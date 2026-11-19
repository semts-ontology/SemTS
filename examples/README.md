# Examples

The nine examples shown on the [website](https://semts-ontology.github.io/SemTS/#examples), as Turtle files. They are the source of the website: `tools/build.py` reads them from here.

| File | Shows | Builds on |
|---|---|---|
| [01_segments.ttl](01_segments.ttl) | Segments, nesting and Allen relations | |
| [02_segment_knowledge.ttl](02_segment_knowledge.ttl) | Knowledge on individual segments, with the run that produced it | 01 |
| [03_multi_segment.ttl](03_multi_segment.ttl) | Knowledge about a set of segments | |
| [04_knowledge_groups.ttl](04_knowledge_groups.ttl) | Nested knowledge groups | |
| [05_relations.ttl](05_relations.ttl) | Causal chains and other relations between knowledge items | 01 |
| [06_quality.ttl](06_quality.ttl) | Quality measures, a trained model as referenced knowledge, and method knowledge | 01 |
| [07_common_context.ttl](07_common_context.ttl) | Common context knowledge: facts about the machine rather than a segment | 01 |
| [08_provenance.ttl](08_provenance.ttl) | Provenance across three analyses | 01 |
| [09_forecast.ttl](09_forecast.ttl) | Forecasts on artificial segments, with prediction intervals | 04 |

An example is valid together with the example it builds on. Validate all of them with

```bash
pip install -r tools/requirements.txt
python tools/validate.py --repository
```

`legacy_1.2.0/examples.svg` is the example diagram of version 1.2.0. It shows algorithms as knowledge generation concepts, which 1.3.0 no longer allows (see [Changes in 1.3.0](https://semts-ontology.github.io/SemTS/#changes)).
