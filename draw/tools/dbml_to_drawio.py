#!/usr/bin/env python3
"""
Simple DBML -> draw.io (.drawio) converter.

Reads `draw/erd_from_database.dbml` and writes `draw/erd_v2.drawio`.

This produces a straightforward grid layout: one box per table (name + columns)
and orthogonal edges for each `Ref: a.col > b.col` relationship found in the DBML.

The output is basic but opens in draw.io for manual refinement (colors, cardinalities,
arrangement). Use draw.io to polish and export PNG/PDF as needed.
"""
import re
import os
import html

BASE = os.path.dirname(os.path.dirname(__file__))
DBML_PATH = os.path.join(BASE, 'erd_from_database.dbml')
OUT_PATH = os.path.join(BASE, '..', 'erd_v2.drawio')


def parse_dbml(path):
    tables = {}
    refs = []
    cur_table = None
    with open(path, 'r', encoding='utf-8') as f:
        for raw in f:
            line = raw.rstrip('\n')
            s = line.strip()
            if not s or s.startswith('//'):
                continue
            m = re.match(r'^Table\s+([A-Za-z0-9_`]+)\s*\{', s)
            if m:
                cur_table = m.group(1).strip('`')
                tables[cur_table] = []
                continue
            if s == '}' and cur_table:
                cur_table = None
                continue
            if cur_table:
                # column line: name type ...
                # keep the raw substring before any '[' or comment
                col = s.split('[')[0].strip()
                if col:
                    tables[cur_table].append(col)
                continue
            # parse Ref lines
            m = re.match(r'^Ref:\s*(\S+)\.(\S+)\s*>\s*(\S+)\.(\S+)', s)
            if m:
                left_table = m.group(1).strip('`')
                left_col = m.group(2).strip('`')
                right_table = m.group(3).strip('`')
                right_col = m.group(4).strip('`')
                refs.append((left_table, left_col, right_table, right_col))
    return tables, refs


def make_drawio(tables, refs, out_path):
    # layout parameters
    per_row = 4
    w = 260
    h_base = 40
    row_gap = 40
    col_gap = 40

    # start xml
    parts = []
    parts.append('<?xml version="1.0" encoding="UTF-8"?>')
    parts.append('<mxfile host="generated" modified="2025-11-08T00:00:00.000Z">')
    parts.append('  <diagram id="erd-v2" name="ERD v2">')
    parts.append('    <mxGraphModel dx="1400" dy="1000" grid="1" gridSize="10" guides="1" tooltips="1" connect="1" arrows="1" fold="1" page="1" pageScale="1" pageWidth="827" pageHeight="1169" math="0" shadow="0">')
    parts.append('      <root>')
    parts.append('        <mxCell id="0"/>')
    parts.append('        <mxCell id="1" parent="0"/>')

    # create table cells
    table_ids = {}
    tables_list = list(tables.items())
    for idx, (tname, cols) in enumerate(tables_list, start=1):
        row = (idx - 1) // per_row
        col = (idx - 1) % per_row
        x = 40 + col * (w + col_gap)
        y = 40 + row * (h_base + max(120, len(cols) * 12) + row_gap)
        height = max(60, h_base + len(cols) * 12)
        tid = f"t{idx}"
        table_ids[tname] = tid
        # prepare value: table name bold + columns list
        lines = [f"<b>{html.escape(tname)}</b>"]
        for c in cols:
            lines.append('- ' + html.escape(c))
        value = '<br/>'.join(lines)
        cell = f'        <mxCell id="{tid}" value="{value}" style="rounded=0;whiteSpace=wrap;html=1;fillColor=#FFFFFF;strokeColor=#6B8E23;" parent="1" vertex="1">'
        geom = f'          <mxGeometry x="{x}" y="{y}" width="{w}" height="{height}" as="geometry"/>'
        parts.append(cell)
        parts.append(geom)
        parts.append('        </mxCell>')

    # create edges for refs
    for idx, (lt, lc, rt, rc) in enumerate(refs, start=1):
        source_id = table_ids.get(lt)
        target_id = table_ids.get(rt)
        if not source_id or not target_id:
            # unknown table (skip)
            continue
        eid = f'e{idx}'
        # label default as FK
        label = html.escape(f'{lt}.{lc} → {rt}.{rc}')
        edge = f'        <mxCell id="{eid}" value="1 — N" style="edgeStyle=orthogonalEdgeStyle;rounded=0;html=1;labelPosition=top;verticalLabelPosition=top;" parent="1" source="{source_id}" target="{target_id}" edge="1">'
        parts.append(edge)
        parts.append('          <mxGeometry relative="1" as="geometry"/>')
        parts.append('        </mxCell>')

    parts.append('      </root>')
    parts.append('    </mxGraphModel>')
    parts.append('  </diagram>')
    parts.append('</mxfile>')

    with open(out_path, 'w', encoding='utf-8') as f:
        f.write('\n'.join(parts))


def main():
    if not os.path.exists(DBML_PATH):
        print(f'ERROR: DBML file not found: {DBML_PATH}')
        return 2
    tables, refs = parse_dbml(DBML_PATH)
    print(f'Parsed {len(tables)} tables and {len(refs)} refs')
    make_drawio(tables, refs, OUT_PATH)
    print(f'WROTE {os.path.abspath(OUT_PATH)}')
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
