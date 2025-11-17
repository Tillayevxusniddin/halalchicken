#!/usr/bin/env fish
# Tear down production stack
set -l compose_file docker-compose.prod.yml

if test -n "$argv[1]"
  set compose_file $argv[1]
end

echo "[prod-down] Using compose file: $compose_file"
docker compose -f $compose_file down -v
