import os

def create_optimized_class_diagram():
    # Define entities and their attributes (Same as before)
    entities = {
        "User": ["id: int", "username: string", "email: string", "role: enum", "points: int"],
        "Post": ["id: int", "title: string", "author_id: int", "content: text", "status: enum"],
        "Comment": ["id: int", "post_id: int", "author_id: int", "content: text"],
        "Tour": ["id: int", "seller_id: int", "title: string", "price: float", "start_loc: string"],
        "Booking": ["id: int", "tour_id: int", "user_id: int", "status: enum", "total_price: float"],
        "Location": ["id: int", "name: string", "latitude: float", "longitude: float", "category: enum"],
        "Chat": ["id: int", "sender_id: int", "receiver_id: int", "message: text", "room_id: string"],
        "GroupChat": ["id: int", "room_id: string", "name: string", "created_by: int"],
        "FriendRequest": ["id: int", "requester_id: int", "receiver_id: int", "status: enum"],
        "Notification": ["id: int", "user_id: int", "type: string", "message: text"],
        "Report": ["id: int", "reporter_id: int", "target_id: int", "reason: enum"],
        "NFT": ["id: int", "token_id: string", "owner_id: int", "name: string"],
        "UserPreferences": ["id: int", "user_id: int", "interests: json", "budget: enum"]
    }

    # Optimized Positions for A4 Landscape (1169 x 827)
    # Grid layout to minimize crossing
    # Center: User
    # Top Row: Auxiliaries
    # Left Column: Content
    # Right Column: Commerce
    # Bottom Row: Communication/Admin
    
    positions = {
        # Center
        "User": (500, 300),
        
        # Top Row
        "FriendRequest": (80, 40),
        "UserPreferences": (300, 40),
        "Location": (520, 40),
        "Notification": (740, 40),
        "NFT": (960, 40),
        
        # Left Side (Content)
        "Post": (80, 300),
        "Comment": (80, 550),
        
        # Right Side (Commerce)
        "Tour": (960, 300),
        "Booking": (960, 550),
        
        # Bottom Row
        "Report": (300, 550),
        "Chat": (520, 550),
        "GroupChat": (740, 550)
    }

    # Define relationships (Source, Target, Label, StyleHints)
    # StyleHints: entryX, entryY, exitX, exitY (0=left, 0.5=center, 1=right, 0=top, 1=bottom)
    relationships = [
        # User to Top
        ("User", "FriendRequest", "1:N", "exitX=0;exitY=0;entryX=0.5;entryY=1"),
        ("User", "UserPreferences", "1:1", "exitX=0.25;exitY=0;entryX=0.5;entryY=1"),
        ("User", "Notification", "1:N", "exitX=0.75;exitY=0;entryX=0.5;entryY=1"),
        ("User", "NFT", "1:N", "exitX=1;exitY=0;entryX=0.5;entryY=1"),
        
        # User to Left (Content)
        ("User", "Post", "1:N", "exitX=0;exitY=0.5;entryX=1;entryY=0.5"),
        ("User", "Comment", "1:N", "exitX=0;exitY=1;entryX=1;entryY=0.5"), # Diagonal
        ("User", "Report", "1:N", "exitX=0.25;exitY=1;entryX=0.5;entryY=0"),
        
        # User to Right (Commerce)
        ("User", "Tour", "1:N (Seller)", "exitX=1;exitY=0.5;entryX=0;entryY=0.5"),
        ("User", "Booking", "1:N", "exitX=1;exitY=1;entryX=0;entryY=0.5"), # Diagonal
        
        # User to Bottom (Chat)
        ("User", "Chat", "1:N", "exitX=0.5;exitY=1;entryX=0.5;entryY=0"),
        ("User", "GroupChat", "1:N (Creator)", "exitX=0.75;exitY=1;entryX=0.5;entryY=0"),
        
        # Inter-entity
        ("Post", "Comment", "1:N", "exitX=0.5;exitY=1;entryX=0.5;entryY=0"),
        ("Tour", "Booking", "1:N", "exitX=0.5;exitY=1;entryX=0.5;entryY=0"),
        
        # Location connections
        ("Location", "Tour", "1:N", "exitX=1;exitY=0.5;entryX=0.5;entryY=0"),
        ("Location", "Post", "1:N", "exitX=0;exitY=0.5;entryX=0.5;entryY=0"),
    ]

    xml_header = """<mxfile host="app.diagrams.net" modified="2023-11-22T00:00:00.000Z" agent="5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/118.0.0.0 Safari/537.36" version="21.7.5" type="device">
  <diagram name="Class Diagram" id="classDiagram1">
    <mxGraphModel dx="1422" dy="762" grid="1" gridSize="10" guides="1" tooltips="1" connect="1" arrows="1" fold="1" page="1" pageScale="1" pageWidth="1169" pageHeight="827" math="0" shadow="0">
      <root>
        <mxCell id="0" />
        <mxCell id="1" parent="0" />"""

    xml_footer = """      </root>
    </mxGraphModel>
  </diagram>
</mxfile>"""

    cells = ""
    
    # Generate Entity Cells
    for name, attrs in entities.items():
        x, y = positions.get(name, (0, 0))
        width = 160
        height = 26 + (len(attrs) * 26)
        
        # Class Header (Swimlane)
        cells += f"""
        <mxCell id="{name}" value="{name}" style="swimlane;fontStyle=1;align=center;verticalAlign=top;childLayout=stackLayout;horizontal=1;startSize=26;horizontalStack=0;resizeParent=1;resizeParentMax=0;resizeLast=0;collapsible=1;marginBottom=0;whiteSpace=wrap;html=1;fillColor=#dae8fc;strokeColor=#6c8ebf;" vertex="1" parent="1">
          <mxGeometry x="{x}" y="{y}" width="{width}" height="{height}" as="geometry" />
        </mxCell>"""
        
        # Attributes
        for i, attr in enumerate(attrs):
            cells += f"""
            <mxCell id="{name}_attr_{i}" value="{attr}" style="text;strokeColor=none;fillColor=none;align=left;verticalAlign=middle;spacingLeft=4;spacingRight=4;overflow=hidden;rotatable=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;whiteSpace=wrap;html=1;" vertex="1" parent="{name}">
              <mxGeometry y="{26 + (i * 26)}" width="{width}" height="26" as="geometry" />
            </mxCell>"""

    # Generate Relationship Edges
    for i, (source, target, label, style_hints) in enumerate(relationships):
        # Parse style hints if needed, or just append them to style string
        # Using orthogonalEdgeStyle to avoid overlaps
        style = f"edgeStyle=orthogonalEdgeStyle;rounded=1;orthogonalLoop=1;jettySize=auto;html=1;{style_hints};"
        
        cells += f"""
        <mxCell id="rel_{i}" value="{label}" style="{style}" edge="1" parent="1" source="{source}" target="{target}">
          <mxGeometry relative="1" as="geometry" />
        </mxCell>"""

    full_xml = xml_header + cells + xml_footer
    
    os.makedirs("draw", exist_ok=True)
    with open("draw/class_diagram.drawio", "w", encoding="utf-8") as f:
        f.write(full_xml)
    
    print("Successfully updated draw/class_diagram.drawio with optimized layout")

if __name__ == "__main__":
    create_optimized_class_diagram()
