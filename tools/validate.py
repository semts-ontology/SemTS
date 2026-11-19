#!/usr/bin/env python3
"""Validate instance data against the SemTS SHACL shapes with pySHACL.

The ontology and all vocabularies are added as the ontology graph, so that class
hierarchies and concept types are visible to the validator.

usage:
    python tools/validate.py my-data.ttl [more.ttl ...]   validate your own files (validated together)
    python tools/validate.py --repository                 validate the examples, scenarios and sample data

requires: pip install -r tools/requirements.txt   (rdflib, pyshacl)
"""
import argparse
import sys
from pathlib import Path

from pyshacl import validate
from rdflib import Graph

ROOT = Path(__file__).resolve().parents[1]
SHAPES = ROOT / "evaluation/instance_validation/shacl_shapes.ttl"
CONTEXT = [ROOT / "ontology/current/ontology.ttl"] + sorted((ROOT / "vocabularies").glob("vocab_*.ttl"))

# The examples build on each other: an example is validated together with the graphs it extends.
EXAMPLE_DEPENDENCIES = {
    "02": ["01"], "05": ["01"], "06": ["01"], "07": ["01"], "08": ["01"], "09": ["04"],
}


def context_graph():
    g = Graph()
    for f in CONTEXT:
        g.parse(f)
    return g


def check(name, files, shapes, context):
    data = Graph()
    for f in files:
        data.parse(f)
    conforms, _, text = validate(data, shacl_graph=shapes, ont_graph=context, advanced=True, allow_warnings=True)
    print(f"{'ok  ' if conforms else 'FAIL'} {name}")
    if not conforms:
        print(text)
    return conforms


def repository_targets():
    examples = {p.name[:2]: p for p in sorted((ROOT / "examples").glob("[0-9][0-9]_*.ttl"))}
    for key, path in examples.items():
        yield f"examples/{path.name}", [examples[d] for d in EXAMPLE_DEPENDENCIES.get(key, [])] + [path]
    for path in sorted((ROOT / "application_scenarios").glob("scenario*.ttl")):
        yield f"application_scenarios/{path.name}", [path]
    yield "evaluation/competency_questions/sample_instances.rdf", [ROOT / "evaluation/competency_questions/sample_instances.rdf"]


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("files", nargs="*", type=Path)
    ap.add_argument("--repository", action="store_true", help="validate all data files of the repository")
    a = ap.parse_args()
    if not a.files and not a.repository:
        ap.error("give data files or --repository")
    shapes = Graph().parse(SHAPES)
    context = context_graph()
    targets = list(repository_targets()) if a.repository else [(", ".join(map(str, a.files)), a.files)]
    results = [check(name, files, shapes, context) for name, files in targets]
    print(f"\n{sum(results)} of {len(results)} conform")
    sys.exit(0 if all(results) else 1)


if __name__ == "__main__":
    main()
