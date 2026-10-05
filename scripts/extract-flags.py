"""Extract KoboldCpp's command-line flags from koboldcpp.py (argparse) into JSON.

Usage: python3 scripts/extract-flags.py <path/to/koboldcpp.py> > src/data/flags.json
Run it for each KoboldCpp release (koboldcpp.py at the release tag), then run gen-flag-docs.py.
Stdlib only; the file is parsed, never executed.
"""

import ast
import json
import re
import sys

src_path = sys.argv[1]
source = open(src_path, encoding="utf-8").read()
tree = ast.parse(source)
version = re.search(r'^KcppVersion\s*=\s*"([^"]+)"', source, re.M).group(1)


def literal(node):
    """Best-effort readable value for an argparse keyword."""
    if node is None:
        return None
    try:
        return ast.literal_eval(node)
    except ValueError:
        pass
    if isinstance(node, ast.Attribute) and node.attr == "SUPPRESS":
        return "SUPPRESS"
    if isinstance(node, ast.Name) and node.id in constants:
        return constants[node.id]
    if isinstance(node, ast.JoinedStr):  # f-string: substitute known module constants
        parts = []
        for v in node.values:
            if isinstance(v, ast.Constant):
                parts.append(str(v.value))
            else:
                parts.append(str(literal(v.value)))
        return "".join(parts)
    return ast.unparse(node)


# Module-level constants such as default_maxctx = 16384, used as defaults and in help texts.
constants = {}
for node in tree.body:
    if isinstance(node, ast.Assign) and len(node.targets) == 1 and isinstance(node.targets[0], ast.Name):
        try:
            constants[node.targets[0].id] = ast.literal_eval(node.value)
        except ValueError:
            pass

# Map each parser/group variable to its group title; mutually exclusive groups inherit their parent's.
groups = {}
flags = []
for node in ast.walk(tree):
    if isinstance(node, ast.Assign) and isinstance(node.value, ast.Call) and isinstance(node.value.func, ast.Attribute):
        call, target = node.value, node.targets[0]
        if not isinstance(target, ast.Name):
            continue
        method = call.func.attr
        parent = call.func.value.id if isinstance(call.func.value, ast.Name) else None
        if method == "ArgumentParser":
            groups[target.id] = "General"
        elif method == "add_argument_group":
            groups[target.id] = literal(call.args[0])
        elif method == "add_mutually_exclusive_group" and parent in groups:
            groups[target.id] = groups[parent]

for node in ast.walk(tree):
    if not (isinstance(node, ast.Call) and isinstance(node.func, ast.Attribute) and node.func.attr == "add_argument"):
        continue
    owner = node.func.value.id if isinstance(node.func.value, ast.Name) else None
    if owner not in groups:
        continue
    kw = {k.arg: k.value for k in node.keywords}
    names = [literal(a) for a in node.args]
    options = [n for n in names if n.startswith("-")]
    if not options:  # positional (legacy model/port arguments)
        continue
    dest = literal(kw.get("dest")) or next(o for o in options if o.startswith("--")).lstrip("-").replace("-", "_")
    help_text = literal(kw.get("help"))
    flags.append({
        "flags": options,
        "dest": dest,
        "group": groups[owner],
        "help": None if help_text == "SUPPRESS" else help_text,
        "hidden": help_text == "SUPPRESS",
        "action": literal(kw.get("action")),
        "type": ast.unparse(kw["type"]) if "type" in kw else None,
        "nargs": literal(kw.get("nargs")),
        "default": literal(kw.get("default")),
        "choices": literal(kw.get("choices")),
        "metavar": literal(kw.get("metavar")),
        "line": node.lineno,
    })

flags.sort(key=lambda f: f["line"])
json.dump({"version": version, "flags": flags}, sys.stdout, indent=1, default=str)
sys.stdout.write("\n")
