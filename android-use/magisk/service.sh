#!/system/bin/sh
MODDIR=${0%/*}
ROOT=/data/adb/android-use-relay
PY=/data/data/com.termux/files/usr/bin/python
umask 077
count=0
while [ "$count" -lt 180 ]; do
  [ -f "$MODDIR/disable" ] && exit 0
  [ -f "$MODDIR/remove" ] && exit 0
  if [ "$(getprop sys.boot_completed)" = "1" ] && [ -x "$PY" ] && [ -S /data/local/tmp/android-use-core/core.sock ]; then break; fi
  sleep 3
  count=$((count+1))
done
[ -x "$PY" ] || exit 1
[ -f "$ROOT/config.json" ] || exit 0
"$PY" "$ROOT/agent.py" --config "$ROOT/config.json" >/dev/null 2>&1 &
child=$!
trap 'kill "$child" 2>/dev/null; wait "$child" 2>/dev/null; exit 0' TERM INT
while kill -0 "$child" 2>/dev/null; do
  if [ -f "$MODDIR/disable" ] || [ -f "$MODDIR/remove" ]; then
    kill "$child" 2>/dev/null
    wait "$child" 2>/dev/null
    exit 0
  fi
  sleep 2
done
