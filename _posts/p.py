import glob
import os
from string import maketrans
import string

posts = glob.glob("*.md")

fields = [
    "Title",
    "Date",
    "Category",
    "Author",
    "Tags",
    "Template",
    "Panogroup",
    "Summary"
]

def get_appropriate_kv(line):
    line = line.strip().decode("utf-8-sig")
    for f in fields:
        if line.startswith(f):
            return f, line[len(f)+2:]
    return None, None
    

for p in posts:
    with open(p) as f:
        lines = f.readlines()
    
    field_values = {}
    pass_file = False
    for idx, line in enumerate(lines):
        print "asdf" + line + "asdf"
        if line.strip() == "---":
            pass_file=True
            break
        if not line.strip():
            break
        if idx == 0:
            print "aaaaaa["+line[0]+"]asdfasdfasfd"
        field, val = get_appropriate_kv(line)
        if field is not None:
            field_values[field] = val
    if pass_file:
        continue

    layout = field_values["Template"] if "Template" in field_values and field_values["Template"] != "post" else None
    print field_values
    
    d = field_values["Date"].split(" ")[0]
    d_parts = d.split("/")
    if len(d_parts) == 1:
        d_parts = d.split("-")
    if int(d_parts[0]) > int(d_parts[2]):
        date_part = "-".join(d_parts)
    else:
        date_part = "-".join([d_parts[2], d_parts[0], d_parts[1]])
    new_lines = [
        "---",
        "title: " + field_values["Title"],
        "date: " + date_part,
        "category: " + field_values.get("Category", ""),
        "tags: " + field_values.get("Tags", "")
    ]
    if layout is not None:
        new_lines.append("layout: " + layout)

    if "Panogroup" in field_values:
        new_lines.append("panogroup: " + field_values["Panogroup"])

    new_lines.append("---")
    new_lines = new_lines + lines[idx:]

    print p
    with open(p, 'w') as f:
        for new_line in new_lines:
            try:
                print>>f, new_line.encode("utf-8")
            except:
                print>>f, new_line
    


            
