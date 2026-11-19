"""Minimal RDF/XML parser producing the same term tuples as ttl.py."""
import re
import xml.etree.ElementTree as ET
from urllib.parse import urljoin

RDF = 'http://www.w3.org/1999/02/22-rdf-syntax-ns#'
XML = '{http://www.w3.org/XML/1998/namespace}'


def _iri(tag):
    ns, local = tag[1:].split('}')
    return ns + local


class RDFXMLParser:
    def __init__(self, text, base=''):
        self.root = ET.fromstring(text)
        self.base = self.root.get(XML + 'base', base)
        self.triples = []
        self.bn = 0
        self.ids = {}

    def bnode(self, nid=None):
        if nid:
            if nid not in self.ids:
                self.bn += 1
                self.ids[nid] = ('bnode', 'x' + str(self.bn))
            return self.ids[nid]
        self.bn += 1
        return ('bnode', 'x' + str(self.bn))

    def res(self, v, base):
        if re.match(r'^[A-Za-z][A-Za-z0-9+.\-]*:', v):
            return v  # absolute IRI (urljoin would drop an empty fragment)
        r = urljoin(base, v) if base else v
        return r + '#' if v.endswith('#') and not r.endswith('#') else r

    def parse(self):
        base = self.base
        nodes = list(self.root) if self.root.tag == '{%s}RDF' % RDF else [self.root]
        for n in nodes:
            self.node(n, base, None)
        return self.triples

    def subject(self, el, base):
        if el.get('{%s}about' % RDF) is not None:
            return ('iri', self.res(el.get('{%s}about' % RDF), base))
        if el.get('{%s}ID' % RDF) is not None:
            return ('iri', self.res('#' + el.get('{%s}ID' % RDF), base))
        if el.get('{%s}nodeID' % RDF) is not None:
            return self.bnode(el.get('{%s}nodeID' % RDF))
        return self.bnode()

    def node(self, el, base, lang):
        base = el.get(XML + 'base', base)
        lang = el.get(XML + 'lang', lang)
        s = self.subject(el, base)
        if el.tag != '{%s}Description' % RDF:
            self.triples.append((s, ('iri', RDF + 'type'), ('iri', _iri(el.tag))))
        for k, v in el.attrib.items():
            if k.startswith('{%s}' % RDF) and k[len(RDF) + 2:] in ('about', 'ID', 'nodeID', 'datatype', 'parseType', 'resource'):
                continue
            if k.startswith(XML):
                continue
            if k == '{%s}type' % RDF:
                self.triples.append((s, ('iri', RDF + 'type'), ('iri', self.res(v, base))))
            else:
                self.triples.append((s, ('iri', _iri(k)), ('lit', v, lang, None)))
        for p in el:
            self.prop(s, p, base, lang)
        return s

    def prop(self, s, p, base, lang):
        base = p.get(XML + 'base', base)
        lang = p.get(XML + 'lang', lang)
        pred = ('iri', _iri(p.tag))
        if pred[1] == RDF + 'li':
            pred = ('iri', RDF + '_1')
        res = p.get('{%s}resource' % RDF)
        nid = p.get('{%s}nodeID' % RDF)
        pt = p.get('{%s}parseType' % RDF)
        dt = p.get('{%s}datatype' % RDF)
        if res is not None:
            self.triples.append((s, pred, ('iri', self.res(res, base))))
        elif nid is not None:
            self.triples.append((s, pred, self.bnode(nid)))
        elif pt == 'Resource':
            b = self.bnode()
            self.triples.append((s, pred, b))
            for c in p:
                self.prop(b, c, base, lang)
        elif pt == 'Collection':
            items = [self.node(c, base, lang) for c in p]
            if not items:
                self.triples.append((s, pred, ('iri', RDF + 'nil')))
                return
            head = self.bnode(); cur = head
            self.triples.append((s, pred, head))
            for i, it in enumerate(items):
                self.triples.append((cur, ('iri', RDF + 'first'), it))
                nxt = ('iri', RDF + 'nil') if i == len(items) - 1 else self.bnode()
                self.triples.append((cur, ('iri', RDF + 'rest'), nxt)); cur = nxt
        elif len(p):
            o = self.node(p[0], base, lang)
            self.triples.append((s, pred, o))
        else:
            other = [k for k in p.attrib if not k.startswith(XML) and k not in ('{%s}datatype' % RDF,)]
            if other:
                b = self.bnode()
                self.triples.append((s, pred, b))
                for k in other:
                    v = p.get(k)
                    if k == '{%s}type' % RDF:
                        self.triples.append((b, ('iri', RDF + 'type'), ('iri', self.res(v, base))))
                    else:
                        self.triples.append((b, ('iri', _iri(k)), ('lit', v, lang, None)))
            else:
                self.triples.append((s, pred, ('lit', p.text or '', None if dt else lang, self.res(dt, base) if dt else None)))


def parse_rdfxml(text, base=''):
    return RDFXMLParser(text, base).parse()
