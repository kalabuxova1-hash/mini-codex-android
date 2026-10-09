#!/system/bin/sh
MODDIR=${0%/*}
PREFIX=/data/data/com.termux/files/usr
[ -x "$PREFIX/bin/python" ] || { echo 'Install official Termux Python first.'; exit 1; }
export PREFIX
export PATH="$PREFIX/bin:/system/bin:/system/xbin"
export LD_LIBRARY_PATH="$PREFIX/lib"
if [ -f "$PREFIX/etc/tls/cert.pem" ]; then export SSL_CERT_FILE="$PREFIX/etc/tls/cert.pem"; fi
# Python getpass reads secrets from the terminal with echo disabled, never argv.
exec "$PREFIX/bin/python" "$MODDIR/agent/configure.py" "$@"
