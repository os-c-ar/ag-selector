/* =====================================================
   NFS – Tank & Agitator Elevation Diagram
   Draws a scaled SVG side-view of the tank and agitator.
   Called from calculate() on every input change.
   ===================================================== */

'use strict';

function drawTankDiagram() {
  const svg = document.getElementById('tankDiagram');
  if (!svg) return;

  /* ── Read current inputs ── */
  const tipoTanque  = document.querySelector('input[name="tipoTanque"]:checked')?.value || 'CIRCULAR';
  const alturaUtil  = parseFloat(document.getElementById('alturaUtil').value)  || 0;
  const alturaTotal = parseFloat(document.getElementById('alturaTotal').value) || 0;
  const pct         = (parseFloat(document.getElementById('pctFondo').value) || 90) / 100;
  const bafles      = document.querySelector('input[name="bafles"]:checked')?.value === 'SI';

  /* Tank diameter */
  let tankDiam;
  if (tipoTanque === 'CIRCULAR') {
    tankDiam = parseFloat(document.getElementById('diametro').value) || 0;
  } else {
    const equiv = parseFloat(document.getElementById('diametroEquiv').value);
    if (equiv > 0) {
      tankDiam = equiv;
    } else {
      const a = parseFloat(document.getElementById('ancho').value)    || 0;
      const l = parseFloat(document.getElementById('longitud').value)  || 0;
      tankDiam = (a > 0 && l > 0) ? Math.sqrt(4 * a * l / Math.PI) : 0;
    }
  }

  /* Propeller data [0]=P1 (bottom) … [3]=P4 (top) */
  const props = [1, 2, 3, 4].map(n => {
    const tipo = document.getElementById('tipo'  + n)?.value || 'N.A.';
    const D_mm = parseFloat(document.getElementById('diam' + n)?.value) || 0;
    return { active: tipo !== 'N.A.' && D_mm > 0, D_m: D_mm / 1000 };
  });
  const D1_m = props[0].D_m;

  /* ── Guard: need valid dimensions ── */
  if (alturaUtil <= 0 || alturaTotal <= 0 || tankDiam <= 0) {
    svg.innerHTML =
      `<text x="290" y="220" text-anchor="middle" fill="#9ba3ae"
             font-size="15" font-family="Segoe UI,sans-serif">
         Ingrese dimensiones válidas para ver el diagrama
       </text>`;
    return;
  }

  /* ── SVG canvas constants ── */
  const W = 580, H = 440;
  const ML = 90, MR = 150, MT = 55, MB = 62;
  const drawW = W - ML - MR;
  const drawH = H - MT - MB;

  /* Uniform scale: fit tank keeping aspect ratio, leaving room for baffles */
  const sc = Math.min(drawH / alturaTotal, drawW / (tankDiam * 1.9));

  const tW      = tankDiam   * sc;         // tank pixel width
  const tH      = alturaTotal * sc;        // tank pixel height
  const tX      = ML + (drawW - tW) / 2;  // tank left edge
  const tY      = MT;                      // tank top edge
  const tBot    = tY + tH;                 // tank bottom edge
  const cx      = tX + tW / 2;            // shaft centre X

  /* Convert real height-from-bottom → SVG Y */
  const Y = h => tBot - h * sc;

  const liquidY    = Y(alturaUtil);
  const clearance  = D1_m > 0 ? pct * D1_m : 0.05 * alturaTotal;
  const shaftBotY  = Y(clearance);

  /* Motor block */
  const mH = 20, mW = Math.min(Math.max(tW * 0.3, 32), 52);
  const mTop = tY - mH - 4;

  /* Baffle width in px */
  const bafW = Math.max(tankDiam * 0.08 * sc, 5);

  /* Propeller heights from tank bottom (uses D1 spacing between propellers) */
  const propH = props.map((p, i) => {
    if (!p.active || D1_m <= 0) return null;
    const h = clearance + i * D1_m;
    return h <= alturaTotal + 0.001 ? h : null;
  });

  /* ── Colour palette ── */
  const navy    = '#0d2340';
  const blue    = '#1a4880';
  const blueMid = '#2062a8';
  const dim     = '#475569';
  const propCols = [navy, blue, blueMid, '#4a90c4'];

  const E = []; // SVG string parts

  /* ════════════════════════════════════════
     1. DEFS: markers (arrows) + gradients
     ════════════════════════════════════════ */
  E.push(`<defs>
    <marker id="da"  markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto">
      <polygon points="0,0 8,4 0,8" fill="${dim}"/>
    </marker>
    <marker id="daR" markerWidth="8" markerHeight="8" refX="2" refY="4" orient="auto">
      <polygon points="8,0 0,4 8,8" fill="${dim}"/>
    </marker>
    <marker id="daB"  markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto">
      <polygon points="0,0 8,4 0,8" fill="${blueMid}"/>
    </marker>
    <marker id="daBR" markerWidth="8" markerHeight="8" refX="2" refY="4" orient="auto">
      <polygon points="8,0 0,4 8,8" fill="${blueMid}"/>
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
  </defs>`);

  /* ════════════════════════════
     2. AIR SPACE (hatching)
     ════════════════════════════ */
  const airH = liquidY - tY;
  if (airH > 1) {
    E.push(`<rect x="${tX + 2}" y="${tY + 2}" width="${tW - 4}" height="${airH - 2}"
      fill="url(#airPat)"/>`);
  }

  /* ════════════════════════════
     3. LIQUID FILL
     ════════════════════════════ */
  E.push(`<rect x="${tX + 2}" y="${liquidY}" width="${tW - 4}"
    height="${tBot - liquidY - 2}" fill="url(#liqGr)"/>`);

  /* ════════════════════════════
     4. BAFFLES
     ════════════════════════════ */
  if (bafles && alturaUtil > 0) {
    const bfH = tBot - liquidY;
    E.push(`<rect x="${tX + 2}"          y="${liquidY}" width="${bafW}" height="${bfH}"
      fill="#94a3b8" rx="2"/>`);
    E.push(`<rect x="${tX + tW - bafW - 2}" y="${liquidY}" width="${bafW}" height="${bfH}"
      fill="#94a3b8" rx="2"/>`);
  }

  /* ════════════════════════════
     5. SHAFT – desde motor hasta P1
     ════════════════════════════ */
  const shaftThk  = Math.max(Math.min(tW * 0.025, 6), 3.5);
  const shaftTopY = mTop + mH;                  // fondo del bloque de motor
  const shaftLen  = shaftBotY - shaftTopY;      // longitud total en px
  E.push(`<rect x="${cx - shaftThk / 2}" y="${shaftTopY}"
    width="${shaftThk}" height="${shaftLen}"
    fill="url(#shaftGr)"/>`);

  /* ════════════════════════════
     6. PROPELLERS
     ════════════════════════════ */
  props.forEach((p, i) => {
    const h = propH[i];
    if (h === null || h === undefined) return;
    const py   = Y(h);
    const half = (p.D_m / 2) * sc;
    const col  = propCols[i];
    const Dmm  = Math.round(p.D_m * 1000);

    /* Blade shadow */
    E.push(`<line x1="${cx - half}" y1="${py + 1}" x2="${cx + half}" y2="${py + 1}"
      stroke="rgba(0,0,0,0.15)" stroke-width="7" stroke-linecap="round"/>`);
    /* Blade */
    E.push(`<line x1="${cx - half}" y1="${py}" x2="${cx + half}" y2="${py}"
      stroke="${col}" stroke-width="6" stroke-linecap="round"/>`);
    /* Hub */
    E.push(`<circle cx="${cx}" cy="${py}" r="5.5" fill="${col}"/>`);
    /* Labels */
    E.push(`<text x="${cx - half - 9}" y="${py + 4}"
      font-size="13" font-weight="700" fill="${col}"
      font-family="Segoe UI,sans-serif" text-anchor="end">P${i + 1}</text>`);
    E.push(`<text x="${cx + half + 9}" y="${py + 4}"
      font-size="12" fill="${col}" font-family="Segoe UI,sans-serif">
      Ø ${Dmm} mm</text>`);
  });

  /* ════════════════════════════
     7. TANK OUTLINE
     ════════════════════════════ */
  E.push(`<rect x="${tX}" y="${tY}" width="${tW}" height="${tH}"
    fill="none" stroke="${navy}" stroke-width="2.5"/>`);
  /* Bottom plate (double line) */
  E.push(`<line x1="${tX}" y1="${tBot}" x2="${tX + tW}" y2="${tBot}"
    stroke="${navy}" stroke-width="4.5" stroke-linecap="square"/>`);

  /* ════════════════════════════
     8. LIQUID LEVEL LINE
     ════════════════════════════ */
  E.push(`<line x1="${tX}" y1="${liquidY}" x2="${tX + tW}" y2="${liquidY}"
    stroke="${blueMid}" stroke-width="1.5" stroke-dasharray="8,4"/>`);
  E.push(`<text x="${tX + tW + 5}" y="${liquidY - 5}"
    font-size="11" fill="${blueMid}" font-family="Segoe UI,sans-serif">Nivel liq.</text>`);

  /* ════════════════════════════
     9. MOTOR BLOCK
     ════════════════════════════ */
  E.push(`<rect x="${cx - mW / 2}" y="${mTop}" width="${mW}" height="${mH}"
    fill="${navy}" rx="4"/>`);
  E.push(`<text x="${cx}" y="${mTop + mH / 2 + 3.5}"
    text-anchor="middle" font-size="10.5" fill="white"
    font-family="Segoe UI,sans-serif" font-weight="700" letter-spacing="0.4">MOTOR</text>`);

  /* ════════════════════════════════
     10. DIMENSION ANNOTATIONS
     ════════════════════════════════ */
  const tf = `font-family="Segoe UI,sans-serif" font-size="13" fill="${dim}"`;

  /* ── H total (right, outer) ── */
  const rx1 = tX + tW + 20;
  E.push(`<line x1="${rx1}" y1="${tY}" x2="${rx1}" y2="${tBot}"
    stroke="${dim}" stroke-width="1"
    marker-start="url(#daR)" marker-end="url(#da)"/>`);
  E.push(`<text x="${rx1 + 8}" y="${(tY + tBot) / 2 + 4}"
    ${tf}>H = ${alturaTotal.toFixed(2)} m</text>`);

  /* ── H útil (right, inner – only if different from total) ── */
  if (alturaUtil < alturaTotal - 0.02) {
    const rx2 = tX + tW + 72;
    E.push(`<line x1="${rx2}" y1="${liquidY}" x2="${rx2}" y2="${tBot}"
      stroke="${blueMid}" stroke-width="1"
      marker-start="url(#daBR)" marker-end="url(#daB)"/>`);
    E.push(`<text x="${rx2 + 8}" y="${(liquidY + tBot) / 2 + 4}"
      font-family="Segoe UI,sans-serif" font-size="13" fill="${blueMid}">
      Hú = ${alturaUtil.toFixed(2)} m</text>`);
  }

  /* ── Diameter (bottom) ── */
  const botArrY = tBot + 22;
  E.push(`<line x1="${tX}" y1="${botArrY}" x2="${tX + tW}" y2="${botArrY}"
    stroke="${dim}" stroke-width="1"
    marker-start="url(#daR)" marker-end="url(#da)"/>`);
  const dLbl = tipoTanque === 'CIRCULAR'
    ? `Ø ${tankDiam.toFixed(2)} m`
    : `${tankDiam.toFixed(2)} m (equiv.)`;
  E.push(`<text x="${cx}" y="${botArrY + 14}" ${tf} text-anchor="middle">${dLbl}</text>`);

  /* ── Tank type label ── */
  const typeStr = tipoTanque === 'CIRCULAR'
    ? 'Tanque cilíndrico'
    : 'Tanque rectangular';
  E.push(`<text x="${cx}" y="${tBot + 52}"
    text-anchor="middle" font-size="13" fill="${navy}" font-weight="600"
    font-family="Segoe UI,sans-serif">${typeStr}</text>`);

  /* ── Clearance Hb – left side (P1 to bottom) ── */
  if (propH[0] !== null && propH[0] !== undefined && D1_m > 0) {
    const py0 = Y(propH[0]);
    const lx  = tX - 18;
    const mid = (py0 + tBot) / 2;
    E.push(`<line x1="${lx}" y1="${py0}" x2="${lx}" y2="${tBot}"
      stroke="${dim}" stroke-width="1"
      marker-start="url(#daR)" marker-end="url(#da)"/>`);
    E.push(`<text x="${lx - 6}" y="${mid - 8}"
      ${tf} text-anchor="end" font-style="italic">Hb</text>`);
    E.push(`<text x="${lx - 6}" y="${mid + 6}"
      ${tf} text-anchor="end">${clearance.toFixed(3)} m</text>`);
  }

  /* ════════════════════
     11. LEGEND
     ════════════════════ */
  const lgX = W - MR + 12, lgY = MT;
  const legItems = [
    { col: '#3b82f6', label: 'Líquido',    opacity: '0.7' },
    { col: '#94a3b8', label: 'Bafles',     opacity: '1'   },
    { col: navy,      label: 'Eje / Motor',opacity: '1'   },
  ];
  E.push(`<text x="${lgX}" y="${lgY}" font-size="12" font-weight="700"
    fill="${dim}" font-family="Segoe UI,sans-serif">Referencia</text>`);
  legItems.forEach((item, i) => {
    const ly = lgY + 18 + i * 18;
    E.push(`<rect x="${lgX}" y="${ly - 9}" width="14" height="10"
      fill="${item.col}" opacity="${item.opacity}" rx="2"/>`);
    E.push(`<text x="${lgX + 20}" y="${ly}" font-size="12"
      fill="${dim}" font-family="Segoe UI,sans-serif">${item.label}</text>`);
  });
  /* Propeller legend entries */
  const activePropNames = props
    .map((p, i) => p.active ? `P${i + 1}` : null)
    .filter(Boolean);
  activePropNames.forEach((name, i) => {
    const ly = lgY + 18 + (legItems.length + i) * 18;
    const col = propCols[i];
    E.push(`<line x1="${lgX}" y1="${ly - 4}" x2="${lgX + 14}" y2="${ly - 4}"
      stroke="${col}" stroke-width="5" stroke-linecap="round"/>`);
    E.push(`<text x="${lgX + 20}" y="${ly}" font-size="12"
      fill="${dim}" font-family="Segoe UI,sans-serif">Propela ${name}</text>`);
  });

  /* ════════════════════
     12. FOOTER NOTE
     ════════════════════ */
  E.push(`<text x="${W / 2}" y="${H - 8}"
    text-anchor="middle" font-size="11" fill="#94a3b8"
    font-family="Segoe UI,sans-serif" font-style="italic">
    Vista de elevación – escala aproximada – posición de propelas estimada
  </text>`);

  svg.innerHTML = E.join('\n');
}
