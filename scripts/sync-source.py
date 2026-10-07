"""Fallback source packaging when the plugin's filesystem helpers are unavailable.
Credentials are accepted through hidden stdin and kept only in process memory.
"""
import sys,json,os,subprocess,termios,tarfile
from pathlib import Path
root=Path(__file__).resolve().parents[1]
if sys.stdin.isatty():
    attrs=termios.tcgetattr(sys.stdin.fileno());attrs[3]&=~termios.ECHO;termios.tcsetattr(sys.stdin.fileno(),termios.TCSANOW,attrs)
print('Ready for source credential JSON on stdin (input is hidden).',flush=True)
credential=json.loads(sys.stdin.readline())
manifest=json.loads((root/'.openai/hosting.json').read_text())
env=dict(os.environ)
env['GIT_CONFIG_COUNT']='1'
env['GIT_CONFIG_KEY_0']='http.'+credential['remote_url']+'.extraHeader'
env['GIT_CONFIG_VALUE_0']='Authorization: Bearer '+credential['token']
env['GIT_TERMINAL_PROMPT']='0'
def git(*args):
    r=subprocess.run(['git',*args],cwd=root,env=env,text=True,capture_output=True)
    if r.returncode:
        print(r.stderr[:1500],file=sys.stderr);raise RuntimeError('Source synchronization failed.')
    return r.stdout.strip()
if not (root/'.git').exists():git('init','-b',credential['branch'])
git('config','user.name','Codex')
git('config','user.email','codex@openai.com')
if 'origin' not in git('remote').splitlines():git('remote','add','origin',credential['remote_url'])
if git('remote','get-url','origin')!=credential['remote_url']:raise RuntimeError('Unexpected source repository.')
remote=git('ls-remote','--heads','origin',credential['branch'])
if remote and not git('log','-1','--format=%H'):
    git('fetch','origin',credential['branch']);git('reset','--mixed','FETCH_HEAD')
git('add','.')
if git('status','--porcelain'):git('commit','-m','Build 52-week quiz journey with durable progress and family assessments')
sha=git('rev-parse','HEAD')
git('push','origin','HEAD:refs/heads/'+credential['branch'])
if git('ls-remote','--heads','origin',credential['branch']).split()[0]!=sha:raise RuntimeError('Remote source SHA did not match.')
archive=root.parent/'mam-sang-52.tar.gz'
with tarfile.open(archive,'w:gz') as tar:
    for name in ['.openai','dist','drizzle']:tar.add(root/name,arcname=name)
print(json.dumps({'project_id':manifest['project_id'],'commit_sha':sha,'archive':str(archive)}),flush=True)
