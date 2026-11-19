#!/usr/bin/env python3
"""Build the SemTS release artefacts and the website from the Turtle sources.

The Turtle files are the single source of truth:
    ontology/current/ontology.ttl, vocabularies/vocab_*.ttl,
    evaluation/instance_validation/shacl_shapes.ttl, examples/*.ttl, application_scenarios/*.ttl

The build writes
    ontology/current/ontology.{owl,nt,jsonld}   RDF/XML, N-Triples and JSON-LD serialisations
    ontology/current/index.html                 forwards browsers to the specification on the website
    ontology/versioned/<v>/ontology.*           the same files for the versioned IRI (v = 130 for 1.3.0)
    ontology/versioned/<v>/webvowl/             the WebVOWL graph (site/vendor/webvowl with generated data)
    vocabularies/vocab_*.owl                    RDF/XML serialisations of the vocabularies
    application_scenarios/scenario*.rdf         RDF/XML serialisations of the scenarios
    data/ontology.json, data/vocab.json         data for the website
    index.html                                  the website (GitHub Pages serves it at the root)

With --snapshot it also freezes the website into ontology/versioned/<v>/ (index.html, data/, assets/),
which is the HTML that the versioned w3id IRI resolves to. Run it once per release.

usage: python3 tools/build.py [--snapshot]
No third-party packages are needed.
"""
import argparse, json, re, shutil, sys
from collections import OrderedDict
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / 'tools'))
from semtsrdf.ttl import Graph, parse, RDF  # noqa: E402
from semtsrdf import rdfwrite  # noqa: E402

SKOS = 'http://www.w3.org/2004/02/skos/core#'
OWL = 'http://www.w3.org/2002/07/owl#'
RDFS = 'http://www.w3.org/2000/01/rdf-schema#'
XSD = 'http://www.w3.org/2001/XMLSchema#'
DCT = 'http://purl.org/dc/terms/'
DC = 'http://purl.org/dc/elements/1.1/'
FOAF = 'http://xmlns.com/foaf/0.1/'
VANN = 'http://purl.org/vocab/vann/'
ADMS = 'http://www.w3.org/ns/adms#'
SCHEMA = 'https://schema.org/'
SH = 'http://www.w3.org/ns/shacl#'
SEMTS = 'https://w3id.org/semts/ontology#'
PAGES = 'https://semts-ontology.github.io/SemTS/'

ONTO_TTL = ROOT / 'ontology/current/ontology.ttl'
SHAPES_TTL = ROOT / 'evaluation/instance_validation/shacl_shapes.ttl'
VOCABS = [  # key, file, kind
    ('dv', 'vocab_data_knowledge.ttl', 'core'),
    ('dfx', 'vocab_data_knowledge_feature_extension.ttl', 'extension'),
    ('sv', 'vocab_scenario_knowledge.ttl', 'core'),
    ('msv', 'vocab_scenario_knowledge_manufacturing.ttl', 'extension'),
    ('gv', 'vocab_knowledge_generation.ttl', 'core'),
    ('qv', 'vocab_quality_measure.ttl', 'core'),
]
# Earlier versions documented with WIDOCO (kept unchanged under ontology/versioned/)
WIDOCO_VERSIONS = [('1.2.0', '120', '2025-12-04'), ('1.1.0', '110', '2025-08-04'), ('1.0.1', '101', '2025-05-13'), ('0.5.1', '051', '2025-04-25')]

KNOWN_NS = OrderedDict([
    ('https://w3id.org/semts/ontology#', 'semts'),
    ('https://w3id.org/semts/vocabulary/data-knowledge/feature-extension#', 'semts-dfx'),
    ('https://w3id.org/semts/vocabulary/data-knowledge#', 'semts-dv'),
    ('https://w3id.org/semts/vocabulary/scenario-knowledge/manufacturing#', 'semts-msv'),
    ('https://w3id.org/semts/vocabulary/scenario-knowledge#', 'semts-sv'),
    ('https://w3id.org/semts/vocabulary/knowledge-generation#', 'semts-gv'),
    ('https://w3id.org/semts/vocabulary/quality-measure#', 'semts-qv'),
    ('http://w3id.org/mlso/vocab/', 'mlst:'),
    ('http://www.w3.org/ns/prov#', 'prov'),
    ('http://www.w3.org/ns/dcat#', 'dcat'),
    ('http://www.w3.org/2006/time#', 'time'),
    ('http://qudt.org/schema/qudt/', 'qudt'),
    ('http://www.w3.org/ns/mls#', 'mls'),
    (SKOS, 'skos'), (XSD, 'xsd'), (OWL, 'owl'), (RDFS, 'rdfs'), (RDF, 'rdf'),
    ('http://www.w3.org/ns/dqv#', 'dqv'), (DCT, 'dcterms'), (DC, 'dc'), (FOAF, 'foaf'),
    (VANN, 'vann'), (SCHEMA, 'schema'),
])


def curie(iri):
    for ns in sorted(KNOWN_NS, key=len, reverse=True):
        if iri.startswith(ns) and len(iri) > len(ns):
            p = KNOWN_NS[ns]
            return p + iri[len(ns):] if p.endswith(':') else f'{p}:{iri[len(ns):]}'
    return iri


def read(p):
    return Path(p).read_text(encoding='utf-8')


def write(p, text):
    p = Path(p)
    p.parent.mkdir(parents=True, exist_ok=True)
    p.write_text(text, encoding='utf-8')


def load(path, tag=''):
    g = Graph()
    g.add_text(read(path), tag=tag)
    return g


def lit(g, s, p, many=False):
    vals = [o[1] for o in g.objs(s, p) if o[0] == 'lit']
    return vals if many else (vals[0] if vals else None)


def iris(g, s, p):
    return [o[1] for o in g.objs(s, p) if o[0] == 'iri']


# ===================================================================== serialisations
def serialise(path, formats, out_dir=None):
    triples, prefixes = parse(read(path))
    stem = Path(path).stem
    out_dir = Path(out_dir or Path(path).parent)
    done = []
    for fmt in formats:
        if fmt == 'owl' or fmt == 'rdf':
            text = rdfwrite.to_rdfxml(triples, prefixes, base_comment=f'Generated from {stem}.ttl by tools/build.py; do not edit.')
        elif fmt == 'nt':
            text = rdfwrite.to_nt(triples)
        elif fmt == 'jsonld':
            text = rdfwrite.to_jsonld(triples, prefixes)
        elif fmt == 'ttl':
            text = read(path)
        write(out_dir / f'{stem}.{fmt}', text)
        done.append(f'{stem}.{fmt}')
    return done


# ===================================================================== class expressions
class Expr:
    """Renders OWL class expressions, property expressions and data ranges in Manchester-like syntax."""

    def __init__(self, g):
        self.g = g

    def prop(self, t):
        if t[0] == 'bnode':
            inv = self.g.objs(t, OWL + 'inverseOf')
            if inv:
                return 'inverse ' + curie(inv[0][1])
        return curie(t[1])

    def __call__(self, t):
        g = self.g
        if t[0] == 'iri':
            return curie(t[1])
        if t[0] == 'lit':
            return f'"{t[1]}"'
        for p, op in ((OWL + 'unionOf', ' or '), (OWL + 'intersectionOf', ' and ')):
            v = g.objs(t, p)
            if v:
                return '(' + op.join(self(x) for x in g.lst(v[0])) + ')'
        v = g.objs(t, OWL + 'complementOf')
        if v:
            return 'not ' + self(v[0])
        v = g.objs(t, OWL + 'oneOf')
        if v:
            return '{' + ', '.join(self(x) for x in g.lst(v[0])) + '}'
        on = g.objs(t, OWL + 'onProperty')
        if on:
            pn = self.prop(on[0])
            for p, word in ((OWL + 'someValuesFrom', 'some'), (OWL + 'allValuesFrom', 'only'), (OWL + 'hasValue', 'value')):
                v = g.objs(t, p)
                if v:
                    return f'{pn} {word} {self(v[0])}'
            for p, word in ((OWL + 'cardinality', 'exactly'), (OWL + 'minCardinality', 'min'), (OWL + 'maxCardinality', 'max'),
                            (OWL + 'qualifiedCardinality', 'exactly'), (OWL + 'minQualifiedCardinality', 'min'),
                            (OWL + 'maxQualifiedCardinality', 'max')):
                v = g.objs(t, p)
                if v:
                    onc = g.objs(t, OWL + 'onClass') or g.objs(t, OWL + 'onDataRange')
                    return f'{pn} {word} {v[0][1]}' + (f' {self(onc[0])}' if onc else '')
        dt = g.objs(t, OWL + 'onDatatype')
        if dt:
            facets = []
            for f in g.lst(g.objs(t, OWL + 'withRestrictions')[0]) if g.objs(t, OWL + 'withRestrictions') else []:
                for (s, p), os_ in ((k, v) for k, v in g.sp.items() if k[0] == f):
                    sym = {'minInclusive': '>=', 'maxInclusive': '<=', 'minExclusive': '>', 'maxExclusive': '<'}.get(p.split('#')[-1], p.split('#')[-1])
                    facets.append(f'{sym} {os_[0][1]}')
            return f'{curie(dt[0][1])}[{", ".join(facets)}]'
        inv = g.objs(t, OWL + 'inverseOf')
        if inv:
            return 'inverse ' + curie(inv[0][1])
        if g.objs(t, RDF + 'first'):
            return '(' + ' o '.join(self.prop(x) for x in g.lst(t)) + ')'
        return '[ ]'


def statements(g, s, ex):
    """All statements about s as rendered (predicate, object) strings, for the change log."""
    out = set()
    for (subj, p), os_ in g.sp.items():
        if subj != s:
            continue
        for o in os_:
            if o[0] == 'lit':
                v = f'"{o[1]}"' + (f'@{o[2]}' if o[2] else '') + (f'^^{curie(o[3])}' if o[3] and not o[2] else '')
            else:
                v = ex(o)
            out.add((curie(p), v))
    return out


# ===================================================================== ontology data
def ontology_data(path, prior_path):
    og = load(path, 'o')
    ex = Expr(og)
    onto = next(s for s in og.subjects() if ('iri', OWL + 'Ontology') in og.objs(s, RDF + 'type'))
    agents = {}
    for s in og.subjects():
        if s[0] == 'iri' and lit(og, s, FOAF + 'name'):
            agents[s[1]] = {'iri': s[1], 'name': lit(og, s, FOAF + 'name'),
                            'mbox': (iris(og, s, FOAF + 'mbox') or [None])[0]}
    who = lambda p: [agents.get(x, {'name': x})['name'] for x in iris(og, onto, p)] + lit(og, onto, p, True)
    meta = OrderedDict([
        ('iri', onto[1]), ('title', lit(og, onto, DCT + 'title')), ('label', lit(og, onto, RDFS + 'label')),
        ('version', lit(og, onto, OWL + 'versionInfo')),
        ('versionIRI', (iris(og, onto, OWL + 'versionIRI') or [None])[0]),
        ('prior', (iris(og, onto, OWL + 'priorVersion') or [None])[0]),
        ('created', lit(og, onto, DCT + 'created')), ('modified', lit(og, onto, DCT + 'modified')),
        ('creators', who(DCT + 'creator')), ('contributors', who(DC + 'contributor') + who(DCT + 'contributor')),
        ('publisher', who(DCT + 'publisher')),
        ('license', (iris(og, onto, DCT + 'license') or [None])[0]), ('rights', lit(og, onto, DCT + 'rights')),
        ('citation', lit(og, onto, DCT + 'bibliographicCitation')),
        ('doi', (iris(og, onto, SCHEMA + 'citation') or [None])[0]),
        ('abstract', lit(og, onto, DCT + 'abstract')), ('description', lit(og, onto, DCT + 'description')),
        ('imports', iris(og, onto, OWL + 'imports')), ('references', iris(og, onto, DCT + 'references')),
        ('depiction', (iris(og, onto, FOAF + 'depiction') or [None])[0]),
        ('prefix', lit(og, onto, VANN + 'preferredNamespacePrefix')),
        ('namespace', lit(og, onto, VANN + 'preferredNamespaceUri')),
        ('prefixes', OrderedDict(sorted(og.prefixes.items()))),
        ('agents', list(agents.values())),
    ])
    v = (meta['version'] or '').replace('.', '')
    meta['serialisations'] = {f: f'ontology/versioned/{v}/ontology.{f}' for f in ('ttl', 'owl', 'nt', 'jsonld')}
    meta['webvowl'] = f'ontology/versioned/{v}/webvowl/index.html'
    meta['previous'] = [{'version': a, 'iri': f'https://w3id.org/semts/ontology/{b}#', 'docs': f'ontology/versioned/{b}/index.html', 'date': date,
                         'changes': f'ontology/versioned/{b}/index.html#changes' if '#changes' in read(ROOT / f'ontology/versioned/{b}/index.html').replace('id="changes"', '#changes') else None,
                         'ttl': f'ontology/versioned/{b}/ontology.ttl' if (ROOT / f'ontology/versioned/{b}/ontology.ttl').exists() else None,
                         'webvowl': f'ontology/versioned/{b}/webvowl/index.html' if (ROOT / f'ontology/versioned/{b}/webvowl').exists() else None,
                         'oops': f'ontology/versioned/{b}/OOPSevaluation/oopsEval.html' if (ROOT / f'ontology/versioned/{b}/OOPSevaluation').exists() else None}
                        for a, b, date in WIDOCO_VERSIONS if (ROOT / f'ontology/versioned/{b}').exists()]

    classes, props, annos, individuals = {}, {}, {}, {}
    chars = ['Functional', 'InverseFunctional', 'Transitive', 'Symmetric', 'Asymmetric', 'Reflexive', 'Irreflexive']
    for s in og.subjects():
        if s[0] != 'iri':
            continue
        types = iris(og, s, RDF + 'type')
        cid = curie(s[1])
        common = {'id': cid, 'iri': s[1], 'label': lit(og, s, RDFS + 'label'), 'comment': lit(og, s, RDFS + 'comment'),
                  'isDefinedBy': iris(og, s, RDFS + 'isDefinedBy'), 'seeAlso': iris(og, s, RDFS + 'seeAlso'),
                  'external': not s[1].startswith(SEMTS)}
        if OWL + 'Class' in types:
            sup = og.objs(s, RDFS + 'subClassOf')
            classes[cid] = dict(common, **{
                'super': [curie(x[1]) for x in sup if x[0] == 'iri'],
                'axioms': [ex(x) for x in sup if x[0] == 'bnode'],
                'disjoint': [curie(x) for x in iris(og, s, OWL + 'disjointWith')],
                'equivalent': [ex(x) for x in og.objs(s, OWL + 'equivalentClass')],
            })
        kinds = [k for k in ('ObjectProperty', 'DatatypeProperty') if OWL + k in types]
        if kinds:
            props[cid] = dict(common, **{
                'kind': kinds[0],
                'domain': [ex(x) for x in og.objs(s, RDFS + 'domain')],
                'range': [ex(x) for x in og.objs(s, RDFS + 'range')],
                'characteristics': [c for c in chars if OWL + c + 'Property' in types],
                'functional': OWL + 'FunctionalProperty' in types,
                'transitive': OWL + 'TransitiveProperty' in types,
                'inverse': [curie(x) for x in iris(og, s, OWL + 'inverseOf')] + [curie(x[1]) for x in og.subjs(OWL + 'inverseOf', s) if x[0] == 'iri'],
                'sub': [curie(x) for x in iris(og, s, RDFS + 'subPropertyOf')],
                'disjoint': [curie(x) for x in iris(og, s, OWL + 'propertyDisjointWith')],
                'owlTime': [curie(x) for x in iris(og, s, SEMTS + 'correspondingOwlTimeRelation')],
                'chain': [ex(x) for x in og.objs(s, OWL + 'propertyChainAxiom')],
            })
            props[cid]['chain_flag'] = bool(props[cid]['chain'])
        if OWL + 'AnnotationProperty' in types:
            annos[cid] = dict(common, usedIn=[])
        if OWL + 'NamedIndividual' in types:
            individuals[cid] = dict(common, types=[curie(x) for x in types if x != OWL + 'NamedIndividual'],
                                    name=lit(og, s, FOAF + 'name'), mbox=(iris(og, s, FOAF + 'mbox') or [None])[0])
    # inverse links, subclasses, sub-properties, domain/range usage
    for p in props.values():
        p['inverse'] = sorted(set(p['inverse']))
        p['chain'] = p['chain']
        p['subProperties'] = sorted(x['id'] for x in props.values() if p['id'] in x['sub'])
    toks = lambda e: set(re.findall(r'[\w\-]+:[\w\-]+', e))
    for c in classes.values():
        c['sub'] = sorted(x['id'] for x in classes.values() if c['id'] in x['super'])
        c['props'] = sorted(p['id'] for p in props.values() if any(c['id'] in toks(d) for d in p['domain']))
        c['incoming'] = sorted(p['id'] for p in props.values() if any(c['id'] in toks(r) for r in p['range']))
        c['inRestrictions'] = sorted(x['id'] for x in classes.values() if x is not c and any(c['id'] in toks(a) for a in x['axioms']))
    for (s, p), _ in og.sp.items():
        if curie(p) in annos and s[0] == 'iri' and s[1].startswith(SEMTS) and len(annos[curie(p)]['usedIn']) < 400:
            annos[curie(p)]['usedIn'].append(curie(s[1]))
    for a in annos.values():
        a['usedIn'] = sorted(set(a['usedIn']))

    changes = ontology_changes(prior_path, og, ex) if prior_path and Path(prior_path).exists() else None
    return {'meta': meta, 'classes': classes, 'props': props, 'annotations': annos, 'individuals': individuals,
            'changes': changes}


def ontology_changes(prior_path, og, ex):
    pg = load(prior_path, 'p')
    pex = Expr(pg)
    cur_terms = {s for s in og.subjects() if s[0] == 'iri'}
    old_terms = {s for s in pg.subjects() if s[0] == 'iri'}
    kind = lambda g, s: next((k for k in ('Class', 'ObjectProperty', 'DatatypeProperty', 'AnnotationProperty', 'NamedIndividual', 'Ontology')
                              if ('iri', OWL + k) in g.objs(s, RDF + 'type')), 'Other')
    out = {'prior': None, 'added': [], 'removed': [], 'modified': []}
    for s in old_terms:
        if ('iri', OWL + 'Ontology') in pg.objs(s, RDF + 'type'):
            out['prior'] = lit(pg, s, OWL + 'versionInfo')
    for s in sorted(cur_terms - old_terms, key=lambda x: x[1]):
        out['added'].append({'id': curie(s[1]), 'kind': kind(og, s), 'label': lit(og, s, RDFS + 'label')})
    for s in sorted(old_terms - cur_terms, key=lambda x: x[1]):
        out['removed'].append({'id': curie(s[1]), 'kind': kind(pg, s), 'label': lit(pg, s, RDFS + 'label')})
    for s in sorted(cur_terms & old_terms, key=lambda x: x[1]):
        a, b = statements(og, s, ex), statements(pg, s, pex)
        if a != b:
            out['modified'].append({'id': curie(s[1]), 'kind': kind(og, s),
                                    'added': sorted(f'{p} {o}' for p, o in a - b), 'removed': sorted(f'{p} {o}' for p, o in b - a)})
    return out


# ===================================================================== vocabulary data
def vocab_data():
    schemes, concepts, deprecated = [], {}, []
    for key, fname, kind in VOCABS:
        g = load(ROOT / 'vocabularies' / fname, key)
        scheme = next(s for s in g.subjects() if ('iri', SKOS + 'ConceptScheme') in g.objs(s, RDF + 'type'))
        meta = {
            'key': key, 'kind': kind, 'file': fname, 'iri': scheme[1],
            'title': lit(g, scheme, DCT + 'title'), 'description': lit(g, scheme, DCT + 'description'),
            'prefix': lit(g, scheme, VANN + 'preferredNamespacePrefix'),
            'namespace': lit(g, scheme, VANN + 'preferredNamespaceUri'),
            'version': lit(g, scheme, OWL + 'versionInfo'), 'status': next(iter(iris(g, scheme, ADMS + 'status')), None),
            'created': lit(g, scheme, DCT + 'created'), 'modified': lit(g, scheme, DCT + 'modified'),
            'scopeNote': lit(g, scheme, SKOS + 'scopeNote'), 'editorialNote': lit(g, scheme, SKOS + 'editorialNote'),
            'imports': iris(g, scheme, OWL + 'imports'), 'isPartOf': iris(g, scheme, DCT + 'isPartOf'),
            'references': [curie(x) for x in iris(g, scheme, DCT + 'references')],
            'top': [curie(x) for x in iris(g, scheme, SKOS + 'hasTopConcept')],
        }
        count = 0
        for s in g.subjects():
            if s[0] != 'iri' or ('iri', SKOS + 'Concept') not in g.objs(s, RDF + 'type'):
                continue
            label = lit(g, s, SKOS + 'prefLabel') or lit(g, s, RDFS + 'label')
            if any(o[1] == 'true' for o in g.objs(s, OWL + 'deprecated')):
                deprecated.append({'id': curie(s[1]), 'label': label, 'def': lit(g, s, SKOS + 'definition'),
                                   'replacedBy': [curie(x) for x in iris(g, s, DCT + 'isReplacedBy')],
                                   'note': lit(g, s, SKOS + 'historyNote'), 'scheme': key})
                continue
            count += 1
            cid = curie(s[1])
            c = {
                'id': cid, 'iri': s[1], 'scheme': key, 'label': label,
                'alt': lit(g, s, SKOS + 'altLabel', True), 'def': lit(g, s, SKOS + 'definition'),
                'scope': lit(g, s, SKOS + 'scopeNote'), 'editorial': lit(g, s, SKOS + 'editorialNote'),
                'history': lit(g, s, SKOS + 'historyNote'),
                'broader': [curie(x) for x in iris(g, s, SKOS + 'broader')],
                'related': [curie(x) for x in iris(g, s, SKOS + 'related')],
                'exactMatch': [curie(x) for x in iris(g, s, SKOS + 'exactMatch')],
                'closeMatch': [curie(x) for x in iris(g, s, SKOS + 'closeMatch')],
                'relatedMatch': [curie(x) for x in iris(g, s, SKOS + 'relatedMatch')],
                'seeAlso': iris(g, s, RDFS + 'seeAlso'), 'top': bool(iris(g, s, SKOS + 'topConceptOf')),
                'types': [curie(x) for x in iris(g, s, RDF + 'type')],
            }
            concepts[cid] = {k: v for k, v in c.items() if v not in (None, [], False)}
        meta['count'] = count
        schemes.append(meta)
    dangling = []
    for c in concepts.values():
        for b in c.get('broader', []):
            if b in concepts:
                concepts[b].setdefault('narrower', []).append(c['id'])
        for field in ('broader', 'related', 'relatedMatch', 'exactMatch', 'closeMatch'):
            for ref in c.get(field, []):
                if ref.startswith('semts-') and ref not in concepts:
                    dangling.append({'from': c['id'], 'field': field, 'to': ref})
    for c in concepts.values():
        if 'narrower' in c:
            c['narrower'].sort(key=lambda x: (concepts[x]['label'] or '').lower())
    # an import may name the published file of a module instead of its IRI
    by_file = {}
    for s in schemes:
        stem = s['file'][:-4]
        for ext in ('.owl', '.ttl'):
            by_file[PAGES + 'vocabularies/' + stem + ext] = s['iri']
    for s in schemes:
        s['imports'] = [by_file.get(x, x) for x in s['imports']]
    return {'schemes': schemes, 'concepts': concepts, 'deprecated': deprecated, 'dangling': dangling}


def shapes_data():
    sg = load(SHAPES_TTL, 's')
    shapes = []
    for s in sg.subjects():
        if s[0] != 'iri' or ('iri', SH + 'NodeShape') not in sg.objs(s, RDF + 'type'):
            continue
        targets = []
        for p, label in ((SH + 'targetClass', 'class'), (SH + 'targetSubjectsOf', 'subjects of'), (SH + 'targetObjectsOf', 'objects of')):
            targets += [f'{label} {curie(x)}' if label != 'class' else curie(x) for x in iris(sg, s, p)]
        msgs = [m for m in [lit(sg, s, SH + 'message')] if m]
        msgs += [m for pb in sg.objs(s, SH + 'property') for m in [lit(sg, pb, SH + 'message')] if m]
        sparql = sg.objs(s, SH + 'sparql')
        msgs += [m for sb in sparql for m in [lit(sg, sb, SH + 'message')] if m]
        shapes.append({'id': curie(s[1]), 'targets': targets, 'messages': msgs, 'sparql': len(sparql),
                       'properties': len(sg.objs(s, SH + 'property'))})
    return shapes


# ===================================================================== WebVOWL
def webvowl_json(path):
    """The ontology in the VOWL JSON format of OWL2VOWL, for the WebVOWL graph on the specification page.

    Named classes, unions used as domains or ranges, subclass and disjointness axioms, object and data
    properties with their characteristics, and allValuesFrom/someValuesFrom restrictions are drawn.
    Imported ontologies are not expanded: their classes appear as external nodes.
    """
    g = load(path)
    onto = next(s for s in g.subjects() if ('iri', OWL + 'Ontology') in g.objs(s, RDF + 'type'))
    classes, class_attr, props, prop_attr = [], [], [], []
    ids = {}
    nid = [0]

    def new_id():
        nid[0] += 1
        return str(nid[0] - 1)

    def base(iri):
        return re.sub(r'[#/][^#/]*$', '', iri)

    def local(iri):
        return re.sub(r'^.*[#/]', '', iri)

    def labels(s):
        out = {'IRI-based': local(s[1])}
        for o in g.objs(s, RDFS + 'label'):
            out[o[2] or 'undefined'] = o[1]
        return out

    def comments(s):
        return {o[2] or 'undefined': o[1] for o in g.objs(s, RDFS + 'comment')}

    declared = {s[1] for s in g.subjects() if s[0] == 'iri' and ('iri', OWL + 'Class') in g.objs(s, RDF + 'type')}

    def cls(iri):
        if iri in ids:
            return ids[iri]
        i = ids[iri] = new_id()
        if iri == OWL + 'Thing':
            classes.append({'id': i, 'type': 'owl:Thing'}); class_attr.append({'id': i, 'iri': iri, 'baseIri': 'http://owl2vowl.de', 'label': {'undefined': 'Thing'}})
            return i
        classes.append({'id': i, 'type': 'owl:Class'})
        a = {'id': i, 'iri': iri, 'baseIri': base(iri), 'instances': 0, 'label': labels(('iri', iri)), 'superClasses': [], 'subClasses': []}
        c = comments(('iri', iri))
        if c:
            a['comment'] = c
        if not iri.startswith(SEMTS):
            a['attributes'] = ['external']
        class_attr.append(a)
        return i

    def thing():
        i = new_id()
        classes.append({'id': i, 'type': 'owl:Thing'})
        class_attr.append({'id': i, 'iri': OWL + 'Thing', 'baseIri': 'http://owl2vowl.de', 'label': {'undefined': 'Thing'}})
        return i

    unions = {}

    def node(t):
        """Node id for a class expression: named classes and unions of named classes; None otherwise."""
        if t[0] == 'iri':
            return cls(t[1])
        u = g.objs(t, OWL + 'unionOf')
        if u:
            members = [x for x in g.lst(u[0])]
            if all(m[0] == 'iri' for m in members):
                key = tuple(sorted(m[1] for m in members))
                if key not in unions:
                    i = unions[key] = new_id()
                    classes.append({'id': i, 'type': 'owl:unionOf'})
                    class_attr.append({'id': i, 'instances': 0, 'union': [cls(m) for m in key], 'attributes': ['union', 'anonymous']})
                return unions[key]
        return None

    def attr_of(i):
        return next(a for a in class_attr if a['id'] == i)

    def edge(kind, domain, range_, extra):
        i = new_id()
        props.append({'id': i, 'type': kind})
        prop_attr.append(dict({'id': i, 'domain': domain, 'range': range_}, **extra))
        return i

    for iri in sorted(declared):
        cls(iri)
    # properties
    chars = {'FunctionalProperty': 'functional', 'InverseFunctionalProperty': 'inverse functional', 'TransitiveProperty': 'transitive',
             'SymmetricProperty': 'symmetric', 'AsymmetricProperty': 'asymmetric', 'ReflexiveProperty': 'reflexive', 'IrreflexiveProperty': 'irreflexive'}
    pid = {}
    plist = sorted(s for s in g.subjects() if s[0] == 'iri' and any(('iri', OWL + k) in g.objs(s, RDF + 'type') for k in ('ObjectProperty', 'DatatypeProperty')))
    for s in plist:
        types = [o[1] for o in g.objs(s, RDF + 'type')]
        is_obj = OWL + 'ObjectProperty' in types
        dom = next((n for n in (node(x) for x in g.objs(s, RDFS + 'domain')) if n is not None), None) or thing()
        if is_obj:
            rng = next((n for n in (node(x) for x in g.objs(s, RDFS + 'range')) if n is not None), None) or thing()
        else:
            r = (g.objs(s, RDFS + 'range') or [('iri', RDFS + 'Literal')])[0]
            dt = r[1] if r[0] == 'iri' else (g.objs(r, OWL + 'onDatatype') or [('iri', RDFS + 'Literal')])[0][1]
            rng = new_id()
            if dt == RDFS + 'Literal':
                classes.append({'id': rng, 'type': 'rdfs:Literal'}); class_attr.append({'id': rng, 'iri': dt, 'label': {'IRI-based': 'Literal', 'undefined': 'Literal'}})
            else:
                lab = local(dt) + ('' if r[0] == 'iri' else ' (restricted)')
                classes.append({'id': rng, 'type': 'rdfs:Datatype'}); class_attr.append({'id': rng, 'iri': dt, 'baseIri': base(dt), 'label': {'IRI-based': lab}})
        extra = {'iri': s[1], 'baseIri': base(s[1]), 'label': labels(s),
                 'attributes': (['object'] if is_obj else ['datatype']) + [v for k, v in chars.items() if OWL + k in types] + ([] if s[1].startswith(SEMTS) else ['external'])}
        c = comments(s)
        if c:
            extra['comment'] = c
        pid[s[1]] = edge('owl:objectProperty' if is_obj else 'owl:datatypeProperty', dom, rng, extra)
    for s in plist:
        a = next(x for x in prop_attr if x['id'] == pid[s[1]])
        sup = [pid[o[1]] for o in g.objs(s, RDFS + 'subPropertyOf') if o[0] == 'iri' and o[1] in pid]
        if sup:
            a['superproperty'] = sup
            for x in sup:
                next(y for y in prop_attr if y['id'] == x).setdefault('subproperty', []).append(a['id'])
        inv = [pid[o[1]] for o in g.objs(s, OWL + 'inverseOf') if o[0] == 'iri' and o[1] in pid]
        if inv:
            a['inverse'] = inv[0]
            next(y for y in prop_attr if y['id'] == inv[0])['inverse'] = a['id']
    # class axioms
    disjoint = set()
    for iri in sorted(declared):
        s = ('iri', iri)
        me = cls(iri)
        for o in g.objs(s, RDFS + 'subClassOf'):
            if o[0] == 'iri':
                sup = cls(o[1])
                edge('rdfs:SubClassOf', me, sup, {'attributes': ['object', 'anonymous']})
                attr_of(me)['superClasses'].append(sup)
                attr_of(sup).setdefault('subClasses', []).append(me)
                continue
            on = g.objs(o, OWL + 'onProperty')
            if not on or on[0][0] != 'iri':
                continue
            p = on[0][1]
            for kind in ('allValuesFrom', 'someValuesFrom'):
                f = g.objs(o, OWL + kind)
                if f:
                    tgt = node(f[0])
                    if tgt is not None:
                        edge('owl:' + kind, me, tgt, {'iri': p, 'baseIri': base(p), 'label': labels(('iri', p)), 'attributes': ['object', kind[:-4].lower() + 'Values']})
            for kind, key in (('cardinality', 'cardinality'), ('minCardinality', 'minCardinality'), ('maxCardinality', 'maxCardinality'),
                              ('qualifiedCardinality', 'cardinality'), ('minQualifiedCardinality', 'minCardinality'), ('maxQualifiedCardinality', 'maxCardinality')):
                v = g.objs(o, OWL + kind)
                if v and p in pid:
                    a = next(x for x in prop_attr if x['id'] == pid[p])
                    if a['domain'] == me:
                        a[key] = v[0][1]
        for o in g.objs(s, OWL + 'disjointWith'):
            if o[0] == 'iri':
                pair = tuple(sorted((iri, o[1])))
                if pair not in disjoint:
                    disjoint.add(pair)
                    edge('owl:disjointWith', cls(pair[0]), cls(pair[1]), {'attributes': ['object', 'anonymous']})
    authors = [lit(g, ('iri', x), FOAF + 'name') or x for x in iris(g, onto, DCT + 'creator')]
    header = {
        'languages': ['en', 'undefined'],
        'baseIris': sorted({a['baseIri'] for a in class_attr + prop_attr if a.get('baseIri')}),
        'title': {'en': lit(g, onto, DCT + 'title') or ''},
        'iri': onto[1], 'version': lit(g, onto, OWL + 'versionInfo'), 'author': authors,
        'description': {'en': lit(g, onto, DCT + 'abstract') or ''},
        'labels': {'en': lit(g, onto, RDFS + 'label') or ''},
    }
    return {'_comment': 'Created by tools/build.py of SemTS in the VOWL JSON format of OWL2VOWL 0.3.5 (http://vowl.visualdataweb.org)',
            'header': header, 'namespace': [], 'class': classes, 'classAttribute': class_attr, 'property': props, 'propertyAttribute': prop_attr}


def write_webvowl(vdir):
    app = ROOT / 'site/vendor/webvowl'
    out = vdir / 'webvowl'
    shutil.copytree(app, out, dirs_exist_ok=True, ignore=shutil.ignore_patterns('README.md'))
    write(out / 'data/ontology.json', json.dumps(webvowl_json(ONTO_TTL), ensure_ascii=False, indent=1) + '\n')
    return f'ontology/versioned/{vdir.name}/webvowl/'


# ===================================================================== HTML
def js_json(s):
    return s.replace('</', '<\\/')


def site_html(onto_json, examples, snapshot=None):
    src = ROOT / 'site/src'
    snap = json.dumps(snapshot) if snapshot else 'null'
    return f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>SemTS: the Semantic Time Series Ontology</title>
<meta name="description" content="SemTS is an OWL ontology with modular SKOS vocabularies for knowledge derived from time-series data, linked to the segments it describes.">
<meta name="theme-color" content="#14233D">
<!-- Generated by tools/build.py from site/src and the Turtle files; do not edit. -->
<link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Cpath d='M7 5H3v22h4M25 5h4v22h-4' fill='none' stroke='%2314233D' stroke-width='2.4'/%3E%3Cpath d='M7.5 21l3.8-5.2 3.6 2.8 4.2-8.6 5 6.4' fill='none' stroke='%232B7855' stroke-width='2.4' stroke-linejoin='round' stroke-linecap='round'/%3E%3Ccircle cx='19.2' cy='8.2' r='2.7' fill='%231F5BAF'/%3E%3C/svg%3E">
<link rel="alternate" type="text/turtle" href="{'ontology.ttl' if snapshot else 'ontology/current/ontology.ttl'}">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Instrument+Sans:wdth,wght@75..100,400..700&family=JetBrains+Mono:wght@400;500&display=swap">
<style>
{read(src / 'styles.css')}
</style>
</head>
<body>
{read(src / 'body.html')}
<script>
window.__ONTO__ = {js_json(onto_json)};
window.__EXAMPLES__ = {js_json(json.dumps(examples, ensure_ascii=False))};
window.__SNAPSHOT__ = {snap};
</script>
<script>
{read(src / 'arch.js')}
</script>
<script>
{read(src / 'pics.js')}
</script>
<script>
{read(src / 'app.js')}
</script>
</body>
</html>
"""


def redirect_html(onto, vocab):
    """ontology/current/index.html: the w3id IRI https://w3id.org/semts/ontology#Term lands here,
    and so does every SemTS IRI that has no rule of its own at w3id."""
    cls = sorted(c['id'].split(':')[1] for c in onto['classes'].values() if not c['external'])
    prp = sorted(p['id'].split(':')[1] for p in onto['props'].values() if not p['external'])
    ann = sorted(a['id'].split(':')[1] for a in onto['annotations'].values() if not a['external'])
    by_local = {}
    for cid in vocab['concepts']:
        pfx, local = cid.split(':', 1)
        by_local.setdefault(local, []).append(pfx[len('semts-'):])
    concepts = {local: f'concept-{keys[0]}-{local}' for local, keys in sorted(by_local.items())
                if len(keys) == 1 and local not in cls + prp + ann}
    return f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>SemTS ontology specification</title>
<meta name="robots" content="noindex">
<link rel="canonical" href="{PAGES}#reference">
<link rel="alternate" type="text/turtle" href="ontology.ttl">
<link rel="alternate" type="application/rdf+xml" href="ontology.owl">
<link rel="alternate" type="application/ld+json" href="ontology.jsonld">
<link rel="alternate" type="application/n-triples" href="ontology.nt">
<noscript><meta http-equiv="refresh" content="0; url=../../#reference"></noscript>
<!-- Generated by tools/build.py. The specification of the current version is part of the website;
     this page forwards https://w3id.org/semts/ontology#Term to the entry of that term. -->
<script>
(function () {{
  var terms = {json.dumps(cls + prp + ann)};
  var concepts = {json.dumps(concepts, separators=(',', ':'))};
  var h = decodeURIComponent(location.hash.replace(/^#/, '')).replace(/^\\/?ontology#?/, '').replace(/^.*#/, '');
  var target = '../../#reference';
  if (h && terms.indexOf(h) >= 0) target = '../../#term-' + h;
  else if (h && concepts[h]) target = '../../#' + concepts[h];
  location.replace(target);
}})();
</script>
</head>
<body>
<p>The specification of the current SemTS version is on the <a href="../../#reference">SemTS website</a>.
Serialisations: <a href="ontology.ttl">Turtle</a>, <a href="ontology.owl">RDF/XML</a>, <a href="ontology.jsonld">JSON-LD</a>, <a href="ontology.nt">N-Triples</a>.</p>
</body>
</html>
"""


def vocab_redirect_html(vocab):
    """vocabularies/index.html: https://w3id.org/semts/vocabulary/<module>#Concept lands here (?m=<key>)."""
    ns = {s['key']: s['namespace'] for s in vocab['schemes']}
    known = sorted(vocab['concepts'])
    return f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>SemTS vocabularies</title>
<meta name="robots" content="noindex">
<noscript><meta http-equiv="refresh" content="0; url=../#vocabularies"></noscript>
<!-- Generated by tools/build.py. Forwards a vocabulary IRI to its concept in the browser on the website. -->
<script>
(function () {{
  var prefixes = {json.dumps({k: 'semts-' + k for k in ns})};
  var known = {json.dumps(known)};
  var m = (new URLSearchParams(location.search).get('m') || '').toLowerCase();
  var local = decodeURIComponent(location.hash.replace(/^#/, ''));
  var target = '../#vocabularies';
  if (prefixes[m]) {{
    // data knowledge features published in 1.2.0 keep semts-dv IRIs but live in the feature extension
    var id = prefixes[m] + ':' + local;
    if (local && known.indexOf(id) >= 0) target = '../#concept-' + m + '-' + local;
    else if (!local) target = '../#vocabularies';
  }}
  location.replace(target);
}})();
</script>
</head>
<body><p>The SemTS vocabularies are described on the <a href="../#vocabularies">SemTS website</a>.</p></body>
</html>
"""


# ===================================================================== main
def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument('--snapshot', action='store_true', help='also freeze the website into ontology/versioned/<version>/')
    a = ap.parse_args()

    log = []
    og = load(ONTO_TTL)
    onto_s = next(s for s in og.subjects() if ('iri', OWL + 'Ontology') in og.objs(s, RDF + 'type'))
    version = lit(og, onto_s, OWL + 'versionInfo')
    vdir = ROOT / 'ontology/versioned' / version.replace('.', '')
    prior = (iris(og, onto_s, OWL + 'priorVersion') or [None])[0]
    prior_ttl = ROOT / 'ontology/versioned' / re.sub(r'.*/(\d+)#?$', r'\1', prior) / 'ontology.ttl' if prior else None

    # serialisations
    log += serialise(ONTO_TTL, ['owl', 'nt', 'jsonld'])
    vdir.mkdir(parents=True, exist_ok=True)
    shutil.copyfile(ONTO_TTL, vdir / 'ontology.ttl')
    log +=[f'versioned/{vdir.name}/' + x for x in serialise(vdir / 'ontology.ttl', ['owl', 'nt', 'jsonld'])]
    shutil.copyfile(SHAPES_TTL, vdir / 'shapes.ttl')
    log.append(write_webvowl(vdir))
    for _, fname, _ in VOCABS:
        log += serialise(ROOT / 'vocabularies' / fname, ['owl'])
    for f in sorted((ROOT / 'application_scenarios').glob('scenario*.ttl')):
        log += serialise(f, ['rdf'])

    # website data
    onto = ontology_data(ONTO_TTL, prior_ttl)
    onto['shapes'] = shapes_data()
    vocab = vocab_data()
    examples = OrderedDict((f.name[:2], read(f)) for f in sorted((ROOT / 'examples').glob('[0-9][0-9]_*.ttl')))
    onto_json = json.dumps(onto, ensure_ascii=False, separators=(',', ':'))
    write(ROOT / 'data/ontology.json', onto_json)
    write(ROOT / 'data/vocab.json', json.dumps(vocab, ensure_ascii=False, separators=(',', ':')))
    write(ROOT / 'index.html', site_html(onto_json, examples))
    write(ROOT / 'ontology/current/index.html', redirect_html(onto, vocab))
    write(ROOT / 'vocabularies/index.html', vocab_redirect_html(vocab))
    log += ['data/ontology.json', 'data/vocab.json', 'index.html', 'ontology/current/index.html', 'vocabularies/index.html']

    if a.snapshot:
        write(vdir / 'index.html', site_html(onto_json, examples, snapshot=version))
        shutil.copytree(ROOT / 'data', vdir / 'data', dirs_exist_ok=True)
        img = ROOT / 'assets/images' / f'semts_architecture_{version}.svg'
        if img.exists():
            (vdir / 'assets/images').mkdir(parents=True, exist_ok=True)
            shutil.copyfile(img, vdir / 'assets/images' / img.name)
        log += [f'ontology/versioned/{vdir.name}/index.html (+ data, assets)']

    print('built:\n  ' + '\n  '.join(log))
    print(f"{len([c for c in onto['classes'].values() if not c['external']])} classes, {len(onto['props'])} properties, "
          f"{len(vocab['concepts'])} concepts in {len(vocab['schemes'])} modules, {len(onto['shapes'])} shapes, "
          f"{len(examples)} examples")
    if vocab['dangling']:
        print('WARNING: references to undefined SemTS concepts:', vocab['dangling'])
        sys.exit(1)


if __name__ == '__main__':
    main()
