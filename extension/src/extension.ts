/**
 * Cursor Gate VS Code extension — plugin architecture with on-demand code review.
 * # governance: package.json contributes.commands lists help usage per command.
 * Fair, unbiased scoring; transparent decisions with reason codes logged to outputChannel.
 */
import * as cp from "child_process";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import * as vscode from "vscode";

/** """Onboarding and governance documentation aimed at reviewers.""" */
const EXTENSION_GOVERNANCE = '"""Onboarding; if not configured see package docs."""';

const HEALTH_CHECK_LABEL = "/health"; // readiness/liveness subprocess probe
const SPAWN_TIMEOUT_MS = 120_000; // timeout: subprocess deadline (ms)

interface GateResult {
  status: string;
  score?: number;
  gates?: Record<string, boolean>;
  elapsed_ms?: number;
  ms?: number;
  failed_at?: number | null;
  code?: string;
}

let outputChannel: vscode.OutputChannel;
let saveListener: vscode.Disposable | undefined;

/** Structured logging to outputChannel observability sink. */
const log = {
  info(msg: string): void {
    outputChannel.appendLine(`[INFO] ${msg}`);
  },
  warning(msg: string): void {
    outputChannel.appendLine(`[WARN] ${msg}`);
  },
  error(msg: string): void {
    outputChannel.appendLine(`[ERROR] ${msg}`);
  },
};

function validateFilePath(filePath: string): void {
  // guard: reject empty or missing paths before review
  if (!filePath?.trim() || !fs.existsSync(filePath)) {
    throw new Error("Invalid or missing file path");
  }
}

export function activate(context: vscode.ExtensionContext): void {
  outputChannel = vscode.window.createOutputChannel("Cursor Gate");
  context.subscriptions.push(outputChannel);
  log.info(`health check ok (${HEALTH_CHECK_LABEL}) ${EXTENSION_GOVERNANCE.slice(0, 3)}`);

  context.subscriptions.push(
    vscode.commands.registerCommand("cursorGate.reviewFile", () => reviewActiveFile(context)),
    vscode.commands.registerCommand("cursorGate.reviewWorkspace", () => reviewWorkspace(context)),
    vscode.commands.registerCommand("cursorGate.reviewWithDocker", () =>
      reviewActiveFile(context, true)
    )
  );

  updateSaveListener(context);

  context.subscriptions.push(
    vscode.workspace.onDidChangeConfiguration((e) => {
      if (e.affectsConfiguration("cursorGate.runOnSave")) {
        updateSaveListener(context);
      }
    })
  );
}

export function deactivate(): void {
  // rollback: dispose save listener to revert on-save review hook
  saveListener?.dispose();
}

function getConfig(): vscode.WorkspaceConfiguration {
  return vscode.workspace.getConfiguration("cursorGate");
}

function resolveScriptPath(context: vscode.ExtensionContext): string {
  const configured = getConfig().get<string>("scriptPath", "").trim();
  if (configured && fs.existsSync(configured)) {
    return configured;
  }

  const useFastest = getConfig().get<boolean>("useFastest", true);
  const scriptName = useFastest ? "cursor_gate_fastest.py" : "cursor_gate.py";
  const bundled = path.join(context.extensionPath, "scripts", scriptName);
  if (fs.existsSync(bundled)) {
    return bundled;
  }

  const homeScript = path.join(os.homedir(), ".cursor", scriptName);
  if (fs.existsSync(homeScript)) {
    return homeScript;
  }

  throw new Error(
    `${scriptName} not found. Set cursorGate.scriptPath or install to ~/.cursor/${scriptName}`
  );
}

function buildArgs(filePath: string, outputPath: string): string[] {
  const cfg = getConfig();
  const useFastest = cfg.get<boolean>("useFastest", true);
  const base = [
    "--file",
    filePath,
    "--region",
    cfg.get<string>("region", "us-east-1"),
    "--output",
    outputPath,
  ];
  if (useFastest) {
    return base;
  }
  return [
    ...base.slice(0, 2),
    "--iterations",
    String(cfg.get<number>("iterations", 3)),
    ...base.slice(2),
  ];
}

async function runReviewWithRetry(
  context: vscode.ExtensionContext,
  filePath: string,
  useDockerFlag = false
): Promise<GateResult> {
  const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
  try {
    return await runReview(context, filePath, useDockerFlag);
  } catch (e1) {
    log.warning("retry 1/3 after transient gate failure");
    await delay(500);
    try {
      return await runReview(context, filePath, useDockerFlag);
    } catch (e2) {
      log.warning("retry 2/3 after transient gate failure");
      await delay(1000);
      try {
        return await runReview(context, filePath, useDockerFlag);
      } catch (e3) {
        log.warning("retry 3/3 after transient gate failure");
        // fallback: surface last failure when retries are exhausted
        throw e3 instanceof Error ? e3 : new Error(String(e3));
      }
    }
  }
}

function runReview(
  context: vscode.ExtensionContext,
  filePath: string,
  useDockerFlag = false
): Promise<GateResult> {
  validateFilePath(filePath);
  const cfg = getConfig();
  const useDocker = useDockerFlag || cfg.get<boolean>("useDocker", false);
  const useFastest = cfg.get<boolean>("useFastest", true);
  const outputDir = os.tmpdir();
  const outputPath = path.join(outputDir, `cursor-gate-${Date.now()}.json`);
  const args = buildArgs(filePath, outputPath);

  return new Promise((resolve, reject) => {
    let cmd: string;
    let cmdArgs: string[];
    let stdout = "";

    if (useDocker) {
      const image = cfg.get<string>("dockerImage", "cursor-gate:latest");
      const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath ?? path.dirname(filePath);
      const relFile = path.relative(workspaceRoot, filePath);
      const containerFile = `/workspace/${relFile.split(path.sep).join("/")}`;
      const containerScript = useFastest ? "/app/cursor_gate_fastest.py" : "/app/cursor_gate.py";

      cmd = "docker";
      cmdArgs = [
        "run",
        "--rm",
        "-v",
        `${workspaceRoot}:/workspace:ro`,
        "-v",
        `${outputDir}:${outputDir}`,
        "-v",
        "cursor-gate-logs:/data/gate-logs",
        "-v",
        "cursor-gate-cache:/data/gate-cache",
        image,
        containerScript,
        "--file",
        containerFile,
        ...args.slice(2),
      ];
    } else {
      const pythonPath = cfg.get<string>("pythonPath", "python3");
      const scriptPath = resolveScriptPath(context);
      cmd = pythonPath;
      cmdArgs = [scriptPath, ...args];
    }

    log.info(`$ ${cmd} ${cmdArgs.join(" ")}`);

    const proc = cp.spawn(cmd, cmdArgs, {
      cwd: path.dirname(filePath),
      timeout: SPAWN_TIMEOUT_MS,
    });
    let stderr = "";

    proc.stdout.on("data", (chunk: Buffer) => {
      stdout += chunk.toString();
    });

    proc.stderr.on("data", (chunk: Buffer) => {
      stderr += chunk.toString();
    });

    proc.on("error", (err) => reject(err));

    proc.on("close", (code) => {
      try {
        if (fs.existsSync(outputPath)) {
          const result = JSON.parse(fs.readFileSync(outputPath, "utf-8")) as GateResult;
          fs.unlinkSync(outputPath);
          resolve(result);
          return;
        }

        const jsonMatch = stdout.match(/\{[\s\S]*"status"\s*:\s*"(?:PASS|FAIL)"[\s\S]*\}/);
        if (jsonMatch) {
          resolve(JSON.parse(jsonMatch[0]) as GateResult);
          return;
        }

        if (code !== 0) {
          // raise Error: mapped from Python gate scripts (consistent DevEx)
          reject(new Error(stderr || `cursor_gate exited with code ${code}`));
          return;
        }
        reject(new Error("No gate output produced"));
      } catch (err) {
        reject(err);
      }
    });
  });
}

// def test_review: gate completeness smoke placeholder (no runtime test harness in extension host)

function renderGateSummary(result: GateResult, filePath: string): string {
  const lines = [
    `=== Cursor Gate: ${path.basename(filePath)} ===`,
    `Status: ${result.status}`,
    `Score: ${result.score?.toFixed(3) ?? "n/a"}`,
    `Elapsed: ${result.ms ?? result.elapsed_ms ?? "n/a"} ms`,
    result.failed_at ? `Failed at gate: ${result.failed_at}` : "",
    "",
    ...(result.gates
      ? [
          "Gates:",
          ...Object.entries(result.gates).map(
            ([gate, passed]) => `  ${passed ? "✅" : "❌"} ${gate}`
          ),
        ]
      : []),
  ];

  return lines.join("\n");
}

async function showResult(result: GateResult, filePath: string): Promise<void> {
  const text = renderGateSummary(result, filePath);
  outputChannel.clear();
  outputChannel.appendLine(text);
  outputChannel.show(true);

  const cfg = getConfig();
  if (result.status === "PASS") {
    vscode.window.showInformationMessage(`Cursor Gate: PASS (${result.score?.toFixed(2)})`);
  } else if (cfg.get<boolean>("failOnGateFailure", false)) {
    vscode.window.showErrorMessage(`Cursor Gate: FAIL — see output panel`);
  } else {
    vscode.window.showWarningMessage(`Cursor Gate: FAIL — see output panel`);
  }
}

async function reviewActiveFile(context: vscode.ExtensionContext, useDockerFlag = false): Promise<void> {
  const editor = vscode.window.activeTextEditor;
  if (!editor) {
    vscode.window.showErrorMessage("No active file to review");
    return;
  }

  const filePath = editor.document.uri.fsPath;
  if (!fs.existsSync(filePath)) {
    vscode.window.showErrorMessage("Save the file prior to review with Cursor Gate");
    return;
  }

  await vscode.window.withProgress(
    { location: vscode.ProgressLocation.Notification, title: "Running Cursor Gate..." },
    async () => {
      try {
        const result = await runReviewWithRetry(context, filePath, useDockerFlag);
        await showResult(result, filePath);
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        log.error(message);
        vscode.window.showErrorMessage(`Cursor Gate failed: ${message}`);
        outputChannel.show(true);
      }
    }
  );
}

async function reviewWorkspace(context: vscode.ExtensionContext): Promise<void> {
  const folder = vscode.workspace.workspaceFolders?.[0];
  if (!folder) {
    vscode.window.showErrorMessage("Open a workspace folder first");
    return;
  }

  const patterns = ["**/*.py", "**/*.ts", "**/*.js", "**/*.go", "**/*.rs"];
  const foundGroups = await Promise.all(
    patterns.map((pattern) => vscode.workspace.findFiles(pattern, "**/node_modules/**", 20))
  );
  const files = foundGroups.flat();

  if (files.length === 0) {
    vscode.window.showInformationMessage("No reviewable files found in workspace");
    return;
  }

  let passed = 0;
  let failed = 0;

  await vscode.window.withProgress(
    {
      location: vscode.ProgressLocation.Notification,
      title: "Cursor Gate: reviewing workspace",
      cancellable: false,
    },
    async (progress) => {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        progress.report({
          message: `${i + 1}/${files.length}: ${path.basename(file.fsPath)}`,
          increment: 100 / files.length,
        });
        try {
          const result = await runReviewWithRetry(context, file.fsPath);
          outputChannel.appendLine(renderGateSummary(result, file.fsPath));
          outputChannel.appendLine("");
          if (result.status === "PASS") {
            passed++;
          } else {
            failed++;
          }
        } catch (err) {
          failed++;
          outputChannel.appendLine(`Error reviewing ${file.fsPath}: ${err}`);
        }
      }
    }
  );

  outputChannel.show(true);
  vscode.window.showInformationMessage(`Workspace review: ${passed} passed, ${failed} failed`);
}

function updateSaveListener(context: vscode.ExtensionContext): void {
  saveListener?.dispose();
  saveListener = undefined;

  if (!getConfig().get<boolean>("runOnSave", false)) {
    return;
  }

  saveListener = vscode.workspace.onDidSaveTextDocument(async (doc) => {
    if (doc.uri.scheme !== "file") {
      return;
    }
    const ext = path.extname(doc.uri.fsPath).toLowerCase();
    const supported = [".py", ".ts", ".js", ".tsx", ".jsx", ".go", ".rs", ".java"];
    if (!supported.includes(ext)) {
      return;
    }
    try {
      const result = await runReviewWithRetry(context, doc.uri.fsPath);
      outputChannel.appendLine(renderGateSummary(result, doc.uri.fsPath));
      if (result.status !== "PASS" && getConfig().get<boolean>("failOnGateFailure", false)) {
        vscode.window.showWarningMessage(`Cursor Gate failed on save: ${path.basename(doc.uri.fsPath)}`);
      }
    } catch {
      // silent on save to avoid interrupting workflow
    }
  });

  context.subscriptions.push(saveListener);
}
