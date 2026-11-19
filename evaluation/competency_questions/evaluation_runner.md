# Competency Questions Runner

`evaluation_runner.py` runs the competency questions of `competency_questions.yaml` as SPARQL queries against instance graphs of this repository. It uses `PyYAML` to read the questions and `rdflib` to load the data and run the queries. It was used to evaluate SemTS with project data and works with any dataset in this repository.

The runner loads the SemTS ontology (`ontology/current/ontology.ttl`) and all vocabularies (`vocabularies/vocab_*.ttl`) together with the instance graph, so that queries can follow `rdfs:subClassOf` and `skos:broader`.

---

## Prerequisites

- Python 3.9 or newer.

## Installation

```bash
python -m venv venv
source venv/bin/activate          # on Windows: venv\Scripts\activate
pip install -r requirements.txt
```

## Usage

Select an instance graph by index:

| Index | Graph |
|---|---|
| `0` | `evaluation/competency_questions/sample_instances.rdf` (tsfresh features of UCR time series) |
| `1` | `application_scenarios/scenario1.ttl` (anomaly detection in blow moulding) |
| `2` | `application_scenarios/scenario2.ttl` (forecasting grinding bead wear) |

```bash
python evaluation_runner.py 0               # print questions and results for one graph
python evaluation_runner.py --all           # count the results of every question in every graph
python evaluation_runner.py --all --require-results   # exit with an error if a question has no answer in any graph
```

The script can be started from any directory. Paths are resolved relative to the repository.

## Output

For a single graph, the script prints each question, its example and up to 20 result rows. With `--all` it prints a table of row counts per question and graph.
