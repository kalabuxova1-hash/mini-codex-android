"""Outbound Android Use relay. No incoming network listener or arbitrary shell API."""
import argparse,hashlib,http.client,json,logging,os,re,signal,socket,sqlite3,ssl,time,urllib.error,urllib.parse,urllib.request
from logging.handlers import RotatingFileHandler
from pathlib import Path

MAX_RESULT=4*1024*1024-8192
TOOLS={t['name']:t for t in json.loads(Path(__file__).with_name('tools.json').read_text(encoding='utf-8'))}
SOCKET_PATH='/data/local/tmp/android-use-core/core.sock'
class Uncertain(Exception):pass
def error(message):return {'content':[{'type':'text','text':message}],'isError':True}

def validate_schema(schema,value):
    kind=schema.get('type')
    if kind=='object':
        if not isinstance(value,dict):raise ValueError('Expected object')
        if any(k not in value for k in schema.get('required',[])):raise ValueError('Missing argument')
        props=schema.get('properties',{})
        for k,v in value.items():
            if k not in props:
                if schema.get('additionalProperties') is False:raise ValueError('Unknown argument')
            else:validate_schema(props[k],v)
    elif kind=='string':
        if not isinstance(value,str) or '\0' in value or len(value)>schema.get('maxLength',4096):raise ValueError('Invalid text')
    elif kind=='integer':
        if type(value)!=int:raise ValueError('Expected integer')
    elif kind=='array':
        if not isinstance(value,list) or not schema.get('minItems',0)<=len(value)<=schema.get('maxItems',18):raise ValueError('Invalid array')
        for x in value:validate_schema(schema['items'],x)

def validate_call(name,args):
    if name not in TOOLS:raise ValueError('Unknown Android Use tool')
    validate_schema(TOOLS[name]['inputSchema'],args)
    if name=='android_key' and args['key'] not in ('BACK','ENTER','TAB','DPAD_UP','DPAD_DOWN','DPAD_LEFT','DPAD_RIGHT'):raise ValueError('Key not permitted')
    if name=='android_launch' and (len(args['component'])>200 or not re.fullmatch(r'[A-Za-z_][\w.]*/[A-Za-z_][\w.$]*',args['component'],re.ASCII)):raise ValueError('Invalid app component')
    for k in ('x','y','x1','x2','y1','y2'):
        if k in args and not 0<=args[k]<4000:raise ValueError('Invalid coordinate')
    if name=='android_swipe' and not 80<=args['ms']<=2500:raise ValueError('Invalid swipe duration')
    if name in ('android_set_text','android_click_text') and not 1<=len(args['text'])<=(1000 if name=='android_set_text' else 180):raise ValueError('Invalid text')
    if name=='android_batch':
        for step in args['steps']:
            if not isinstance(step,dict):raise ValueError('Invalid batch step')
            operation=step.get('op');rest={k:v for k,v in step.items() if k!='op'}
            if operation=='wait':
                if set(rest)!={'ms'} or type(rest['ms'])!=int or not 0<=rest['ms']<=2000:raise ValueError('Invalid wait')
            else:
                if operation not in ('privileges','start','stop','launch','tap','swipe','key','status','windows','inspect_ui','click_text','set_text'):raise ValueError('Invalid batch operation')
                validate_call('android_'+operation,rest)

class Journal:
    def __init__(self,directory):
        directory=Path(directory);directory.mkdir(parents=True,exist_ok=True,mode=0o700)
        self.db=sqlite3.connect(directory/'jobs.sqlite3')
        self.db.execute('PRAGMA journal_mode=DELETE')
        self.db.execute('CREATE TABLE IF NOT EXISTS jobs (id TEXT PRIMARY KEY,fingerprint TEXT,expires REAL,status TEXT,result TEXT,submitted INTEGER DEFAULT 0)')
        self.db.execute('CREATE TABLE IF NOT EXISTS flags (id TEXT PRIMARY KEY,value INTEGER)')
        crashed=self.db.execute("SELECT COUNT(*) FROM jobs WHERE status='started'").fetchone()[0]
        if crashed:
            self.block()
            self.db.execute("UPDATE jobs SET status='uncertain',result=? WHERE status='started'",(json.dumps(error('Agent stopped during a Core operation. Outcome unknown; explicit recovery required.')),))
        self.db.commit();self.compact()
    def close(self):
        if self.db is not None:self.db.close();self.db=None
    def blocked(self):return self.db.execute("SELECT value FROM flags WHERE id='blocked'").fetchone() is not None
    def block(self):self.db.execute("INSERT OR REPLACE INTO flags VALUES ('blocked',1)");self.db.commit()
    def get(self,ident):
        r=self.db.execute('SELECT fingerprint,status,result FROM jobs WHERE id=?',(ident,)).fetchone()
        return None if r is None else (r[0],r[1],json.loads(r[2]) if r[2] else None)
    def start(self,job,fingerprint):
        self.db.execute("INSERT INTO jobs (id,fingerprint,expires,status) VALUES (?,?,?,'started')",(job['id'],fingerprint,job['expires_at']));self.db.commit()
    def finish(self,ident,result,status):
        raw=json.dumps(result,ensure_ascii=False,separators=(',',':'))
        if len(raw.encode('utf-8'))>MAX_RESULT:result=error('Core result exceeded transport limit. The action must not be repeated to retrieve output.');raw=json.dumps(result)
        self.db.execute('UPDATE jobs SET status=?,result=? WHERE id=?',(status,raw,ident));self.db.commit();return result
    def pending(self):
        return [(i,json.loads(r),s) for i,r,s in self.db.execute("SELECT id,result,status FROM jobs WHERE submitted=0 AND status IN ('completed','uncertain') ORDER BY rowid")]
    def delivered(self,ident):self.db.execute('UPDATE jobs SET submitted=1 WHERE id=?',(ident,));self.db.commit();self.compact()
    def compact(self):
        self.db.execute('DELETE FROM jobs WHERE expires<? AND submitted=1',(time.time()-900,))
        ids=[r[0] for r in self.db.execute('SELECT id FROM jobs WHERE submitted=1 ORDER BY rowid DESC LIMIT -1 OFFSET 16')]
        for ident in ids:self.db.execute('UPDATE jobs SET result=? WHERE id=?',(json.dumps(error('Output compacted; command already executed. Do not replay.')),ident))
        self.db.commit();self.db.execute('VACUUM')

def execute_job(job,journal,executor):
    if not isinstance(job,dict) or not isinstance(job.get('id'),str) or not re.fullmatch(r'[\w-]{1,80}',job['id'],re.ASCII):raise ValueError('Invalid job ID')
    ident=job['id']
    fingerprint=hashlib.sha256(json.dumps([job.get('tool'),job.get('arguments')],sort_keys=True,ensure_ascii=False,separators=(',',':')).encode()).hexdigest()
    old=journal.get(ident)
    if old:
        if old[0]!=fingerprint:return ident,error('Job ID arguments changed; blocked.'),'uncertain'
        return ident,old[2] or error('Outcome unknown; do not repeat.'),old[1] if old[1]!='started' else 'uncertain'
    if journal.blocked():return ident,error('Agent blocked after an uncertain operation. Explicit recovery required.'),'uncertain'
    expires=job.get('expires_at')
    if type(expires) not in (int,float) or not time.time()<expires<=time.time()+305:return ident,error('Job expired or invalid; no action executed.'),'completed'
    try:validate_call(job.get('tool'),job.get('arguments'))
    except (ValueError,TypeError,KeyError):return ident,error('Unsupported tool or invalid arguments; no action executed.'),'completed'
    journal.start(job,fingerprint)
    try:
        result=executor(job['tool'],job['arguments'])
        if not isinstance(result,dict) or not isinstance(result.get('content'),list):raise Uncertain('Invalid Core response')
        status='completed'
    except Exception as exc:
        journal.block();result=error('Core operation has an uncertain outcome. No automatic replay; explicit transport recovery required.');status='uncertain'
        original=getattr(exc,'result',None)
        if isinstance(original,dict) and isinstance(original.get('content'),list):
            result={'content':original['content']+result['content'],'isError':True}
    return ident,journal.finish(ident,result,status),status

def core_call(name,args):
    validate_call(name,args)
    payload=(json.dumps({'jsonrpc':'2.0','id':1,'method':'tools/call','params':{'name':name,'arguments':args}},ensure_ascii=False,separators=(',',':'))+'\n').encode('utf-8')
    if len(payload)>16384:return error('Request exceeds Core socket limit; no action executed.')
    with socket.socket(socket.AF_UNIX,socket.SOCK_STREAM) as connection:
        connection.settimeout(240)
        try:connection.connect(SOCKET_PATH)
        except OSError:return error('Android Use Core socket is unavailable. No action was sent.')
        try:
            connection.sendall(payload)
            with connection.makefile('rb') as stream:raw=stream.readline(6000001)
            if not raw.endswith(b'\n') or len(raw)>6000000:raise Uncertain('Incomplete Core response')
            rpc=json.loads(raw)
            if rpc.get('id')!=1 or 'result' not in rpc:raise Uncertain('Invalid Core receipt')
            result=rpc['result']
            # Core can report an action timeout as a completed JSON-RPC response.
            messages=' '.join(c.get('text','') for c in result.get('content',[]) if c.get('type')=='text').lower()
            if result.get('isError') and any(s in messages for s in ('outcome unknown','timeout','timed out')):
                exc=Uncertain('Core timeout');exc.result=result;raise exc
            return result
        except (OSError,ValueError,KeyError) as exc:raise Uncertain('Core connection failed after dispatch') from exc

class Relay:
    def __init__(self,config,connection_factory=None):
        url=urllib.parse.urlparse(config['relay_url'])
        if url.scheme!='https' or not url.hostname or url.username or url.password or url.query or url.fragment or url.path not in ('','/'):raise ValueError('Invalid relay origin')
        token=config['agent_token'];bypass=config['sites_authorization']
        if not isinstance(token,str) or len(token)<40 or not isinstance(bypass,str) or any(c in token+bypass for c in '\r\n'):raise ValueError('Invalid credentials')
        self.base=config['relay_url'].rstrip('/')
        self.headers={'Authorization':'Bearer '+token,'OAI-Sites-Authorization':'Bearer '+bypass,'Accept':'application/json'}
        self.context=ssl.create_default_context();self.connection_factory=connection_factory or http.client.HTTPSConnection
        self.host=url.hostname;self.port=url.port or 443;self.connection=None
        self.proxy=urllib.request.getproxies().get('https')
        if self.proxy:
            proxy=urllib.parse.urlparse(self.proxy)
            if proxy.scheme!='http' or not proxy.hostname or proxy.username or proxy.password or proxy.query or proxy.fragment or proxy.path not in ('','/'):raise ValueError('Unsupported HTTPS proxy configuration')
            self.proxy=(proxy.hostname,proxy.port or 80)
    def close(self):
        if self.connection is not None:self.connection.close();self.connection=None
    def connect(self):
        if self.connection is None:
            host,port=self.proxy or (self.host,self.port)
            self.connection=self.connection_factory(host,port,timeout=25,context=self.context)
            if self.proxy:self.connection.set_tunnel(self.host,self.port)
        return self.connection
    def request(self,path,payload=None,blocked=False):
        if not isinstance(path,str) or not path.startswith('/') or path.startswith('//') or any(c in path for c in '\r\n'):raise ValueError('Invalid relay path')
        headers={**self.headers,'X-Agent-Blocked':'1' if blocked else '0'}
        raw=None if payload is None else json.dumps(payload,ensure_ascii=False,separators=(',',':')).encode('utf-8')
        if raw is not None:
            if len(raw)>4*1024*1024:raise ValueError('Result too large')
            headers['Content-Type']='application/json'
        try:
            connection=self.connect()
            connection.request('GET' if payload is None else 'POST',path,body=raw,headers=headers)
            response=connection.getresponse()
            data=response.read(65537)
            status=response.status;will_close=response.will_close;response.close()
            if len(data)>65536:self.close();raise ValueError('Relay response too large')
            if will_close:self.close()
            if status not in (200,204):raise urllib.error.HTTPError(self.base+path,status,'Relay HTTP error',None,None)
            return None if status==204 else json.loads(data)
        except urllib.error.HTTPError:raise
        except Exception:
            # No hidden retries: a lost job claim must not cause a second dispatch.
            self.close();raise

def deliver_result(relay,journal,ident,result,status):
    try:receipt=relay.request('/agent/jobs/'+ident+'/result',{'result':result,'status':status})
    except urllib.error.HTTPError as exc:
        if exc.code!=404:raise
        # Server expired this job; local journal still keeps its outcome.
        journal.delivered(ident);return
    if not isinstance(receipt,dict) or receipt.get('ok') is not True:
        raise ValueError('Server did not acknowledge result persistence')
    journal.delivered(ident)

def main():
    import fcntl
    parser=argparse.ArgumentParser();parser.add_argument('--config',required=True);options=parser.parse_args()
    os.umask(0o077)
    if os.geteuid()!=0:raise SystemExit('Android Use Relay requires authorized root')
    root=Path(options.config).resolve().parent
    config=json.loads(Path(options.config).read_text(encoding='utf-8'))
    root.mkdir(parents=True,exist_ok=True,mode=0o700)
    lock=(root/'agent.lock').open('a')
    try:fcntl.flock(lock.fileno(),fcntl.LOCK_EX|fcntl.LOCK_NB)
    except BlockingIOError:raise SystemExit('Android Use Relay is already running')
    handler=RotatingFileHandler(root/'agent.log',maxBytes=256*1024,backupCount=3)
    logging.basicConfig(handlers=[handler],level=logging.INFO,format='%(asctime)s %(message)s')
    journal=Journal(root/'state');relay=Relay(config)
    stopping=False
    def stop(*args):
        nonlocal stopping;stopping=True
    signal.signal(signal.SIGTERM,stop);signal.signal(signal.SIGINT,stop)
    disabled=lambda:any(Path(p).exists() for p in config.get('stop_files',[]))
    logging.info('agent_started')
    last_screen_use=time.monotonic()
    idle_display_closed=False
    idle_seconds=120
    while not stopping and not disabled():
        try:
            pending=journal.pending()
            for ident,result,status in pending:
                deliver_result(relay,journal,ident,result,status)
            response=relay.request('/agent/jobs/next',blocked=journal.blocked())
            if response and not stopping and not disabled():
                started=time.monotonic()
                ident,result,status=execute_job(response['job'],journal,core_call)
                execution_ms=round((time.monotonic()-started)*1000);started=time.monotonic()
                deliver_result(relay,journal,ident,result,status)
                name=response['job'].get('tool');name=name if name in TOOLS else 'unsupported'
                if status=='completed' and name=='android_stop' and not result.get('isError'):
                    idle_display_closed=True
                elif name not in ('android_privileges','android_job_result') and status=='completed':
                    last_screen_use=time.monotonic()
                    idle_display_closed=False
                logging.info('job_finished tool=%s status=%s execution_ms=%s result_ms=%s',name,status,execution_ms,round((time.monotonic()-started)*1000))
            else:time.sleep(0.05)
            # A dedicated display must not linger in Recents after an idle session.
            # Do not touch display 0; Core validates the display owner on stop.
            if not idle_display_closed and time.monotonic()-last_screen_use>=idle_seconds:
                cleanup=core_call('android_stop',{})
                if not cleanup.get('isError'):
                    logging.info('idle_virtual_display_released after_seconds=%s',idle_seconds)
                    idle_display_closed=True
                else:
                    logging.warning('idle_virtual_display_cleanup_failed')
                    idle_display_closed=True
        except Exception as exc:
            # No argument bodies, credentials, URLs or screen content in logs.
            logging.warning('relay_error type=%s',type(exc).__name__);time.sleep(5)
    relay.close();journal.close();logging.info('agent_stopped')

if __name__=='__main__':main()
