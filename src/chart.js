const THEMES = {
  light: {
    background: "#ffffff",
    text: "#111827",
    axis: "#111827",
    line: "#38bdf8",
  },
  dark: {
    background: "#0d1117",
    text: "#f0f6fc",
    axis: "#c9d1d9",
    line: "#58a6ff",
  },
};

function escapeXml(value) {
  return value.replace(/[<>&"']/g, (character) => ({
    "<": "&lt;",
    ">": "&gt;",
    "&": "&amp;",
    '"': "&quot;",
    "'": "&apos;",
  })[character]);
}

function formatDate(timestamp) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(timestamp);
}

function smoothPath(points) {
  if (points.length === 0) return "";
  if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;

  let path = `M ${points[0].x.toFixed(2)} ${points[0].y.toFixed(2)}`;
  for (let index = 1; index < points.length - 1; index += 1) {
    const point = points[index];
    const next = points[index + 1];
    path += ` Q ${point.x.toFixed(2)} ${point.y.toFixed(2)} ${((point.x + next.x) / 2).toFixed(2)} ${((point.y + next.y) / 2).toFixed(2)}`;
  }

  const last = points.at(-1);
  return `${path} L ${last.x.toFixed(2)} ${last.y.toFixed(2)}`;
}

export function renderChart(repository, history, theme = "light") {
  const colors = THEMES[theme];
  const width = 1200;
  const height = 800;
  const padding = { top: 118, right: 110, bottom: 116, left: 110 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;
  const chartEnd = width - padding.right;
  const chartBottom = padding.top + chartHeight;
  const firstDate = Date.parse(history.createdAt);
  const lastDate = Date.now();
  const duration = Math.max(lastDate - firstDate, 1);
  const maxStars = Math.max(history.totalStars, 1);
  const samples = [
    { starredAt: history.createdAt, stars: 0 },
    ...history.samples,
    { starredAt: new Date(lastDate).toISOString(), stars: history.totalStars },
  ];
  const points = samples.map(({ starredAt, stars }) => {
    const timestamp = Date.parse(starredAt);
    return {
      x: padding.left + ((timestamp - firstDate) / duration) * chartWidth,
      y: chartBottom - (stars / maxStars) * chartHeight,
    };
  });
  const linePath = smoothPath(points.length === 1 ? [{ x: padding.left, y: chartBottom }, points[0]] : points);
  const yTicks = [0, 0.25, 0.5, 0.75, 1].map((ratio) => {
    const y = chartBottom - ratio * chartHeight;
    return `<line x1="${padding.left - 8}" y1="${y}" x2="${padding.left}" y2="${y}"/><text x="${padding.left - 20}" y="${y + 6}" text-anchor="end">${Math.round(maxStars * ratio).toLocaleString()}</text>`;
  }).join("");
  const xTicks = [0, 0.25, 0.5, 0.75, 1].map((ratio) => {
    const x = padding.left + ratio * chartWidth;
    return `<line x1="${x}" y1="${chartBottom}" x2="${x}" y2="${chartBottom + 8}"/><text x="${x}" y="${chartBottom + 34}" text-anchor="middle">${formatDate(firstDate + ratio * duration)}</text>`;
  }).join("");
  const lastPoint = points.at(-1) ?? { x: padding.left, y: chartBottom };
  const labelX = chartEnd + 20;
  const labelY = Math.max(lastPoint.y - 18, padding.top + 24);

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-labelledby="title description">
  <title id="title">Star history for ${escapeXml(repository)}</title>
  <desc id="description">${history.totalStars} GitHub stars from ${formatDate(firstDate)} to ${formatDate(lastDate)}</desc>
  <defs>
    <filter id="xkcdify" x="-5%" y="-5%" width="110%" height="110%"><feTurbulence type="fractalNoise" baseFrequency="0.018" numOctaves="1" seed="7" result="noise"/><feDisplacementMap in="SourceGraphic" in2="noise" scale="1.4" xChannelSelector="R" yChannelSelector="G"/></filter>
  </defs>
  <rect width="100%" height="100%" fill="${colors.background}"/>
  <style>text{font-family:"Comic Sans MS","Chalkboard SE",cursive;fill:${colors.text};font-size:19px}.title{font-size:34px;font-weight:700}.axis-label{font-size:23px}.legend{font-size:21px}.credit{font-size:17px;opacity:.55}.axis{stroke:${colors.axis};stroke-width:2.4;fill:none}.tick{stroke:${colors.axis};stroke-width:2}.line{fill:none;stroke:${colors.line};stroke-width:4.5;stroke-linecap:round;stroke-linejoin:round}.endpoint{fill:${colors.background};stroke:${colors.line};stroke-width:4}.final{font-size:22px;font-weight:700}</style>
  <text class="title" x="${padding.left}" y="58">Star History</text>
  <g filter="url(#xkcdify)">
    <path class="axis" d="M ${padding.left} ${padding.top} V ${chartBottom} H ${chartEnd}"/>
    <g class="tick">${yTicks}${xTicks}</g>
    <path class="line" d="${linePath}"/>
  </g>
  <circle cx="${padding.left + 14}" cy="${padding.top + 29}" r="7" fill="${colors.line}"/>
  <text class="legend" x="${padding.left + 30}" y="${padding.top + 36}">${escapeXml(repository)}</text>
  <circle class="endpoint" cx="${lastPoint.x}" cy="${lastPoint.y}" r="7"/>
  <text class="final" x="${labelX}" y="${labelY}">${history.totalStars.toLocaleString()}</text>
  <text class="axis-label" x="${padding.left + chartWidth / 2}" y="${height - 28}" text-anchor="middle">Date</text>
  <text class="axis-label" x="33" y="${padding.top + chartHeight / 2}" text-anchor="middle" transform="rotate(-90 33 ${padding.top + chartHeight / 2})">GitHub Stars</text>
  <text class="credit" x="${width - 24}" y="${height - 24}" text-anchor="end">generated by starfolio</text>
</svg>`;
}
