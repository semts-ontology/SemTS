#!/usr/bin/env python3
"""Structural checks of the SemTS source files, without third-party packages.

  * every Turtle file of the repository parses
  * ontology: OWL 2 reserved vocabulary is not redeclared, every non-imported entity that is used is declared,
    no property is declared with two property kinds, rdfs:seeAlso has IRI objects
  * vocabularies (SKOS integrity across all modules): one prefLabel per language (S14), prefLabel and altLabel
    disjoint (S13), related disjoint from broaderTransitive (S27), exactMatch disjoint from broadMatch,
    narrowMatch and relatedMatch (S46), no broader cycles, existing broader/related/match targets in SemTS
    namespaces, consistent top concepts, unique preferred labels per scheme, the SemTS concept class of each
    module (knowledge concepts, except generation concepts under Knowledge Generation and quality measure
    concepts), and deprecated concepts with an existing replacement

usage: python3 tools/check_sources.py
"""
import collections, sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / 'tools'))
from semtsrdf.ttl import parse  # noqa: E402

RDF = 'http://www.w3.org/1999/02/22-rdf-syntax-ns#'
RDFS = 'http://www.w3.org/2000/01/rdf-schema#'
OWL = 'http://www.w3.org/2002/07/owl#'
XSD = 'http://www.w3.org/2001/XMLSchema#'
SK = 'http://www.w3.org/2004/02/skos/core#'
SEM = 'https://w3id.org/semts/'
IMPORTED = ('http://www.w3.org/2006/time#', 'http://www.w3.org/ns/dcat#', 'http://www.w3.org/ns/prov#')
problems = []


def load(p):
    return parse(p.read_text(encoding='utf-8'))[0]


# ------------------------------------------------------------------ syntax
for p in sorted(ROOT.rglob('*.ttl')):
    if any(part.startswith('.') for part in p.relative_to(ROOT).parts):
        continue
    try:
        load(p)
    except Exception as e:  # noqa: BLE001
        problems.append(('syntax', str(p.relative_to(ROOT)), str(e)[:200]))

# ------------------------------------------------------------------ ontology
T = load(ROOT / 'ontology/current/ontology.ttl')
kinds = {OWL + 'Class': 'C', RDFS + 'Datatype': 'D', OWL + 'ObjectProperty': 'OP', OWL + 'DatatypeProperty': 'DP',
         OWL + 'AnnotationProperty': 'AP', OWL + 'NamedIndividual': 'I', OWL + 'Ontology': 'O'}
decl = collections.defaultdict(set)
for s, p, o in T:
    if p[1] == RDF + 'type' and s[0] == 'iri' and o[1] in kinds:
        decl[s[1]].add(kinds[o[1]])
builtin = lambda i: i.startswith((RDF, RDFS, OWL, XSD))
declared = lambda i: i in decl or builtin(i) or i.startswith(IMPORTED)
for i, k in decl.items():
    if builtin(i):
        problems.append(('ontology', 'reserved vocabulary redeclared', i))
    if len(k & {'OP', 'DP', 'AP'}) > 1:
        problems.append(('ontology', 'property declared with several kinds', i))
for s, p, o in T:
    if not declared(p[1]):
        problems.append(('ontology', 'undeclared property', p[1]))
    if p[1] in (RDFS + 'subClassOf', OWL + 'equivalentClass', OWL + 'disjointWith', RDFS + 'domain', RDFS + 'range',
                OWL + 'someValuesFrom', OWL + 'allValuesFrom', OWL + 'onClass') and o[0] == 'iri' and not declared(o[1]):
        problems.append(('ontology', 'undeclared class', o[1]))
    if p[1] == RDFS + 'seeAlso' and o[0] == 'lit':
        problems.append(('ontology', 'rdfs:seeAlso with a literal', s[1]))

# ------------------------------------------------------------------ vocabularies
V = []
for p in sorted((ROOT / 'vocabularies').glob('vocab_*.ttl')):
    V += load(p)
by = collections.defaultdict(lambda: collections.defaultdict(list))
for s, p, o in V:
    by[s][p[1]].append(o)
concepts = {s for s in by if ('iri', SK + 'Concept') in by[s][RDF + 'type']}
schemes = {s for s in by if ('iri', SK + 'ConceptScheme') in by[s][RDF + 'type']}
short = lambda t: t[1].replace(SEM, '') if t[0] == 'iri' else str(t)
METHOD = ('iri', SEM + 'vocabulary/knowledge-generation#MethodKnowledge')


def want(c):
    # the knowledge generation vocabulary also holds the method knowledge branch (knowledge concepts)
    if '/knowledge-generation#' in c[1]:
        return 'KnowledgeConcept' if c == METHOD or METHOD in ancestors(c) else 'KnowledgeGenerationConcept'
    return 'QualityMeasureConcept' if '/quality-measure#' in c[1] else 'KnowledgeConcept'


for c in concepts:
    d = by[c]
    langs = collections.Counter(o[2] for o in d[SK + 'prefLabel'])
    if not langs:
        problems.append(('vocabulary', 'no skos:prefLabel', short(c)))
    problems += [('vocabulary', f'S14: several prefLabels @{lang}', short(c)) for lang, n in langs.items() if n > 1]
    if {(o[1], o[2]) for o in d[SK + 'prefLabel']} & {(o[1], o[2]) for o in d[SK + 'altLabel']}:
        problems.append(('vocabulary', 'S13: prefLabel also used as altLabel', short(c)))
    if not any(o in schemes for o in d[SK + 'inScheme']):
        problems.append(('vocabulary', 'not in a known concept scheme', short(c)))
    for rel in ('broader', 'narrower', 'related'):
        problems += [('vocabulary', f'{rel} target is not a concept', f'{short(c)} -> {short(o)}') for o in d[SK + rel] if o not in concepts]
    for rel in ('exactMatch', 'closeMatch', 'broadMatch', 'narrowMatch', 'relatedMatch'):
        problems += [('vocabulary', f'{rel} target is not a SemTS concept', f'{short(c)} -> {short(o)}')
                     for o in d[SK + rel] if o[0] == 'iri' and o[1].startswith(SEM) and o not in concepts]
    if set(d[SK + 'exactMatch']) & (set(d[SK + 'broadMatch']) | set(d[SK + 'narrowMatch']) | set(d[SK + 'relatedMatch'])):
        problems.append(('vocabulary', 'S46: exactMatch overlaps another mapping', short(c)))
    if any(o[1] == 'true' for o in d[OWL + 'deprecated']):
        repl = d['http://purl.org/dc/terms/isReplacedBy']
        if not repl or any(r not in concepts for r in repl):
            problems.append(('vocabulary', 'deprecated without an existing replacement', short(c)))
broader = collections.defaultdict(set)
for c in concepts:
    broader[c] |= set(by[c][SK + 'broader'])
    for n in by[c][SK + 'narrower']:
        broader[n].add(c)


def ancestors(c):
    seen, stack = set(), list(broader[c])
    while stack:
        x = stack.pop()
        if x not in seen:
            seen.add(x); stack += broader[x]
    return seen


for c in concepts:
    if ('iri', SEM + 'ontology#' + want(c)) not in by[c][RDF + 'type']:
        problems.append(('vocabulary', 'not typed semts:' + want(c), short(c)))
    a = ancestors(c)
    if c in a:
        problems.append(('vocabulary', 'broader cycle', short(c)))
    for r in by[c][SK + 'related']:
        if r in a or c in ancestors(r):
            problems.append(('vocabulary', 'S27: related and broaderTransitive', f'{short(c)} - {short(r)}'))
    for s in by[c][SK + 'topConceptOf']:
        if c not in by[s][SK + 'hasTopConcept']:
            problems.append(('vocabulary', 'topConceptOf without hasTopConcept', short(c)))
for s in schemes:
    for t in by[s][SK + 'hasTopConcept']:
        if s not in by[t][SK + 'topConceptOf']:
            problems.append(('vocabulary', 'hasTopConcept without topConceptOf', short(t)))
labels = collections.defaultdict(list)
for c in concepts:
    for o in by[c][SK + 'prefLabel']:
        for s in by[c][SK + 'inScheme']:
            labels[(s, o[1].lower(), o[2])].append(short(c))
problems += [('vocabulary', f'preferred label "{k[1]}" used twice in {short(k[0])}', ', '.join(sorted(v))) for k, v in labels.items() if len(v) > 1]

problems = sorted(set(problems))
for p in problems:
    print(*p, sep=' | ')
print(f'{len(T)} ontology triples, {len(concepts)} concepts in {len(schemes)} schemes, {len(problems)} problems')
sys.exit(1 if problems else 0)
