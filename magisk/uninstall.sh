#!/system/bin/sh
MODDIR=${0%/*}
"$MODDIR/stop.sh"
# Intentionally retain /data/adb/mini-codex: owner configuration, memory and journal.
