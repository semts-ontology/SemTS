"""Minimal Turtle parser (enough for the SemTS ontology, vocabularies, shapes and examples).

Terms:  ('iri', str) | ('bnode', str) | ('lit', value, lang, datatype)
"""
import re
from urllib.parse import urljoin

TOKEN_RE = re.compile(r'''
    (?P<ws>\s+)
  | (?P<comment>\#[^\n]*)
  | (?P<iri><[^>\s]*>)
  | (?P<lstring>"""(?:[^"\\]|\\.|"(?!""))*""")
  | (?P<string>"(?:[^"\\\n]|\\.)*")
  | (?P<blabel>_:[A-Za-z0-9_](?:[A-Za-z0-9_\-.]*[A-Za-z0-9_\-])?)
  | (?P<prefixkw>@prefix|PREFIX|@base|BASE)
  | (?P<lang>@[a-zA-Z]+(?:-[a-zA-Z0-9]+)*)
  | (?P<dtsep>\^\^)
  | (?P<number>[+-]?(?:\d+\.\d+|\d+)(?:[eE][+-]?\d+)?)
  | (?P<pname>(?:[A-Za-z][\w\-]*)?:(?:(?:[^\s;,.\[\]()<>"'{}^\\#]|\\[_~.\-!$&'()*+,;=/?#@%])+(?:\.+(?:[^\s;,.\[\]()<>"'{}^\\#]|\\[_~.\-!$&'()*+,;=/?#@%])+)*)?)
  | (?P<bool>true|false)
  | (?P<a>a(?=[\s\[<"]))
  | (?P<punct>[;,.\[\]()])
''', re.X)

XSD = 'http://www.w3.org/2001/XMLSchema#'
RDF = 'http://www.w3.org/1999/02/22-rdf-syntax-ns#'


def tokenize(text):
    pos, out = 0, []
    while pos < len(text):
        m = TOKEN_RE.match(text, pos)
        if not m:
            raise SyntaxError(f'Cannot tokenize at {pos}: {text[pos:pos+40]!r} (line {text.count(chr(10),0,pos)+1})')
        kind = m.lastgroup
        if kind not in ('ws', 'comment'):
            out.append((kind, m.group(kind), text.count('\n', 0, pos) + 1))
        pos = m.end()
    return out


def unescape(s):
    def r(m):
        c = m.group(1)
        if c[0] in 'uU':
            return chr(int(c[1:], 16))
        return {'n': '\n', 't': '\t', 'r': '\r', 'b': '\b', 'f': '\f', '"': '"', "'": "'", '\\': '\\'}[c]
    return re.sub(r'\\(u[0-9A-Fa-f]{4}|U[0-9A-Fa-f]{8}|[ntrbf"\'\\])', r, s)


class Parser:
    def __init__(self, text, base_prefixes=None):
        self.toks = tokenize(text)
        self.i = 0
        self.prefixes = dict(base_prefixes or {})
        self.triples = []
        self.bn = 0
        self.base = ''

    def peek(self, k=0):
        return self.toks[self.i + k] if self.i + k < len(self.toks) else (None, None, None)

    def next(self):
        t = self.peek(); self.i += 1; return t

    def expect(self, val):
        t = self.next()
        if t[1] != val:
            raise SyntaxError(f'Expected {val!r} got {t[1]!r} at line {t[2]}')

    def new_bnode(self):
        self.bn += 1
        return ('bnode', f'b{self.bn}')

    def res(self, iri):
        if re.match(r'^[A-Za-z][A-Za-z0-9+.-]*:', iri) or not self.base:
            return iri
        return urljoin(self.base, iri)

    def expand(self, pname, line):
        pre, local = pname.split(':', 1)
        local = re.sub(r'\\(.)', r'\1', local)
        if pre not in self.prefixes:
            raise SyntaxError(f'Unknown prefix {pre!r} at line {line}')
        return ('iri', self.prefixes[pre] + local)

    def parse(self):
        while self.i < len(self.toks):
            k, v, line = self.peek()
            if k == 'prefixkw' and v in ('@base', 'BASE'):
                self.next()
                _, iri, _ = self.next()
                self.base = self.res(iri[1:-1])
                if v == '@base':
                    self.expect('.')
                continue
            if k == 'prefixkw':
                self.next()
                _, p, _ = self.next()
                _, iri, _ = self.next()
                self.prefixes[p[:-1]] = self.res(iri[1:-1])
                if v == '@prefix':
                    self.expect('.')
                continue
            subj = self.subject()
            if self.peek()[1] == '.' and subj[0] == 'bnode':
                self.next(); continue
            self.pred_obj_list(subj)
            self.expect('.')
        return self.triples

    def subject(self):
        k, v, line = self.peek()
        if v == '[':
            return self.bnode_prop_list()
        if v == '(':
            return self.collection()
        self.next()
        if k == 'iri':
            return ('iri', self.res(v[1:-1]))
        if k == 'pname':
            return self.expand(v, line)
        if k == 'blabel':
            return ('bnode', 'L' + v[2:])
        raise SyntaxError(f'Bad subject {v!r} at line {line}')

    def pred_obj_list(self, subj):
        while True:
            k, v, line = self.next()
            if k == 'a':
                pred = ('iri', RDF + 'type')
            elif k == 'iri':
                pred = ('iri', self.res(v[1:-1]))
            elif k == 'pname':
                pred = self.expand(v, line)
            else:
                raise SyntaxError(f'Bad predicate {v!r} at line {line}')
            while True:
                obj = self.obj()
                self.triples.append((subj, pred, obj))
                if self.peek()[1] == ',':
                    self.next(); continue
                break
            if self.peek()[1] == ';':
                while self.peek()[1] == ';':
                    self.next()
                if self.peek()[1] in ('.', ']'):
                    return
                continue
            return

    def bnode_prop_list(self):
        self.expect('[')
        b = self.new_bnode()
        if self.peek()[1] != ']':
            self.pred_obj_list(b)
        self.expect(']')
        return b

    def collection(self):
        self.expect('(')
        items = []
        while self.peek()[1] != ')':
            items.append(self.obj())
        self.expect(')')
        if not items:
            return ('iri', RDF + 'nil')
        head = self.new_bnode(); cur = head
        for idx, it in enumerate(items):
            self.triples.append((cur, ('iri', RDF + 'first'), it))
            if idx == len(items) - 1:
                self.triples.append((cur, ('iri', RDF + 'rest'), ('iri', RDF + 'nil')))
            else:
                nxt = self.new_bnode()
                self.triples.append((cur, ('iri', RDF + 'rest'), nxt)); cur = nxt
        return head

    def obj(self):
        k, v, line = self.peek()
        if v == '[':
            return self.bnode_prop_list()
        if v == '(':
            return self.collection()
        self.next()
        if k == 'iri':
            return ('iri', self.res(v[1:-1]))
        if k == 'pname':
            return self.expand(v, line)
        if k in ('string', 'lstring'):
            val = unescape(v[3:-3] if k == 'lstring' else v[1:-1])
            lang = dt = None
            if self.peek()[0] == 'lang':
                lang = self.next()[1][1:]
            elif self.peek()[0] == 'dtsep':
                self.next()
                k2, v2, l2 = self.next()
                dt = self.res(v2[1:-1]) if k2 == 'iri' else self.expand(v2, l2)[1]
            return ('lit', val, lang, dt)
        if k == 'blabel':
            return ('bnode', 'L' + v[2:])
        if k == 'number':
            return ('lit', v, None, XSD + ('double' if 'e' in v.lower() else 'decimal' if '.' in v else 'integer'))
        if k == 'bool':
            return ('lit', v, None, XSD + 'boolean')
        raise SyntaxError(f'Bad object {v!r} at line {line}')


def parse(text, prefixes=None):
    p = Parser(text, prefixes)
    triples = p.parse()
    return triples, p.prefixes


class Graph:
    def __init__(self):
        self.t = []
        self.prefixes = {}

    def add_text(self, text, tag=''):
        # make bnode ids unique per source
        triples, pref = parse(text)
        def fix(term):
            return ('bnode', tag + term[1]) if term[0] == 'bnode' else term
        self.t.extend((fix(s), p, fix(o)) for s, p, o in triples)
        self.prefixes.update(pref)
        self._index()
        return triples

    def _index(self):
        self.sp, self.po = {}, {}
        for s, p, o in self.t:
            self.sp.setdefault((s, p[1]), []).append(o)
            self.po.setdefault((p[1], o), []).append(s)

    def objs(self, s, p):
        return self.sp.get((s, p), [])

    def subjs(self, p, o):
        return self.po.get((p, o), [])

    def subjects(self):
        seen, out = set(), []
        for s, _, _ in self.t:
            if s not in seen:
                seen.add(s); out.append(s)
        return out

    def lst(self, head):
        out = []
        while head != ('iri', RDF + 'nil'):
            out += self.objs(head, RDF + 'first')
            r = self.objs(head, RDF + 'rest')
            if not r: break
            head = r[0]
        return out
