#!/system/bin/sh
# Sourced by Magisk's module installer on a running Android system.
[ "$BOOTMODE" = true ] || abort 'Install on booted Android with the Magisk app or supported CLI, not recovery.'
[ -x /data/data/com.termux/files/usr/bin/python ] || abort 'First install official Termux, open it and run: pkg install python'
BASE=/data/adb/mini-codex
for path in /data /data/adb "$BASE" "$BASE/config.json" "$BASE/enabled" "$BASE/state" "$BASE/memory"; do
  [ ! -L "$path" ] || abort 'Private storage must not contain symbolic links.'
done
[ ! -e "$BASE" ] || [ -d "$BASE" ] || abort 'Private storage is not a directory.'
mkdir -p "$BASE" || abort 'Cannot create private storage.'
chmod 0700 "$BASE"
set_perm_recursive "$MODPATH" 0 0 0755 0644
for script in service.sh stop.sh uninstall.sh configure.sh; do
  set_perm "$MODPATH/$script" 0 0 0755
done
# Existing config, enabled marker, memory and journal remain intact on upgrades.
# No credentials or enabled marker are supplied by this ZIP.
ui_print 'MiniCodex installed. It makes no connection until you import your OWN relay configuration.'
ui_print 'Configure locally: su -c /data/adb/modules/mini_codex/configure.sh'
