#!/usr/bin/env python3
"""
Generate a compact class-style diagram (draw.io) from the project DBML.
Each entity is limited to at most five representative attributes to keep
the visual footprint manageable while still covering every table and
relationship defined in `draw/erd_from_database.dbml`.
"""
from __future__ import annotations

import html
import os
import re
from typing import Dict, List, Tuple

BASE = os.path.dirname(os.path.dirname(__file__))
DBML_PATH = os.path.join(BASE, 'erd_from_database.dbml')
OUT_PATH = os.path.join(BASE, 'VieGo_Class_Diagram_Full.drawio')
MAX_ATTR = 5


TableMap = Dict[str, List[str]]
RefList = List[Tuple[str, str, str, str]]


def parse_dbml(path: str) -> Tuple[TableMap, RefList]:
    tables: TableMap = {}
    refs: RefList = []
    cur = None
    with open(path, 'r', encoding='utf-8') as fh:
        for raw in fh:
            line = raw.strip()
            if not line or line.startswith('//'):
                continue
            m = re.match(r'^Table\s+([A-Za-z0-9_`]+)\s*\{', line)
            if m:
                cur = m.group(1).strip('`')
                tables[cur] = []
                continue
            if line == '}' and cur:
                cur = None
                continue
            if cur:
                col = line.split('[')[0].strip()
                if col:
                    tables[cur].append(col)
                continue
            m = re.match(r'^Ref:\s*(\S+)\.(\S+)\s*>\s*(\S+)\.(\S+)', line)
            if m:
                refs.append(tuple(part.strip('`') for part in m.groups()))
    return tables, refs


def summarize_columns(columns: List[str]) -> List[str]:
    summary = []
    for raw in columns:
        col_def = raw.split('//')[0].strip()
        if not col_def:
            continue
        tokens = col_def.split()
        if not tokens:
            continue
        name = tokens[0]
        ctype = tokens[1] if len(tokens) > 1 else ''
        if ctype:
            entry = f"{name}: {ctype}"
        else:
            entry = name
        summary.append(entry)
        if len(summary) >= MAX_ATTR:
            break
    return summary


def make_drawio(tables: TableMap, refs: RefList, out_path: str) -> None:
    per_row = 5
    width = 240
    base_height = 60
    vert_gap = 60
    horiz_gap = 35
    row_stride = base_height + MAX_ATTR * 18

    parts: List[str] = []
    parts.append('<?xml version="1.0" encoding="UTF-8"?>')
    parts.append('<mxfile host="generated" modified="2025-11-22T00:00:00.000Z" editor="github-copilot">')
    parts.append('  <diagram id="class-full" name="VieGo Class Diagram (Full)">')
    parts.append('    <mxGraphModel dx="1600" dy="1200" grid="1" gridSize="10" guides="1" tooltips="1" connect="1" arrows="1" fold="1" page="1" pageScale="1" pageWidth="1600" pageHeight="1200" math="0" shadow="0">')
    parts.append('      <root>')
    parts.append('        <mxCell id="0"/>')
    parts.append('        <mxCell id="1" parent="0"/>')

    table_ids: Dict[str, str] = {}
    for idx, (name, cols) in enumerate(sorted(tables.items()), start=1):
        tid = f"t{idx}"
        table_ids[name] = tid
        row = (idx - 1) // per_row
        col = (idx - 1) % per_row
        x = 30 + col * (width + horiz_gap)
        summary = summarize_columns(cols)
        height = base_height + len(summary) * 16
        y = 30 + row * (row_stride + vert_gap)
        body_lines = [f"<b>{html.escape(name)}</b>"]
        for col_text in summary:
            body_lines.append('- ' + html.escape(col_text))
        value = '<br/>'.join(body_lines)
        parts.append(f'        <mxCell id="{tid}" value="{value}" style="rounded=0;whiteSpace=wrap;html=1;align=left;spacingLeft=6;spacingTop=6;strokeColor=#1a1a1a;fillColor=#fffefe;" vertex="1" parent="1">')
        parts.append(f'          <mxGeometry x="{x}" y="{y}" width="{width}" height="{height}" as="geometry"/>')
        parts.append('        </mxCell>')

    for idx, (ltable, lcol, rtable, rcol) in enumerate(refs, start=1):
        src = table_ids.get(ltable)
        dst = table_ids.get(rtable)
        if not src or not dst:
            continue
        eid = f'e{idx}'
        label = html.escape(f"{ltable}.{lcol} → {rtable}.{rcol}")
        parts.append(f'        <mxCell id="{eid}" value="{label}" style="edgeStyle=orthogonalEdgeStyle;rounded=0;html=1;strokeWidth=1.1;endArrow=block;endFill=1;labelBackgroundColor=#ffffff;" edge="1" parent="1" source="{src}" target="{dst}">')
        parts.append('          <mxGeometry relative="1" as="geometry"/>')
        parts.append('        </mxCell>')

    parts.append('      </root>')
    parts.append('    </mxGraphModel>')
    parts.append('  </diagram>')
    parts.append('</mxfile>')

    with open(out_path, 'w', encoding='utf-8') as fh:
        fh.write('\n'.join(parts))


def main() -> int:
    if not os.path.exists(DBML_PATH):
        print(f"DBML not found at {DBML_PATH}")
        return 2
    tables, refs = parse_dbml(DBML_PATH)
    make_drawio(tables, refs, OUT_PATH)
    print(f"Generated {OUT_PATH} with {len(tables)} tables and {len(refs)} relationships")
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
