#!/usr/bin/env fish
# Bring up production stack with health waits
set -l compose_file docker-compose.prod.yml

if test -n "$argv[1]"
  set compose_file $argv[1]
end

echo "[prod-up] Using compose file: $compose_file"
docker compose -f $compose_file up -d --build

# Wait for API health
set -l retries 40
set -l delay 3
for i in (seq $retries)
  if curl -fsS http://localhost:8000/api/healthz/ >/dev/null
    echo "[prod-up] API healthy"
    break
  end
  echo "[prod-up] Waiting for API... ($i/$retries)"
  sleep $delay
end

# Wait for web
for i in (seq $retries)
  if curl -fsS http://localhost:5173/ >/dev/null
    echo "[prod-up] Web healthy"
    break
  end
  echo "[prod-up] Waiting for Web... ($i/$retries)"
  sleep $delay
end

echo "[prod-up] Done"
