# Semantic Time Series Ontology - SemTS
<table style="border: none;">
  <tr style="border: none;">
    <td style="border: none; padding-right: 20px;">
      <img src="https://raw.githubusercontent.com/semts-ontology/SemTS/refs/heads/main/assets/images/logo.png" alt="SemTS Logo" width="800px" style="vertical-align: middle;"/>  
    </td>
    <td style="border: none; vertical-align: top;">
      <p><b>Ontology for the Semantic Classification of Time Series Knowledge</b></p>
      <p>SemTS is an ontology to semantically structure insights gained from multivariate time series analyses combined with domain-specific information.
      The concept of SemTS constitutes a specification of informative data points or intervals within time series data, further referred to as segments. Any segment comprises characteristic knowledge associated with the covered time interval. Examples of such knowledge range from common time series features and structural particularities, such as anomalies or motifs, to a priori information provided by domain experts. A classification and semantic representation of this knowledge enables organized reusability and effective propagation.</p>
    </td>
  </tr>
</table>

# Architecture
An alternative visualization of the current ontology version (v1.1.0) from the documentation can be found [here](assets/images/semts.svg). <br><br>
![Architecture](assets/images/semts_visual_model.drawio.svg)

# Prefix and Namespace
Prefix: semts  <br>
Namespace: [https://w3id.org/semts](https://w3id.org/semts) <br>
Ontology IRI: [https://w3id.org/semts/ontology#](https://w3id.org/semts/ontology#)

# Ontology Versions
- [Current Version](https://w3id.org/semts/ontology)
- Previous Versions: `https://w3id.org/semts/ontology/{version}`

# Vocabularies
- [Data Knowledge Vocabulary (semts-dv)](https://w3id.org/semts/vocabulary/data-knowledge/)
- [Scenario Knowledge Vocabulary (semts-sv)](https://w3id.org/semts/vocabulary/scenario-knowledge/)

# Repository
[Website](https://semts-ontology.github.io/SemTS/index.html)  
[Git Repository](https://github.com/semts-ontology/SemTS/)

# Documentation
[Widoco Documentation](https://w3id.org/semts/ontology)

# Naming Conventions
- Directories and files: All small letters, separated by underscores (_). Example: `ontology.ttl`
- Prefixes: In SemTS Ontology, we use https://prefix.cc/ to abbreviate URIs
- Versioning: SemTS releases will follow the Semantic Versioning Specification 2.0.0 (SemVer - Major.Minor.Patch)

  
## Citation

Please cite SemTS as:

```bibtex
@inproceedings{grass2025towards,
  title={Towards an Ontology for Representing Time Series Knowledge: Motivation, Requirements and Concept},
  author={Gra{\ss}, Alexander and Deshmukh, Rohit A and Beecks, Christian and Decker, Stefan},
  booktitle={International Conference on Advanced Information Systems Engineering},
  pages={103--110},
  year={2025},
  organization={Springer}
}
```

# Changelog
- 08/04/25: Updated version (1.1.0). Detailed changes are tracked in the documentation
- 05/13/25: Updated version (1.0.1). Detailed changes are tracked in the documentation
- 04/25/25: Updated version (0.5.1) of ontology and documentation. First version of vocabularies added
- 02/21/25: New version of ontology UML diagram added
- 02/14/25: Initial version of the documentation added

# License
Ontology files and documentation:  
[![License: CC BY 4.0](https://img.shields.io/badge/License-CC%20BY%204.0-lightgrey.svg)](https://creativecommons.org/licenses/by/4.0/)  
Source code and other software components:  
[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)  

[Further details](https://github.com/semts-ontology/SemTS/tree/main?tab=License-1-ov-file#License-1-ov-file)
