# Semantic Time Series Ontology - SemTS
Ontology for the Semantic Classification of Time Series Knowledge

SemTS is an ontology to semantically structure insights gained from multivariate time series analyses combined with domain-specific information. 
The concept of SemTS constitutes a specification of informative data points or intervals within time series data, further referred to as segments. Any segment comprises characteristic knowledge associated with the covered time interval. Examples of such knowledge range from common time series features, and structural particularities such as anomalies or motifs, to apriori information provided by domain experts. A classification and semantic representation of this knowledge enables organized reusability and effective propagation.

# Architecture
![Architecture](assets/images/semts_visual_model.drawio.svg)

# Prefix and Namespace
semts: [https://w3id.org/semts](https://w3id.org/semts)

# Ontology
- [Current Version](https://w3id.org/semts/ontology)
- Previous Versions: `https://w3id.org/semts/ontology/{version}`

# Vocabularies
- [Data Knowledge Vocabulary](https://w3id.org/semts/vocabulary/data-knowledge/)
- [Scenario Knowledge Vocabulary](https://w3id.org/semts/vocabulary/scenario-knowledge/)

# Code Repository
[Git Repository](https://github.com/semts-ontology/SemTS/)

# Documentation
[Widoco Documentation](https://w3id.org/semts/ontology)

# Naming Conventions
- Directories and files: All small letters, separated by underscores (_). Example: `ontology.ttl`
- Prefixes: In SemTS Ontology, we use https://prefix.cc/ to abbreviate URIs
- Versioning: SemTS releases will follow the Semantic Versioning Specification 2.0.0 (SemVer - Major.Minor.Patch)

# Changelog
- 02/14/25: Initial version of a documentation added
- 02/21/25: New version of ontology UML diagram added
- 04/25/25: Updated version (0.5.1) of ontology and documentation. First version of vocabularies added
