"""Run the SemTS competency questions against the sample and scenario instance graphs.

The ontology and all vocabularies are loaded together with the instance data, so the
queries can follow rdfs:subClassOf and skos:broader.

usage:
    python evaluation_runner.py 0            # one instance graph (0 sample, 1 scenario 1, 2 scenario 2)
    python evaluation_runner.py --all        # all three, with a summary
    python evaluation_runner.py --all --require-results   # exit 1 if a question has no answer in any graph
"""
import argparse
import sys
from pathlib import Path

import rdflib
import yaml

ROOT = Path(__file__).resolve().parents[2]
INSTANCES = [
    ROOT / "evaluation/competency_questions/sample_instances.rdf",
    ROOT / "application_scenarios/scenario1.ttl",
    ROOT / "application_scenarios/scenario2.ttl",
]
CONTEXT = [ROOT / "ontology/current/ontology.ttl"] + sorted((ROOT / "vocabularies").glob("vocab_*.ttl"))
QUESTIONS = ROOT / "evaluation/competency_questions/competency_questions.yaml"


def load_graph(instance_path, with_context=True):
    g = rdflib.Graph()
    g.parse(instance_path)
    if with_context:
        for f in CONTEXT:
            g.parse(f)
    return g


def questions():
    with open(QUESTIONS, encoding="utf-8") as fh:
        cqs = yaml.safe_load(fh)
    for category, items in cqs["competency questions"].items():
        for q in items:
            yield category, q


def run(instance_path, verbose=True):
    g = load_graph(instance_path)
    counts = {}
    for category, q in questions():
        rows = list(g.query(q["query"]))
        counts[q["question"]] = len(rows)
        if verbose:
            print(f"Category: {category}\nQuestion: {q['question']}\nExample: {q.get('example', '')}\n")
            for row in rows[:20]:
                print("  " + " | ".join(f"{v}={row[v]}" for v in row.labels))
            print(f"  ({len(rows)} rows)\n" + "-" * 60)
    return counts


if __name__ == "__main__":
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("instance_index", type=int, nargs="?", choices=range(len(INSTANCES)))
    ap.add_argument("--all", action="store_true", help="run on all instance graphs and print a summary")
    ap.add_argument("--require-results", action="store_true", help="fail if a question returns no rows in any graph")
    a = ap.parse_args()
    if a.instance_index is None and not a.all:
        ap.error("give an instance index or --all")
    targets = INSTANCES if a.all else [INSTANCES[a.instance_index]]
    total = {}
    for path in targets:
        print(f"=== {path.relative_to(ROOT)}")
        for k, v in run(path, verbose=not a.all).items():
            total.setdefault(k, []).append(v)
    if a.all:
        print("\nRows per question (" + ", ".join(p.name for p in targets) + "):")
        for k, v in total.items():
            print(f"  {' '.join(f'{n:4d}' for n in v)}  {k}")
    if a.require_results:
        empty = [k for k, v in total.items() if not any(v)]
        if empty:
            print("\nQuestions without any answer:\n  " + "\n  ".join(empty))
            sys.exit(1)
