#!/usr/bin/env python3
"""
Generate a compact presentation-style draw.io ERD showing only table names and PK/FK columns.

This overwrites `draw/erd_presentation.drawio` with a compact layout suitable for slides.
"""
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
                col = s.split('[')[0].strip()
                tables[cur].append(col)
                if '[pk' in s or 'PRIMARY KEY' in s or col.lower().startswith('id '):
                    pk_map[cur].append(col.split()[0])
                continue
            m = re.match(r'^Ref:\s*(\S+)\.(\S+)\s*>\s*(\S+)\.(\S+)', s)
            if m:
                refs.append((m.group(1).strip('`'), m.group(2).strip('`'), m.group(3).strip('`'), m.group(4).strip('`')))
    return tables, refs, pk_map


def make_compact_drawio(tables, refs, pk_map, out_path):
    # build fk map from refs (left.table.left_col is FK)
    fk_map = {}
    for lt, lc, rt, rc in refs:
        fk_map.setdefault(lt, set()).add(lc)

    parts = []
    parts.append('<?xml version="1.0" encoding="UTF-8"?>')
    parts.append('<mxfile host="generated" modified="2025-11-09T00:00:00.000Z">')
    parts.append('  <diagram id="erd-presentation" name="ERD Presentation (compact)">')
    parts.append('    <mxGraphModel dx="1200" dy="900" grid="1" gridSize="10" guides="1" tooltips="1" connect="1" arrows="1" fold="1" page="1" pageScale="1" pageWidth="827" pageHeight="1169" math="0" shadow="0">')
    parts.append('      <root>')
    parts.append('        <mxCell id="0"/>')
    parts.append('        <mxCell id="1" parent="0"/>')

    per_row = 4
    box_w = 260
    gap_x = 48
    gap_y = 32

    id_map = {}
    names = list(tables.keys())
    for idx, name in enumerate(names, start=1):
        row = (idx-1)//per_row
        col = (idx-1)%per_row
        x = 40 + col*(box_w+gap_x)
        # compact height: header + up to 6 lines
        pks = pk_map.get(name, [])
        fks = sorted(list(fk_map.get(name, set())))
        lines = len(pks) + len(fks)
        height = max(56, 24 + 18 * (1 + lines))
        y = 40 + row*(height + gap_y)

        tid = f'P{idx}'
        id_map[name] = tid

        header = f"<div style='font-weight:bold;font-size:12px'>{html.escape(name)}</div>"
        body_lines = []
        for p in pks:
            body_lines.append(f"<b>PK</b> {html.escape(p)}")
        for f in fks:
            body_lines.append(f"<i>FK</i> {html.escape(f)}")

        if not body_lines:
            body = '<i>(no PK/FK detected)</i>'
        else:
            body = '<br/>'.join(body_lines)

        value = header + '<br/>' + body
        # escape value for XML attribute (draw.io expects HTML but XML requires escaping)
        value_escaped = html.escape(value)

        cell = f'        <mxCell id="{tid}" value="{value_escaped}" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#FFFFFF;strokeColor=#2E6DA4;fontSize=12;" parent="1" vertex="1">'
        parts.append(cell)
        parts.append(f'          <mxGeometry x="{x}" y="{y}" width="{box_w}" height="{height}" as="geometry"/>')
        parts.append('        </mxCell>')

    # compact edges (no labels)
    for idx, (lt, lc, rt, rc) in enumerate(refs, start=1):
        s = id_map.get(lt)
        t = id_map.get(rt)
        if not s or not t:
            continue
        eid = f'EP{idx}'
        edge = f'        <mxCell id="{eid}" value="" style="edgeStyle=orthogonalEdgeStyle;rounded=0;html=1;strokeColor=#888888;" parent="1" source="{s}" target="{t}" edge="1">'
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
    make_compact_drawio(tables, refs, pk_map, OUT)
    print('WROTE', OUT)
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
