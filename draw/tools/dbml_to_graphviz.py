#!/usr/bin/env python3
"""
Convert `draw/erd_from_database.dbml` into a Graphviz DOT and render PNG.

Writes `draw/erd_v2_graph.dot` and attempts to render `draw/erd_v2_graph.png` using
the `dot` executable. If `dot` is not available, the DOT file is still written so
you can render it locally (e.g., `dot -Tpng draw/erd_v2_graph.dot -o draw/erd_v2_graph.png`).
"""
import os
import re
import html
import subprocess
from pathlib import Path

BASE = Path(__file__).resolve().parents[1]
DBML = BASE / 'erd_from_database.dbml'
OUT_DOT = BASE / 'erd_v2_graph.dot'
OUT_PNG = BASE / 'erd_v2_graph.png'


def parse_dbml(path):
    tables = {}
    refs = []
    cur = None
    with open(path, 'r', encoding='utf-8') as f:
        for raw in f:
            line = raw.rstrip('\n')
            s = line.strip()
            if not s or s.startswith('//'):
                continue
            m = re.match(r'^Table\s+([A-Za-z0-9_`]+)\s*\{', s)
            if m:
                cur = m.group(1).strip('`')
                tables[cur] = []
                continue
            if s == '}' and cur:
                cur = None
                continue
            if cur:
                col = s.split('[')[0].strip()
                if col:
                    tables[cur].append(col)
                continue
            m = re.match(r'^Ref:\s*(\S+)\.(\S+)\s*>\s*(\S+)\.(\S+)', s)
            if m:
                refs.append((m.group(1).strip('`'), m.group(2).strip('`'), m.group(3).strip('`'), m.group(4).strip('`')))
    return tables, refs


def make_dot(tables, refs, out_path):
    lines = []
    lines.append('digraph ERD {')
    lines.append('  graph [rankdir="LR", splines=true, overlap=false];')
    lines.append('  node [shape=plaintext,fontname="Helvetica"];')

    for t, cols in tables.items():
        # build an HTML-like table for label
        rows = []
        rows.append(f'<TR><TD COLSPAN="2"><B>{html.escape(t)}</B></TD></TR>')
        for c in cols:
            # split name and type for compactness
            parts = c.split(None, 1)
            name = parts[0]
            rest = parts[1] if len(parts) > 1 else ''
            rows.append(f'<TR><TD ALIGN="left">{html.escape(name)}</TD><TD ALIGN="left">{html.escape(rest)}</TD></TR>')
        table_html = '<TABLE BORDER="0" CELLBORDER="1" CELLSPACING="0">' + ''.join(rows) + '</TABLE>'
        lines.append(f'  "{t}" [label=<{table_html}>];')

    for (lt, lc, rt, rc) in refs:
        # edge from left table (child) to right table (parent)
        label = f"{html.escape(lc)} → {html.escape(rc)}"
        lines.append(f'  "{lt}" -> "{rt}" [label="{label}", fontsize=10];')

    lines.append('}')
    out_path.write_text('\n'.join(lines), encoding='utf-8')


def try_render(dot_path, png_path):
    try:
        subprocess.run(['dot', '-V'], stdout=subprocess.PIPE, stderr=subprocess.PIPE, check=True)
    except Exception:
        print('Graphviz `dot` not found on PATH; DOT file written but PNG not rendered.')
        return False
    try:
        subprocess.run(['dot', '-Tpng', str(dot_path), '-o', str(png_path)], check=True)
        print(f'WROTE {png_path}')
        return True
    except subprocess.CalledProcessError as e:
        print('dot failed:', e)
        return False


def main():
    if not DBML.exists():
        print('DBML file missing:', DBML)
        return 2
    tables, refs = parse_dbml(DBML)
    print(f'Parsed {len(tables)} tables and {len(refs)} refs')
    make_dot(tables, refs, OUT_DOT)
    print('WROTE', OUT_DOT)
    rendered = try_render(OUT_DOT, OUT_PNG)
    if not rendered:
        print('To render locally:')
        print(f'  dot -Tpng "{OUT_DOT}" -o "{OUT_PNG}"')
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
