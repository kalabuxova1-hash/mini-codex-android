#!/system/bin/sh
MODDIR=${0%/*}
BASE=/data/adb/mini-codex
PREFIX=/data/data/com.termux/files/usr
# Late-start is nonblocking. Private Termux storage may need the first unlock.
(
  attempts=0
  while [ "$(/system/bin/getprop sys.boot_completed)" != 1 ] || [ ! -x "$PREFIX/bin/python" ]; do
    [ ! -f "$MODDIR/disable" ] && [ ! -f "$MODDIR/remove" ] || exit 0
    attempts=$((attempts + 1)); [ "$attempts" -lt 180 ] || exit 0
    sleep 2
  done
  [ -f "$BASE/enabled" ] && [ ! -f "$MODDIR/disable" ] && [ ! -f "$MODDIR/remove" ] || exit 0
  export PREFIX PATH="$PREFIX/bin:/system/bin:/system/xbin" LD_LIBRARY_PATH="$PREFIX/lib"
  if [ -f "$PREFIX/etc/tls/cert.pem" ]; then export SSL_CERT_FILE="$PREFIX/etc/tls/cert.pem"; fi
  umask 077
  "$PREFIX/bin/python" "$MODDIR/agent/configure.py" --validate >/dev/null 2>&1 || exit 0
  "$PREFIX/bin/python" "$MODDIR/agent/phone_agent.py" --config "$BASE/config.json" >"$BASE/startup.log" 2>&1 &
  child=$!
  # Only the worker that owns flock writes agent.pid. A duplicate launch cannot
  # overwrite the active worker's PID with a short-lived failed process.
  # phone_agent also holds a nonblocking flock and checks the disable flag.
  while kill -0 "$child" 2>/dev/null; do
    if [ -f "$MODDIR/disable" ] || [ -f "$MODDIR/remove" ] || [ ! -f "$BASE/enabled" ]; then
      kill -TERM "$child" 2>/dev/null
      break
    fi
    sleep 3
  done
  wait "$child"
) &
