#!/usr/bin/env python3
"""
Generate a presentation-style draw.io ERD from `erd_from_database.dbml`.

Produces `draw/erd_presentation.drawio` with nicer header styles, PK/FK markers
and cardinality labels. The layout is grid-based but grouped by simple domains.
Open the resulting file in draw.io and adjust manually for final presentation.
"""
import os
import re
import html
from pathlib import Path

BASE = Path(__file__).resolve().parents[1]
DBML = BASE / 'erd_from_database.dbml'
OUT = BASE / 'erd_presentation.drawio'


def parse_dbml(path):
    tables = {}
    refs = []
    cur = None
    pk_map = {}
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
                pk_map[cur] = []
                continue
            if s == '}' and cur:
                cur = None
                continue
            if cur:
                # capture column and detect pk
                col = s.split('[')[0].strip()
                tables[cur].append(col)
                if '[pk' in s or 'PRIMARY KEY' in s or col.lower().startswith('id '):
                    pk_map[cur].append(col.split()[0])
                continue
            m = re.match(r'^Ref:\s*(\S+)\.(\S+)\s*>\s*(\S+)\.(\S+)', s)
            if m:
                refs.append((m.group(1).strip('`'), m.group(2).strip('`'), m.group(3).strip('`'), m.group(4).strip('`')))
    return tables, refs, pk_map


def is_fk(col):
    return col.endswith('_id') or col.endswith('id')


def make_presentation_drawio(tables, refs, pk_map, out_path):
    # pick ordering: bring core domains first
    core_order = ['users','posts','comments','likes','post_images','post_stats','bookmarks','notifications','tours','bookings','locations','chats','group_chats','messages','stories']
    names = list(tables.keys())
    ordered = [n for n in core_order if n in names] + [n for n in names if n not in core_order]

    parts = []
    parts.append('<?xml version="1.0" encoding="UTF-8"?>')
    parts.append('<mxfile host="generated" modified="2025-11-08T00:00:00.000Z">')
    parts.append('  <diagram id="erd-presentation" name="ERD Presentation">')
    parts.append('    <mxGraphModel dx="1400" dy="1000" grid="1" gridSize="10" guides="1" tooltips="1" connect="1" arrows="1" fold="1" page="1" pageScale="1" pageWidth="827" pageHeight="1169" math="0" shadow="0">')
    parts.append('      <root>')
    parts.append('        <mxCell id="0"/>')
    parts.append('        <mxCell id="1" parent="0"/>')

    per_row = 3
    box_w = 320
    box_h_base = 40
    gap_x = 60
    gap_y = 40

    id_map = {}
    for idx, name in enumerate(ordered, start=1):
        row = (idx-1)//per_row
        col = (idx-1)%per_row
        x = 40 + col*(box_w+gap_x)
        y = 40 + row*(box_h_base + gap_y + 12*max(4, len(tables[name])))
        cols = tables[name]
        height = max(80, box_h_base + 16*len(cols))
        tid = f'P{idx}'
        id_map[name] = tid

        # header style and body style (use single quotes inside to avoid breaking XML attribute)
        header = f"<div style='font-weight:bold;font-size:12px'>{html.escape(name)}</div>"
        body_lines = []
        for c in cols:
            col_name = c.split()[0]
            marker = ''
            if col_name in [p.split()[0] for p in pk_map.get(name, [])]:
                marker = '<b>PK</b> '
            elif is_fk(col_name):
                marker = '<i>FK</i> '
            body_lines.append(f'{marker}{html.escape(c)}')

        value = header + '<br/>' + '<br/>'.join(body_lines)
        # escape value for XML attribute to avoid unescaped '<' errors
        value_escaped = html.escape(value)

        cell = f'        <mxCell id="{tid}" value="{value_escaped}" style="rounded=0;whiteSpace=wrap;html=1;fillColor=#F8F9FB;strokeColor=#2E6DA4;fontSize=11;" parent="1" vertex="1">'
        parts.append(cell)
        parts.append(f'          <mxGeometry x="{x}" y="{y}" width="{box_w}" height="{height}" as="geometry"/>')
        parts.append('        </mxCell>')

    # edges with clearer cardinality markers
    for idx, (lt, lc, rt, rc) in enumerate(refs, start=1):
        s = id_map.get(lt)
        t = id_map.get(rt)
        if not s or not t:
            continue
        eid = f'EP{idx}'
        # choose cardinality: if fk column name endswith _id and parent pk is id -> 1-N
        card = '1 — N'
        edge = f'        <mxCell id="{eid}" value="{card}" style="edgeStyle=orthogonalEdgeStyle;rounded=0;html=1;labelPosition=center;verticalLabelPosition=middle;" parent="1" source="{s}" target="{t}" edge="1">'
        parts.append(edge)
        parts.append('          <mxGeometry relative="1" as="geometry"/>')
        parts.append('        </mxCell>')

    parts.append('      </root>')
    parts.append('    </mxGraphModel>')
    parts.append('  </diagram>')
    parts.append('</mxfile>')

    out_path.write_text('\n'.join(parts), encoding='utf-8')


def main():
    if not DBML.exists():
        print('DBML not found at', DBML)
        return 2
    tables, refs, pk_map = parse_dbml(DBML)
    print('Parsed', len(tables), 'tables and', len(refs), 'refs')
    make_presentation_drawio(tables, refs, pk_map, OUT)
    print('WROTE', OUT)
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
