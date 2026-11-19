# WebVOWL (vendored)

The interactive ontology graph on the specification page is [WebVOWL](https://github.com/VisualDataWeb/WebVOWL) 1.1.7, Copyright (c) 2014-2019 Vincent Link, Steffen Lohmann, Eduard Marbach, Stefan Negru and Vitalis Wiens, released under the MIT License (see `license.txt`). It bundles D3.js 3.5.17 (`js/d3.min.js`), Copyright (c) 2010-2016 Michael Bostock, under the BSD 3-Clause License (see `d3-license.txt`). This copy is the build that WIDOCO shipped with the SemTS 1.2.0 documentation. It opens `data/ontology.json` by default.

`tools/build.py` copies this folder to `ontology/versioned/<version>/webvowl/` and writes `data/ontology.json` there in the VOWL JSON format of [OWL2VOWL](https://github.com/VisualDataWeb/OWL2VOWL), generated from `ontology/current/ontology.ttl`.

Reference: S. Lohmann, S. Negru, F. Haag, T. Ertl. Visualizing Ontologies with VOWL. Semantic Web 7(4):399-419, 2016. https://doi.org/10.3233/SW-150200
