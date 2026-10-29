/* =====================================================
   NFS – Tank & Agitator Elevation Diagram
   CIRCULAR    → single scaled SVG side-view.
   RECTANGULAR → two side-by-side elevation views (front
   view against "ancho" and side view against "longitud")
   sharing the same vertical scale, so the propeller
   diameters can be compared against both walls.
   Called from calculate() on every input change.
   ===================================================== */

'use strict';

/* ── Shared colour palette ── */
const _DIAG_NAVY    = '#0d2340';
const _DIAG_BLUE    = '#1a4880';
const _DIAG_BLUEMID = '#2062a8';
const _DIAG_DIM     = '#475569';
const _DIAG_PROPCOLS = [_DIAG_NAVY, _DIAG_BLUE, _DIAG_BLUEMID, '#4a90c4'];

function _diagDefs() {
  return `<defs>
    <marker id="da"  markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto">
      <polygon points="0,0 8,4 0,8" fill="${_DIAG_DIM}"/>
    </marker>
    <marker id="daR" markerWidth="8" markerHeight="8" refX="2" refY="4" orient="auto">
      <polygon points="8,0 0,4 8,8" fill="${_DIAG_DIM}"/>
    </marker>
    <marker id="daB"  markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto">
      <polygon points="0,0 8,4 0,8" fill="${_DIAG_BLUEMID}"/>
    </marker>
    <marker id="daBR" markerWidth="8" markerHeight="8" refX="2" refY="4" orient="auto">
      <polygon points="8,0 0,4 8,8" fill="${_DIAG_BLUEMID}"/>
    </marker>

    <linearGradient id="liqGr" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%"   stop-color="#bfdbfe" stop-opacity="0.9"/>
      <stop offset="100%" stop-color="#3b82f6" stop-opacity="0.4"/>
    </linearGradient>
    <linearGradient id="shaftGr" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%"   stop-color="#374151"/>
      <stop offset="50%"  stop-color="#6b7280"/>
      <stop offset="100%" stop-color="#374151"/>
    </linearGradient>

    <pattern id="airPat" patternUnits="userSpaceOnUse" width="10" height="10">
      <line x1="0" y1="10" x2="10" y2="0" stroke="#dde3ec" stroke-width="1.2"/>
    </pattern>
  </defs>`;
}

function _diagLegend(E, lgX, lgY, props, activePropNames) {
  const legItems = [
    { col: '#3b82f6',  label: 'Líquido',     opacity: '0.7' },
    { col: '#94a3b8',  label: 'Bafles',      opacity: '1'   },
    { col: _DIAG_NAVY, label: 'Eje / Motor', opacity: '1'   },
  ];
  E.push(`<text x="${lgX}" y="${lgY}" font-size="12" font-weight="700"
    fill="${_DIAG_DIM}" font-family="Segoe UI,sans-serif">Referencia</text>`);
  legItems.forEach((item, i) => {
    const ly = lgY + 18 + i * 18;
    E.push(`<rect x="${lgX}" y="${ly - 9}" width="14" height="10"
      fill="${item.col}" opacity="${item.opacity}" rx="2"/>`);
    E.push(`<text x="${lgX + 20}" y="${ly}" font-size="12"
      fill="${_DIAG_DIM}" font-family="Segoe UI,sans-serif">${item.label}</text>`);
  });
  activePropNames.forEach((name, i) => {
    const ly = lgY + 18 + (legItems.length + i) * 18;
    const col = _DIAG_PROPCOLS[i];
    E.push(`<line x1="${lgX}" y1="${ly - 4}" x2="${lgX + 14}" y2="${ly - 4}"
      stroke="${col}" stroke-width="5" stroke-linecap="round"/>`);
    E.push(`<text x="${lgX + 20}" y="${ly}" font-size="12"
      fill="${_DIAG_DIM}" font-family="Segoe UI,sans-serif">Propela ${name}</text>`);
  });
}

/**
 * Renders one elevation panel (tank cross-section + shaft + propellers) into E.
 * All vertical placement (sc, tY, tBot, Y()) is shared across panels so that
 * both views of a rectangular tank are drawn to the exact same scale.
 */
function _diagRenderPanel(E, ctx) {
  const {
    tX, tW, tY, tBot, sc, cx, Y,
    alturaUtil, liquidY, bafles, bafRefDim,
    props, propH, D1_m, clearance,
    mTop, mH, mW,
    widthLabel, showHb, showTitle,
  } = ctx;

  const bafW = Math.max(bafRefDim * 0.08 * sc, 5);
  const tf = `font-family="Segoe UI,sans-serif" font-size="13" fill="${_DIAG_DIM}"`;

  if (showTitle) {
    E.push(`<text x="${cx}" y="${tY - 26}" text-anchor="middle"
      font-size="12.5" font-weight="700" fill="${_DIAG_NAVY}"
      font-family="Segoe UI,sans-serif">${showTitle}</text>`);
  }

  /* Air space */
  const airH = liquidY - tY;
  if (airH > 1) {
    E.push(`<rect x="${tX + 2}" y="${tY + 2}" width="${tW - 4}" height="${airH - 2}"
      fill="url(#airPat)"/>`);
  }

  /* Liquid fill */
  E.push(`<rect x="${tX + 2}" y="${liquidY}" width="${tW - 4}"
    height="${tBot - liquidY - 2}" fill="url(#liqGr)"/>`);

  /* Baffles */
  if (bafles && alturaUtil > 0) {
    const bfH = tBot - liquidY;
    E.push(`<rect x="${tX + 2}"          y="${liquidY}" width="${bafW}" height="${bfH}"
      fill="#94a3b8" rx="2"/>`);
    E.push(`<rect x="${tX + tW - bafW - 2}" y="${liquidY}" width="${bafW}" height="${bfH}"
      fill="#94a3b8" rx="2"/>`);
  }

  /* Shaft */
  const shaftThk  = Math.max(Math.min(tW * 0.025, 6), 3.5);
  const shaftTopY = mTop + mH;
  const shaftBotY = Y(clearance);
  const shaftLen  = shaftBotY - shaftTopY;
  E.push(`<rect x="${cx - shaftThk / 2}" y="${shaftTopY}"
    width="${shaftThk}" height="${shaftLen}"
    fill="url(#shaftGr)"/>`);

  /* Propellers */
  props.forEach((pp, i) => {
    const h = propH[i];
    if (h === null || h === undefined) return;
    const py   = Y(h);
    const half = (pp.D_m / 2) * sc;
    const col  = _DIAG_PROPCOLS[i];
    const Dmm  = Math.round(pp.D_m * 1000);

    E.push(`<line x1="${cx - half}" y1="${py + 1}" x2="${cx + half}" y2="${py + 1}"
      stroke="rgba(0,0,0,0.15)" stroke-width="7" stroke-linecap="round"/>`);
    E.push(`<line x1="${cx - half}" y1="${py}" x2="${cx + half}" y2="${py}"
      stroke="${col}" stroke-width="6" stroke-linecap="round"/>`);
    E.push(`<circle cx="${cx}" cy="${py}" r="5.5" fill="${col}"/>`);
    E.push(`<text x="${cx - half - 9}" y="${py + 4}"
      font-size="13" font-weight="700" fill="${col}"
      font-family="Segoe UI,sans-serif" text-anchor="end">P${i + 1}</text>`);
    E.push(`<text x="${cx + half + 9}" y="${py + 4}"
      font-size="12" fill="${col}" font-family="Segoe UI,sans-serif">
      Ø ${Dmm} mm</text>`);
  });

  /* Tank outline */
  E.push(`<rect x="${tX}" y="${tY}" width="${tW}" height="${tBot - tY}"
    fill="none" stroke="${_DIAG_NAVY}" stroke-width="2.5"/>`);
  E.push(`<line x1="${tX}" y1="${tBot}" x2="${tX + tW}" y2="${tBot}"
    stroke="${_DIAG_NAVY}" stroke-width="4.5" stroke-linecap="square"/>`);

  /* Liquid level line */
  E.push(`<line x1="${tX}" y1="${liquidY}" x2="${tX + tW}" y2="${liquidY}"
    stroke="${_DIAG_BLUEMID}" stroke-width="1.5" stroke-dasharray="8,4"/>`);

  /* Motor block */
  E.push(`<rect x="${cx - mW / 2}" y="${mTop}" width="${mW}" height="${mH}"
    fill="${_DIAG_NAVY}" rx="4"/>`);
  E.push(`<text x="${cx}" y="${mTop + mH / 2 + 3.5}"
    text-anchor="middle" font-size="10.5" fill="white"
    font-family="Segoe UI,sans-serif" font-weight="700" letter-spacing="0.4">MOTOR</text>`);

  /* Width dimension (bottom) */
  const botArrY = tBot + 22;
  E.push(`<line x1="${tX}" y1="${botArrY}" x2="${tX + tW}" y2="${botArrY}"
    stroke="${_DIAG_DIM}" stroke-width="1"
    marker-start="url(#daR)" marker-end="url(#da)"/>`);
  E.push(`<text x="${cx}" y="${botArrY + 14}" ${tf} text-anchor="middle">${widthLabel}</text>`);

  /* Clearance Hb – left side (P1 to bottom) */
  if (showHb && propH[0] !== null && propH[0] !== undefined && D1_m > 0) {
    const py0 = Y(propH[0]);
    const lx  = tX - 18;
    const mid = (py0 + tBot) / 2;
    E.push(`<line x1="${lx}" y1="${py0}" x2="${lx}" y2="${tBot}"
      stroke="${_DIAG_DIM}" stroke-width="1"
      marker-start="url(#daR)" marker-end="url(#da)"/>`);
    E.push(`<text x="${lx - 6}" y="${mid - 8}"
      ${tf} text-anchor="end" font-style="italic">Hb</text>`);
    E.push(`<text x="${lx - 6}" y="${mid + 6}"
      ${tf} text-anchor="end">${clearance.toFixed(3)} m</text>`);
  }
}

function _diagHeightAnnotations(E, tX, tW, tY, tBot, liquidY, alturaUtil, alturaTotal) {
  const tf = `font-family="Segoe UI,sans-serif" font-size="13" fill="${_DIAG_DIM}"`;
  const rx1 = tX + tW + 20;
  E.push(`<line x1="${rx1}" y1="${tY}" x2="${rx1}" y2="${tBot}"
    stroke="${_DIAG_DIM}" stroke-width="1"
    marker-start="url(#daR)" marker-end="url(#da)"/>`);
  E.push(`<text x="${rx1 + 8}" y="${(tY + tBot) / 2 + 4}"
    ${tf}>H = ${alturaTotal.toFixed(2)} m</text>`);

  if (alturaUtil < alturaTotal - 0.02) {
    const rx2 = tX + tW + 72;
    E.push(`<line x1="${rx2}" y1="${liquidY}" x2="${rx2}" y2="${tBot}"
      stroke="${_DIAG_BLUEMID}" stroke-width="1"
      marker-start="url(#daBR)" marker-end="url(#daB)"/>`);
    E.push(`<text x="${rx2 + 8}" y="${(liquidY + tBot) / 2 + 4}"
      font-family="Segoe UI,sans-serif" font-size="13" fill="${_DIAG_BLUEMID}">
      Hú = ${alturaUtil.toFixed(2)} m</text>`);
  }
}

function drawTankDiagram() {
  const svg = document.getElementById('tankDiagram');
  if (!svg) return;

  /* ── Read current inputs ── */
  const tipoTanque  = document.querySelector('input[name="tipoTanque"]:checked')?.value || 'CIRCULAR';
  const alturaUtil  = parseFloat(document.getElementById('alturaUtil').value)  || 0;
  const alturaTotal = parseFloat(document.getElementById('alturaTotal').value) || 0;
  const bafles      = document.querySelector('input[name="bafles"]:checked')?.value === 'SI';

  /* Propeller data [0]=P1 (bottom) … [3]=P4 (top) */
  const props = [1, 2, 3, 4].map(n => {
    const tipo = document.getElementById('tipo'  + n)?.value || 'N.A.';
    const D_mm = parseFloat(document.getElementById('diam' + n)?.value) || 0;
    return { active: tipo !== 'N.A.' && D_mm > 0, D_m: D_mm / 1000 };
  });
  const D1_m = props[0].D_m;
  const geometry = getAgitatorGeometry();
  if (!Number.isFinite(geometry.length) || !Number.isFinite(geometry.clearance)) {
    _diagEmpty(svg);
    return;
  }
  const clearance = geometry.clearance;
  const propH = geometry.positions.map(h =>
    h !== null && Number.isFinite(h) && h >= 0 && h <= alturaTotal + 0.001 ? h : null);
  const activePropNames = props.map((p, i) => p.active ? `P${i + 1}` : null).filter(Boolean);

  if (tipoTanque === 'CIRCULAR') {
    const tankDiam = parseFloat(document.getElementById('diametro').value) || 0;
    if (alturaUtil <= 0 || alturaTotal <= 0 || tankDiam <= 0) {
      _diagEmpty(svg);
      return;
    }
    _drawCircularDiagram(svg, {
      alturaUtil, alturaTotal, bafles, props, D1_m, clearance, propH,
      activePropNames, tankDiam,
    });
    return;
  }

  /* RECTANGULAR – two elevation views sharing the same vertical scale */
  const ancho    = parseFloat(document.getElementById('ancho').value)    || 0;
  const longitud = parseFloat(document.getElementById('longitud').value) || 0;
  if (alturaUtil <= 0 || alturaTotal <= 0 || ancho <= 0 || longitud <= 0) {
    _diagEmpty(svg);
    return;
  }
  _drawRectangularDiagram(svg, {
    alturaUtil, alturaTotal, bafles, props, D1_m, clearance, propH,
    activePropNames, ancho, longitud,
  });
}

function _diagEmpty(svg) {
  svg.setAttribute('viewBox', '0 0 580 440');
  svg.innerHTML =
    `<text x="290" y="220" text-anchor="middle" fill="#9ba3ae"
           font-size="15" font-family="Segoe UI,sans-serif">
       Ingrese dimensiones válidas para ver el diagrama
     </text>`;
}

function _drawCircularDiagram(svg, p) {
  const { alturaUtil, alturaTotal, bafles, props, D1_m, clearance, propH, activePropNames, tankDiam } = p;

  const W = 580, H = 440;
  const ML = 90, MR = 150, MT = 55, MB = 62;
  const drawW = W - ML - MR;
  const drawH = H - MT - MB;

  const sc = Math.min(drawH / alturaTotal, drawW / (tankDiam * 1.9));
  const tW   = tankDiam * sc;
  const tY   = MT;
  const tBot = tY + alturaTotal * sc;
  const tX   = ML + (drawW - tW) / 2;
  const cx   = tX + tW / 2;
  const Y    = h => tBot - h * sc;
  const liquidY = Y(alturaUtil);
  const mH = 20, mW = Math.min(Math.max(tW * 0.3, 32), 52);
  const mTop = tY - mH - 4;

  svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
  const E = [_diagDefs()];

  _diagRenderPanel(E, {
    tX, tW, tY, tBot, sc, cx, Y,
    alturaUtil, liquidY, bafles, bafRefDim: tankDiam,
    props, propH, D1_m, clearance,
    mTop, mH, mW,
    widthLabel: `Ø ${tankDiam.toFixed(2)} m`,
    showHb: true, showTitle: null,
  });

  _diagHeightAnnotations(E, tX, tW, tY, tBot, liquidY, alturaUtil, alturaTotal);

  E.push(`<text x="${cx}" y="${tBot + 52}"
    text-anchor="middle" font-size="13" fill="${_DIAG_NAVY}" font-weight="600"
    font-family="Segoe UI,sans-serif">Tanque cilíndrico</text>`);

  _diagLegend(E, W - MR + 12, MT, props, activePropNames);

  E.push(`<text x="${W / 2}" y="${H - 8}"
    text-anchor="middle" font-size="11" fill="#94a3b8"
    font-family="Segoe UI,sans-serif" font-style="italic">
    Vista de elevación – escala aproximada – posición de propelas estimada
  </text>`);

  svg.innerHTML = E.join('\n');
}

function _drawSquareDiagram(svg, p) {
  const { alturaUtil, alturaTotal, bafles, props, D1_m, clearance, propH, activePropNames, ancho } = p;

  const W = 580, H = 440;
  const ML = 90, MR = 150, MT = 55, MB = 62;
  const drawW = W - ML - MR;
  const drawH = H - MT - MB;

  const sc = Math.min(drawH / alturaTotal, drawW / (ancho * 1.9));
  const tW   = ancho * sc;
  const tY   = MT;
  const tBot = tY + alturaTotal * sc;
  const tX   = ML + (drawW - tW) / 2;
  const cx   = tX + tW / 2;
  const Y    = h => tBot - h * sc;
  const liquidY = Y(alturaUtil);
  const mH = 20, mW = Math.min(Math.max(tW * 0.3, 32), 52);
  const mTop = tY - mH - 4;

  svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
  const E = [_diagDefs()];

  _diagRenderPanel(E, {
    tX, tW, tY, tBot, sc, cx, Y,
    alturaUtil, liquidY, bafles, bafRefDim: ancho,
    props, propH, D1_m, clearance,
    mTop, mH, mW,
    widthLabel: `Ancho = Longitud = ${ancho.toFixed(2)} m`,
    showHb: true, showTitle: null,
  });

  _diagHeightAnnotations(E, tX, tW, tY, tBot, liquidY, alturaUtil, alturaTotal);

  E.push(`<text x="${cx}" y="${tBot + 52}"
    text-anchor="middle" font-size="13" fill="${_DIAG_NAVY}" font-weight="600"
    font-family="Segoe UI,sans-serif">Tanque rectangular (planta cuadrada)</text>`);

  _diagLegend(E, W - MR + 12, MT, props, activePropNames);

  E.push(`<text x="${W / 2}" y="${H - 8}"
    text-anchor="middle" font-size="11" fill="#94a3b8"
    font-family="Segoe UI,sans-serif" font-style="italic">
    Vista de elevación – escala aproximada – posición de propelas estimada
  </text>`);

  svg.innerHTML = E.join('\n');
}

function _drawRectangularDiagram(svg, p) {
  const { alturaUtil, alturaTotal, bafles, props, D1_m, clearance, propH, activePropNames, ancho, longitud } = p;

  /* Square tank (ancho === longitud): a single view is enough */
  if (Math.abs(ancho - longitud) < 0.005) {
    _drawSquareDiagram(svg, p);
    return;
  }

  const W = 900, H = 460;
  const MR = 150, MT = 80, MB = 62;
  const GAP = 60;                         // space between the two panels (height dimension lives here)
  const ML = 60;
  const drawW = W - ML - MR - GAP;
  const drawH = H - MT - MB;
  const panelMaxW = drawW / 2;

  const sc = Math.min(drawH / alturaTotal, panelMaxW / Math.max(ancho, longitud));

  const tY   = MT;
  const tBot = tY + alturaTotal * sc;
  const Y    = h => tBot - h * sc;
  const liquidY = Y(alturaUtil);

  /* Panel 1 – front view (width = ancho) */
  const t1W = ancho * sc;
  const t1X = ML + (panelMaxW - t1W) / 2;
  const cx1 = t1X + t1W / 2;

  /* Panel 2 – side view (width = longitud) */
  const panel2SlotX = ML + panelMaxW + GAP;
  const t2W = longitud * sc;
  const t2X = panel2SlotX + (panelMaxW - t2W) / 2;
  const cx2 = t2X + t2W / 2;

  const mH = 20;
  const mW1 = Math.min(Math.max(t1W * 0.3, 32), 52);
  const mW2 = Math.min(Math.max(t2W * 0.3, 32), 52);
  const mTop = tY - mH - 4;

  svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
  const E = [_diagDefs()];

  _diagRenderPanel(E, {
    tX: t1X, tW: t1W, tY, tBot, sc, cx: cx1, Y,
    alturaUtil, liquidY, bafles, bafRefDim: ancho,
    props, propH, D1_m, clearance,
    mTop, mH, mW: mW1,
    widthLabel: `Ancho = ${ancho.toFixed(2)} m`,
    showHb: true, showTitle: 'VISTA FRONTAL (ANCHO)',
  });

  _diagRenderPanel(E, {
    tX: t2X, tW: t2W, tY, tBot, sc, cx: cx2, Y,
    alturaUtil, liquidY, bafles, bafRefDim: longitud,
    props, propH, D1_m, clearance,
    mTop, mH, mW: mW2,
    widthLabel: `Longitud = ${longitud.toFixed(2)} m`,
    showHb: false, showTitle: 'VISTA LATERAL (LONGITUD)',
  });

  /* Shared height dimension, anchored to the right edge of panel 2 */
  _diagHeightAnnotations(E, t2X, t2W, tY, tBot, liquidY, alturaUtil, alturaTotal);

  E.push(`<text x="${(cx1 + cx2) / 2}" y="${tBot + 52}"
    text-anchor="middle" font-size="13" fill="${_DIAG_NAVY}" font-weight="600"
    font-family="Segoe UI,sans-serif">Tanque rectangular</text>`);

  _diagLegend(E, W - MR + 12, MT, props, activePropNames);

  E.push(`<text x="${W / 2}" y="${H - 8}"
    text-anchor="middle" font-size="11" fill="#94a3b8"
    font-family="Segoe UI,sans-serif" font-style="italic">
    Vistas de elevación ortogonales a escala – misma posición de propelas en ambas
  </text>`);

  svg.innerHTML = E.join('\n');
}

/* =====================================================
   TOP VIEW – plan diagram (looking down from above).
   Drawn at the exact same px/m scale as the elevation
   view, showing tank outline, baffles, shaft/motor at
   the center, and every active propeller as a concentric
   circle colour-matched to the elevation legend.
   ===================================================== */

/* Replicates the sc used by the matching elevation panel so both views align. */
function _diagElevationScale(tipoTanque, alturaTotal, tankDiam, ancho, longitud) {
  if (tipoTanque === 'CIRCULAR') {
    const drawW = 580 - 90 - 150, drawH = 440 - 55 - 62;
    return Math.min(drawH / alturaTotal, drawW / (tankDiam * 1.9));
  }
  if (Math.abs(ancho - longitud) < 0.005) {
    const drawW = 580 - 90 - 150, drawH = 440 - 55 - 62;
    return Math.min(drawH / alturaTotal, drawW / (ancho * 1.9));
  }
  const drawW = 900 - 60 - 150 - 60, drawH = 460 - 80 - 62;
  const panelMaxW = drawW / 2;
  return Math.min(drawH / alturaTotal, panelMaxW / Math.max(ancho, longitud));
}

const _DIAG_PROP_ANGLES = [315, 45, 135, 225]; // degrees, kept away from the 0/90/180/270 baffle slots

function drawTankTopView() {
  const svg = document.getElementById('tankDiagramTop');
  if (!svg) return;

  const tipoTanque  = document.querySelector('input[name="tipoTanque"]:checked')?.value || 'CIRCULAR';
  const bafles      = document.querySelector('input[name="bafles"]:checked')?.value === 'SI';
  const alturaTotal = parseFloat(document.getElementById('alturaTotal').value) || 0;

  const props = [1, 2, 3, 4].map(n => {
    const tipo = document.getElementById('tipo'  + n)?.value || 'N.A.';
    const D_mm = parseFloat(document.getElementById('diam' + n)?.value) || 0;
    return { active: tipo !== 'N.A.' && D_mm > 0, D_m: D_mm / 1000 };
  });
  const activePropNames = props.map((p, i) => p.active ? `P${i + 1}` : null).filter(Boolean);

  if (tipoTanque === 'CIRCULAR') {
    const tankDiam = parseFloat(document.getElementById('diametro').value) || 0;
    if (tankDiam <= 0 || alturaTotal <= 0) { _diagEmpty(svg); return; }
    const sc = _diagElevationScale('CIRCULAR', alturaTotal, tankDiam, 0, 0);
    _drawCircularTopView(svg, { tankDiam, bafles, props, activePropNames, sc });
    return;
  }

  const ancho    = parseFloat(document.getElementById('ancho').value)    || 0;
  const longitud = parseFloat(document.getElementById('longitud').value) || 0;
  if (ancho <= 0 || longitud <= 0 || alturaTotal <= 0) { _diagEmpty(svg); return; }
  const sc = _diagElevationScale('RECTANGULAR', alturaTotal, 0, ancho, longitud);
  _drawRectangularTopView(svg, { ancho, longitud, bafles, props, activePropNames, sc });
}

function _diagPropCirclesTop(E, cx, cy, props, sc) {
  props.forEach((pp, i) => {
    if (!pp.active) return;
    const col = _DIAG_PROPCOLS[i];
    const pr  = (pp.D_m / 2) * sc;
    const Dmm = Math.round(pp.D_m * 1000);
    E.push(`<circle cx="${cx}" cy="${cy}" r="${pr}" fill="none"
      stroke="${col}" stroke-width="2" stroke-dasharray="6,4"/>`);
    const rad = _DIAG_PROP_ANGLES[i] * Math.PI / 180;
    const lx  = cx + pr * Math.cos(rad), ly = cy + pr * Math.sin(rad);
    E.push(`<text x="${lx}" y="${ly}" font-size="11.5" font-weight="700" fill="${col}"
      font-family="Segoe UI,sans-serif" text-anchor="middle">P${i + 1} Ø${Dmm}</text>`);
  });
}

function _drawCircularTopView(svg, { tankDiam, bafles, props, activePropNames, sc }) {
  /* Fixed canvas matching the circular/square elevation box, so both SVGs render at the same CSS scale. */
  const W = 580, H = 440, ML = 90, MR = 150, MT = 55, MB = 62;
  const drawW = W - ML - MR, drawH = H - MT - MB;
  const r  = (tankDiam * sc) / 2;
  const cx = ML + drawW / 2;
  const cy = MT + drawH / 2;

  svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
  const E = [_diagDefs()];

  /* Tank wall */
  E.push(`<circle cx="${cx}" cy="${cy}" r="${r}" fill="url(#liqGr)"
    stroke="${_DIAG_NAVY}" stroke-width="2.5"/>`);

  /* Baffles – 4 equally spaced radial plates */
  if (bafles) {
    const bafW = Math.max(r * 0.05, 3);
    [0, 90, 180, 270].forEach(deg => {
      const rad = deg * Math.PI / 180;
      const x1 = cx + (r - 1) * Math.cos(rad), y1 = cy + (r - 1) * Math.sin(rad);
      const x2 = cx + (r * 0.78) * Math.cos(rad), y2 = cy + (r * 0.78) * Math.sin(rad);
      E.push(`<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"
        stroke="#94a3b8" stroke-width="${bafW}" stroke-linecap="square"/>`);
    });
  }

  /* Active propellers – concentric circles colour-matched to the elevation legend */
  _diagPropCirclesTop(E, cx, cy, props, sc);

  /* Shaft/motor at center */
  E.push(`<circle cx="${cx}" cy="${cy}" r="5.5" fill="${_DIAG_NAVY}"/>`);

  /* Diameter dimension */
  const dimY = cy + r + 20;
  E.push(`<line x1="${cx - r}" y1="${dimY}" x2="${cx + r}" y2="${dimY}"
    stroke="${_DIAG_DIM}" stroke-width="1" marker-start="url(#daR)" marker-end="url(#da)"/>`);
  E.push(`<text x="${cx}" y="${dimY + 14}" text-anchor="middle" font-size="13"
    fill="${_DIAG_DIM}" font-family="Segoe UI,sans-serif">Ø ${tankDiam.toFixed(2)} m</text>`);

  E.push(`<text x="${cx}" y="${MT - 12}" text-anchor="middle" font-size="12.5"
    font-weight="700" fill="${_DIAG_NAVY}" font-family="Segoe UI,sans-serif">VISTA SUPERIOR</text>`);

  _diagLegend(E, W - MR + 12, MT, props, activePropNames);

  E.push(`<text x="${W / 2}" y="${H - 8}" text-anchor="middle" font-size="11"
    fill="#94a3b8" font-family="Segoe UI,sans-serif" font-style="italic">
    Vista en planta – misma escala que la vista frontal</text>`);

  svg.innerHTML = E.join('\n');
}

function _drawRectangularTopView(svg, { ancho, longitud, bafles, props, activePropNames, sc }) {
  /* Fixed canvas matching the rectangular elevation box, so both SVGs render at the same CSS scale. */
  const W = 900, H = 460, ML = 60, MR = 150, MT = 80, MB = 62;
  const drawW = W - ML - MR, drawH = H - MT - MB;
  const tW = longitud * sc, tH = ancho * sc;
  const tX = ML + (drawW - tW) / 2;
  const tY = MT + (drawH - tH) / 2;
  const cx = tX + tW / 2, cy = tY + tH / 2;

  svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
  const E = [_diagDefs()];

  /* Tank outline */
  E.push(`<rect x="${tX}" y="${tY}" width="${tW}" height="${tH}" fill="url(#liqGr)"
    stroke="${_DIAG_NAVY}" stroke-width="2.5"/>`);

  /* Baffles – one centered on each wall */
  if (bafles) {
    const bafThk = Math.max(Math.min(tW, tH) * 0.03, 3);
    const bafLen = Math.min(tW, tH) * 0.18;
    E.push(`<rect x="${cx - bafThk / 2}" y="${tY}" width="${bafThk}" height="${bafLen}" fill="#94a3b8"/>`);
    E.push(`<rect x="${cx - bafThk / 2}" y="${tY + tH - bafLen}" width="${bafThk}" height="${bafLen}" fill="#94a3b8"/>`);
    E.push(`<rect x="${tX}" y="${cy - bafThk / 2}" width="${bafLen}" height="${bafThk}" fill="#94a3b8"/>`);
    E.push(`<rect x="${tX + tW - bafLen}" y="${cy - bafThk / 2}" width="${bafLen}" height="${bafThk}" fill="#94a3b8"/>`);
  }

  /* Active propellers – concentric circles colour-matched to the elevation legend */
  _diagPropCirclesTop(E, cx, cy, props, sc);

  /* Shaft/motor at center */
  E.push(`<circle cx="${cx}" cy="${cy}" r="5.5" fill="${_DIAG_NAVY}"/>`);

  /* Dimensions */
  const dimYBot = tY + tH + 20;
  E.push(`<line x1="${tX}" y1="${dimYBot}" x2="${tX + tW}" y2="${dimYBot}"
    stroke="${_DIAG_DIM}" stroke-width="1" marker-start="url(#daR)" marker-end="url(#da)"/>`);
  E.push(`<text x="${cx}" y="${dimYBot + 14}" text-anchor="middle" font-size="13"
    fill="${_DIAG_DIM}" font-family="Segoe UI,sans-serif">Longitud = ${longitud.toFixed(2)} m</text>`);

  const dimXLeft = tX - 20;
  E.push(`<line x1="${dimXLeft}" y1="${tY}" x2="${dimXLeft}" y2="${tY + tH}"
    stroke="${_DIAG_DIM}" stroke-width="1" marker-start="url(#daR)" marker-end="url(#da)"/>`);
  E.push(`<text x="${dimXLeft - 8}" y="${cy}" text-anchor="end" font-size="13"
    fill="${_DIAG_DIM}" font-family="Segoe UI,sans-serif"
    transform="rotate(-90 ${dimXLeft - 8} ${cy})">Ancho = ${ancho.toFixed(2)} m</text>`);

  E.push(`<text x="${cx}" y="${MT - 12}" text-anchor="middle" font-size="12.5"
    font-weight="700" fill="${_DIAG_NAVY}" font-family="Segoe UI,sans-serif">VISTA SUPERIOR</text>`);

  _diagLegend(E, W - MR + 12, MT, props, activePropNames);

  E.push(`<text x="${W / 2}" y="${H - 8}" text-anchor="middle" font-size="11"
    fill="#94a3b8" font-family="Segoe UI,sans-serif" font-style="italic">
    Vista en planta – misma escala que la vista frontal</text>`);

  svg.innerHTML = E.join('\n');
}
