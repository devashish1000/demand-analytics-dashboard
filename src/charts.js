import { formatters, round } from "./calculations.js";

const SVG_NS = "http://www.w3.org/2000/svg";

function svg(width, height, className = "chart") {
  const node = document.createElementNS(SVG_NS, "svg");
  node.setAttribute("viewBox", `0 0 ${width} ${height}`);
  node.setAttribute("role", "img");
  node.setAttribute("class", className);
  return node;
}

function el(name, attrs = {}, text = "") {
  const node = document.createElementNS(SVG_NS, name);
  Object.entries(attrs).forEach(([key, value]) => node.setAttribute(key, value));
  if (text) node.textContent = text;
  return node;
}

export function renderSparkline(container, values, options = {}) {
  container.replaceChildren();
  const width = options.width || 128;
  const height = options.height || 36;
  const node = svg(width, height, "sparkline");
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const points = values
    .map((value, index) => {
      const x = (index / (values.length - 1 || 1)) * width;
      const y = height - ((value - min) / span) * (height - 8) - 4;
      return `${round(x, 1)},${round(y, 1)}`;
    })
    .join(" ");
  node.appendChild(
    el("polyline", {
      points,
      fill: "none",
      stroke: options.color || "#2f7d48",
      "stroke-width": "2",
      "stroke-linecap": "round",
      "stroke-linejoin": "round"
    })
  );
  container.appendChild(node);
}

export function renderWaterfall(container, bridge) {
  container.replaceChildren();
  const width = 620;
  const height = 250;
  const pad = { top: 26, right: 22, bottom: 48, left: 46 };
  const node = svg(width, height, "chart waterfall-chart");
  const max = Math.max(...bridge.map((item) => Math.abs(item.value)), 0.3);
  const minValue = Math.min(...bridge.map((item) => item.type ? item.value : 0.14));
  const maxValue = Math.max(...bridge.map((item) => item.type ? item.value : 0.3), 0.3);
  const yScale = (value) => {
    const usable = height - pad.top - pad.bottom;
    return pad.top + (maxValue - value) / (maxValue - minValue || 1) * usable;
  };
  const xStep = (width - pad.left - pad.right) / bridge.length;

  [0.15, 0.2, 0.25, 0.3].forEach((tick) => {
    const y = yScale(tick);
    node.appendChild(el("line", { x1: pad.left, x2: width - pad.right, y1: y, y2: y, class: "grid-line" }));
    node.appendChild(el("text", { x: 12, y: y + 4, class: "axis-label" }, formatters.percent(tick, 0)));
  });

  let cursor = bridge[0].value;
  bridge.forEach((item, index) => {
    const x = pad.left + index * xStep + 12;
    const barWidth = xStep - 24;
    let y;
    let barHeight;
    let colorClass;
    if (item.type === "start" || item.type === "end") {
      y = yScale(item.value);
      barHeight = Math.max(3, yScale(minValue) - y);
      colorClass = "bar-total";
    } else {
      const next = cursor + item.value;
      y = yScale(Math.max(cursor, next));
      barHeight = Math.max(3, Math.abs(yScale(cursor) - yScale(next)));
      colorClass = item.value >= 0 ? "bar-good" : "bar-bad";
      node.appendChild(
        el("line", {
          x1: x - 12,
          x2: x,
          y1: yScale(cursor),
          y2: yScale(cursor),
          class: "connector-line"
        })
      );
      cursor = next;
    }
    node.appendChild(el("rect", { x, y, width: barWidth, height: barHeight, rx: 2, class: colorClass }));
    node.appendChild(
      el(
        "text",
        { x: x + barWidth / 2, y: y - 8, class: item.value >= 0 ? "value-label good" : "value-label bad", "text-anchor": "middle" },
        item.type ? formatters.percent(item.value) : formatters.points(item.value)
      )
    );
    node.appendChild(
      el("text", { x: x + barWidth / 2, y: height - 24, class: "axis-label", "text-anchor": "middle" }, splitLabel(item.label)[0])
    );
    node.appendChild(
      el("text", { x: x + barWidth / 2, y: height - 10, class: "axis-label", "text-anchor": "middle" }, splitLabel(item.label)[1] || "")
    );
  });

  container.appendChild(node);
}

export function renderDonut(container, rows) {
  container.replaceChildren();
  const width = 260;
  const height = 220;
  const cx = 105;
  const cy = 108;
  const radius = 72;
  const thickness = 34;
  const node = svg(width, height, "chart donut-chart");
  let startAngle = -90;

  rows.forEach((row) => {
    const endAngle = startAngle + row.pct * 360;
    const path = donutSegment(cx, cy, radius, thickness, startAngle, endAngle);
    node.appendChild(el("path", { d: path, fill: row.color, stroke: "#fff", "stroke-width": "2" }));
    startAngle = endAngle;
  });

  node.appendChild(el("text", { x: cx, y: cy - 4, class: "donut-center", "text-anchor": "middle" }, formatters.currency(rows.reduce((sum, row) => sum + row.value, 0), true)));
  node.appendChild(el("text", { x: cx, y: cy + 18, class: "axis-label", "text-anchor": "middle" }, "net sales"));
  container.appendChild(node);
}

export function renderForecast(container, series) {
  container.replaceChildren();
  const width = 650;
  const height = 290;
  const pad = { top: 22, right: 24, bottom: 38, left: 46 };
  const node = svg(width, height, "chart forecast-chart");
  const values = series.flatMap((row) => [row.baseMarginPct, row.scenarioMarginPct]);
  const min = Math.min(0.1, ...values) - 0.01;
  const max = Math.max(0.3, ...values) + 0.01;
  const x = (index) => pad.left + (index / (series.length - 1)) * (width - pad.left - pad.right);
  const y = (value) => pad.top + (max - value) / (max - min) * (height - pad.top - pad.bottom);

  [0.1, 0.15, 0.2, 0.25, 0.3].forEach((tick) => {
    const tickY = y(tick);
    node.appendChild(el("line", { x1: pad.left, x2: width - pad.right, y1: tickY, y2: tickY, class: "grid-line" }));
    node.appendChild(el("text", { x: 10, y: tickY + 4, class: "axis-label" }, formatters.percent(tick, 0)));
  });

  node.appendChild(linePath(series.map((row, index) => [x(index), y(row.baseMarginPct)]), "forecast-base"));
  node.appendChild(linePath(series.map((row, index) => [x(index), y(row.scenarioMarginPct)]), "forecast-scenario"));
  node.appendChild(el("line", { x1: pad.left, x2: width - pad.right, y1: y(0.2), y2: y(0.2), class: "target-line" }));

  series.forEach((row, index) => {
    if (index % 2 === 0 || index === series.length - 1) {
      node.appendChild(el("text", { x: x(index), y: height - 12, class: "axis-label", "text-anchor": "middle" }, `W${index + 1}`));
    }
  });

  container.appendChild(node);
}

export function renderBarTrend(container, rows, accessor, labelAccessor) {
  container.replaceChildren();
  const width = 520;
  const height = 220;
  const pad = { top: 18, right: 16, bottom: 56, left: 44 };
  const node = svg(width, height, "chart bar-chart");
  const values = rows.map(accessor);
  const max = Math.max(...values, 1);
  const step = (width - pad.left - pad.right) / rows.length;

  [0.1, 0.2, 0.3].forEach((tick) => {
    const y = pad.top + (1 - tick / max) * (height - pad.top - pad.bottom);
    node.appendChild(el("line", { x1: pad.left, x2: width - pad.right, y1: y, y2: y, class: "grid-line" }));
  });

  rows.forEach((row, index) => {
    const value = accessor(row);
    const h = (value / max) * (height - pad.top - pad.bottom);
    const x = pad.left + index * step + 8;
    const y = height - pad.bottom - h;
    node.appendChild(el("rect", { x, y, width: step - 16, height: h, rx: 3, class: value < 0.34 ? "bar-bad" : value > 0.52 ? "bar-good" : "bar-neutral" }));
    node.appendChild(el("text", { x: x + (step - 16) / 2, y: height - 34, class: "axis-label", "text-anchor": "middle" }, splitLabel(labelAccessor(row))[0]));
    node.appendChild(el("text", { x: x + (step - 16) / 2, y: height - 19, class: "axis-label", "text-anchor": "middle" }, splitLabel(labelAccessor(row))[1] || ""));
  });

  container.appendChild(node);
}

function linePath(points, className) {
  const d = points.map(([x, y], index) => `${index === 0 ? "M" : "L"} ${round(x, 1)} ${round(y, 1)}`).join(" ");
  return el("path", { d, fill: "none", class: className });
}

function donutSegment(cx, cy, r, thickness, startAngle, endAngle) {
  const outerStart = polar(cx, cy, r, endAngle);
  const outerEnd = polar(cx, cy, r, startAngle);
  const innerStart = polar(cx, cy, r - thickness, endAngle);
  const innerEnd = polar(cx, cy, r - thickness, startAngle);
  const largeArc = endAngle - startAngle <= 180 ? "0" : "1";
  return [
    "M", outerStart.x, outerStart.y,
    "A", r, r, 0, largeArc, 0, outerEnd.x, outerEnd.y,
    "L", innerEnd.x, innerEnd.y,
    "A", r - thickness, r - thickness, 0, largeArc, 1, innerStart.x, innerStart.y,
    "Z"
  ].join(" ");
}

function polar(cx, cy, r, angle) {
  const radians = ((angle - 90) * Math.PI) / 180;
  return {
    x: round(cx + r * Math.cos(radians), 2),
    y: round(cy + r * Math.sin(radians), 2)
  };
}

function splitLabel(label) {
  const words = String(label).split(" ");
  if (words.length <= 2) return [label];
  const midpoint = Math.ceil(words.length / 2);
  return [words.slice(0, midpoint).join(" "), words.slice(midpoint).join(" ")];
}
