import unittest,json,tempfile,time,sys
from pathlib import Path
sys.path.insert(0,str(Path(__file__).parent))
from network_route import choose_proxy
class RouteTests(unittest.TestCase):
 def setUp(self):
  self.tmp=tempfile.TemporaryDirectory();self.p=Path(self.tmp.name)/'status.json';self.proxy='http://127.0.0.1:17890'
 def tearDown(self):self.tmp.cleanup()
 def write(self,**values):self.p.write_text(json.dumps(values))
 def choose(self,proxy=None):return choose_proxy(self.proxy if proxy is None else proxy,status_path=self.p,require_root=False)
 def test_existing_android_vpn_uses_system_route(self):
  self.write(mode='standby',any_android_vpn=True);self.assertEqual(self.choose(),'')
 def test_shadow_active_keeps_shadow_proxy(self):
  self.write(mode='mobile',any_android_vpn=False);self.assertEqual(self.choose(),self.proxy)
 def test_no_android_vpn_keeps_proxy(self):
  self.write(mode='standby',any_android_vpn=False);self.assertEqual(self.choose(),self.proxy)
 def test_other_proxy_is_preserved(self):
  self.write(mode='standby',any_android_vpn=True);self.assertEqual(self.choose('http://127.0.0.1:7890'),'http://127.0.0.1:7890')
 def test_stale_or_corrupt_state_keeps_proxy(self):
  self.p.write_text('bad');self.assertEqual(self.choose(),self.proxy)
  self.write(mode='standby',any_android_vpn=True)
  import os;os.utime(self.p,(time.time()-120,time.time()-120));self.assertEqual(self.choose(),self.proxy)
 def test_blank_config_stays_blank(self):
  self.write(mode='standby',any_android_vpn=True);self.assertEqual(self.choose(''),'')
if __name__=='__main__':unittest.main()
