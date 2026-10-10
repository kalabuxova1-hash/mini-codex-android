#!/system/bin/sh
ROOT=/data/local/tmp/android-use-core
PY=/data/data/com.termux/files/usr/bin/python
count=0
while [ "$count" -lt 180 ]; do
  if [ "$(getprop sys.boot_completed)" = "1" ] && [ -x "$PY" ] && [ -f "$ROOT/controller.py" ]; then break; fi
  sleep 3
  count=$((count+1))
done
[ -x "$PY" ] && [ -f "$ROOT/controller.py" ] || exit 0
umask 077
"$PY" "$ROOT/controller.py" serve >> "$ROOT/core.log" 2>&1 &
exit 0
