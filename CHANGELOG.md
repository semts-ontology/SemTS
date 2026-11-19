# Changelog

All notable changes to the SemTS ontology, shapes, vocabularies and documentation. Versions follow [SemVer 2.0.0](https://semver.org/). For changes up to 1.2.0 see the "Changes from last version" section of the WIDOCO documentation in `ontology/versioned/{version}/`.

## [1.3.0] - 2026-11-18

How to update data written for 1.2.0, the deprecated concepts and the term-by-term comparison with 1.2.0 are on the website: [Changes in 1.3.0](https://semts-ontology.github.io/SemTS/#changes).

### Added
- `semts:KnowledgeRelation` with `DirectedKnowledgeRelation` and `UndirectedKnowledgeRelation`, and the properties `knowledgeRelationParticipant`, `knowledgeRelationSource` and `knowledgeRelationTarget`.
- `semts:CommonContextKnowledge` and `semts:commonContextKnowledge` for knowledge that holds for a machine, process or site rather than for a stretch of data.
- `semts:correspondingOwlTimeRelation`, relating each Allen relation to the OWL-Time relation it is derived from.
- Restrictions: every knowledge item has exactly one `knowledgeGenerationEntity`. Every `KnowledgeGenerationOutput` has output knowledge, an input it was derived from and a generating entity. Every `KnowledgeGenerationInput` references data or knowledge.
- Ontology metadata: `dcterms:bibliographicCitation`, `dcterms:references`, the author as a `foaf:Person` individual, `xsd:date` dates.
- Vocabularies: knowledge generation (`semts-gv`, with a Method Knowledge branch for `semts:MethodKnowledge`, `semts:Algorithm` and `semts:Hyperparameter`), quality measures (`semts-qv`), and two example extensions: a feature catalogue for data knowledge (`semts-dfx`) and a manufacturing module for scenario knowledge (`semts-msv`).
- `semts-dfx:LinearTrend` for the remaining statistics of a linear trend (p-value, r value, standard error).
- SHACL: shapes graph header with version and licence, and checks for `segmentKnowledge`, `multiSegmentKnowledge`, segment titles and descriptions, and `knowledgeQualityMeasure`.
- Nine Turtle examples (`examples/`), a website generated from the sources (`tools/build.py`) with the specification, an embedded WebVOWL graph, sections on AI agents and on reports written by language models, and a contact page, JSON-LD and N-Triples serialisations, `tools/validate.py`, `tools/check_sources.py` and a GitHub workflow running them.

### Changed
- QUDT references use the QUDT 2/3 schema namespace `http://qudt.org/schema/qudt/`.
- `semts:ReferencedValue` is a subclass of `dcat:Resource` (was `dcat:Dataset`).
- Imports use the ontology IRIs of OWL-Time, DCAT and PROV-O.
- `semts:title` and `semts:description` may also describe segments and values.
- Labels: `hasUnit` "has unit", `hasDatatype` "has datatype". Language tags and comments added where missing. `rdfs:isDefinedBy` of reused classes points to the defining vocabulary.
- Shapes: "exactly one value" also enforces at most one, and the SPARQL constraints for multi-segment knowledge and segment relations accept subclasses. `hasUnit` and `hasDatatype` accept QUDT unit and datatype IRIs without the QUDT graph being loaded, or instances of `qudt:Unit` and `qudt:Datatype`.
- Vocabulary concepts are `skos:Concept`s and `semts:KnowledgeConcept`s (were `owl:NamedIndividual`s). Each module declares the SKOS, Dublin Core, VANN and ADMS terms it uses, so that it is an OWL 2 DL document on its own, and carries the release version. Concrete data knowledge features moved to the feature extension with unchanged IRIs. Preferred labels of ten published concepts changed (see the migration guide).
- Feature hierarchy: matrix profile summary and query similarity count are structural properties (were filed under distance and similarity, which are segment relations). Partial autocorrelation and AR coefficients are temporal dependence properties.
- The documentation of the current version is part of the website, and `ontology/current/index.html` forwards to it.

### Deprecated
- `semts-sv:ProductionCycleStart`, `semts-sv:ProductionCycleComplete`, `semts-sv:ToolWearState`.

### Removed
- Allen relations are no longer sub-properties of the OWL-Time interval relations (this made the RBox irregular in OWL 2 DL and typed segments as intervals).
- `semts:isPartOf` is no longer irreflexive (not allowed for a transitive property in OWL 2 DL).
- `TimeSeriesSegment` no longer requires a data dimension. The shapes require one when data knowledge is attached.
- Declarations of `owl:imports`, `owl:priorVersion` and `owl:versionIRI` as annotation properties, and the unused WIDOCO annotation property.
- The WIDOCO copy of 1.2.0 under `ontology/current/` (it remains in `ontology/versioned/120/`).

### Fixed
- `vocab_data_knowledge.ttl` of 1.2.0 was not valid Turtle (`skos:broader ::Correlation`).
- `rdfs:seeAlso` with literal objects.
- Scenario and sample data, competency questions and the runner were updated for 1.3.0 and validate against the shapes.

## [1.2.0] - 2025-12-04
See `ontology/versioned/120/index.html`.

## [1.1.0] - 2025-08-04
See `ontology/versioned/110/index.html`.

## [1.0.1] - 2025-05-13
See `ontology/versioned/101/index.html`.

## [0.5.1] - 2025-04-25
See `ontology/versioned/051/index.html`.
