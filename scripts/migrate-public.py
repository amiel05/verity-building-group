"""Migrate only published public HTML captured by audit-public.py. No database access."""
from pathlib import Path
from urllib.parse import urlparse,unquote
from bs4 import BeautifulSoup,Comment
import json,re,shutil,hashlib,subprocess
ROOT=Path.cwd(); SOURCE=ROOT/'.local/public-source'; OUT=ROOT/'src/content/pages';OUT.mkdir(parents=True,exist_ok=True)
BASE='https://veritybuildstg.wpenginepowered.com'; assets={};style_chunks=[];missing=[]
inventory=json.loads((ROOT/'docs/public-inventory.json').read_text());routes=[]
# Preserve custom visual classes; remove CMS namespaces from reusable content and CSS.
def classes(s):
 return s.replace('wp-block-','content-block-').replace('--wp--','--content--').replace('wp-element-','content-element-').replace('wp-container-','content-container-').replace('wp-image-','image-').replace('wp-caption','image-caption')
def asset(url):
 url=url.strip().strip('"\'');u=urlparse(url if not url.startswith('//') else 'https:'+url)
 if u.netloc not in ['',urlparse(BASE).netloc]:return url
 path=unquote(u.path)
 if not path.startswith('/wp-content/') and path not in ['/favicon.ico','/apple-touch-icon.png','/apple-touch-icon-precomposed.png']:return url
 if '/uploads/' not in path and '/themes/vbg/assets/img/' not in path and not path.startswith('/favicon') and not path.startswith('/apple-'):return url
 mapping=json.loads((ROOT/'src/content/asset-repairs.json').read_text()) if (ROOT/'src/content/asset-repairs.json').exists() else {}
 if path in mapping:path=mapping[path]
 local=ROOT/path.lstrip('/')
 if not local.is_file():
  local=ROOT/'.local/public-assets'/path.lstrip('/')
  local.parent.mkdir(parents=True,exist_ok=True)
  result=subprocess.run(['curl','-fsSL','--max-time','60',BASE+u.path,'-o',str(local)],capture_output=True)
  if result.returncode:
   if path not in missing:missing.append(path)
   return '/assets/unresolved-'+Path(path).name
 # Only public references, never walk/copy uploads or backup directories wholesale.
 dest='/assets/'+hashlib.sha256(path.encode()).hexdigest()[:10]+'-'+local.name
 if dest not in assets:
  target=ROOT/'public'/dest.lstrip('/');target.parent.mkdir(parents=True,exist_ok=True);shutil.copyfile(local,target)
  assets[dest]={'source':path,'bytes':local.stat().st_size,'sha256':hashlib.sha256(local.read_bytes()).hexdigest()}
 return dest

def urls(text):
 text=re.sub(r'url\(([\s\S]*?)\)',lambda m:'url("'+asset(m.group(1))+'")',text)
 return classes(re.sub(r"/\*# sourceURL=.*?\*/", "", text))
def clean(node):
 if not node:return ''
 for x in list(node.find_all(string=lambda t:isinstance(t,Comment))):x.extract()
 for x in list(node.select('script,style,iframe,object,embed')):x.decompose()
 for x in list(node.select('.gform_wrapper')):
  slot=BeautifulSoup('<div data-contact-slot></div>','html5lib').div;x.replace_with(slot)
 for x in list(node.select('.gform_confirmation_wrapper,[id^="gform_ajax"],[id^="gform_wrapper_"]')):x.decompose()
 for x in list(node.select('form')):
  # Public sidebar search is rebuilt separately, never preserve WP actions.
  if 'search' in ' '.join(x.get('class',[])) or x.select_one('[name=s]'):
   x['action']='/search/';x['method']='get'
   for y in x.select('[name=s]'):y['name']='q'
  else:x.decompose()
 for x in node.find_all(True):
  for key in list(x.attrs):
   if key.startswith('on') or key in ['data-settings','data-formid','data-post-id','data-lazy-src','data-lazy-srcset']:del x[key]
  if x.get('class'):
   x['class']=[classes(c) for c in x['class'] if not re.match(r'^(wp-|post-\d|page-id-|menu-item-\d)',classes(c))]
  if x.get('style'):x['style']=urls(x['style'])
  for k in ['src','poster']:
   if x.get(k):x[k]=asset(x[k])
  if x.get('srcset'):
   x['srcset']=', '.join(asset(p.strip().split()[0])+' '+' '.join(p.strip().split()[1:]) for p in x['srcset'].split(','))
  if x.get('href'):
   h=x['href']
   if h.startswith(BASE):h=h[len(BASE):] or '/'
   if h.startswith('/wp-content/'):h=asset(h)
   if h.startswith('/author/'):h='/insights/'
   if h.startswith('javascript:'):h='#'
   x['href']=h
  if x.name=='img':x['decoding']='async'
  if x.name=='i' and any(c.startswith('fa-') for c in x.get('class',[])):
   cs=x.get('class',[]);x.name='span';x['class']=['interface-icon'];x['aria-hidden']='true';x.string='→' if any('arrow' in c for c in cs) else '✉' if any('envelope' in c for c in cs) else '✓'
 return urls(str(node)).replace('info@veritybuildstg.wpenginepowered.com', 'info@veritybuildinggroup.com')

home=BeautifulSoup((SOURCE/'home.html').read_text(),'html5lib')
# Shared source-derived design CSS; build-time only, no WordPress theme runtime.
for filename in ['style.css','assets/css/main.css']:
 text=(ROOT/'wp-content/themes/vbg'/filename).read_text()
 text=re.sub(r'url\(([^)]+)\)',lambda m:'url("'+asset('/wp-content/themes/vbg/assets/'+m.group(1).strip('"\'').replace('../',''))+'")' if '../img/' in m.group(1) else m.group(0),text)
 style_chunks.append(urls(text))
for entry in inventory['routes']:
 path=entry['path']
 if not entry.get('sourceFile') or (path!='/' and not path.endswith('/')):continue
 soup=BeautifulSoup((SOURCE/entry['sourceFile']).read_text(),'html5lib')
 canonical=soup.select_one('link[rel=canonical]');canonical=canonical.get('href') if canonical else BASE+path
 if path=='/commercial-construction-renovation-charlotte-nc/':continue
 # Keep all public structured data, not hidden script configuration.
 schema=[]
 for x in soup.select('script[type="application/ld+json"]'):
  try:schema.append(json.loads(x.string or ""))
  except ValueError:pass
 for x in soup.select('style'):
  if x.get('id')=='wp-custom-css':continue # Convert pseudo-element public text into real text below.
  text=urls(x.string or "")
  if text not in style_chunks:style_chunks.append(text)
 main=soup.select_one('main');bodyclass=' '.join(c for c in soup.body.get('class',[]) if c in ['home','page','single','archive','category','tag','hfeed','single-post'])
 if path=='/':
  for c in main.select('.service-card'):
   if c.select_one('a[href*="commercial-construction-renovation"]'):c.decompose()
  p=main.select_one('.home-hero__desc p')
  if p:p.string='Custom homes, thoughtful land development, and residential renovation throughout Charlotte, Lake Norman, and surrounding communities.'
  p=main.select_one('.team-section__content .delay-250 p')
  if p:p.string='At Verity Building Group, leadership means guiding every phase of the project with clarity, integrity, and experienced construction oversight. From land acquisition and planning to custom residential construction and renovation, VBG brings the right people, process, and vision together to build with purpose.'
 content=clean(main)
 # Keep archive sidebars when present.
 sidebar=soup.select_one('#secondary');content+=clean(sidebar)
 meta=[dict(x.attrs) for x in soup.select('meta[name],meta[property]') if x.get('name') not in ['generator','viewport']]
 record={'path':path,'title':soup.title.get_text(),'bodyClass':bodyclass,'canonical':canonical,'meta':meta,'schema':schema,'sections':re.split(r'<div data-contact-slot=""></div>',content)}
 key='home' if path=='/' else path.strip('/').replace('/','__')
 (OUT/(key+'.json')).write_text(json.dumps(record,indent=2,ensure_ascii=False))
 routes.append({'path':path,'file':key+'.json'})
header=clean(home.select_one('#masthead'));footer=clean(home.select_one('#colophon'))
(ROOT/'src/content/chrome.json').write_text(json.dumps({'header':header,'footer':footer},indent=2))
(ROOT/'src/content/routes.json').write_text(json.dumps(routes,indent=2))
(ROOT/'src/styles/source.css').write_text('\n'.join(style_chunks))
(ROOT/'docs/assets.json').write_text(json.dumps(assets,indent=2))
(ROOT/'docs/missing-source-assets.json').write_text(json.dumps(missing,indent=2))
print('Migrated',len(routes),'routes;',len(assets),'publicly referenced assets')

# Reapply owner-approved content changes after importing historical source content.
import sys
subprocess.run([sys.executable, str(ROOT/"scripts/apply-content-overrides.py")], check=True)
subprocess.run([sys.executable, str(ROOT/"scripts/build-blog-index.py")], check=True)
