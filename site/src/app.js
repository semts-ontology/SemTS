(() => {
'use strict';
const ONTO = window.__ONTO__;
const EXTTL = window.__EXAMPLES__;
let VOCAB = null;
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

/* ------------------------------------------------------------------ routes
   One entry per page. nav is the label in the main menu, docs the group in the docs sidebar. */
const ROUTES = [
  { id: 'home', title: 'SemTS: the Semantic Time Series Ontology' },
  { id: 'ontology', title: 'Ontology', nav: 'Ontology' },
  { id: 'vocabularies', title: 'Vocabularies', nav: 'Vocabularies' },
  { id: 'examples', title: 'Examples', nav: 'Examples' },
  { id: 'applications', title: 'Applications', nav: 'Applications' },
  { id: 'get-started', title: 'Get started', nav: 'Docs', docs: 'Using SemTS' },
  { id: 'reference', title: 'Specification', docs: 'Using SemTS' },
  { id: 'validation', title: 'Validation', docs: 'Using SemTS' },
  { id: 'changes', title: 'Changes in 1.3.0', docs: 'Project' },
  { id: 'cite', title: 'Publications', docs: 'Project' },
  { id: 'contact', title: 'Contact', nav: 'Contact' },
];
const ALIASES = { 'concept-notes': 'changes', specification: 'reference' };
const SNAPSHOT = window.__SNAPSHOT__;
const REPO = 'https://github.com/semts-ontology/SemTS';
const PAGES = 'https://semts-ontology.github.io/SemTS/';

/* ------------------------------------------------------------------ helpers */
function toast(msg) { const t = $('#toast'); t.textContent = msg; t.classList.add('on'); clearTimeout(toast._t); toast._t = setTimeout(() => t.classList.remove('on'), 1600); }
async function copyText(text) {
  try { await navigator.clipboard.writeText(text); toast('Copied to the clipboard'); }
  catch (e) {
    const ta = document.createElement('textarea'); ta.value = text; ta.style.position = 'fixed'; ta.style.opacity = '0'; document.body.appendChild(ta); ta.select();
    let ok = false; try { ok = document.execCommand('copy'); } catch (_) { ok = false; }
    ta.remove(); toast(ok ? 'Copied to the clipboard' : 'Copying is blocked here. Select the text and copy it.');
  }
}
const local = c => c.split(':')[1];
const SHORT = { 'semts-dv': 'dv', 'semts-dfx': 'dfx', 'semts-sv': 'sv', 'semts-msv': 'msv', 'semts-gv': 'gv', 'semts-qv': 'qv' };
function hrefFor(curie) {
  if (!curie) return null;
  const [p, l] = curie.split(':');
  if (p === 'semts') {
    if (ONTO.classes[curie]) return '#class-' + l;
    if (ONTO.props[curie]) return '#prop-' + l;
    return null;
  }
  if (SHORT[p]) return '#concept-' + SHORT[p] + '-' + l;
  return null;
}
function curieFromHash(h) {
  const m = h.match(/^concept-(dv|dfx|sv|msv|gv|qv)-(.+)$/);
  if (!m) return null;
  const pfx = 'semts-' + m[1];
  return pfx + ':' + m[2];
}
function termChip(curie, layer) {
  const h = hrefFor(curie);
  const lab = curie.startsWith('semts:') ? local(curie) : curie;
  return h ? `<a class="term" href="${h}">${esc(lab)}</a>` : `<span class="term">${esc(lab)}</span>`;
}

// Class and property expressions from the build (Manchester-like syntax) with linked terms
function exprHTML(e, strip = true) {
  return esc(e).replace(/\b((?:semts|dcat|time|prov|qudt|mls|skos|xsd|owl|rdfs|foaf|dcterms|dc|schema|vann)(?:-[a-z]+)?:[A-Za-z][\w\-]*)/g, m => {
    const h = hrefFor(m); const lab = strip && m.startsWith('semts:') ? local(m) : m;
    return h ? `<a class="term" href="${h}">${esc(lab)}</a>` : `<span class="term">${esc(lab)}</span>`;
  });
}

/* ------------------------------------------------------------------ syntax highlighting */
const KW = /^(@prefix|@base|PREFIX|BASE|SELECT|DISTINCT|WHERE|FILTER|BIND|AS|OPTIONAL|ORDER|BY|LIMIT|UNION|NOT|EXISTS|STR|a|true|false)$/;
function hlRDF(src) {
  const re = /(#[^\n]*)|(<[^>\s]*>)|("""[\s\S]*?"""|"(?:[^"\\\n]|\\.)*")((?:@[a-zA-Z]+(?:-[a-zA-Z0-9]+)*)|(?:\^\^(?:[A-Za-z][\w-]*)?:[\w-]*))?|([?$][A-Za-z_]\w*)|((?:[A-Za-z][\w-]*)?:(?:[\w-]+(?:\.[\w-]+)*)?)|(@?[A-Za-z]+)|([+-]?\d+(?:\.\d+)?)|([;,.\[\]()*{}\/|^])/g;
  let out = '', last = 0, m;
  while ((m = re.exec(src))) {
    out += esc(src.slice(last, m.index)); last = re.lastIndex;
    const [all, com, iri, str, suf, v, pn, word, num, p] = m;
    if (com) out += `<span class="t-com">${esc(com)}</span>`;
    else if (iri) out += `<span class="t-iri">${esc(iri)}</span>`;
    else if (str) out += `<span class="t-str">${esc(str)}</span>` + (suf ? `<span class="t-p">${esc(suf)}</span>` : '');
    else if (v) out += `<span class="t-var">${esc(v)}</span>`;
    else if (pn) {
      const h = pn.startsWith('semts') && !pn.endsWith(':') ? hrefFor(pn) : null;
      out += h ? `<a class="t-semts" href="${h}">${esc(pn)}</a>` : `<span class="${pn.startsWith('semts') ? 't-semts' : 't-pn'}">${esc(pn)}</span>`;
    }
    else if (word) out += KW.test(word) ? `<span class="t-kw">${esc(word)}</span>` : esc(word);
    else if (num) out += `<span class="t-num">${esc(num)}</span>`;
    else if (p) out += `<span class="t-p">${esc(p)}</span>`;
    else out += esc(all);
  }
  return out + esc(src.slice(last));
}
function hlPy(src, lang) {
  const mark = lang === 'js' ? '//' : '#';
  return src.split('\n').map(line => {
    const i = lang === 'bib' ? -1 : line.indexOf(mark);
    const code = i >= 0 ? line.slice(0, i) : line, com = i >= 0 ? line.slice(i) : '';
    let h = esc(code).replace(/(&quot;.*?&quot;)/g, '<span class="t-str">$1</span>').replace(lang === 'bib' ? /^(?!)/ : /\b(from|import|for|in|print|as|const)\b/g, '<span class="t-kw">$1</span>');
    return h + (com ? `<span class="t-com">${esc(com)}</span>` : '');
  }).join('\n');
}
function renderCode(src, lang) {
  if (lang === 'py' || lang === 'js' || lang === 'bib') return { html: hlPy(src, lang), copy: src };
  const lines = src.split('\n');
  let html = '', buf = [], copy = [], inFold = false, foldBuf = [];
  const flush = () => { if (buf.length) { html += hlRDF(buf.join('\n') + '\n'); buf = []; } };
  for (const ln of lines) {
    if (ln.trim() === '#region provenance') { flush(); inFold = true; foldBuf = []; continue; }
    if (ln.trim() === '#endregion' && inFold) {
      inFold = false;
      const n = foldBuf.filter(l => l.trim()).length;
      html += `<button class="fold" aria-expanded="false" data-n="${n}">Show provenance (${n} lines, required by the shapes)</button><span class="fold-body" hidden>${hlRDF(foldBuf.join('\n') + '\n')}</span>`;
      continue;
    }
    (inFold ? foldBuf : buf).push(ln); copy.push(ln);
  }
  flush();
  return { html: html.replace(/\n$/, ''), copy: copy.join('\n').trim() + '\n' };
}
let codeId = 0;
function codeBox(tabs, opts = {}) {
  const id = 'cb' + (++codeId);
  const el = document.createElement('div'); el.className = 'codebox';
  const rendered = tabs.map(t => renderCode(t.code, t.lang));
  el.innerHTML = `<div class="code-tabs" role="tablist">${tabs.map((t, i) => `<button role="tab" id="${id}-t${i}" aria-controls="${id}-p${i}" aria-selected="${i === 0}" tabindex="${i === 0 ? 0 : -1}">${esc(t.label)}</button>`).join('')}<span class="spacer"></span><button class="copy" type="button">Copy</button></div>` +
    rendered.map((r, i) => `<pre class="code${opts.short ? ' short' : ''}" role="tabpanel" id="${id}-p${i}" aria-labelledby="${id}-t${i}"${i ? ' hidden' : ''}><code>${r.html}</code></pre>`).join('');
  let cur = 0;
  const tabsEls = $$('[role="tab"]', el);
  tabsEls.forEach((b, i) => b.addEventListener('click', () => {
    cur = i; tabsEls.forEach((x, j) => { x.setAttribute('aria-selected', j === i); x.tabIndex = j === i ? 0 : -1; });
    $$('pre', el).forEach((p, j) => { p.hidden = j !== i; });
  }));
  $('.copy', el).addEventListener('click', () => copyText(rendered[cur].copy));
  $$('.fold', el).forEach(b => b.addEventListener('click', () => {
    const body = b.nextElementSibling; const open = body.hidden; body.hidden = !open;
    b.setAttribute('aria-expanded', open); b.textContent = open ? 'Hide provenance' : `Show provenance (${b.dataset.n} lines, required by the shapes)`;
  }));
  return el;
}

/* ------------------------------------------------------------------ content data */
const LAYER = { dat: ['var(--dat)', 'var(--dat-t)', 'Data management'], cls: ['var(--cls)', 'var(--cls-t)', 'Knowledge classification'], gen: ['var(--gen)', 'var(--gen-t)', 'Knowledge generation'] };

const CAPS = [
  { t: 'Knowledge per segment', d: 'Attach knowledge to a whole series, a sub-interval, a single point or selected dimensions, for each segment on its own or for a set of segments together.', terms: ['semts:segmentKnowledge', 'semts:multiSegmentKnowledge', 'semts:segmentDimension'], l: ['dat', 'cls'], see: [['segment-knowledge', 'Example 2'], ['multi-segment', 'Example 3']] },
  { t: 'Hierarchies of segments and knowledge', d: 'Nest segments, order them with Allen\'s interval relations, and nest knowledge in groups of any depth.', terms: ['semts:isPartOf', 'semts:before', 'semts:KnowledgeGroup'], l: ['dat', 'cls'], see: [['segments', 'Example 1'], ['knowledge-groups', 'Example 4']] },
  { t: 'Values and source context', d: 'Small values live in the graph, larger ones such as models, files or arrays are referenced as DCAT resources. Both carry QUDT units and datatypes.', terms: ['semts:EmbeddedValue', 'semts:ReferencedValue', 'semts:hasUnit'], l: ['dat'], see: [['forecast', 'Example 9']] },
  { t: 'Meaning and quality', d: 'Classify every knowledge item with a concept from a vocabulary and qualify it with measures such as confidence or F1 score.', terms: ['semts:knowledgeConcept', 'semts:KnowledgeQualityMeasure', 'semts:qualityMeasureConcept'], l: ['cls'], see: [['quality', 'Example 6']] },
  { t: 'Provenance and propagation', d: 'Record which activity produced which knowledge from which inputs, and feed results into the next analysis.', terms: ['semts:knowledgeGenerationEntity', 'semts:used', 'semts:wasDerivedFrom'], l: ['gen'], see: [['provenance', 'Example 8']] },
  { t: 'Relations and causal chains', d: 'Relate knowledge items with directed relations such as causes or validates, or undirected ones such as correlated with.', terms: ['semts:DirectedKnowledgeRelation', 'semts:UndirectedKnowledgeRelation', 'semts:SegmentRelation'], l: ['cls'], see: [['relations', 'Example 5']] },
  { t: 'Analysis workflows', d: 'Describe methods, trained models, comparison measures and reasoning steps, linked to ML-Schema implementations.', terms: ['semts:KnowledgeGenerationMethod', 'semts:ModelInstance', 'semts:Algorithm'], l: ['gen', 'cls'], see: [['quality', 'Example 6']] },
  { t: 'Interoperability and extension', d: 'Reuse DCAT, OWL-Time, PROV-O, QUDT and ML-Schema, and add domain vocabularies without changing the core.', terms: ['semts:TimeSeriesSegment', 'semts:KnowledgeConcept'], l: ['cls', 'dat'], see: [['@vocabularies', 'Vocabularies']] },
];

const EXAMPLES = [
  { slug: 'segments', file: '01', title: 'Segments, nesting and Allen relations', layers: ['dat'], pic: 'segments',
    sum: 'A run is a segment, and so is every interval or point inside it. <code>isPartOf</code> nests them, and an Allen relation such as <code>before</code> is backed by the matching OWL-Time relation between the indexes. The raw data stays in a CSV file referenced through DCAT.' },
  { slug: 'segment-knowledge', file: '02', title: 'Knowledge on individual segments', layers: ['dat', 'cls', 'gen'], pic: 'segmentKnowledge', deps: 'segments',
    sum: 'The same knowledge item is linked from S1 and from S2 with <code>segmentKnowledge</code>: “rising trend” holds for each of them on its own. A second, more specific value uses a concept from the feature extension.',
    sparql: `PREFIX semts:    <https://w3id.org/semts/ontology#>
PREFIX semts-dv: <https://w3id.org/semts/vocabulary/data-knowledge#>
PREFIX skos:     <http://www.w3.org/2004/02/skos/core#>

# Segments with any trend characteristic, including concrete features such as LinearSlope
SELECT ?segment ?concept ?value WHERE {
  ?segment semts:segmentKnowledge ?k .
  ?k semts:knowledgeConcept ?concept ;
     semts:hasValue/semts:valueString ?value .
  ?concept skos:broader* semts-dv:TrendProperty .
}` },
  { slug: 'multi-segment', file: '03', title: 'Knowledge about a set of segments', layers: ['dat', 'cls', 'gen'], pic: 'multiSegment',
    sum: 'Similarity is only meaningful for the pair. <code>multiSegmentKnowledge</code> links both heartbeats to one segment relation. A link from a single segment would be rejected. The indexes use sample numbers instead of timestamps.',
    sparql: `PREFIX semts:    <https://w3id.org/semts/ontology#>
PREFIX semts-dv: <https://w3id.org/semts/vocabulary/data-knowledge#>
PREFIX xsd:      <http://www.w3.org/2001/XMLSchema#>

# Pairs of segments that are more similar than 0.8
SELECT ?a ?b ?similarity WHERE {
  ?a semts:multiSegmentKnowledge ?k .
  ?b semts:multiSegmentKnowledge ?k .
  FILTER (STR(?a) < STR(?b))
  ?k semts:knowledgeConcept semts-dv:Similarity ;
     semts:hasValue/semts:valueString ?v .
  BIND (xsd:decimal(?v) AS ?similarity)
  FILTER (?similarity > 0.8)
}` },
  { slug: 'knowledge-groups', file: '04', title: 'Nested knowledge groups', layers: ['dat', 'cls', 'gen'], pic: 'groups',
    sum: 'A clustering is a group of clusters, and each cluster groups the class assignments of its members. Membership holds per day, while the medoid is a relation that only makes sense for the members together.' },
  { slug: 'relations', file: '05', title: 'Causal chains and other relations', layers: ['cls', 'gen'], pic: 'relations', deps: 'segments',
    sum: 'Directed relations chain knowledge from source to target: a temperature rise influences an anomaly, and the anomaly causes downtime. An undirected relation records that the downtime co-occurred with a shift change.',
    sparql: `PREFIX semts: <https://w3id.org/semts/ontology#>

# Walk every directed relation and show its meaning
SELECT ?source ?relation ?target WHERE {
  ?r a semts:DirectedKnowledgeRelation ;
     semts:knowledgeConcept ?relation ;
     semts:knowledgeRelationSource ?source ;
     semts:knowledgeRelationTarget ?target .
}` },
  { slug: 'quality', file: '06', title: 'Quality measures, model reuse and method knowledge', layers: ['cls', 'gen', 'dat'], pic: 'quality', deps: 'segments',
    sum: 'A classification carries a confidence value. The trained model is knowledge as well: stored outside the graph as a referenced value with a DCAT distribution, scored with its F1, and reused as input knowledge by the classification run. Model selection then records what worked as method knowledge, an algorithm recommendation classified with the MLSO taxonomy.',
    sparql: `PREFIX semts:    <https://w3id.org/semts/ontology#>
PREFIX semts-qv: <https://w3id.org/semts/vocabulary/quality-measure#>
PREFIX xsd:      <http://www.w3.org/2001/XMLSchema#>

# Predictions with a confidence of at least 0.9
SELECT ?segment ?prediction ?label ?confidence WHERE {
  ?segment semts:segmentKnowledge ?prediction .
  ?prediction a semts:SegmentPrediction ;
      semts:hasValue/semts:valueString ?label ;
      semts:knowledgeQualityMeasure ?q .
  ?q semts:qualityMeasureConcept semts-qv:Confidence ;
     semts:hasValue/semts:valueString ?c .
  BIND (xsd:decimal(?c) AS ?confidence)
  FILTER (?confidence >= 0.9)
}` },
  { slug: 'common-context', file: '07', title: 'Common context knowledge', layers: ['cls', 'gen'], pic: 'commonContext', deps: 'segments', isNew: true,
    sum: 'The default temperature from the machine handbook matters when reading S1 and S2, but it says nothing about these segments. Common context knowledge carries it, and the shapes reject linking it with <code>segmentKnowledge</code>.' },
  { slug: 'provenance', file: '08', title: 'Provenance across three analyses', layers: ['gen', 'cls'], pic: 'provenance', deps: 'segments',
    sum: 'Feature extraction finds a noise peak, a classifier turns it into “bearing wear”, and an engineer confirms the wear-out phase. Each run uses the previous output, and the query walks the chain back from the confirmation.',
    sparql: `PREFIX semts: <https://w3id.org/semts/ontology#>
PREFIX ex:    <https://example.org/line2/>

# Every knowledge item the confirmed wear state was derived from, with the step that produced it
SELECT ?knowledge ?value ?step ?method WHERE {
  ex:wearOut (semts:knowledgeGenerationEntity/semts:used/semts:inputKnowledge)* ?knowledge .
  ?knowledge semts:hasValue/semts:valueString ?value ;
             semts:knowledgeGenerationEntity ?step .
  ?step semts:knowledgeGenerationConcept ?method .
}` },
  { slug: 'forecast', file: '09', title: 'Forecasts on artificial segments', layers: ['dat', 'cls', 'gen'], pic: 'forecast', deps: 'knowledge-groups',
    sum: 'The forecast horizon has no ground truth yet, so it is an artificial segment that meets the last observed day. The forecast and its 90 % interval are stored as files and scored with MASE from a backtest.' },
];

const APPS = [
  { t: 'Memory and context for AI agents', d: 'Agents retrieve what is known about a segment before they analyse it: earlier results, expert facts and assumptions, and the methods that worked. What they find is written back as knowledge with its generation entity, inputs and quality measure, and the SHACL shapes check it on the way in. Other agents and people can then inspect, confirm and reuse it, so the graph becomes the shared memory of an agentic workflow.', terms: ['semts:KnowledgeGenerationEntity', 'semts:inputKnowledge', 'semts:MethodKnowledge', 'semts:knowledgeQualityMeasure'], ex: ['provenance', 'quality'] },
  { t: 'Automated reports in natural language', d: 'A language model queries the graph and writes the report on a time series: the findings of each analysis, the expert knowledge that frames them, how reliable they are, and charts of the segments concerned. Each sentence can cite the knowledge item it comes from, so readers can check it, and the report is written again when the graph changes.', terms: ['semts:segmentKnowledge', 'semts:ScenarioKnowledge', 'semts:knowledgeQualityMeasure', 'semts:knowledgeGenerationEntity'], ex: ['provenance', 'forecast'] },
  { t: 'Starting from what experts know', d: 'Initial assumptions, known facts, operating limits and observations from domain experts are recorded before any analysis runs, as scenario or common context knowledge with the expert annotation as their source. Analyses and agents use them as input knowledge, and later results can confirm or contradict them.', terms: ['semts:ScenarioKnowledge', 'semts:CommonContextKnowledge', 'semts-gv:ExpertAnnotation', 'semts:DirectedKnowledgeRelation'], ex: ['common-context', 'relations'] },
  { t: 'Condition monitoring and maintenance', d: 'Features, classifications and expert confirmations about the same interval stay linked to that interval and to each other. A maintenance team can see why a wear state was assigned and who confirmed it.', terms: ['semts:SegmentPrediction', 'semts:ScenarioKnowledge', 'semts-sv:WearState', 'semts-msv:MachineDowntime'], ex: ['provenance', 'relations'] },
  { t: 'Reusing analysis results', d: 'Before computing a feature or training a model, query the graph for knowledge that already exists for the segment. Results become inputs to later analyses instead of being computed again.', terms: ['semts:segmentKnowledge', 'semts:inputKnowledge', 'semts:ModelInstance'], ex: ['quality', 'segment-knowledge'] },
  { t: 'Expert-in-the-loop labelling', d: 'Annotations, confirmations and rejections are scenario knowledge with their own provenance. Relations such as validates, contradicts or supersedes keep the history of a label.', terms: ['semts-sv:Annotation', 'semts-sv:Validates', 'semts-sv:Supersedes', 'semts:KnowledgeReasoning'], ex: ['provenance'] },
  { t: 'Traceable analytics', d: 'Each knowledge item points to one generation activity with its inputs and outputs, and methods can link to their ML-Schema implementation. Quality measures record how far to trust a result.', terms: ['semts:KnowledgeGenerationEntity', 'semts:wasDerivedFrom', 'semts:KnowledgeQualityMeasure'], ex: ['quality', 'provenance'] },
  { t: 'Cross-series and causal analysis', d: 'Similarities, correlations and causal influences between segments of different series are knowledge of their own, so they can be queried, chained and scored like any other result.', terms: ['semts:SegmentRelation', 'semts:DirectedKnowledgeRelation', 'semts-dv:CausalGraph'], ex: ['multi-segment', 'relations'] },
  { t: 'Forecasting and planning', d: 'Forecast horizons are artificial segments with their own index, so forecasts, intervals and later observations line up on the same time axis.', terms: ['semts:ArtificialTimeSeriesSegment', 'semts-dv:Forecast', 'semts-dv:PredictionInterval'], ex: ['forecast'] },
  { t: 'Pattern discovery', d: 'Clusters, motifs and shapelets are groups and representatives over segments, so a discovered pattern keeps its members and can be compared with new data.', terms: ['semts:KnowledgeGroup', 'semts-dv:Motif', 'semts-dv:Shapelet'], ex: ['knowledge-groups'] },
  { t: 'Findable time-series data', d: 'Segments are DCAT datasets with distributions, units come from QUDT and every term has a permanent IRI, so segment catalogues fit into existing data portals.', terms: ['semts:TimeSeriesSegment', 'semts:DataDimension', 'semts:hasUnit'], ex: ['segments'] },
];


const SNIPPETS = {
  'gs-segment': ['ttl', `@prefix semts: <https://w3id.org/semts/ontology#> .
@prefix dcat:  <http://www.w3.org/ns/dcat#> .
@prefix time:  <http://www.w3.org/2006/time#> .
@prefix unit:  <http://qudt.org/vocab/unit/> .
@prefix xsd:   <http://www.w3.org/2001/XMLSchema#> .
@prefix ex:    <https://example.org/line2/> .

ex:S1 a semts:TimeSeriesSegment ;
    semts:segmentIndex [ a time:Interval ;
        time:hasBeginning [ a time:Instant ; time:inXSDDateTimeStamp "2026-03-02T08:10:00Z"^^xsd:dateTimeStamp ] ;
        time:hasEnd       [ a time:Instant ; time:inXSDDateTimeStamp "2026-03-02T08:30:00Z"^^xsd:dateTimeStamp ] ] ;
    semts:segmentDimension ex:spindleTemp ;
    dcat:distribution ex:run42-csv .

ex:spindleTemp a semts:DataDimension ; semts:hasUnit unit:DEG_C .
ex:run42-csv a dcat:Distribution ; dcat:downloadURL <https://data.example.org/line2/run42.csv> .`],
  'gs-knowledge': ['ttl', `@prefix semts-dv: <https://w3id.org/semts/vocabulary/data-knowledge#> .

ex:S1 semts:segmentKnowledge ex:risingTrend .

ex:risingTrend a semts:SegmentDataCharacteristic ;
    semts:knowledgeConcept semts-dv:TrendProperty ;
    semts:hasValue [ a semts:EmbeddedValue ; semts:valueString "rising" ] ;
    semts:knowledgeGenerationEntity ex:trendRun .`],
  'gs-provenance': ['ttl', `@prefix semts-gv: <https://w3id.org/semts/vocabulary/knowledge-generation#> .

ex:trendRun a semts:KnowledgeGenerationMethod ;
    semts:knowledgeGenerationConcept semts-gv:TemporalFeatureExtraction ;
    semts:used ex:trendRun-in ;
    semts:generated ex:trendRun-out .

ex:trendRun-in a semts:KnowledgeGenerationInput ;
    semts:inputDataReference ex:S1 .

ex:trendRun-out a semts:KnowledgeGenerationOutput ;
    semts:outputKnowledge ex:risingTrend ;
    semts:wasDerivedFrom ex:trendRun-in .`],
  'gs-validate': ['py', `# pip install pyshacl   (paths are relative to a clone of the repository)
from pathlib import Path
from rdflib import Graph
from pyshacl import validate

data = Graph().parse("my-segments.ttl")

# load the ontology and all vocabularies together with the data,
# so that subclasses and concept types are known to the validator
data.parse("ontology/current/ontology.ttl")
for f in sorted(Path("vocabularies").glob("vocab_*.ttl")):
    data.parse(f)

shapes = Graph().parse("evaluation/instance_validation/shacl_shapes.ttl")
conforms, _, report = validate(data, shacl_graph=shapes, advanced=True)
print(report)

# or, from the repository root:  python tools/validate.py my-segments.ttl`],
  'gs-query': ['ttl', `PREFIX semts:    <https://w3id.org/semts/ontology#>
PREFIX semts-dv: <https://w3id.org/semts/vocabulary/data-knowledge#>
PREFIX skos:     <http://www.w3.org/2004/02/skos/core#>

# Load the vocabularies into the store for skos:broader to resolve
SELECT ?segment ?concept ?value WHERE {
  ?segment semts:segmentKnowledge ?k .
  ?k semts:knowledgeConcept ?concept ;
     semts:hasValue/semts:valueString ?value .
  ?concept skos:broader* semts-dv:TrendProperty .
}`],
  'extension-template': ['ttl', `# A hypothetical energy module, following the manufacturing pattern
@prefix semts:     <https://w3id.org/semts/ontology#> .
@prefix semts-sv:  <https://w3id.org/semts/vocabulary/scenario-knowledge#> .
@prefix semts-esv: <https://w3id.org/semts/vocabulary/scenario-knowledge/energy#> .
@prefix skos: <http://www.w3.org/2004/02/skos/core#> .
@prefix owl:  <http://www.w3.org/2002/07/owl#> .
@prefix dct:  <http://purl.org/dc/terms/> .

<https://w3id.org/semts/vocabulary/scenario-knowledge/energy> a owl:Ontology, skos:ConceptScheme ;
    dct:title "SemTS Energy Scenario Knowledge Extension"@en ;
    dct:isPartOf <https://w3id.org/semts/vocabulary/scenario-knowledge> ;
    owl:imports <https://w3id.org/semts/vocabulary/scenario-knowledge> ;
    skos:hasTopConcept semts-esv:EnergyScenarioKnowledge .

semts-esv:EnergyScenarioKnowledge a skos:Concept, semts:KnowledgeConcept ;
    skos:broader semts-sv:ScenarioKnowledge ;
    skos:inScheme <https://w3id.org/semts/vocabulary/scenario-knowledge/energy> ;
    skos:prefLabel "Energy Scenario Knowledge"@en ;
    skos:definition "Organizing concept for scenario knowledge that is specific to energy systems."@en ;
    skos:topConceptOf <https://w3id.org/semts/vocabulary/scenario-knowledge/energy> .

# Narrower than the core concept Power Outage: it fixes where the power comes from
semts-esv:GridOutage a skos:Concept, semts:KnowledgeConcept ;
    skos:broader semts-sv:PowerOutage, semts-esv:EnergyScenarioKnowledge ;
    skos:inScheme <https://w3id.org/semts/vocabulary/scenario-knowledge/energy> ;
    skos:prefLabel "Grid Outage"@en ;
    skos:definition "Unavailability of the electricity supply from the public grid."@en .`],
};

const HERO_CAP = {
  trend: `ex:S1 semts:segmentKnowledge ex:trend .
ex:trend a semts:SegmentDataCharacteristic ; semts:knowledgeConcept semts-dv:TrendProperty .`,
  similarity: `ex:S3 semts:multiSegmentKnowledge ex:sim .   ex:S4 semts:multiSegmentKnowledge ex:sim .
ex:sim a semts:SegmentRelation ; semts:knowledgeConcept semts-dv:Similarity .`,
  anomaly: `ex:P7 semts:segmentKnowledge ex:anomaly .
ex:anomaly a semts:SegmentPrediction ; semts:knowledgeConcept semts-dv:Anomaly .`,
  validation: `ex:validation a semts:KnowledgeReasoning ; semts:knowledgeGenerationConcept semts-gv:ExpertValidation ;
    semts:used ex:validation-in .   ex:validation-in semts:inputKnowledge ex:anomaly .`,
  wearout: `ex:S5 semts:segmentKnowledge ex:wearOut .
ex:wearOut a semts:ScenarioKnowledge ; semts:knowledgeConcept semts-sv:WearState ; semts:knowledgeGenerationEntity ex:validation .`,
};

/* ------------------------------------------------------------------ shared renderers */
function renderTermLists(root = document) {
  $$('[data-terms]', root).forEach(ul => {
    ul.innerHTML = ul.dataset.terms.split(' ').map(t => `<li>${termChip(t)}</li>`).join('');
  });
}
function renderCaps() {
  $('#caps').innerHTML = CAPS.map(c => {
    const c1 = LAYER[c.l[0]][0], c2 = LAYER[c.l[1] || c.l[0]][0];
    return `<div class="cap"><span class="bar" style="--c1:${c1};--c2:${c2}" title="${c.l.map(l => LAYER[l][2]).join(' and ')}"></span>
      <div><h3>${esc(c.t)}</h3><p>${esc(c.d)}</p></div>
      <ul class="termlist" style="--c:var(--ink);">${c.terms.map(t => `<li>${termChip(t)}</li>`).join('')}</ul>
      <div class="see">${c.see.map(([s, l]) => `<a href="#${s.startsWith('@') ? s.slice(1) : 'ex-' + s}">${l}</a>`).join('<br>')}</div></div>`;
  }).join('');
}
function renderApps() {
  $$('[data-apps]').forEach(el => {
    const list = el.dataset.apps === 'all' ? APPS : APPS.slice(0, +el.dataset.apps);
    el.innerHTML = list.map(a => `<div class="app"><h3>${esc(a.t)}</h3><p>${esc(a.d)}</p>
      <div class="uses termlist">${a.terms.map(t => termChip(t)).join('')}</div>
      <p class="small" style="margin:10px 0 0">${a.ex.map(s => { const e = EXAMPLES.find(x => x.slug === s); return `<a href="#ex-${s}">${esc(e.title)}</a>`; }).join(' and ')}</p></div>`).join('');
  });
}
const BIBTEX = `@inproceedings{grass2026semts,
  author    = {Gra{\\ss}, Alexander and Deshmukh, Rohit A. and Lange, Christoph and
               Collarana, Diego and Beecks, Christian and Decker, Stefan},
  title     = {{SemTS}: Ontology and Vocabularies for the Semantic Categorization
               of Time Series Knowledge},
  booktitle = {The Semantic Web -- 23rd European Semantic Web Conference,
               {ESWC} 2026, Proceedings, Part {II}},
  series    = {Lecture Notes in Computer Science},
  volume    = {16550},
  pages     = {172--190},
  publisher = {Springer, Cham},
  year      = {2026},
  doi       = {10.1007/978-3-032-25159-6_10}
}`;
function renderCite() {
  $$('[data-cite]').forEach(el => {
    el.innerHTML = `<p>${esc(ONTO.meta.citation).replace(/(https:\/\/doi\.org\/\S+)/, '<a href="$1">$1</a>')}</p>`;
    if (el.dataset.cite === 'short') {
      const b = document.createElement('button'); b.className = 'btn btn-secondary btn-small'; b.type = 'button'; b.textContent = 'Copy BibTeX';
      b.addEventListener('click', () => copyText(BIBTEX)); el.appendChild(b);
    } else el.appendChild(codeBox([{ label: 'BibTeX', code: BIBTEX, lang: 'bib' }], { short: true }));
  });
}
function renderSnippets(root = document) {
  $$('[data-code]', root).forEach(el => {
    if (el.dataset.done) return; el.dataset.done = 1;
    const [lang, code] = SNIPPETS[el.dataset.code];
    el.appendChild(codeBox([{ label: { ttl: 'Turtle', py: 'Python', js: 'JavaScript' }[lang], code, lang }], { short: true }));
  });
  $$('[data-code="gs-query"] [role="tab"]').forEach(b => { b.textContent = 'SPARQL'; });
}

/* ------------------------------------------------------------------ hero */
function initHero() {
  const box = $('#hero-svg');
  box.innerHTML = PIC.hero();
  const svg = $('svg', box);
  if (!matchMedia('(prefers-reduced-motion: reduce)').matches) svg.classList.add('anim');
  const cap = $('#hero-cap'); const def = cap.innerHTML;
  const show = key => { cap.innerHTML = `<code>${hlRDF(HERO_CAP[key])}</code>`; };
  $$('.chip-g', svg).forEach(g => {
    const key = g.dataset.cap;
    g.addEventListener('mouseenter', () => show(key));
    g.addEventListener('focus', () => show(key));
    g.addEventListener('click', () => show(key));
    g.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); show(key); } });
  });
  svg.addEventListener('mouseleave', () => { if (!svg.contains(document.activeElement)) cap.innerHTML = def; });
}

/* ------------------------------------------------------------------ architecture */
let archSel = null;
function initArch() {
  $('#arch').innerHTML = ARCH.render();
  const svg = $('#arch svg');
  const pick = id => selectArch(id, true);
  $$('.node', svg).forEach(n => {
    n.addEventListener('click', () => pick(n.dataset.id));
    n.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); pick(n.dataset.id); } });
  });
  $$('.edge[data-id]:not([data-id=""])', svg).forEach(n => {
    n.addEventListener('click', () => pick(n.dataset.id));
    n.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); pick(n.dataset.id); } });
  });
  $('#arch-reset').addEventListener('click', () => { selectArch(null); history.replaceState(null, '', '#ontology'); });
  $('#arch-new').addEventListener('click', e => {
    const on = e.currentTarget.getAttribute('aria-pressed') !== 'true';
    e.currentTarget.setAttribute('aria-pressed', on);
    svg.classList.toggle('dim', on);
    $$('[data-new]', svg).forEach(x => x.classList.toggle('hl', on));
  });
  $('#arch-copy').addEventListener('click', () => copyText(standaloneSVG()));
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && archSel) { selectArch(null); history.replaceState(null, '', '#ontology'); } });
  const allen = Object.values(ONTO.props).filter(p => p.owlTime.length).length;
  $('#arch-summary').innerHTML = `<span><strong>${Object.values(ONTO.classes).filter(c => !c.external).length}</strong> SemTS classes, plus classes reused from DCAT, OWL-Time, PROV-O, QUDT, ML-Schema and SKOS</span><span><strong>${Object.keys(ONTO.props).length}</strong> properties, ${allen} of them Allen interval relations</span><span><strong>${ONTO.shapes.length}</strong> SHACL node shapes</span>`;
  selectArch(null);
}
function standaloneSVG() {
  const svg = $('#arch svg').cloneNode(true);
  $$('.sel, .hl', svg).forEach(x => x.classList.remove('sel', 'hl'));
  svg.classList.remove('dim');
  return '<?xml version="1.0" encoding="UTF-8"?>\n' + svg.outerHTML;
}
function shapesFor(curie) {
  return ONTO.shapes.filter(s => s.targets.some(t => t === curie || t.endsWith(' ' + curie)));
}
function examplesUsing(curie) {
  const l = local(curie);
  const re = new RegExp('(semts|dcat):' + l + '\\b');
  return EXAMPLES.filter(e => re.test(EXTTL[e.file]));
}
function selectArch(id, fromClick) {
  const svg = $('#arch svg'); if (!svg) return;
  $$('.sel', svg).forEach(x => x.classList.remove('sel'));
  const panel = $('#arch-detail');
  archSel = id;
  if (!id) { panel.hidden = true; return; }
  panel.hidden = false;
  const el = $(`[data-id="${CSS.escape(id)}"]`, svg);
  if (el) { const r = el.getBoundingClientRect(); panel.classList.toggle('left', r.left + r.width / 2 > window.innerWidth * 0.55); }
  $$(`[data-id="${CSS.escape(id)}"]`, svg).forEach(x => x.classList.add('sel'));
  if (fromClick) {
    const h = hrefFor(id);
    if (h) history.replaceState(null, '', h);
  }
  const c = ONTO.classes[id], p = ONTO.props[id], ext = ARCH.info[id];
  let h = '';
  const list = arr => arr && arr.length ? `<ul class="termlist">${arr.map(x => `<li>${termChip(x.split(' ')[0]).replace('<a class="term"', '<a class="term"')}</li>`).join('')}</ul>` : '<span class="empty">None</span>';
  const exs = examplesUsing(id);
  if (c) {
    h += `<h3>${esc(c.label || local(id))}${ARCH.nodes.find(n => n.id === id && n.isNew) ? ' <span class="badge-new">new in 1.3</span>' : ''}</h3><div class="iri">${esc(c.iri)}</div>`;
    h += `<p style="font-size:15px">${esc(c.comment || '')}</p><dl>`;
    h += `<dt>Subclass of</dt><dd>${list(c.super)}</dd>`;
    if (c.sub.length) h += `<dt>Subclasses</dt><dd>${list(c.sub)}</dd>`;
    if (c.axioms.length) h += `<dt>Axioms</dt><dd><ul class="msgs">${c.axioms.map(a => `<li>${exprHTML(a)}</li>`).join('')}</ul></dd>`;
    if (c.equivalent.length) h += `<dt>Equivalent to</dt><dd>${c.equivalent.map(e => exprHTML(e)).join(', ')}</dd>`;
    if (c.disjoint.length) h += `<dt>Disjoint with</dt><dd>${list(c.disjoint)}</dd>`;
    if (c.props.length) h += `<dt>Properties with this domain</dt><dd>${list(c.props)}</dd>`;
    if (c.incoming.length) h += `<dt>Range of</dt><dd>${list(c.incoming)}</dd>`;
  } else if (p) {
    const chars = [p.kind.replace('Property', ' property'), ...p.characteristics.map(x => x.replace(/([a-z])([A-Z])/, '$1 $2').toLowerCase()), p.chain.length && 'property chain'].filter(Boolean).join(', ');
    h += `<h3>${esc(p.label || local(id))}</h3><div class="iri">${esc(p.iri)}</div><p style="font-size:15px">${esc(p.comment || '')}</p><dl>`;
    h += `<dt>Kind</dt><dd>${esc(chars)}</dd>`;
    h += `<dt>Domain</dt><dd>${p.domain.length ? p.domain.map(d => exprHTML(d)).join(' ') : '<span class="empty">Not declared</span>'}</dd>`;
    h += `<dt>Range</dt><dd>${p.range.length ? p.range.map(d => exprHTML(d)).join(' ') : '<span class="empty">Not declared</span>'}</dd>`;
    if (p.chain.length) h += `<dt>Property chain</dt><dd>${p.chain.map(e => exprHTML(e)).join('<br>')}</dd>`;
    const subs = p.sub.filter(x => !/topObjectProperty|topDataProperty/.test(x));
    if (subs.length) h += `<dt>Subproperty of</dt><dd>${subs.map(x => termChip(x)).join(' ')}</dd>`;
    if (p.inverse.length) h += `<dt>Inverse of</dt><dd>${list(p.inverse)}</dd>`;
    if (p.owlTime.length) h += `<dt>OWL-Time relation</dt><dd><code>${esc(p.owlTime[0])}</code></dd>`;
    if (p.disjoint.length) h += `<dt>Disjoint with</dt><dd>${list(p.disjoint)}</dd>`;
  } else if (ext) {
    h += `<h3>${esc(ext.label)}</h3><div class="iri">${esc(ext.iri)}</div><p style="font-size:15px">${esc(ext.comment)}</p><p><a href="${ext.href}">Specification</a></p><dl>`;
  } else {
    h += `<h3>${esc(id)}</h3><dl>`;
  }
  const sh = shapesFor(id);
  if (sh.length) h += `<dt>Checked by</dt><dd><ul class="msgs">${sh.flatMap(s => s.messages.slice(0, 6).map(m => `<li>${esc(m)}</li>`)).join('')}</ul></dd>`;
  if (exs.length) h += `<dt>Used in examples</dt><dd>${exs.map(e => `<a href="#ex-${e.slug}">${esc(e.title)}</a>`).join('<br>')}</dd>`;
  if (c || p) h += `<dt>Specification</dt><dd><a href="#term-${esc(local(id))}">Full entry</a></dd>`;
  h += '</dl>';
  panel.innerHTML = '<button class="close" type="button" aria-label="Close details">Close</button>' + h;
  $('.close', panel).addEventListener('click', () => { selectArch(null); history.replaceState(null, '', '#ontology'); });
}

/* ------------------------------------------------------------------ vocabularies */
const MOD_META = {
  dv: { name: 'Data knowledge', serves: 'Characteristics, predictions, segment relations and models' },
  dfx: { name: 'Feature catalogue', serves: 'Concrete features, aligned with the tsfresh feature calculators' },
  sv: { name: 'Scenario knowledge', serves: 'Annotations, events, parameters, context and relation meanings' },
  msv: { name: 'Manufacturing', serves: 'A few terms that are specific to manufacturing' },
  gv: { name: 'Knowledge generation', serves: 'Methods, comparisons, reasoning and human processes, and method knowledge: what worked, with which settings' },
  qv: { name: 'Quality measures', serves: 'Quality dimensions, relational measures and metrics' },
};
const scheme = k => VOCAB.schemes.find(s => s.key === k);
const parentOf = s => { const p = VOCAB.schemes.find(x => s.isPartOf.includes(x.iri)); return p ? p.key : null; };
function renderVmap() {
  $$('[data-vmap]').forEach(el => {
    const cores = ['dv', 'sv', 'gv', 'qv'].filter(k => scheme(k));
    const mlst = k => Object.values(VOCAB.concepts).filter(c => c.scheme === k && [...(c.exactMatch || []), ...(c.closeMatch || [])].some(x => x.startsWith('mlst:'))).length;
    let h = `<div class="onto"><h3>SemTS ontology ${esc(ONTO.meta.version)}</h3><span class="muted small">Classes point to concepts with <code>knowledgeConcept</code>, <code>knowledgeGenerationConcept</code> and <code>qualityMeasureConcept</code></span></div>`;
    cores.forEach(k => {
      const s = scheme(k);
      h += `<div class="vcol"><div class="stem"></div>${modBtn(s, 'core')}`;
      VOCAB.schemes.filter(x => parentOf(x) === k).forEach(x => {
        const included = s.imports.includes(x.iri);
        h += `<div class="vlink${included ? ' default' : ''}">${included ? 'imported by the core, always included' : 'imports the core, opt-in'}</div>${modBtn(x, 'ext')}`;
      });
      if (k === 'dv') h += `<div class="vlink">room for further catalogues</div><div class="vmod slot"><h4>Another feature catalogue</h4><div class="meta">For example features of a specific library</div></div>`;
      if (k === 'sv') h += `<div class="vlink">room for further domains</div><div class="vmod slot"><h4>Your domain module</h4><div class="meta">Energy, health, mobility and others</div></div>`;
      if (k === 'gv') h += `<div class="vlink">${mlst('gv')} concepts mapped</div><div class="vmod external"><h4>MLST taxonomies</h4><div class="meta">ML task types and learning methods, referenced, not copied</div></div>`;
      if (k === 'qv') h += `<div class="vlink">${mlst('qv')} concepts mapped</div><div class="vmod external"><h4>MLST evaluation measures</h4><div class="meta">Specialised metrics are referenced from MLST</div></div>`;
      h += '</div>';
    });
    el.innerHTML = h;
    $$('.vmod[data-mod]', el).forEach(b => b.addEventListener('click', () => openModule(b.dataset.mod)));
  });
}
function modBtn(s, kind) {
  const m = MOD_META[s.key];
  return `<button class="vmod ${kind}" data-mod="${s.key}" type="button"><h4>${esc(m.name)}</h4><div class="pfx">${esc(s.prefix)}</div><div class="serves">${esc(m.serves)}</div><div class="meta">${kind === 'ext' ? 'Example extension, ' : ''}${s.count} concepts, version ${esc(s.version)}</div></button>`;
}
function openModule(k) {
  vb.mod = k; vb.query = ''; const inp = $('#vb-q'); if (inp) inp.value = '';
  const s = scheme(k); vb.sel = s.top[0];
  if (location.hash !== '#vocabularies') location.hash = 'vocabularies';
  renderVB(); setTimeout(() => $('#browser').scrollIntoView({ behavior: 'smooth' }), 30);
}

const vb = { mod: 'dv', ext: true, sel: 'semts-dv:DataKnowledge', query: '', open: new Set() };
function children(id, mod) {
  const c = VOCAB.concepts[id]; if (!c || !c.narrower) return [];
  return c.narrower.filter(n => {
    const nc = VOCAB.concepts[n]; if (!nc) return false;
    if (nc.scheme === mod) return true;
    const par = parentOf(scheme(nc.scheme));
    return vb.ext && par === mod;
  });
}
function ancestors(id, acc = new Set()) {
  const c = VOCAB.concepts[id]; if (!c) return acc;
  (c.broader || []).forEach(b => { if (!acc.has(b)) { acc.add(b); ancestors(b, acc); } });
  return acc;
}
function pathTo(id) {
  const out = []; let cur = id; const seen = new Set();
  while (cur && !seen.has(cur)) {
    seen.add(cur); out.unshift(cur);
    const c = VOCAB.concepts[cur]; if (!c || !c.broader) break;
    const b = c.broader.find(x => VOCAB.concepts[x] && !VOCAB.concepts[x].top && VOCAB.concepts[x].scheme !== c.scheme) || c.broader.find(x => !/DetailedTimeSeriesFeature|ManufacturingScenarioKnowledge/.test(x)) || c.broader[0];
    cur = b;
  }
  return out;
}
function badge(c) {
  let s = '';
  if (c.scheme !== vb.mod && (c.scheme === 'dfx' || c.scheme === 'msv')) s += `<span class="mini ext">${c.scheme}</span>`;
  return s;
}
function treeHTML(id, mod, depth, seen) {
  const c = VOCAB.concepts[id]; if (!c || seen.has(id)) return '';
  seen = new Set(seen); seen.add(id);
  let kids = children(id, mod);
  const isOpen = vb.open.has(id);
  let h = `<li><div class="row"><button class="tw" type="button" data-tw="${id}" ${kids.length ? `aria-expanded="${isOpen}" aria-label="${isOpen ? 'Collapse' : 'Expand'} ${esc(c.label)}"` : 'disabled aria-hidden="true"'}>${kids.length ? (isOpen ? '▾' : '▸') : ''}</button><button class="lab" type="button" data-c="${id}" aria-current="${vb.sel === id}">${esc(c.label)}${badge(c)}</button></div>`;
  if (kids.length && isOpen) {
    if (id === 'semts-dfx:DetailedTimeSeriesFeature') {
      const groups = {};
      kids.forEach(k => { const fam = (VOCAB.concepts[k].broader || []).find(b => b !== id) || ''; (groups[fam] = groups[fam] || []).push(k); });
      h += '<ul>' + Object.keys(groups).sort((a, b) => (VOCAB.concepts[a]?.label || '').localeCompare(VOCAB.concepts[b]?.label || '')).map(f => `<li class="grp">${esc(VOCAB.concepts[f]?.label || f)}</li>` + groups[f].map(k => treeHTML(k, mod, depth + 1, seen)).join('')).join('') + '</ul>';
    } else {
      h += '<ul>' + kids.map(k => treeHTML(k, mod, depth + 1, seen)).join('') + '</ul>';
    }
  }
  return h + '</li>';
}
function initVB() {
  const el = $('#vb');
  const mods = VOCAB.schemes.map(s => `<button type="button" data-m="${s.key}" aria-pressed="${s.key === vb.mod}">${esc(MOD_META[s.key].name)}</button>`).join('');
  el.innerHTML = `<div class="vb-side"><div class="vb-search"><input type="search" id="vb-q" placeholder="Search ${Object.keys(VOCAB.concepts).length} concepts" aria-label="Search concepts"></div>
    <div class="vb-mods" role="group" aria-label="Module">${mods}</div>
    <label class="vb-opts"><input type="checkbox" id="vb-ext" checked> Show extension terms in the core trees</label>
    <div class="tree" id="vb-tree"></div></div><div class="vb-main" id="vb-detail" aria-live="polite"></div>`;
  $$('.vb-mods button', el).forEach(b => b.addEventListener('click', () => { vb.mod = b.dataset.m; vb.query = ''; $('#vb-q').value = ''; vb.sel = scheme(vb.mod).top[0]; renderVB(); }));
  $('#vb-ext').addEventListener('change', e => { vb.ext = e.target.checked; renderVB(); });
  $('#vb-q').addEventListener('input', e => { vb.query = e.target.value.trim(); renderTree(); });
  $('#vb-tree').addEventListener('click', e => {
    const tw = e.target.closest('[data-tw]'), lab = e.target.closest('[data-c]');
    if (tw && !tw.disabled) { const id = tw.dataset.tw; vb.open.has(id) ? vb.open.delete(id) : vb.open.add(id); renderTree(); $(`[data-tw="${CSS.escape(id)}"]`)?.focus(); }
    else if (lab) selectConcept(lab.dataset.c, true);
  });
  $('#vb-detail').addEventListener('click', e => {
    const b = e.target.closest('[data-c]'); if (b) { e.preventDefault(); selectConcept(b.dataset.c, true); }
  });
  $$('#vpaths [data-mod]').forEach(b => b.addEventListener('click', () => openModule(b.dataset.mod)));
  $$('#vpaths [data-concept]').forEach(b => b.addEventListener('click', () => { selectConcept(b.dataset.concept, true); $('#browser').scrollIntoView({ behavior: 'smooth' }); }));
  // default open: root and first level
  VOCAB.schemes.forEach(s => s.top.forEach(t => vb.open.add(t)));
  renderVB();
}
function renderVB() {
  $$('.vb-mods button').forEach(b => b.setAttribute('aria-pressed', b.dataset.m === vb.mod));
  renderTree(); renderDetail();
}
function renderTree() {
  const t = $('#vb-tree'); if (!t) return;
  if (vb.query.length >= 2) {
    const q = vb.query.toLowerCase();
    const hits = Object.values(VOCAB.concepts).map(c => {
      const lab = (c.label || '').toLowerCase();
      let score = lab === q ? 0 : lab.startsWith(q) ? 1 : lab.includes(q) ? 2 : (c.alt || []).some(a => a.toLowerCase().includes(q)) ? 3 : c.id.toLowerCase().includes(q) ? 3 : (c.def || '').toLowerCase().includes(q) ? 4 : 9;
      return [score, c];
    }).filter(x => x[0] < 9).sort((a, b) => a[0] - b[0] || a[1].label.localeCompare(b[1].label)).slice(0, 80);
    t.innerHTML = hits.length ? `<ul class="results">${hits.map(([, c]) => `<li><button type="button" data-c="${c.id}" aria-current="${vb.sel === c.id}">${esc(c.label)}${badge(c)}<span class="rid">${esc(c.id)}</span></button></li>`).join('')}</ul>` : `<p class="muted small" style="padding:8px 10px">No concept matches “${esc(vb.query)}”. Try a shorter word or search in all modules by clearing the box.</p>`;
    return;
  }
  const s = scheme(vb.mod);
  t.innerHTML = '<ul>' + s.top.map(r => treeHTML(r, vb.mod, 0, new Set())).join('') + '</ul>';
}
function selectConcept(id, push) {
  if (!VOCAB || !VOCAB.concepts[id]) return;
  const c = VOCAB.concepts[id];
  vb.sel = id;
  // switch module if the concept is not visible in the current one
  const visibleIn = m => m === c.scheme || (vb.ext && parentOf(scheme(c.scheme)) === m);
  if (!visibleIn(vb.mod)) vb.mod = c.scheme;
  ancestors(id).forEach(a => vb.open.add(a));
  if (push) history.replaceState(null, '', hrefFor(id));
  vb.query = ''; const q = $('#vb-q'); if (q) q.value = '';
  renderVB();
  const cur = $('#vb-tree [aria-current="true"]'); if (cur) cur.scrollIntoView({ block: 'nearest' });
}
function cchip(id) {
  const c = VOCAB.concepts[id];
  if (!c) return `<span class="term" title="Not defined in any module">${esc(id)}</span>`;
  return `<button class="term" type="button" data-c="${id}" style="--c:var(--cls);--t:var(--cls-t)">${esc(c.label)}</button>`;
}
function extLink(x) {
  if (x.startsWith('mlst:')) { const u = 'http://w3id.org/mlso/vocab/' + x.slice(5); return `<a href="${esc(u)}">${esc(x)}</a>`; }
  if (/^https?:/.test(x)) return `<a href="${esc(x)}">${esc(x.replace(/^https?:\/\//, '').slice(0, 60))}…</a>`;
  return esc(x);
}
function renderDetail() {
  const el = $('#vb-detail'); if (!el) return;
  const c = VOCAB.concepts[vb.sel]; if (!c) { el.innerHTML = '<p class="muted">Select a concept.</p>'; return; }
  const s = scheme(c.scheme);
  const path = pathTo(c.id);
  let h = `<div class="crumbs">${path.slice(0, -1).map(p => `<button type="button" data-c="${p}">${esc(VOCAB.concepts[p]?.label || p)}</button><span aria-hidden="true">›</span>`).join('')}</div>`;
  h += `<h3>${esc(c.label)}</h3><div class="crumbs" style="margin-top:6px"><code style="background:none;padding:0;font-size:13px">${esc(c.id)}</code> <span class="pill-kind">${esc(MOD_META[c.scheme].name)}, ${esc(s.prefix)} ${esc(s.version)}</span> <button class="btn btn-secondary btn-small" type="button" id="copy-iri">Copy IRI</button></div>`;
  if (c.def) h += `<p style="font-size:17px; margin-top:14px; max-width:64ch">${esc(c.def)}</p>`;
  h += '<dl class="kv">';
  if (c.scope) h += `<dt>Scope note</dt><dd>${esc(c.scope)}</dd>`;
  if (c.alt) h += `<dt>Also called</dt><dd>${c.alt.map(esc).join(', ')}</dd>`;
  if (c.broader) h += `<dt>Broader</dt><dd class="termlist">${c.broader.map(cchip).join('')}</dd>`;
  if (c.narrower) h += `<dt>Narrower (${c.narrower.length})</dt><dd class="termlist">${c.narrower.slice(0, 40).map(cchip).join('')}${c.narrower.length > 40 ? `<span class="muted small">and ${c.narrower.length - 40} more in the tree</span>` : ''}</dd>`;
  if (c.related) h += `<dt>Related</dt><dd class="termlist">${c.related.map(cchip).join('')}</dd>`;
  const inbound = Object.values(VOCAB.concepts).filter(x => x.id !== c.id && ['related', 'relatedMatch', 'exactMatch', 'closeMatch'].some(k => (x[k] || []).includes(c.id)) && !(c.related || []).includes(x.id));
  if (inbound.length) h += `<dt>Referenced by</dt><dd class="termlist">${inbound.map(x => cchip(x.id)).join('')} <span class="muted small">${inbound.some(x => x.scheme !== c.scheme) ? 'from other modules' : ''}</span></dd>`;
  const maps = [['exactMatch', 'Exact match'], ['closeMatch', 'Close match'], ['relatedMatch', 'Related match']];
  maps.forEach(([k, l]) => { if (c[k]) h += `<dt>${l}</dt><dd class="termlist">${c[k].map(x => x.startsWith('semts-') ? cchip(x) : `<span>${extLink(x)}</span>`).join(' ')}</dd>`; });
  if (c.seeAlso) h += `<dt>See also</dt><dd>${c.seeAlso.map(x => x.includes('semts/ontology#') ? termChip('semts:' + x.split('#')[1]) : extLink(x)).join('<br>')}</dd>`;
  if (c.editorial) h += `<dt>Editorial note</dt><dd class="muted">${esc(c.editorial)}</dd>`;
  h += `<dt>IRI</dt><dd><code style="white-space:normal; word-break:break-all">${esc(c.iri)}</code></dd>`;
  h += '</dl><h4 style="margin: 20px 0 8px">Use it</h4><div id="vb-use"></div>';
  el.innerHTML = h;
  $('#copy-iri').addEventListener('click', () => copyText(c.iri));
  $('#vb-use').appendChild(codeBox([{ label: 'Turtle', code: usage(c), lang: 'ttl' }], { short: true }));
}
function usage(c) {
  const a = ancestors(c.id); a.add(c.id);
  const has = x => a.has(x);
  if (has('semts-gv:MethodKnowledge')) {
    const cls = c.id === 'semts-gv:AlgorithmRecommendation' ? 'semts:Algorithm' : c.id === 'semts-gv:HyperparameterRecommendation' ? 'semts:Hyperparameter' : 'semts:MethodKnowledge';
    const extra = cls === 'semts:Algorithm' ? '    mlso:hasAlgorithmType <http://w3id.org/mlso/vocab/ml_algorithm/XGBoost> ;\n' : cls === 'semts:Hyperparameter' ? '    semts:title "max_depth" ;\n' : '';
    return `ex:S1 semts:segmentKnowledge ex:k .\n\nex:k a ${cls} ;\n    semts:knowledgeConcept ${c.id} ;\n${extra}    semts:hasValue [ a semts:EmbeddedValue ; semts:valueString "…" ] ;\n    semts:knowledgeGenerationEntity ex:run .`;
  }
  if (c.scheme === 'gv') {
    const cls = has('semts-gv:ComparisonBasedGeneration') ? 'semts:KnowledgeComparisonMeasure' : has('semts-gv:ReasoningBasedGeneration') ? 'semts:KnowledgeReasoning' : has('semts-gv:MethodBasedGeneration') ? 'semts:KnowledgeGenerationMethod' : 'semts:KnowledgeGenerationEntity';
    return `ex:run a ${cls} ;\n    semts:knowledgeGenerationConcept ${c.id} ;\n    semts:used ex:run-in ;\n    semts:generated ex:run-out .`;
  }
  if (c.scheme === 'qv') return `ex:knowledge semts:knowledgeQualityMeasure ex:q .\n\nex:q a semts:KnowledgeQualityMeasure ;\n    semts:qualityMeasureConcept ${c.id} ;\n    semts:hasValue [ a semts:EmbeddedValue ; semts:valueString "0.9" ] .`;
  const directed = has('semts-sv:DirectedRelationship') || has('semts-dv:Causality') || has('semts-dv:ConditionRelation') || has('semts-dv:AssociationRule');
  const undirected = has('semts-sv:UndirectedRelationship');
  const gen = '    semts:knowledgeGenerationEntity ex:run .';
  if (directed) return `ex:r a semts:DirectedKnowledgeRelation ;\n    semts:knowledgeConcept ${c.id} ;\n    semts:knowledgeRelationSource ex:k1 ;\n    semts:knowledgeRelationTarget ex:k2 ;\n${gen}`;
  if (undirected) return `ex:r a semts:UndirectedKnowledgeRelation ;\n    semts:knowledgeConcept ${c.id} ;\n    semts:knowledgeRelationParticipant ex:k1, ex:k2 ;\n${gen}`;
  if (c.scheme === 'sv' || c.scheme === 'msv') return `ex:S1 semts:segmentKnowledge ex:k .\n\nex:k a semts:ScenarioKnowledge ;\n    semts:knowledgeConcept ${c.id} ;\n    semts:hasValue [ a semts:EmbeddedValue ; semts:valueString "…" ] ;\n${gen}`;
  const val = '    semts:hasValue [ a semts:EmbeddedValue ; semts:valueString "…" ] ;\n';
  if (has('semts-dv:SegmentGroup') || c.id === 'semts-dv:Clustering') return `ex:g a semts:KnowledgeGroup ;\n    semts:knowledgeConcept ${c.id} ;\n    semts:groupKnowledge ex:member1, ex:member2 ;\n${gen}`;
  if (has('semts-dfx:DetailedTimeSeriesFeature') || has('semts-dv:SegmentDataCharacteristic')) {
    return `ex:S1 semts:segmentKnowledge ex:k .\n\nex:k a semts:SegmentDataCharacteristic ;\n    semts:knowledgeConcept ${c.id} ;\n${val}${gen}`;
  }
  if (has('semts-dv:SegmentRelation')) return `ex:S1 semts:multiSegmentKnowledge ex:k .\nex:S2 semts:multiSegmentKnowledge ex:k .\n\nex:k a semts:SegmentRelation ;\n    semts:knowledgeConcept ${c.id} ;\n${val}${gen}`;
  if (has('semts-dv:SegmentPrediction')) return `ex:S1 semts:segmentKnowledge ex:k .\n\nex:k a semts:SegmentPrediction ;\n    semts:knowledgeConcept ${c.id} ;\n${val}${gen}`;
  if (has('semts-dv:ModelInstance')) return `ex:model a semts:ModelInstance ;\n    semts:knowledgeConcept ${c.id} ;\n    semts:hasValue ex:model-file ;   # a semts:ReferencedValue\n    semts:knowledgeGenerationEntity ex:training .`;
  return `ex:k a semts:DataKnowledge ;\n    semts:knowledgeConcept ${c.id} ;\n${val}${gen}`;
}
function renderDeprecated() {
  $('#deprecated tbody').innerHTML = VOCAB.deprecated.map(d => `<tr><td><code>${esc(d.id)}</code><br><span class="muted small">${esc(d.label)}</span></td><td>${d.replacedBy.map(cchip).join(' ')}</td><td>${esc(d.note)}</td></tr>`).join('');
  $('#deprecated').addEventListener('click', e => { const b = e.target.closest('[data-c]'); if (b) { selectConcept(b.dataset.c, true); $('#browser').scrollIntoView({ behavior: 'smooth' }); } });
}

/* ------------------------------------------------------------------ examples */
function initExamples() {
  $('#ex-index').innerHTML = EXAMPLES.map((e, i) => `<li><a href="#ex-${e.slug}" data-slug="${e.slug}">${i + 1}. ${esc(e.title)}</a></li>`).join('');
  const list = $('#ex-list');
  list.innerHTML = `<p class="small muted" style="margin:0 0 18px">In the pictures: <span class="tag" style="--c:var(--dat);--t:var(--dat-t)">segment</span> <span class="tag" style="--c:var(--cls);--t:var(--cls-t)">knowledge</span> <span class="tag" style="--c:var(--gen);--t:var(--gen-t)">generation activity</span>. Scenario knowledge has a white box with a bar on the left, and quality measures are round.</p>`;
  EXAMPLES.forEach((e, i) => {
    const art = document.createElement('article'); art.className = 'example'; art.id = 'ex-' + e.slug;
    const dep = e.deps ? EXAMPLES.find(x => x.slug === e.deps) : null;
    art.innerHTML = `<div class="ex-top"><span class="ex-num">Example ${i + 1}</span><h2>${esc(e.title)}</h2>${e.isNew ? '<span class="badge-new">new in 1.3</span>' : ''}</div>
      <div class="tags">${e.layers.map(l => `<span class="tag" style="--c:${LAYER[l][0]};--t:${LAYER[l][1]}">${LAYER[l][2]}</span>`).join('')}</div>
      <p class="prose" style="font-size:16.5px">${e.sum}</p>
      ${dep ? `<p class="depends">Builds on the graph of <a href="#ex-${dep.slug}">example ${EXAMPLES.indexOf(dep) + 1}, ${esc(dep.title)}</a>.</p>` : ''}
      <div class="ex-grid"><figure class="pic" style="margin:0">${PIC[e.pic]()}</figure><div class="code-slot"></div></div>`;
    const tabs = [{ label: 'Turtle', code: EXTTL[e.file], lang: 'ttl' }];
    if (e.sparql) tabs.push({ label: 'SPARQL', code: e.sparql, lang: 'ttl' });
    $('.code-slot', art).appendChild(codeBox(tabs));
    list.appendChild(art);
  });
  const links = $$('#ex-index a');
  const io = new IntersectionObserver(entries => {
    entries.forEach(en => { if (en.isIntersecting) links.forEach(a => a.classList.toggle('on', a.dataset.slug === en.target.id.slice(3))); });
  }, { rootMargin: '-40% 0px -55% 0px' });
  $$('.example').forEach(a => io.observe(a));
}

/* ------------------------------------------------------------------ docs */
function renderDocsNav() {
  const groups = {};
  ROUTES.filter(r => r.docs).forEach(r => (groups[r.docs] = groups[r.docs] || []).push(r));
  const h = Object.entries(groups).map(([g, rs]) => `<h4>${esc(g)}</h4><ul>${rs.map(r => `<li><a href="#${r.id}" data-r="${r.id}">${esc(r.title)}</a></li>`).join('')}</ul>`).join('');
  $$('[data-docs-nav]').forEach(n => { n.innerHTML = h; });
}
function renderNS() {
  const rows = [['semts', 'https://w3id.org/semts/ontology#', 'Ontology', ONTO.meta.version]].concat(VOCAB.schemes.map(s => [s.prefix, s.namespace, MOD_META[s.key].name, s.version]));
  $('#ns-table tbody').innerHTML = rows.map(r => `<tr><td><code>${esc(r[0])}</code></td><td><code style="white-space:normal;word-break:break-all">${esc(r[1])}</code></td><td>${esc(r[2])}</td><td>${esc(r[3])}</td></tr>`).join('');
}
/* ------------------------------------------------------------------ specification (replaces the WIDOCO page) */
const KIND = { class: ['c', 'Class'], ObjectProperty: ['op', 'Object property'], DatatypeProperty: ['dp', 'Data property'], anno: ['ap', 'Annotation property'], ind: ['ni', 'Named individual'] };
function termId(id) { return 'term-' + (id.includes(':') && !/^https?:/.test(id) ? (id.startsWith('semts:') ? local(id) : id.replace(':', '-')) : id.replace(/^.*[\/#]/, '')); }
function specLink(id) {
  const known = ONTO.classes[id] || ONTO.props[id] || ONTO.annotations[id] || ONTO.individuals[id];
  const lab = id.startsWith('semts:') ? local(id) : id;
  return known ? `<a class="term" href="#${termId(id)}">${esc(lab)}</a>` : termChip(id);
}
function specList(arr) { return arr.map(specLink).join(' '); }
function specEntry(t, kind) {
  const [abbr, kname] = KIND[kind];
  const rows = [];
  const add = (k, v) => { if (v) rows.push(`<dt>${k}</dt><dd>${v}</dd>`); };
  if (kind === 'class') {
    add('Subclass of', specList(t.super) + (t.axioms.length ? `<ul class="msgs">${t.axioms.map(a => `<li>${exprHTML(a)}</li>`).join('')}</ul>` : ''));
    add('Equivalent to', t.equivalent.map(e => exprHTML(e)).join('<br>'));
    add('Subclasses', specList(t.sub));
    add('Disjoint with', specList(t.disjoint));
    add('In domain of', specList(t.props));
    add('In range of', specList(t.incoming));
    add('Used in restrictions of', specList(t.inRestrictions));
  } else if (kind === 'ObjectProperty' || kind === 'DatatypeProperty') {
    add('Characteristics', t.characteristics.map(x => x.replace(/([a-z])([A-Z])/, '$1 $2').toLowerCase()).join(', '));
    add('Domain', t.domain.map(d => exprHTML(d)).join('<br>'));
    add('Range', t.range.map(d => exprHTML(d)).join('<br>'));
    add('Subproperty of', specList(t.sub.filter(x => !/top(Object|Data)Property/.test(x))));
    add('Subproperties', specList(t.subProperties));
    add('Inverse of', specList(t.inverse));
    add('Property chain', t.chain.map(e => exprHTML(e)).join('<br>'));
    add('Disjoint with', specList(t.disjoint));
    add('Corresponding OWL-Time relation', specList(t.owlTime));
  } else if (kind === 'anno') {
    add('Used on', t.usedIn.length ? `${t.usedIn.length} SemTS ${t.usedIn.length === 1 ? 'term' : 'terms'}` + (t.usedIn.length <= 16 ? ': ' + specList(t.usedIn) : '') : '');
  } else if (kind === 'ind') {
    add('Type', specList(t.types));
    add('Name', esc(t.name));
    add('Mailbox', t.mbox ? `<a href="${esc(t.mbox)}">${esc(t.mbox.replace('mailto:', ''))}</a>` : '');
  }
  add('Is defined by', (t.isDefinedBy || []).map(x => `<a href="${esc(x)}">${esc(x)}</a>`).join('<br>'));
  add('See also', (t.seeAlso || []).map(x => /^https?:/.test(x) ? `<a href="${esc(x)}">${esc(x)}</a>` : specLink(x)).join('<br>'));
  const sh = shapesFor(t.id);
  add('Checked by', sh.length ? sh.map(x => `<code>${esc(local(x.id))}</code>`).join(' ') : '');
  const exs = t.id.startsWith('semts:') ? examplesUsing(t.id) : [];
  add('Used in examples', exs.map(e => `<a href="#ex-${e.slug}">${esc(e.title)}</a>`).join('<br>'));
  const inDiagram = typeof ARCH !== 'undefined' && (ARCH.nodes.some(n => n.id === t.id) || ARCH.edges?.some?.(e => e.id === t.id));
  const filter = [t.label, t.id, t.comment].join(' ').toLowerCase();
  return `<article class="spec-term" id="${termId(t.id)}" data-f="${esc(filter)}">
    <div class="spec-term-head"><span class="kind kind-${abbr}" title="${kname}">${abbr}</span><h4>${esc(t.label || local(t.id) || t.id)}</h4>${t.external ? '<span class="muted small">external</span>' : ''}${inDiagram ? `<a class="small" href="${hrefFor(t.id)}">Show in the diagram</a>` : ''}</div>
    <div class="iri">${esc(t.iri)}</div>
    ${t.comment ? `<p>${esc(t.comment)}</p>` : ''}
    ${rows.length ? `<dl class="kv">${rows.join('')}</dl>` : ''}
  </article>`;
}
function renderSpec() {
  const m = ONTO.meta;
  const byLabel = (a, b) => (a.label || a.id).localeCompare(b.label || b.id);
  const cls = Object.values(ONTO.classes).sort((a, b) => (a.external - b.external) || byLabel(a, b));
  const ops = Object.values(ONTO.props).filter(p => p.kind === 'ObjectProperty').sort(byLabel);
  const dps = Object.values(ONTO.props).filter(p => p.kind === 'DatatypeProperty').sort(byLabel);
  const aps = Object.values(ONTO.annotations).sort((a, b) => (a.external - b.external) || byLabel(a, b));
  const inds = Object.values(ONTO.individuals).sort(byLabel);
  const link = (u, t) => `<a href="${esc(u)}">${esc(t || u)}</a>`;
  const root = SNAPSHOT ? '../../../' : '';
  const ser = { ttl: 'Turtle', owl: 'RDF/XML', jsonld: 'JSON-LD', nt: 'N-Triples' };
  const rows = [
    ['IRI', link(m.iri)],
    ['This version', link(m.versionIRI)],
    ['Latest version', link(m.iri.replace(/#$/, ''), m.iri.replace(/#$/, ''))],
    ['Previous version', m.prior ? link(m.prior) : ''],
    ['Revision', esc(m.version)],
    ['Created', esc(m.created)], ['Modified', esc(m.modified)],
    ['Authors', m.creators.map(esc).join(', ')],
    ['Contributors', m.contributors.map(esc).join(', ')],
    ['Publisher', m.publisher.map(esc).join(', ')],
    ['Imported ontologies', m.imports.map(x => link(x)).join('<br>')],
    ['Repository', link(REPO)],
    ['Serialisations', Object.entries(ser).map(([k, l]) => `<a href="${root}${esc(m.serialisations[k])}">${l}</a>`).join(', ') + ` <span class="muted small">Also by content negotiation on the IRI</span>`],
    ['License', m.license ? link(m.license, m.rights || m.license) : ''],
    ['Cite as', esc(m.citation).replace(/(https:\/\/doi\.org\/\S+)/, '<a href="$1">$1</a>') + ' <a href="#cite">BibTeX</a>'],
    ['Visualisation', `<a href="#ontology">Architecture diagram</a>` + (m.depiction ? ` (<a href="${esc(m.depiction)}">SVG</a>)` : '') + `, <a href="#spec-vowl-h">WebVOWL graph</a>`],
    ['Shapes', `<a href="#validation">${ONTO.shapes.length} SHACL node shapes</a>`],
    ['Earlier versions', m.previous.map(v => `${esc(v.version)}: <a href="${root}${esc(v.docs)}">WIDOCO documentation</a>${v.webvowl ? `, <a href="${root}${esc(v.webvowl)}">WebVOWL</a>` : ''}${v.oops ? `, <a href="${root}${esc(v.oops)}">OOPS! evaluation</a>` : ''}`).join('<br>')],
    ['Provenance of this page', `Generated by <code>tools/build.py</code> from <a href="${REPO}/blob/main/ontology/current/ontology.ttl">ontology/current/ontology.ttl</a> (modified ${esc(m.modified)})`],
  ].filter(r => r[1]);
  $('#spec-meta').innerHTML = rows.map(([k, v]) => `<dt>${k}</dt><dd>${v}</dd>`).join('');
  $('#spec-abstract').textContent = m.abstract || '';
  const vowl = SNAPSHOT ? 'webvowl/index.html' : m.webvowl;
  const fr = $('#spec-vowl'); if (fr && !fr.getAttribute('src')) fr.setAttribute('src', vowl);
  $('#spec-vowl-open').setAttribute('href', vowl);
  $('#spec-description').innerHTML = (m.description || '').split(/(?<=\.)\s+(?=At the highest level)/).map(p => `<p>${esc(p)}</p>`).join('');
  $('#spec-ns tbody').innerHTML = Object.entries(m.prefixes).map(([k, v]) => `<tr><td><code>${esc(k)}</code></td><td><code style="white-space:normal;word-break:break-all">${esc(v)}</code></td></tr>`).join('');
  const groups = [['Classes', cls, 'class'], ['Object properties', ops, 'ObjectProperty'], ['Data properties', dps, 'DatatypeProperty'], ['Annotation properties', aps, 'anno'], ['Named individuals', inds, 'ind']];
  $('#spec-overview').innerHTML = groups.map(([g, list]) => `<div><h4>${g} <span class="muted small">${list.length}</span></h4><p class="termlist">${list.map(t => `<a class="term" href="#${termId(t.id)}">${esc(t.label || t.id.replace(/^.*[\/#:]/, ''))}</a>`).join('')}</p></div>`).join('');
  $('#spec-xref').innerHTML = groups.map(([g, list, kind]) => `<h3 class="spec-group">${g}</h3>${list.map(t => specEntry(t, kind)).join('')}`).join('');
  $('#spec-refs').innerHTML = m.references.map(r => `<li>${link(r)}</li>`).join('');
  const f = $('#ref-filter');
  const apply = () => {
    const q = f.value.trim().toLowerCase(); let n = 0;
    $$('#spec-xref .spec-term').forEach(a => { const on = !q || a.dataset.f.includes(q); a.hidden = !on; n += on; });
    $$('#spec-xref .spec-group').forEach(h => { let e = h.nextElementSibling, any = false; while (e && !e.classList.contains('spec-group')) { if (!e.hidden) any = true; e = e.nextElementSibling; } h.hidden = !any; });
    $('#ref-count').textContent = q ? `${n} matching` : `${cls.length} classes, ${ops.length + dps.length} properties, ${aps.length} annotation properties`;
  };
  f.addEventListener('input', apply); apply();
}
function renderShapes() {
  const groups = [
    ['Segments and time', /Segment|Interval|PartOf|IndexConsistency/],
    ['Knowledge', /^semts:(Knowledge|DataKnowledge|Scenario|Method|CommonContext|KnowledgeGroup|KnowledgeMulti|SegmentRelation|ModelInstance|KnowledgeRelation|Directed|Undirected|KnowledgeConcept)(?!.*Disjoint)/],
    ['Generation and provenance', /KnowledgeGeneration(?!.*Disjoint)/],
    ['Quality', /Quality/],
    ['Values, units and dimensions', /Value|Unit|Datatype|DataDimension/],
    ['Disjointness', /Disjoint/],
  ];
  const used = new Set(); const out = [];
  const order = [5, 2, 3, 4, 1, 0];
  const buckets = groups.map(() => []);
  ONTO.shapes.forEach(s => { for (const gi of order) { if (groups[gi][1].test(s.id)) { buckets[gi].push(s); used.add(s.id); break; } } });
  const rest = ONTO.shapes.filter(s => !used.has(s.id));
  if (rest.length) buckets[1].push(...rest);
  let h = `<div style="margin-bottom:28px"><p class="prose">Load the ontology and the vocabularies together with your data, so that class hierarchies and concept types are visible to the validator. <a href="#get-started">Get started</a> has a Python example.</p></div>`;
  groups.forEach(([name], gi) => {
    let list = buckets[gi]; if (!list.length) return;
    const allen = list.filter(s => /IndexConsistency/.test(s.id));
    list = list.filter(s => !/IndexConsistency/.test(s.id));
    h += `<h2 style="font-size:23px;margin:28px 0 10px">${esc(name)} <span class="muted small" style="font-weight:400">${list.length + allen.length} shapes</span></h2><div class="tbl-wrap"><table class="tbl"><thead><tr><th style="width:30%">Shape</th><th style="width:22%">Applies to</th><th>Checks</th></tr></thead><tbody>`;
    list.forEach(s => { h += `<tr><td><code style="white-space:normal">${esc(local(s.id))}</code></td><td>${s.targets.map(t => `<code style="white-space:normal">${esc(t.replaceAll('semts:', ''))}</code>`).join('<br>') || '<span class="muted">Used by other shapes</span>'}</td><td>${s.messages.length ? `<ul class="msgs" style="margin:0;padding-left:16px">${s.messages.map(m => `<li>${esc(m)}</li>`).join('')}</ul>` : '<span class="muted">Structural shape without messages</span>'}</td></tr>`; });
    if (allen.length) h += `<tr><td><code>…IndexConsistencyShape</code> (${allen.length})</td><td>Subjects of the ${allen.length} Allen relations</td><td>The related node is a segment, and the relation is backed by the matching OWL-Time relation between the two segment indexes, for example <code>semts:before</code> by <code>time:intervalBefore</code>.</td></tr>`;
    h += '</tbody></table></div>';
  });
  $('#shape-groups').innerHTML = h;
}

/* ------------------------------------------------------------------ contact */
function initContact() {
  const agent = (ONTO.meta.agents || []).find(a => a.mbox) || {};
  const mail = (agent.mbox || '').replace('mailto:', '');
  $$('[data-mail]').forEach(a => { a.href = 'mailto:' + mail; a.textContent = mail; });
  const f = $('#contact-form');
  f.addEventListener('submit', e => {
    e.preventDefault();
    const v = k => (f.elements[k].value || '').trim();
    if (!v('message')) { $('#contact-status').textContent = 'Write a short message first.'; f.elements.message.focus(); return; }
    const subject = `[SemTS] ${v('topic')}${v('org') ? ', ' + v('org') : ''}`;
    const body = `${v('message')}\n\n--\n${v('name')}${v('org') ? '\n' + v('org') : ''}`;
    location.href = `mailto:${mail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    $('#contact-status').textContent = 'Your email program should open with the message filled in. If it does not, write to ' + mail + '.';
  });
}

/* ------------------------------------------------------------------ changes */
// one changed statement: predicate, then the object (an expression, an IRI or a literal)
function diffLine(st, kind) {
  const i = st.indexOf(' '), pred = st.slice(0, i), obj = st.slice(i + 1);
  const o = /^"/.test(obj) ? `<span class="lit">${esc(obj.length > 220 ? obj.slice(0, 220) + '…"' : obj)}</span>` : /^https?:/.test(obj) ? `<a href="${esc(obj)}">${esc(obj)}</a>` : exprHTML(obj, false);
  return `<li class="${kind}"><span class="mk" aria-label="${kind === 'add' ? 'added' : 'removed'}">${kind === 'add' ? '+' : '−'}</span><code class="pred">${esc(pred)}</code><span class="obj">${o}</span></li>`;
}
function renderChanges() {
  const ch = ONTO.changes; if (!ch) return;
  const kindName = { Class: 'class', ObjectProperty: 'object property', DatatypeProperty: 'data property', AnnotationProperty: 'annotation property', NamedIndividual: 'individual', Ontology: 'ontology header', Other: 'term' };
  const name = x => x.id.startsWith('semts:') ? specLink(x.id) : `<code>${esc(x.id)}</code>`;
  $('#chg-prior').textContent = ch.prior || '';
  $('#chg-added').innerHTML = ch.added.map(x => `<li>${name(x)} <span class="muted small">${kindName[x.kind]}</span></li>`).join('');
  $('#chg-removed').innerHTML = ch.removed.map(x => `<li><code>${esc(x.id)}</code> <span class="muted small">${kindName[x.kind]}</span></li>`).join('');
  $('#chg-modified').innerHTML = ch.modified.map(x => `<details class="chg"><summary>${name(x)} <span class="muted small">${kindName[x.kind]}, ${x.added.length} added, ${x.removed.length} removed</span></summary>
    <ul class="diff">${x.removed.map(r => diffLine(r, 'del')).join('')}${x.added.map(a => diffLine(a, 'add')).join('')}</ul></details>`).join('');
  $('#chg-counts').textContent = `${ch.added.length} terms added, ${ch.removed.length} removed, ${ch.modified.length} changed`;
  const root = SNAPSHOT ? '../../../' : '';
  const prev = ONTO.meta.previous;
  $('#chg-earlier').innerHTML = prev.map((v, i) => `<tr><td><strong>${esc(v.version)}</strong></td><td style="white-space:nowrap">${esc(v.date || '')}</td>
    <td>${v.changes ? `<a href="${root}${esc(v.changes)}">Changes from ${esc(prev[i + 1] ? prev[i + 1].version : 'the previous version')}</a>` : '<span class="muted">First published version</span>'}</td>
    <td><a href="${root}${esc(v.docs)}">Documentation</a>${v.webvowl ? `, <a href="${root}${esc(v.webvowl)}">WebVOWL</a>` : ''}</td>
    <td>${v.ttl ? `<a href="${root}${esc(v.ttl)}">Turtle</a>` : ''} <code class="small">${esc(v.iri)}</code></td></tr>`).join('');
}
function renderDeprecatedList() {
  const el = $('#chg-deprecated'); if (!el || !VOCAB) return;
  el.innerHTML = VOCAB.deprecated.map(d => `<tr><td><code>${esc(d.id)}</code><br><span class="muted small">${esc(d.label)}</span></td><td>${d.replacedBy.map(x => `<a class="term" href="${hrefFor(x) || '#'}">${esc(VOCAB.concepts[x]?.label || x)}</a>`).join(' ')}</td><td>${esc(d.note)}</td></tr>`).join('');
}

/* ------------------------------------------------------------------ router */
const inited = {};
const INIT = {
  home: () => { initHero(); renderCaps(); $('#home-pic-agents').innerHTML = PIC.agents(); $('#home-pic-report').innerHTML = `<div class="pic-wide">${PIC.report()}</div><div class="pic-narrow">${PIC.report(true)}</div>`; $('#home-pic-provenance').innerHTML = PIC.provenance(); },
  ontology: () => initArch(),
  examples: () => initExamples(),
  reference: () => renderSpec(),
  contact: () => initContact(),
  changes: () => renderChanges(),
  validation: () => renderShapes(),
};
function renderConceptCount() {
  $$('[data-concept-count]').forEach(el => { el.textContent = `${Object.keys(VOCAB.concepts).length} SKOS concepts in ${VOCAB.schemes.length} modules`; });
}
const NEEDS_VOCAB = { vocabularies: () => { renderVmap(); initVB(); renderDeprecated(); }, 'get-started': renderNS, changes: renderDeprecatedList, home: () => { renderVmap(); renderConceptCount(); } };
function ensure(page) {
  if (!inited[page] && INIT[page]) { INIT[page](); inited[page] = true; }
  const vk = 'v:' + page;
  if (!inited[vk] && NEEDS_VOCAB[page] && VOCAB) { NEEDS_VOCAB[page](); inited[vk] = true; }
}
function buildNav() {
  $('#main-nav').innerHTML = ROUTES.filter(r => r.nav).map(r => `<a href="#${r.id}" data-r="${r.id}">${esc(r.nav)}</a>`).join('');
  $('#menu-btn').addEventListener('click', () => { const n = $('#main-nav'); const o = n.classList.toggle('open'); $('#menu-btn').setAttribute('aria-expanded', o); });
}
function route() {
  let h = decodeURIComponent(location.hash.slice(1)) || 'home';
  if (ALIASES[h]) h = ALIASES[h];
  let page = h, after = null;
  if (ROUTES.some(r => r.id === h)) { /* plain page */ }
  else if (h.startsWith('term-') || h.startsWith('spec-')) { page = 'reference'; after = () => { const el = document.getElementById(h); if (el) { el.scrollIntoView(); el.classList.add('flash'); setTimeout(() => el.classList.remove('flash'), 1600); } }; }
  else if (h.startsWith('ex-')) { page = 'examples'; after = () => { const el = document.getElementById(h); if (el) el.scrollIntoView(); }; }
  else if (h.startsWith('concept-')) { page = 'vocabularies'; after = () => { const id = curieFromHash(h); const go = () => { selectConcept(id, false); $('#browser').scrollIntoView(); }; VOCAB ? go() : (pendingConcept = go); }; }
  else if (h.startsWith('class-') || h.startsWith('prop-')) { page = 'ontology'; after = () => selectArch('semts:' + h.replace(/^(class|prop)-/, '')); }
  else if (h === 'browser') { page = 'vocabularies'; after = () => $('#browser').scrollIntoView(); }
  if (!ROUTES.some(r => r.id === page)) page = 'home';
  $$('.page').forEach(p => p.classList.toggle('active', p.dataset.page === page));
  const r = ROUTES.find(x => x.id === page);
  document.title = page === 'home' ? r.title : `${r.title} | SemTS`;
  const navId = r.nav ? r.id : r.docs ? 'get-started' : null;
  $$('#main-nav a').forEach(a => { if (a.dataset.r === navId) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current'); });
  $$('[data-docs-nav] a').forEach(a => { if (a.dataset.r === page) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current'); });
  $('#main-nav').classList.remove('open'); $('#menu-btn').setAttribute('aria-expanded', 'false');
  if (page !== 'ontology') { const d = $('#arch-detail'); if (d) d.hidden = true; archSel = null; }
  ensure(page);
  if (after) requestAnimationFrame(after); else window.scrollTo(0, 0);
}
let pendingConcept = null;

function boot() {
  if (SNAPSHOT) {
    const b = document.createElement('div'); b.className = 'snapshot';
    b.innerHTML = `You are reading the archived documentation of SemTS ${esc(SNAPSHOT)}. <a href="${PAGES}">Go to the current version</a>`;
    document.body.prepend(b);
  }
  const vt = $('.version'); if (vt && ONTO.meta.version) vt.textContent = 'Ontology ' + ONTO.meta.version;
  buildNav(); renderDocsNav(); renderTermLists(); renderApps(); renderCite(); renderSnippets();
  $$('[data-count="classes"]').forEach(e => { e.textContent = Object.values(ONTO.classes).filter(c => !c.external).length; });
  $$('[data-count="props"]').forEach(e => { e.textContent = Object.keys(ONTO.props).length; });
  window.addEventListener('hashchange', route);
  route();
  fetch('data/vocab.json').then(r => { if (!r.ok) throw new Error(r.status); return r.json(); }).then(v => {
    VOCAB = v;
    const page = $('.page.active').dataset.page; ensure(page);
    if (pendingConcept) { pendingConcept(); pendingConcept = null; }
  }).catch(err => {
    const msg = '<p class="muted">The vocabulary data (data/vocab.json) could not be loaded. Reload the page to try again.</p>';
    $$('[data-vmap], #vb').forEach(e => { e.innerHTML = msg; });
  });
}
document.addEventListener('DOMContentLoaded', boot);
})();
