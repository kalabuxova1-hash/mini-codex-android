"""Safe offline regression checks for 0.2.2 boot and local VLESS proxy."""
import sys
import unittest
from pathlib import Path
from unittest.mock import patch

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0,str(ROOT/'agent'))
import configure
from phone_agent import Relay


class ResilienceTests(unittest.TestCase):
    def setUp(self):
        self.base=Path('/tmp/mini-test-private')
        self.module=Path('/tmp/mini-test-magisk')
        self.values={'relay_url':'https://private.example.com','agent_token':'a'*40}

    def test_config_defaults_to_no_proxy_and_preserves_private_paths(self):
        result=configure.validate(self.values,self.base,self.module)
        self.assertEqual(result.get('outbound_proxy',''),'')

    def test_accepts_loopback_only_and_blocks_proxy_credentials(self):
        for proxy in ('http://127.0.0.1:17890','http://[::1]:17890'):
            result=configure.validate({**self.values,'outbound_proxy':proxy},self.base,self.module)
            self.assertEqual(result['outbound_proxy'],proxy)
        for proxy in ('https://127.0.0.1:17890','http://192.168.0.1:17890',
                      'http://example.com:17890','http://user:secret@127.0.0.1:17890',
                      'http://127.0.0.1:17890/path','http://127.0.0.1:17890/?x=y',
                      'http://127.0.0.1:99999','http://127.0.0.1:0',
                      'http://127.0.0.1','http://127.0.0.1:17890\n'):
            with self.subTest(proxy=proxy),self.assertRaises(ValueError):
                configure.validate({**self.values,'outbound_proxy':proxy},self.base,self.module)

    def test_relay_explicit_loopback_proxy_for_https(self):
        conf=configure.validate({**self.values,'outbound_proxy':'http://127.0.0.1:17890'},self.base,self.module)
        with patch('urllib.request.build_opener',wraps=__import__('urllib.request',fromlist=['build_opener']).build_opener) as create:
            Relay(conf)
            handlers=create.call_args.args
            proxies=[x.proxies for x in handlers if isinstance(x,__import__('urllib.request',fromlist=['ProxyHandler']).ProxyHandler)]
            self.assertIn({'https':'http://127.0.0.1:17890'},proxies)

    def test_watchdog_restarts_unexpected_exit_and_honors_disable(self):
        script=(ROOT/'magisk'/'service.sh').read_text()
        self.assertIn('while',script)
        self.assertIn('wait "$child"',script)
        self.assertIn('sleep 15',script)
        self.assertIn('phone_agent.py',script)
        self.assertIn('[ ! -f "$MODDIR/disable" ]',script)
        self.assertIn('[ -f "$BASE/enabled" ]',script)
        self.assertLess(script.index('--validate'),script.index('phone_agent.py'))
        self.assertNotIn('pkill',script)
        self.assertNotIn('rm -rf',script)


if __name__=='__main__': unittest.main()
