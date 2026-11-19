"""Serialise triples (as produced by ttl.py / rdfxml.py) to N-Triples, RDF/XML, JSON-LD and Turtle.

Terms: ('iri', v) | ('bnode', id) | ('lit', lexical, lang, datatype)
"""
import json, re
from collections import OrderedDict, defaultdict

RDF = 'http://www.w3.org/1999/02/22-rdf-syntax-ns#'
XSD = 'http://www.w3.org/2001/XMLSchema#'


def _esc_nt(s):
    out = []
    for ch in s:
        o = ord(ch)
        if ch == '\\': out.append('\\\\')
        elif ch == '"': out.append('\\"')
        elif ch == '\n': out.append('\\n')
        elif ch == '\r': out.append('\\r')
        elif ch == '\t': out.append('\\t')
        elif o < 0x20: out.append('\\u%04X' % o)
        else: out.append(ch)
    return ''.join(out)


def _bid(t, ids):
    return ids.setdefault(t[1], 'b%d' % (len(ids) + 1))


def nt_term(t, ids):
    if t[0] == 'iri':
        return '<' + t[1] + '>'
    if t[0] == 'bnode':
        return '_:' + _bid(t, ids)
    s = '"' + _esc_nt(t[1]) + '"'
    if t[2]:
        return s + '@' + t[2]
    if t[3] and t[3] != XSD + 'string':
        return s + '^^<' + t[3] + '>'
    return s


def sort_key(t):
    return (0 if t[0][0] == 'iri' else 1, t[0][1], t[1][1], t[2][0], str(t[2][1]))


def dedupe(triples):
    seen, out = set(), []
    for t in triples:
        if t not in seen:
            seen.add(t); out.append(t)
    return out


def to_nt(triples):
    ids = {}
    return ''.join(f'{nt_term(s, ids)} {nt_term(p, ids)} {nt_term(o, ids)} .\n' for s, p, o in sorted(dedupe(triples), key=sort_key))


def _split(iri):
    m = re.match(r'^(.*[#/])([A-Za-z_][A-Za-z0-9_.\-]*)$', iri)
    if not m or m.group(2).endswith('.'):
        return None
    return m.group(1), m.group(2)


def _xesc(s, attr=False):
    s = s.replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;')
    return s.replace('"', '&quot;') if attr else s


NCNAME = re.compile(r'^[A-Za-z_][A-Za-z0-9_.\-]*$')


def named_prefixes(prefixes):
    """Prefixes usable as XML namespace prefixes and JSON-LD terms (the empty prefix is renamed)."""
    out = OrderedDict()
    for k, v in prefixes.items():
        if not k:
            k = 'semts' if v == 'https://w3id.org/semts/ontology#' else 'base'
        if NCNAME.match(k) and k not in out and not k.lower().startswith('xml'):
            out[k] = v
    return out


def to_rdfxml(triples, prefixes, base_comment=None):
    """Flat RDF/XML: one rdf:Description per subject, blank nodes as rdf:nodeID."""
    triples = dedupe(triples)
    prefixes = named_prefixes(prefixes)
    ns = OrderedDict([('rdf', RDF)])
    for k, v in prefixes.items():
        if v not in ns.values() and k not in ns:
            ns[k] = v
    ids = {}
    gen = [0]

    def qname(iri):
        sp = _split(iri)
        if not sp:
            raise ValueError('cannot make an XML qname for predicate ' + iri)
        n, l = sp
        for k, v in ns.items():
            if v == n:
                return f'{k}:{l}'
        gen[0] += 1
        k = f'ns{gen[0]}'
        ns[k] = n
        return f'{k}:{l}'

    by = OrderedDict()
    for s, p, o in sorted(triples, key=sort_key):
        by.setdefault(s, []).append((p, o))
    body = []
    for s, pos in by.items():
        if s[0] == 'iri':
            body.append(f'  <rdf:Description rdf:about="{_xesc(s[1], True)}">')
        else:
            body.append(f'  <rdf:Description rdf:nodeID="{_bid(s, ids)}">')
        for p, o in pos:
            q = qname(p[1])
            if o[0] == 'iri':
                body.append(f'    <{q} rdf:resource="{_xesc(o[1], True)}"/>')
            elif o[0] == 'bnode':
                body.append(f'    <{q} rdf:nodeID="{_bid(o, ids)}"/>')
            else:
                a = ''
                if o[2]:
                    a = f' xml:lang="{o[2]}"'
                elif o[3] and o[3] != XSD + 'string':
                    a = f' rdf:datatype="{_xesc(o[3], True)}"'
                body.append(f'    <{q}{a}>{_xesc(o[1])}</{q}>')
        body.append('  </rdf:Description>')
    head = ['<?xml version="1.0" encoding="utf-8"?>']
    if base_comment:
        head.append(f'<!-- {base_comment} -->')
    head.append('<rdf:RDF')
    head += [f'   xmlns:{k}="{_xesc(v, True)}"' for k, v in ns.items()]
    head[-1] += '>'
    return '\n'.join(head + body + ['</rdf:RDF>', ''])


def to_jsonld(triples, prefixes):
    """Flattened, compacted-by-prefix JSON-LD (@context with the prefixes, @graph of nodes)."""
    triples = dedupe(triples)
    prefixes = named_prefixes(prefixes)
    ids = {}

    def cur(iri):
        for k, v in prefixes.items():
            if iri.startswith(v) and re.match(r'^[A-Za-z_][\w\-.]*$', iri[len(v):] or 'x') and iri[len(v):]:
                return f'{k}:{iri[len(v):]}'
        return iri

    def node_id(t):
        return cur(t[1]) if t[0] == 'iri' else '_:' + _bid(t, ids)

    nodes = OrderedDict()
    for s, p, o in sorted(triples, key=sort_key):
        n = nodes.setdefault(node_id(s), OrderedDict([('@id', node_id(s))]))
        if p[1] == RDF + 'type' and o[0] == 'iri':
            n.setdefault('@type', []).append(cur(o[1]))
            continue
        key = cur(p[1])
        if o[0] in ('iri', 'bnode'):
            v = {'@id': node_id(o)}
        else:
            v = {'@value': o[1]}
            if o[2]:
                v['@language'] = o[2]
            elif o[3] and o[3] != XSD + 'string':
                v['@type'] = cur(o[3])
        n.setdefault(key, []).append(v)
    ctx = OrderedDict((k, v) for k, v in prefixes.items() if k)
    return json.dumps(OrderedDict([('@context', ctx), ('@graph', list(nodes.values()))]), indent=2, ensure_ascii=False) + '\n'


def to_turtle(triples, prefixes, header=None):
    """Readable Turtle: subjects grouped, single-use blank nodes nested, rdf lists as ( )."""
    triples = dedupe(triples)
    by = defaultdict(list)
    ref = defaultdict(int)
    for s, p, o in triples:
        by[s].append((p, o))
        if o[0] == 'bnode':
            ref[o] += 1
    ids = {}
    used = set()

    def term(t):
        if t[0] == 'iri':
            if t[1] == RDF + 'type':
                return 'a'
            for k, v in prefixes.items():
                loc = t[1][len(v):]
                if t[1].startswith(v) and re.match(r'^[A-Za-z_][A-Za-z0-9_\-]*$', loc or '') :
                    used.add(k)
                    return f'{k}:{loc}'
            return '<' + t[1] + '>'
        if t[0] == 'bnode':
            return '_:' + _bid(t, ids)
        s = '"' + _esc_nt(t[1]) + '"'
        if t[2]:
            return s + '@' + t[2]
        if t[3] == XSD + 'integer' and re.match(r'^[+-]?\d+$', t[1]):
            return t[1]
        if t[3] == XSD + 'boolean' and t[1] in ('true', 'false'):
            return t[1]
        if t[3] and t[3] != XSD + 'string':
            return s + '^^' + term(('iri', t[3]))
        return s

    def as_list(b):
        items, cur, seen = [], b, set()
        while cur != ('iri', RDF + 'nil'):
            if cur[0] != 'bnode' or cur in seen or ref[cur] > 1 and cur != b:
                return None
            seen.add(cur)
            po = by.get(cur, [])
            f = [o for p, o in po if p[1] == RDF + 'first']
            r = [o for p, o in po if p[1] == RDF + 'rest']
            if len(po) != 2 or len(f) != 1 or len(r) != 1:
                return None
            items.append(f[0]); cur = r[0]
        return items, seen

    inlined = set()

    def obj(o, ind):
        if o[0] == 'bnode' and ref[o] == 1 and o in by:
            lst = as_list(o)
            if lst is not None:
                inlined.update(lst[1])
                return '( ' + ' '.join(obj(x, ind + 4) for x in lst[0]) + ' )'
            inlined.add(o)
            return '[ ' + body(o, ind + 4, nested=True) + ' ]'
        return term(o)

    def body(s, ind, nested=False):
        groups = OrderedDict()
        pos = sorted(by[s], key=lambda x: (x[0][1] != RDF + 'type', x[0][1], str(x[1])))
        for p, o in pos:
            groups.setdefault(p, []).append(o)
        pad = ' ' * ind
        parts = []
        for p, os_ in groups.items():
            parts.append(term(p) + ' ' + (',\n' + pad + '    ').join(obj(o, ind) for o in os_))
        return (' ;\n' + pad).join(parts)

    subjects = sorted(by, key=lambda s: (s[0] != 'iri', s[1]))
    blocks = []
    for s in subjects:
        if s[0] == 'bnode' and ref[s] == 1:
            continue  # printed inline by its referrer
        blocks.append(term(s) + ' ' + body(s, 4) + ' .\n')
    # blank nodes that were meant to be inlined but whose referrer was itself never printed
    for s in subjects:
        if s[0] == 'bnode' and ref[s] == 1 and s not in inlined:
            blocks.append(term(s) + ' ' + body(s, 4) + ' .\n')
    pre = ''.join(f'@prefix {k}: <{v}> .\n' for k, v in prefixes.items() if k in used)
    return (header or '') + pre + '\n' + '\n'.join(blocks)
