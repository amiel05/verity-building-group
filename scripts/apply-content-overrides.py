"""Preserve owner-approved residential focus after a public-source migration."""
import json
from pathlib import Path
from bs4 import BeautifulSoup

ROOT = Path(__file__).resolve().parents[1]
REMOVED_ROUTE = '/category/commercial-construction-and-renovation/'
REPLACEMENTS = {
    'Ready to develop land, build a custom home, or bring a commercial project to life?': 'Ready to develop land or build a custom home?',
    'commercial renovation': 'residential renovation',
    'residential, commercial, land development': 'residential, land development',
    'renovating commercial spaces': 'renovating homes',
    'improving a commercial property': 'improving a home',
    'land development, commercial projects, renovations': 'land development, renovations',
    'renovations, land development, and commercial construction': 'renovations, and land development',
    'land development, renovations, and commercial projects': 'land development, and renovations',
    'infill properties, active commercial corridors, and sites': 'infill properties, and sites',
    'areas, infill opportunities, and commercial corridors': 'areas, and infill opportunities',
    'For land and commercial work': 'For land development',
    'Can you help with both residential and commercial projects?': 'Can you help with custom homes, renovations, and land development?',
    'Residential &amp;<br/>\nCommercial Development': 'Custom Homes &amp;<br/>\nLand Development',
    'Custom homes, commercial buildings, and land development': 'Custom homes and land development',
    'residential and commercial projects': 'residential projects',
    'residential and commercial construction': 'residential construction',
    'residential, commercial, and development projects': 'residential and land development projects',
    'renovations, land planning, and select commercial projects': 'renovations, and land planning',
    'custom homes, land development and commercial construction': 'custom homes and land development',
    'renovating a commercial property': 'renovating a home',
}

def edit(value):
    if isinstance(value, dict):
        return {key: edit(item) for key, item in value.items()}
    if isinstance(value, list):
        return [edit(item) for item in value if item not in ('Commercial construction', 'Commercial renovation')]
    if isinstance(value, str):
        for old, new in REPLACEMENTS.items():
            value = value.replace(old, new)
    return value

for path in (ROOT / 'src/content/pages').glob('*.json'):
    record = json.loads(path.read_text())
    if record['path'] == REMOVED_ROUTE:
        path.unlink()
        continue
    # Remove entire obsolete controls/cards instead of merely relabeling them.
    for index, section in enumerate(record['sections']):
        if record['path'] not in ('/home-2/', '/portfolio/') or 'commercial' not in section.lower():
            continue
        soup = BeautifulSoup(section, 'html.parser')
        for card in soup.select('.service-card'):
            if card.select_one('a[href*="commercial-construction-renovation"]'):
                card.decompose()
        for node in soup.select('[data-primary-filter="commercial"], [data-subfilters="commercial"]'):
            node.decompose()
        record['sections'][index] = str(soup)
    record = edit(record)
    override = ROOT / "src/content/overrides" / (path.stem + ".html")
    if override.exists():
        record["sections"] = [override.read_text()]
        if record["path"] == "/services/":
            for meta in record["meta"]:
                if meta.get("name") == "description" or meta.get("property") == "og:description":
                    meta["content"] = "Explore land development, custom home construction, and community-focused Legacy Projects with Verity Building Group across Charlotte and the Lake Norman area."
    seo_override = ROOT / "src/content/overrides" / (path.stem + ".seo.json")
    if seo_override.exists():
        record.update(json.loads(seo_override.read_text()))
    result = json.dumps(record, indent=2, ensure_ascii=False)
    assert 'commercial' not in result.lower(), f'Unreviewed reference in {path.name}'
    path.write_text(result)

routes_path = ROOT / 'src/content/routes.json'
routes = json.loads(routes_path.read_text())
routes_path.write_text(json.dumps([r for r in routes if r['path'] != REMOVED_ROUTE], indent=2))
redirects_path = ROOT / 'src/content/redirects.json'
redirects = json.loads(redirects_path.read_text())
redirects[REMOVED_ROUTE] = '/insights/'
redirects[REMOVED_ROUTE.rstrip('/')] = '/insights/'
redirects_path.write_text(json.dumps(redirects, indent=2) + '\n')
print('Applied owner-approved content changes.')
