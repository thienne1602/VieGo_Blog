import re
from pathlib import Path

sql_path = Path(r"d:\project\VieGo_Blog\draw\database.sql")
out_path = Path(r"d:\project\VieGo_Blog\draw\erd_from_database.dbml")

create_re = re.compile(r"CREATE TABLE IF NOT EXISTS `(\w+)` \((.*?)\) ENGINE=", re.S)
pk_re = re.compile(r"PRIMARY KEY \(([^)]+)\)")
fk_re = re.compile(r"FOREIGN KEY \((`?\w+`?)\) REFERENCES `(\w+)` \((`?\w+`?)\)")
unique_re = re.compile(r"UNIQUE KEY `([^`]+)` \(([^)]+)\)")

def split_columns(body):
    """Split body by commas that are NOT inside parentheses."""
    parts = []
    cur = []
    depth = 0
    i = 0
    while i < len(body):
        ch = body[i]
        if ch == '(':
            depth += 1
            cur.append(ch)
        elif ch == ')':
            depth = max(0, depth-1)
            cur.append(ch)
        elif ch == ',' and depth == 0:
            part = ''.join(cur).strip()
            if part:
                parts.append(part)
            cur = []
        else:
            cur.append(ch)
        i += 1
    last = ''.join(cur).strip()
    if last:
        parts.append(last)
    return parts

sql = sql_path.read_text(encoding='utf-8', errors='ignore')

tables = []
for m in create_re.finditer(sql):
    name = m.group(1)
    body = m.group(2).strip()
    parts = split_columns(body)
    cols = []
    pks = []
    fks = []
    uniques = []
    for part in parts:
        p = part.strip()
        if p.upper().startswith('PRIMARY KEY'):
            pm = pk_re.search(p)
            if pm:
                cols_text = pm.group(1)
                cols_text = cols_text.replace('`','')
                for c in cols_text.split(','):
                    pks.append(c.strip())
        elif p.upper().startswith('UNIQUE KEY') or p.upper().startswith('UNIQUE INDEX'):
            um = unique_re.search(p)
            if um:
                coltext = um.group(2).replace('`','')
                uniques.append(tuple(x.strip() for x in coltext.split(',')))
        elif 'FOREIGN KEY' in p.upper():
            fm = fk_re.search(p)
            if fm:
                src = fm.group(1).replace('`','')
                ref_table = fm.group(2)
                ref_col = fm.group(3).replace('`','')
                fks.append((src, ref_table, ref_col))
        elif p.startswith('`'):
            # column definition
            mcol = re.match(r"`(?P<name>\w+)`\s+(?P<type>.+)$", p)
            if mcol:
                col = mcol.group('name')
                typ = mcol.group('type').strip()
                cols.append((col, typ))
    tables.append({'name':name,'cols':cols,'pks':pks,'fks':fks,'uniques':uniques})

# produce dbml
lines = []
lines.append('// Generated DBML from draw/database.sql')
for t in tables:
    lines.append(f"Table {t['name']} {{")
    for col,typ in t['cols']:
        attr = ''
        if col in t['pks']:
            attr = ' [pk]'
        if 'NOT NULL' in typ.upper():
            if attr:
                attr = attr.replace(']', ', not null]')
            else:
                attr = ' [not null]'
        simple_type = typ
        # keep enum(...) or varchar(...) as-is but remove trailing modifiers like DEFAULT
        simple_type = re.split(r"\s+DEFAULT\s+|\s+COMMENT\s+", simple_type, flags=re.I)[0]
        lines.append(f"  {col} {simple_type}{attr}")
    lines.append('}')
    lines.append('')

# references
for t in tables:
    for fk in t['fks']:
        src_col, ref_table, ref_col = fk
        lines.append(f"Ref: {t['name']}.{src_col} > {ref_table}.{ref_col}")

out_path.write_text('\n'.join(lines), encoding='utf-8')
print('WROTE', out_path)
