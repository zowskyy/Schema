FROM python:3.12-slim

LABEL org.opencontainers.image.title="cursor-gate" \
      org.opencontainers.image.description="15-Gate Review System for Cursor AI"

RUN apt-get update && apt-get install -y --no-install-recommends \
    git \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY cursor_gate.py /app/cursor_gate.py
COPY cursor_gate_fastest.py /app/cursor_gate_fastest.py
RUN chmod +x /app/cursor_gate.py /app/cursor_gate_fastest.py

ENV GATE_LOG_DIR=/data/gate-logs \
    GATE_CACHE_DIR=/data/gate-cache \
    PYTHONUNBUFFERED=1

RUN mkdir -p /data/gate-logs /data/gate-cache

VOLUME ["/data/gate-logs", "/data/gate-cache", "/workspace"]

ENTRYPOINT ["python"]
CMD ["/app/cursor_gate.py", "--help"]
