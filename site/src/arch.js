/* SemTS 1.3.0 architecture diagram: hand-placed layout, rendered to SVG.
   Nested boxes are subclasses, arrows are object properties (domain to range). */
const ARCH = (() => {
  const L = { gen: { c: '#B5412D', t: '#F8EAE6' }, cls: { c: '#1F5BAF', t: '#E6EEFA' }, dat: { c: '#2B7855', t: '#E3F1E8' } };

  const bands = [
    { layer: 'gen', y: 6, h: 248, label: 'Knowledge generation' },
    { layer: 'cls', y: 262, h: 352, label: 'Knowledge classification' },
    { layer: 'dat', y: 622, h: 272, label: 'Data management' },
  ];

  // kind: class | container | ext | concept ; depth controls fill
  const nodes = [
    // generation
    { id: 'semts:KnowledgeGenerationIO', layer: 'gen', x: 640, y: 28, w: 220, h: 34, t: ['Knowledge Generation IO'], sub: '⊑ prov:Entity' , inline: true },
    { id: 'semts:KnowledgeGenerationInput', layer: 'gen', x: 60, y: 84, w: 190, h: 48, t: ['Knowledge Generation Input'] },
    { id: 'semts:KnowledgeGenerationOutput', layer: 'gen', x: 1040, y: 84, w: 200, h: 48, t: ['Knowledge Generation Output'] },
    { id: 'semts:KnowledgeGenerationEntity', layer: 'gen', kind: 'container', x: 540, y: 76, w: 420, h: 130, t: ['Knowledge Generation Entity'], sub: '⊑ prov:Activity' },
    { id: 'semts:KnowledgeGenerationMethod', layer: 'gen', depth: 1, x: 552, y: 124, w: 128, h: 72, t: ['Knowledge Generation', 'Method'], sub: '⊑ mls:Implementation', small: true },
    { id: 'semts:KnowledgeComparisonMeasure', layer: 'gen', depth: 1, x: 688, y: 124, w: 128, h: 72, t: ['Knowledge', 'Comparison Measure'], small: true },
    { id: 'semts:KnowledgeReasoning', layer: 'gen', depth: 1, x: 824, y: 124, w: 128, h: 72, t: ['Knowledge', 'Reasoning'], small: true },
    { id: 'semts:KnowledgeGenerationConcept', layer: 'gen', kind: 'concept', x: 270, y: 148, w: 160, h: 56, t: ['Knowledge Generation', 'Concept'], sub: '⊑ skos:Concept', small: true },

    // classification
    { id: 'semts:KnowledgeConcept', layer: 'cls', kind: 'concept', x: 60, y: 300, w: 160, h: 44, t: ['Knowledge Concept'], sub: '⊑ skos:Concept ⊔ Collection' },
    { id: 'semts:Knowledge', layer: 'cls', kind: 'container', x: 290, y: 276, w: 670, h: 328, t: ['Knowledge'] },
    { id: 'semts:DataKnowledge', layer: 'cls', kind: 'container', depth: 1, x: 304, y: 306, w: 324, h: 132, t: ['Data Knowledge'] },
    { id: 'semts:SegmentDataCharacteristic', layer: 'cls', depth: 2, x: 314, y: 334, w: 152, h: 44, t: ['Segment Data', 'Characteristic'], small: true },
    { id: 'semts:SegmentPrediction', layer: 'cls', depth: 2, x: 474, y: 334, w: 144, h: 44, t: ['Segment Prediction'], small: true },
    { id: 'semts:SegmentRelation', layer: 'cls', depth: 2, x: 314, y: 386, w: 152, h: 44, t: ['Segment Relation'], small: true },
    { id: 'semts:ModelInstance', layer: 'cls', depth: 2, x: 474, y: 386, w: 144, h: 44, t: ['Model Instance'], sub: '⊑ mls:Model', small: true },
    { id: 'semts:MethodKnowledge', layer: 'cls', kind: 'container', depth: 1, x: 638, y: 306, w: 162, h: 132, t: ['Method Knowledge'] },
    { id: 'semts:Algorithm', layer: 'cls', depth: 2, x: 648, y: 334, w: 142, h: 44, t: ['Algorithm'], sub: '⊑ mls:Algorithm', small: true },
    { id: 'semts:Hyperparameter', layer: 'cls', depth: 2, x: 648, y: 386, w: 142, h: 44, t: ['Hyperparameter'], sub: '⊑ mls:Hyperparameter', small: true },
    { id: 'semts:ScenarioKnowledge', layer: 'cls', depth: 1, x: 810, y: 306, w: 140, h: 44, t: ['Scenario Knowledge'], small: true },
    { id: 'semts:CommonContextKnowledge', layer: 'cls', depth: 1, x: 810, y: 358, w: 140, h: 56, t: ['Common Context', 'Knowledge'], small: true, isNew: true },
    { id: 'semts:KnowledgeRelation', layer: 'cls', kind: 'container', depth: 1, x: 304, y: 450, w: 324, h: 144, t: ['Knowledge Relation'], sub: 'abstract: directed or undirected', isNew: true },
    { id: 'semts:DirectedKnowledgeRelation', layer: 'cls', depth: 2, x: 314, y: 494, w: 152, h: 90, t: ['Directed Knowledge', 'Relation'], comp: ['source → Knowledge', 'target → Knowledge'], small: true, isNew: true },
    { id: 'semts:UndirectedKnowledgeRelation', layer: 'cls', depth: 2, x: 474, y: 494, w: 144, h: 90, t: ['Undirected', 'Knowledge Relation'], comp: ['participant → Knowledge', 'at least two'], small: true, isNew: true },
    { id: 'semts:KnowledgeGroup', layer: 'cls', depth: 1, x: 638, y: 450, w: 150, h: 76, t: ['Knowledge Group'], comp: ['group knowledge', '→ Knowledge'], small: true },
    { id: 'semts:KnowledgeQualityMeasure', layer: 'cls', x: 1060, y: 300, w: 185, h: 48, t: ['Knowledge Quality Measure'], sub: '⊑ mls:EvaluationMeasure', small: true },
    { id: 'semts:QualityMeasureConcept', layer: 'cls', kind: 'concept', x: 1100, y: 420, w: 145, h: 58, t: ['Quality Measure', 'Concept'], sub: '⊑ skos:Concept', small: true },

    // data management
    { id: 'time:TemporalEntity', layer: 'dat', kind: 'ext', x: 60, y: 660, w: 160, h: 44, t: ['time:TemporalEntity'], sub: 'instant or bounded interval', small: true },
    { id: 'semts:DataDimension', layer: 'dat', x: 60, y: 720, w: 160, h: 86, t: ['Data Dimension'], comp: ['has unit → qudt:Unit', 'has datatype → qudt:Datatype', 'dimension position'], small: true },
    { id: 'dcat:Distribution', layer: 'dat', kind: 'ext', x: 60, y: 820, w: 160, h: 36, t: ['dcat:Distribution'], small: true },
    { id: 'semts:TimeSeriesSegment', layer: 'dat', kind: 'container', x: 320, y: 660, w: 320, h: 212, t: ['Time Series Segment'], sub: '⊑ dcat:Dataset',
      comp: ['is part of → Time Series Segment (transitive)', 'before, meets, overlaps, starts, during,', 'finishes, equals and inverses → Segment', 'dataset row and column index'] },
    { id: 'semts:ArtificialTimeSeriesSegment', layer: 'dat', depth: 1, x: 334, y: 800, w: 292, h: 62, t: ['Artificial Time Series Segment'], comp: ['is part of only artificial segments'], small: true },
    { id: 'semts:Value', layer: 'dat', kind: 'container', x: 680, y: 660, w: 280, h: 132, t: ['Value'] },
    { id: 'semts:EmbeddedValue', layer: 'dat', depth: 1, x: 692, y: 690, w: 126, h: 92, t: ['Embedded Value'], comp: ['value string'], small: true },
    { id: 'semts:ReferencedValue', layer: 'dat', depth: 1, x: 826, y: 690, w: 124, h: 92, t: ['Referenced', 'Value'], sub: '⊑ dcat:Resource', small: true },
    { id: 'qudt:Unit', layer: 'dat', kind: 'ext', x: 1060, y: 672, w: 180, h: 34, t: ['qudt:Unit'], small: true },
    { id: 'qudt:Datatype', layer: 'dat', kind: 'ext', x: 1060, y: 744, w: 180, h: 34, t: ['qudt:Datatype'], small: true },
  ];

  // pts: polyline; label lines at (lx, ly) with anchor; sub = subclass connector (hollow triangle at start)
  const edges = [
    { id: 'semts:wasDerivedFrom', pts: [[1210, 84], [1210, 18], [90, 18], [90, 84]], label: ['was derived from'], lx: 400, ly: 22, dashed: true },
    { id: 'sub:io-in', sub: true, pts: [[640, 45], [155, 45], [155, 84]] },
    { id: 'sub:io-out', sub: true, pts: [[860, 45], [1140, 45], [1140, 84]] },
    { id: 'semts:used', pts: [[540, 108], [250, 108]], label: ['used'], lx: 395, ly: 102 },
    { id: 'semts:generated', pts: [[960, 108], [1040, 108]], label: ['generated'], lx: 1000, ly: 102 },
    { id: 'semts:knowledgeGenerationConcept', pts: [[540, 174], [430, 174]], label: ['knowledge', 'generation concept'], lx: 485, ly: 152 },
    { id: 'semts:inputKnowledge', pts: [[155, 132], [155, 254], [330, 254], [330, 276]], label: ['input knowledge'], lx: 163, ly: 246, anchor: 'start' },
    { id: 'semts:outputKnowledge', pts: [[1100, 132], [1100, 254], [900, 254], [900, 276]], label: ['output knowledge'], lx: 1108, ly: 200, anchor: 'start' },
    { id: 'semts:knowledgeGenerationEntity', pts: [[720, 276], [720, 206]], label: ['knowledge generation entity'], lx: 728, ly: 240, anchor: 'start' },
    { id: 'semts:inputDataReference', pts: [[60, 116], [48, 116], [48, 884], [470, 884], [470, 872]], label: ['input data reference'], lx: 260, ly: 880 },
    { id: 'semts:knowledgeConcept', pts: [[290, 322], [220, 322]], label: ['knowledge', 'concept'], lx: 255, ly: 300 },
    { id: 'semts:knowledgeQualityMeasure', pts: [[960, 324], [1060, 324]], label: ['knowledge', 'quality measure'], lx: 1010, ly: 302 },
    { id: 'semts:qualityMeasureConcept', pts: [[1172, 348], [1172, 420]], label: ['quality measure', 'concept'], lx: 1164, ly: 380, anchor: 'end' },
    { id: 'semts:segmentIndex', pts: [[320, 682], [220, 682]], label: ['segment index'], lx: 270, ly: 676 },
    { id: 'semts:segmentDimension', pts: [[320, 763], [220, 763]], label: ['segment dimension'], lx: 270, ly: 757 },
    { id: 'dcat:distribution', pts: [[320, 838], [220, 838]], label: ['distribution'], lx: 270, ly: 832 },
    { id: 'semts:segmentKnowledge', pts: [[380, 660], [380, 604]], label: ['segment', 'knowledge'], lx: 372, ly: 626, anchor: 'end' },
    { id: 'semts:multiSegmentKnowledge', pts: [[480, 660], [480, 604]], label: ['multi segment', 'knowledge'], lx: 472, ly: 626, anchor: 'end' },
    { id: 'semts:commonContextKnowledge', pts: [[600, 660], [600, 634], [880, 634], [880, 414]], label: ['common context', 'knowledge'], lx: 872, ly: 530, anchor: 'end', isNew: true },
    { id: 'semts:hasValue', pts: [[920, 604], [920, 660]], label: ['has value'], lx: 928, ly: 640, anchor: 'start' },
    { id: 'semts:hasValue#kqm', prop: 'semts:hasValue', pts: [[1245, 330], [1256, 330], [1256, 725], [960, 725]], label: ['has value'], lx: 1150, ly: 728 },
    { id: 'semts:hasUnit', pts: [[960, 689], [1060, 689]], label: ['has unit'], lx: 1010, ly: 683 },
    { id: 'semts:hasDatatype', pts: [[960, 761], [1060, 761]], label: ['has datatype'], lx: 1010, ly: 755 },
  ];

  const legend = { x: 680, y: 808 };

  function esc(s) { return String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])); }

  function nodeSVG(n) {
    const col = L[n.layer];
    const kind = n.kind || 'class';
    const depth = n.depth || 0;
    let fill = depth % 2 ? col.t : '#FFFFFF', stroke = col.c, dash = '', sw = 1.3;
    if (kind === 'ext') { fill = '#F6F7F9'; stroke = '#8A95A6'; dash = '5 4'; }
    if (kind === 'concept') { fill = '#FFFFFF'; stroke = '#1F5BAF'; dash = '2 3'; sw = 1.5; }
    const r = kind === 'container' ? 10 : 7;
    const fs = n.small ? 11 : 12.5;
    const lines = [];
    const cx = n.x + n.w / 2;
    let out = `<g class="node" tabindex="0" role="button" data-id="${n.id}" aria-label="${esc(n.t.join(' '))}"${n.isNew ? ' data-new="1"' : ''}>`;
    out += `<rect class="nbox" x="${n.x}" y="${n.y}" width="${n.w}" height="${n.h}" rx="${r}" fill="${fill}" stroke="${stroke}" stroke-width="${sw}"${dash ? ` stroke-dasharray="${dash}"` : ''}/>`;
    if (kind === 'container') {
      out += `<text x="${n.x + 12}" y="${n.y + 19}" font-size="13" font-weight="600" fill="#14233D">${esc(n.t[0])}</text>`;
      if (n.sub) out += `<text x="${n.x + 12}" y="${n.y + 33}" font-size="10.5" fill="#6A7688">${esc(n.sub)}</text>`;
      if (n.isNew) out += newBadge(n.x + n.w - 44, n.y + 8);
      if (n.comp) {
        let yy = n.y + (n.sub ? 52 : 38);
        out += `<line x1="${n.x + 12}" x2="${n.x + n.w - 12}" y1="${yy - 12}" y2="${yy - 12}" stroke="${col.c}" stroke-opacity=".25"/>`;
        n.comp.forEach(c => { out += `<text x="${n.x + 12}" y="${yy}" font-size="10.5" fill="#48566B">${esc(c)}</text>`; yy += 14; });
      }
      return out + '</g>';
    }
    const subH = n.sub ? 13 : 0;
    const compH = n.comp ? n.comp.length * 13 + 8 : 0;
    const titleH = n.t.length * (fs + 2.5);
    let y0 = n.y + (n.h - titleH - subH - compH) / 2 + fs;
    n.t.forEach((t, i) => { out += `<text x="${cx}" y="${y0 + i * (fs + 2.5)}" text-anchor="middle" font-size="${fs}" font-weight="600" fill="#14233D">${esc(t)}</text>`; });
    let yy = y0 + (n.t.length - 1) * (fs + 2.5);
    if (n.sub) { yy += 14; out += `<text x="${cx}" y="${yy}" text-anchor="middle" font-size="10" fill="#6A7688">${esc(n.sub)}</text>`; }
    if (n.comp) {
      yy += 9;
      out += `<line x1="${n.x + 8}" x2="${n.x + n.w - 8}" y1="${yy}" y2="${yy}" stroke="${col.c}" stroke-opacity=".3"/>`;
      n.comp.forEach(c => { yy += 13; out += `<text x="${cx}" y="${yy}" text-anchor="middle" font-size="10" fill="#48566B">${esc(c)}</text>`; });
    }
    if (n.isNew) out += newBadge(n.x + n.w - 34, n.y - 7);
    return out + '</g>';
  }

  function newBadge(x, y) {
    return `<g aria-hidden="true"><rect x="${x}" y="${y}" width="30" height="14" rx="7" fill="#F8EAE6" stroke="#B5412D" stroke-width=".8"/><text x="${x + 15}" y="${y + 10.2}" text-anchor="middle" font-size="9" font-weight="700" fill="#B5412D">1.3</text></g>`;
  }

  function edgeSVG(e) {
    const d = 'M' + e.pts.map(p => p.join(' ')).join(' L');
    const prop = e.prop || e.id;
    let out = `<g class="edge" data-id="${e.sub ? '' : prop}"${e.isNew ? ' data-new="1"' : ''}${e.sub ? '' : ' tabindex="0" role="button" aria-label="' + esc((e.label || []).join(' ')) + '"'}>`;
    out += `<path d="${d}" fill="none" stroke="transparent" stroke-width="12"/>`;
    if (e.sub) {
      out += `<path class="vis" d="${d}" fill="none" stroke="#B5412D" stroke-width="1.2" marker-start="url(#tri-open)"/>`;
    } else {
      out += `<path class="vis" d="${d}" fill="none" stroke="#7D8899" stroke-width="1.3"${e.dashed ? ' stroke-dasharray="5 4"' : ''} marker-end="url(#arrow)"/>`;
    }
    if (e.label) {
      const anchor = e.anchor || 'middle';
      e.label.forEach((l, i) => {
        out += `<text x="${e.lx}" y="${e.ly + i * 12}" text-anchor="${anchor}" font-size="10.5" fill="#48566B" class="elabel">${esc(l)}</text>`;
      });
    }
    return out + '</g>';
  }

  function render() {
    let s = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1280 900" role="img" aria-label="SemTS 1.3.0 architecture: three layers with their classes and properties" font-family="Instrument Sans, system-ui, sans-serif">`;
    s += `<title>SemTS 1.3.0 architecture</title>`;
    s += `<defs>
      <marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" fill="#7D8899"/></marker>
      <marker id="tri-open" viewBox="0 0 12 12" refX="11" refY="6" markerWidth="10" markerHeight="10" orient="auto-start-reverse"><path d="M1 1L11 6L1 11z" fill="#fff" stroke="#B5412D" stroke-width="1.2"/></marker>
    </defs>`;
    s += `<style>.elabel{paint-order:stroke;stroke:#FFFFFF;stroke-width:3.5px;stroke-linejoin:round}</style>`;
    bands.forEach(b => {
      const col = L[b.layer];
      s += `<rect x="16" y="${b.y}" width="1248" height="${b.h}" rx="12" fill="${col.t}" fill-opacity=".5"/>`;
      s += `<text transform="translate(31 ${b.y + b.h / 2}) rotate(-90)" text-anchor="middle" font-size="12" font-weight="600" fill="${col.c}" letter-spacing=".02em">${b.label}</text>`;
    });
    nodes.forEach(n => { s += nodeSVG(n); });
    edges.forEach(e => { s += edgeSVG(e); });
    // legend
    const lx = legend.x, ly = legend.y;
    s += `<g aria-hidden="true" font-size="11" fill="#48566B">
      <rect x="${lx}" y="${ly}" width="22" height="16" rx="4" fill="#fff" stroke="#2B7855"/><rect x="${lx + 6}" y="${ly + 5}" width="12" height="8" rx="2" fill="#E3F1E8" stroke="#2B7855"/>
      <text x="${lx + 30}" y="${ly + 12}">Nested box: subclass</text>
      <path d="M${lx} ${ly + 32}H${lx + 22}" stroke="#7D8899" stroke-width="1.3" marker-end="url(#arrow)"/>
      <text x="${lx + 30}" y="${ly + 36}">Object property, domain to range</text>
      <rect x="${lx}" y="${ly + 46}" width="22" height="14" rx="3" fill="#F6F7F9" stroke="#8A95A6" stroke-dasharray="4 3"/>
      <text x="${lx + 30}" y="${ly + 57}">Class from another vocabulary</text>
      <rect x="${lx + 290}" y="${ly}" width="22" height="16" rx="4" fill="#fff" stroke="#1F5BAF" stroke-dasharray="2 3" stroke-width="1.5"/>
      <text x="${lx + 320}" y="${ly + 12}">Hook into a SKOS vocabulary</text>
      <path d="M${lx + 312} ${ly + 32}H${lx + 290}" stroke="#B5412D" stroke-width="1.2" marker-end="url(#tri-open)"/>
      <text x="${lx + 320}" y="${ly + 36}">Subclass of a class outside the box</text>
      ${newBadge(lx + 286, ly + 47)}
      <text x="${lx + 320}" y="${ly + 57}">New in version 1.3.0</text>
      <text x="${lx}" y="${ly + 78}">Every SemTS class except the concept hooks also has title and description (strings)</text>
    </g>`;
    s += '</svg>';
    return s;
  }

  const info = {
    'time:TemporalEntity': { label: 'Temporal entity', iri: 'http://www.w3.org/2006/time#TemporalEntity', comment: 'OWL-Time class for instants and intervals. SemTS requires exactly one index per segment: a time:Instant, or a time:Interval with one beginning and one end given either as xsd:dateTimeStamp or as numeric positions.', href: 'https://www.w3.org/TR/owl-time/' },
    'dcat:Distribution': { label: 'Distribution', iri: 'http://www.w3.org/ns/dcat#Distribution', comment: 'DCAT class for an accessible form of a dataset, such as a downloadable file. Every segment needs at least one distribution, which points to the raw data.', href: 'https://www.w3.org/TR/vocab-dcat-3/' },
    'dcat:distribution': { label: 'distribution', iri: 'http://www.w3.org/ns/dcat#distribution', comment: 'DCAT property from a dataset to a distribution. SemTS segments are dcat:Datasets and use it to reference their data.', href: 'https://www.w3.org/TR/vocab-dcat-3/' },
  };

  return { render, nodes, edges, info };
})();
