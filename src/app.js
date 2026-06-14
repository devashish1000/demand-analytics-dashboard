import { BRANDS, CHANNELS, LOCATIONS, MENU_ITEMS, createSampleData, toSampleCsv } from "./data.js";
import {
  channelMix,
  comparePeriods,
  filterData,
  forecastSeries,
  formatters,
  locationPerformance,
  menuPerformance,
  summarize,
  varianceBridge,
  weeklySummary
} from "./calculations.js";
import { renderBarTrend, renderDonut, renderForecast, renderSparkline, renderWaterfall } from "./charts.js";
import { parseCsv, toCsv, validateUpload } from "./csv.js";
import { buildActionCsv, copySummary, downloadSummary, exportRows } from "./export.js";

const app = document.querySelector("#app");
const sampleData = createSampleData();
const storedActions = JSON.parse(localStorage.getItem("salted-actions") || "{}");

const state = {
  view: "overview",
  filters: {
    range: { start: "2026-05-05", end: "2026-05-11" },
    market: "all",
    district: "all",
    locationId: "all",
    brandId: "all",
    channelId: "all"
  },
  scenario: {
    directMixLift: 5,
    foodInflation: 0,
    volumeGrowth: 2,
    laborEfficiency: 1,
    refundReduction: 0.7
  },
  menuSort: "marginAsc",
  uploadRows: [],
  uploadKind: "orders",
  toast: ""
};

const nav = [
  { id: "overview", label: "executive overview", icon: "home" },
  { id: "pnl", label: "location P&L", icon: "ledger" },
  { id: "menu", label: "menu margin", icon: "grid" },
  { id: "forecast", label: "rolling forecast", icon: "trend" },
  { id: "actions", label: "operator actions", icon: "user" },
  { id: "summary", label: "weekly summary", icon: "calendar" },
  { id: "upload", label: "data upload", icon: "upload" },
  { id: "dictionary", label: "data dictionary", icon: "book" }
];

const locationById = Object.fromEntries(LOCATIONS.map((location) => [location.id, location]));
const brandById = Object.fromEntries(BRANDS.map((brand) => [brand.id, brand]));
const channelById = Object.fromEntries(CHANNELS.map((channel) => [channel.id, channel]));

function currentActions() {
  return sampleData.actions.map((action) => ({
    ...action,
    status: storedActions[action.id] || action.status,
    locationName: locationById[action.locationId]?.name || action.locationId
  }));
}

function render() {
  app.innerHTML = `
    <aside class="sidebar">
      <div class="brand-block">
        <div class="wordmark">salted</div>
        <div class="product-name">margin command center</div>
      </div>
      <nav class="nav-list" aria-label="Primary">
        ${nav.map((item) => `
          <button class="nav-item ${state.view === item.id ? "active" : ""}" data-view="${item.id}">
            ${icon(item.icon)}
            <span>${item.label}</span>
          </button>
        `).join("")}
      </nav>
      <div class="saved-views">
        <div class="saved-heading">saved views <span>⌃</span></div>
        ${["VP finance - weekly", "LA district - margin", "operators - daily", "menu review - low margin"].map((item) => `
          <button class="saved-view" data-saved="${item}">${icon("dot")}${item}</button>
        `).join("")}
      </div>
      <div class="profile-block">
        <div class="avatar">DN</div>
        <div>
          <strong>dev neupane</strong>
          <span>business analyst</span>
        </div>
        ${icon("chevron")}
      </div>
    </aside>
    <main class="main">
      ${renderTopbar()}
      <section class="disclosure">
        Sample modeled operating data for a Salted application prototype; not actual Salted data.
      </section>
      <section id="view-root" class="view-root">${renderView()}</section>
    </main>
    <div class="toast ${state.toast ? "show" : ""}">${escapeHtml(state.toast)}</div>
  `;
  bindShellEvents();
  renderCharts();
}

function renderTopbar() {
  return `
    <header class="topbar">
      <div class="filters">
        ${selectControl("date range", "range", rangeKey(), [
          ["current", "May 5 - May 11, 2026"],
          ["prior", "Apr 28 - May 4, 2026"],
          ["all", "Last 28 days"]
        ])}
        ${selectControl("market", "market", state.filters.market, [["all", "all"], ...uniqueOptions(LOCATIONS, "market")])}
        ${selectControl("district", "district", state.filters.district, [["all", "all"], ...uniqueOptions(LOCATIONS, "district")])}
        ${selectControl("location", "locationId", state.filters.locationId, [["all", "all"], ...LOCATIONS.map((l) => [l.id, l.name])])}
        ${selectControl("brand", "brandId", state.filters.brandId, [["all", "all"], ...BRANDS.map((b) => [b.id, b.name])])}
        ${selectControl("channel", "channelId", state.filters.channelId, [["all", "all"], ...CHANNELS.map((c) => [c.id, c.name])])}
      </div>
      <div class="top-actions">
        <span class="fresh-dot"></span>
        <div class="as-of">data as of<br><strong>May 11, 2026 8:30 AM</strong></div>
        <button class="utility-btn" data-action="reset">${icon("refresh")} reset</button>
        <button class="utility-btn" data-action="save">${icon("bookmark")} save view</button>
        <button class="utility-btn icon-only" data-action="more" title="More options">${icon("more")}</button>
      </div>
    </header>
  `;
}

function renderView() {
  const views = {
    overview: renderOverview,
    pnl: renderPnl,
    menu: renderMenu,
    forecast: renderForecastView,
    actions: renderActions,
    summary: renderSummary,
    upload: renderUpload,
    dictionary: renderDictionary
  };
  return views[state.view]();
}

function renderOverview() {
  const comparison = comparePeriods(sampleData, state.filters);
  const { currentSummary, previousSummary } = comparison;
  const bridge = varianceBridge(currentSummary, previousSummary);
  const locations = locationPerformance(sampleData, state.filters);
  const actions = currentActions();
  const summary = weeklySummary({ ...sampleData, actions }, state.filters, state.scenario);
  const forecast = forecastSeries(sampleData, state.filters, state.scenario);
  const menuRows = menuPerformance(sampleData, state.filters);

  return `
    <div class="metric-row">
      ${metricCard("net sales", currentSummary.netSales, previousSummary.netSales, "currency", "bad")}
      ${metricCard("contribution margin", currentSummary.contributionMargin, previousSummary.contributionMargin, "currency", "good")}
      ${metricCard("contribution margin %", currentSummary.marginPct, previousSummary.marginPct, "percent", "bad")}
      ${metricCard("orders", currentSummary.orderCount, previousSummary.orderCount, "number", "bad")}
      ${metricCard("direct-order mix", currentSummary.directOrderMix, previousSummary.directOrderMix, "percent", "good")}
      ${metricCard("refund rate", currentSummary.refundRate, previousSummary.refundRate, "percent", "bad", true)}
    </div>
    <div class="dashboard-grid overview-grid">
      <article class="panel span-5">
        <div class="panel-header">
          <div><h2>margin variance bridge <span>(contribution margin %)</span></h2><p>vs prior 7 days</p></div>
          ${icon("info")}
        </div>
        <div id="waterfall" class="chart-host"></div>
        <div class="insight-callout">
          ${icon("arrowDown")}
          <div><strong>Contribution margin ${currentSummary.marginPct < previousSummary.marginPct ? "decreased" : "improved"} ${formatters.points(currentSummary.marginPct - previousSummary.marginPct)}.</strong><br>
          Main drivers: ${bridge.filter((b) => !b.type).sort((a, b) => Math.abs(b.value) - Math.abs(a.value)).slice(0, 2).map((d) => `${d.label} ${formatters.points(d.value)}`).join(", ")}.</div>
          <button class="link-btn" data-view="pnl">view full bridge</button>
        </div>
      </article>
      <article class="panel span-4">
        <div class="panel-header"><div><h2>sales mix by channel</h2><p>% of net sales</p></div></div>
        <div class="donut-layout">
          <div id="donut" class="chart-host"></div>
          <div class="legend-list">
            ${channelMix(comparison.current.orders).map((row) => `
              <div class="legend-row"><span style="background:${row.color}"></span><strong>${row.label}</strong><em>${formatters.percent(row.pct)} · ${formatters.currency(row.value, true)}</em></div>
            `).join("")}
          </div>
        </div>
        <div class="note-line">${icon("search")} Direct-order mix ${currentSummary.directOrderMix > previousSummary.directOrderMix ? "improved" : "declined"} ${formatters.points(currentSummary.directOrderMix - previousSummary.directOrderMix)} vs prior 7 days.</div>
      </article>
      <article class="panel span-3">
        <div class="panel-header"><div><h2>locations needing attention <span class="badge danger">${locations.filter((l) => l.risk !== "low").length}</span></h2></div><button class="link-btn" data-view="pnl">view all</button></div>
        ${locationTable(locations.slice(0, 7), true)}
      </article>
      <article class="panel span-5">
        <div class="panel-header">
          <div><h2>13-week rolling forecast</h2><p>actual, base forecast, and scenario</p></div>
          <select class="mini-select" data-scenario-preset><option value="base">base</option><option value="direct">+direct mix</option><option value="cost">cost pressure</option></select>
        </div>
        <div class="forecast-layout">
          <div id="forecast-chart" class="chart-host"></div>
          ${forecastCard(forecast)}
        </div>
      </article>
      <article class="panel span-4">
        <div class="panel-header"><div><h2>operator action queue <span class="badge danger">${actions.filter((a) => a.status !== "done").length}</span></h2></div><button class="link-btn" data-view="actions">view all</button></div>
        ${compactActionList(actions.slice(0, 5))}
      </article>
      <article class="panel span-3">
        ${summaryPanel(summary)}
      </article>
      <article class="panel span-12">
        <div class="panel-header"><div><h2>menu margin spotlight</h2><p>top performers vs. trending down</p></div><button class="link-btn" data-view="menu">view full menu margin →</button></div>
        ${menuSpotlight(menuRows)}
      </article>
    </div>
  `;
}

function renderPnl() {
  const comparison = comparePeriods(sampleData, state.filters);
  const locations = locationPerformance(sampleData, state.filters);
  const bridge = varianceBridge(comparison.currentSummary, comparison.previousSummary);
  return `
    <div class="section-heading"><div><h1>location + district P&L</h1><p>Transparent contribution margin by market, location, channel, and controllable cost driver.</p></div>${exportButton("location-performance.csv")}</div>
    <div class="dashboard-grid">
      <article class="panel span-8"><div class="panel-header"><div><h2>variance bridge</h2><p>Current period vs prior period</p></div></div><div id="pnl-waterfall" class="chart-host large"></div></article>
      <article class="panel span-4">${driverStack(bridge)}</article>
      <article class="panel span-12"><div class="panel-header"><div><h2>location operating table</h2><p>Risk uses CM%, margin movement, and refund spikes.</p></div></div>${locationTable(locations, false)}</article>
    </div>
  `;
}

function renderMenu() {
  let rows = menuPerformance(sampleData, state.filters);
  rows = sortMenu(rows);
  return `
    <div class="section-heading"><div><h1>menu item margin waterfall</h1><p>Find high-volume low-margin items, refund-heavy items, and promotion candidates.</p></div>${exportButton("menu-margin.csv")}</div>
    <div class="menu-hero panel">
      <img src="./assets/menu-strip.png" alt="Synthetic healthy bowl thumbnails used as sample menu context" />
      <div><strong>Menu thumbnails are synthetic sample assets.</strong><span>All margin values are calculated from item-level modeled data.</span></div>
      <select class="mini-select" data-menu-sort>
        <option value="marginAsc" ${state.menuSort === "marginAsc" ? "selected" : ""}>lowest margin first</option>
        <option value="volumeDesc" ${state.menuSort === "volumeDesc" ? "selected" : ""}>highest volume first</option>
        <option value="refundDesc" ${state.menuSort === "refundDesc" ? "selected" : ""}>refund-heavy first</option>
      </select>
    </div>
    <div class="dashboard-grid">
      <article class="panel span-5"><div class="panel-header"><div><h2>margin by item</h2><p>Net contribution before store labor</p></div></div><div id="menu-bars" class="chart-host"></div></article>
      <article class="panel span-7"><div class="panel-header"><div><h2>item economics</h2><p>Price, COGS, packaging, fees, and recommendations.</p></div></div>${menuTable(rows)}</article>
    </div>
  `;
}

function renderForecastView() {
  const series = forecastSeries(sampleData, state.filters, state.scenario);
  return `
    <div class="section-heading"><div><h1>rolling forecast</h1><p>13-week forecast with scenario controls for direct mix, food cost, volume, labor, and refund improvement.</p></div>${exportButton("rolling-forecast.csv")}</div>
    <div class="dashboard-grid">
      <article class="panel span-8"><div class="panel-header"><div><h2>base vs scenario CM%</h2><p>Includes confidence bands in the data model.</p></div></div><div id="forecast-detail-chart" class="chart-host large"></div></article>
      <article class="panel span-4">${scenarioControls(series)}</article>
      <article class="panel span-12">${forecastTable(series)}</article>
    </div>
  `;
}

function renderActions() {
  const actions = currentActions();
  return `
    <div class="section-heading"><div><h1>operator action queue</h1><p>Evidence-backed actions that tie P&L movement to field execution.</p></div>${exportButton("operator-actions.csv")}</div>
    <article class="panel">${actionTable(actions, true)}</article>
  `;
}

function renderSummary() {
  const summary = weeklySummary({ ...sampleData, actions: currentActions() }, state.filters, state.scenario);
  return `
    <div class="section-heading"><div><h1>weekly finance summary</h1><p>A send-ready internal summary for finance, operations, and market leaders.</p></div><div class="section-actions"><button class="primary-btn" data-action="copy-summary">${icon("copy")} copy summary</button><button class="utility-btn" data-action="download-summary">${icon("download")} download report</button></div></div>
    <div class="dashboard-grid">
      <article class="panel span-8 summary-document">${summaryDocument(summary)}</article>
      <article class="panel span-4">${forecastUpdate(summary)}</article>
    </div>
  `;
}

function renderUpload() {
  const validation = validateUpload(state.uploadKind, state.uploadRows);
  return `
    <div class="section-heading"><div><h1>data upload</h1><p>Validate CSV exports before connecting real POS, marketplace, labor, and forecast files.</p></div><button class="utility-btn" data-action="download-samples">${icon("download")} sample CSVs</button></div>
    <div class="dashboard-grid">
      <article class="panel span-5">
        <div class="panel-header"><div><h2>upload CSV</h2><p>Prototype parser validates schema and previews rows.</p></div></div>
        <label class="field-label">data type</label>
        <select class="input" data-upload-kind>
          ${[
            ["orders", "orders"],
            ["labor", "labor"],
            ["forecast", "forecast"],
            ["menu", "menu COGS"]
          ].map(([value, label]) => `<option value="${value}" ${state.uploadKind === value ? "selected" : ""}>${label}</option>`).join("")}
        </select>
        <label class="upload-zone">
          ${icon("upload")}
          <strong>Choose CSV file</strong>
          <span>Orders, menu COGS, labor, or forecast exports</span>
          <input type="file" accept=".csv,text/csv" data-upload-file />
        </label>
      </article>
      <article class="panel span-7">
        <div class="panel-header"><div><h2>validation result</h2><p>${state.uploadRows.length ? `${state.uploadRows.length} rows parsed` : "No file uploaded yet"}</p></div></div>
        ${state.uploadRows.length ? `
          <div class="validation ${validation.ok ? "ok" : "bad"}">${validation.ok ? "Schema ready for mapping." : validationMessage(validation)}</div>
          ${previewTable(state.uploadRows.slice(0, 8))}
        ` : emptyState("Upload a CSV to verify headers, row count, and sample values before mapping.")}
      </article>
    </div>
  `;
}

function renderDictionary() {
  const formulas = [
    ["Net sales", "Gross menu sales minus discounts, merchant-funded promos, and merchant-funded refunds."],
    ["Contribution margin", "Net sales minus platform fees, payment fees, food COGS, packaging, and labor."],
    ["Direct-order mix", "Direct-order net sales divided by total net sales."],
    ["Refund leakage", "Merchant-funded refunds divided by gross menu sales."],
    ["Variance bridge", "Change in CM% decomposed into channel mix, fee rate, refunds, COGS, labor, and residual drivers."],
    ["Scenario CM%", "Forecast margin adjusted for direct mix lift, food inflation, volume growth, labor efficiency, and refund improvement."]
  ];
  return `
    <div class="section-heading"><div><h1>data dictionary</h1><p>Finance definitions are visible so operators can trust the recommendations.</p></div></div>
    <article class="panel">${simpleDefinitionTable(formulas)}</article>
  `;
}

function metricCard(label, current, previous, type, tone, inverse = false) {
  const delta = type === "percent" ? current - previous : (current - previous) / (previous || 1);
  const good = inverse ? delta < 0 : delta >= 0;
  const value = type === "currency" ? formatters.currency(current, true) : type === "percent" ? formatters.percent(current) : formatters.number(current);
  const deltaText = type === "percent" ? formatters.points(delta) : `${delta >= 0 ? "+" : ""}${(delta * 100).toFixed(1)}%`;
  const trend = Array.from({ length: 16 }, (_, i) => current * (0.88 + Math.sin(i / 2 + label.length) * 0.03 + i * (good ? 0.008 : -0.005)));
  return `
    <article class="metric-card">
      <div><span>${label}</span><strong>${value}</strong><em class="${good ? "good" : "bad"}">${deltaText}</em> <small>vs prior 7 days</small></div>
      <div class="spark-host" data-spark="${trend.join("|")}" data-tone="${good ? "good" : "bad"}"></div>
    </article>
  `;
}

function locationTable(rows, compact) {
  return `
    <div class="table-wrap"><table class="data-table">
      <thead><tr><th>location</th><th>district</th><th>CM %</th><th>Δ vs prior</th><th>risk</th>${compact ? "<th>top driver</th>" : "<th>net sales</th><th>refund</th><th>top driver</th>"}</tr></thead>
      <tbody>
        ${rows.map((row) => `
          <tr>
            <td><strong>${row.name}</strong><span>${row.manager}</span></td>
            <td>${row.district}</td>
            <td>${formatters.percent(row.summary.marginPct)}</td>
            <td class="${row.delta >= 0 ? "good" : "bad"}">${formatters.points(row.delta)}</td>
            <td><span class="status ${row.risk}">${row.risk}</span></td>
            ${compact ? `<td>${row.topDriver?.label || "stable"} ${row.topDriver?.value < 0 ? "↑" : "↓"}</td>` : `<td>${formatters.currency(row.summary.netSales, true)}</td><td>${formatters.percent(row.summary.refundRate)}</td><td>${row.topDriver?.driver || "stable"}</td>`}
          </tr>
        `).join("")}
      </tbody>
    </table></div>
  `;
}

function actionTable(actions, editable = false) {
  return `
    <div class="table-wrap"><table class="data-table action-table">
      <thead><tr><th>action</th><th>priority</th><th>est. impact</th><th>owner</th><th>due</th><th>status</th></tr></thead>
      <tbody>
        ${actions.map((action) => `
          <tr>
            <td><strong>${action.issue}</strong><span>${action.evidence}</span></td>
            <td><span class="priority ${action.priority}">${action.priority}</span></td>
            <td class="good">+${action.estimatedImpactPts.toFixed(1)} pts</td>
            <td>${action.owner}</td>
            <td>${formatShortDate(action.due)}</td>
            <td>${editable ? statusSelect(action) : `<span class="status ${statusClass(action.status)}">${action.status}</span>`}</td>
          </tr>
        `).join("")}
      </tbody>
    </table></div>
  `;
}

function compactActionList(actions) {
  return `
    <div class="compact-actions">
      ${actions.map((action) => `
        <div class="compact-action">
          <div><strong>${action.issue}</strong><span>${locationById[action.locationId]?.district || ""} · ${action.owner}</span></div>
          <span class="priority ${action.priority}">${action.priority}</span>
          <em class="good">+${action.estimatedImpactPts.toFixed(1)} pts</em>
          <span class="status ${statusClass(action.status)}">${action.status}</span>
        </div>
      `).join("")}
    </div>
  `;
}

function menuTable(rows) {
  return `
    <div class="table-wrap"><table class="data-table">
      <thead><tr><th>item</th><th>brand</th><th>price</th><th>COGS</th><th>packaging</th><th>unit CM</th><th>CM %</th><th>volume rank</th><th>recommendation</th></tr></thead>
      <tbody>
        ${rows.map((row) => `
          <tr>
            <td><strong>${row.name}</strong><span>${row.category}</span></td>
            <td>${row.brandName}</td>
            <td>${formatters.currency(row.price)}</td>
            <td>${formatters.currency(row.foodCost)}</td>
            <td>${formatters.currency(row.packaging)}</td>
            <td>${formatters.currency(row.unitContribution)}</td>
            <td class="${row.marginPct < 0.34 ? "bad" : row.marginPct > 0.52 ? "good" : ""}">${formatters.percent(row.marginPct)}</td>
            <td>#${row.volumeRank}</td>
            <td><span class="status ${row.recommendation.includes("reprice") || row.recommendation.includes("audit") ? "medium" : "low"}">${row.recommendation}</span></td>
          </tr>
        `).join("")}
      </tbody>
    </table></div>
  `;
}

function forecastTable(series) {
  return `
    <article class="panel"><div class="panel-header"><div><h2>forecast detail</h2><p>Base and scenario margin by week.</p></div></div>
      <div class="table-wrap"><table class="data-table">
        <thead><tr><th>week</th><th>revenue</th><th>orders</th><th>COGS</th><th>labor</th><th>base CM%</th><th>scenario CM%</th><th>upside</th></tr></thead>
        <tbody>${series.map((row) => `<tr><td><strong>${row.week}</strong></td><td>${formatters.currency(row.revenue, true)}</td><td>${formatters.number(row.orders)}</td><td>${formatters.currency(row.cogs, true)}</td><td>${formatters.currency(row.labor, true)}</td><td>${formatters.percent(row.baseMarginPct)}</td><td class="good">${formatters.percent(row.scenarioMarginPct)}</td><td class="good">${formatters.points(row.scenarioMarginPct - row.baseMarginPct)}</td></tr>`).join("")}</tbody>
      </table></div>
    </article>
  `;
}

function summaryPanel(summary) {
  return `
    <div class="panel-header">
      <div><h2>weekly finance summary</h2><p>${summary.period}</p></div>
      <div class="button-row"><button class="utility-btn icon-only" data-action="copy-summary" title="Copy">${icon("copy")}</button><button class="primary-btn" data-action="download-summary">download report</button></div>
    </div>
    ${summaryDocument(summary, true)}
    ${forecastUpdate(summary)}
  `;
}

function summaryDocument(summary, compact = false) {
  const sections = [
    ["what changed", summary.changed, "good"],
    ["why it changed", summary.why, "info"],
    ["what to do next", summary.next, "warn"],
    ["risks for next", summary.risks, "bad"]
  ];
  return `<div class="${compact ? "summary-compact" : "summary-body"}">${sections.map(([title, lines, tone]) => `<section><h3><span class="dot ${tone}"></span>${title}</h3><ul>${lines.map((line) => `<li>${line}</li>`).join("")}</ul></section>`).join("")}</div>`;
}

function forecastUpdate(summary) {
  return `
    <div class="forecast-card">
      <span>forecast update</span>
      <strong>week 13 CM%</strong>
      <dl><dt>base</dt><dd>${formatters.percent(summary.forecast.base)}</dd><dt>scenario</dt><dd class="good">${formatters.percent(summary.forecast.scenario)}</dd><dt>upside</dt><dd class="good">${formatters.points(summary.forecast.upside)}</dd></dl>
    </div>
  `;
}

function menuSpotlight(rows) {
  const spotlight = [...rows].sort((a, b) => b.summary.quantity - a.summary.quantity).slice(0, 5);
  return `
    <div class="menu-spotlight">
      ${spotlight.map((item) => `
        <div class="menu-tile">
          <div class="thumb slot-${item.imageSlot}"></div>
          <div><strong>${item.name}</strong><span>${item.recommendation}</span></div>
          <dl><dt>CM %</dt><dd class="${item.marginPct < 0.34 ? "bad" : "good"}">${formatters.percent(item.marginPct, 0)}</dd><dt>volume rank</dt><dd>#${item.volumeRank}</dd></dl>
        </div>
      `).join("")}
    </div>
  `;
}

function driverStack(bridge) {
  const rows = bridge.filter((item) => !item.type).sort((a, b) => Math.abs(b.value) - Math.abs(a.value));
  return `
    <div class="panel-header"><div><h2>driver evidence</h2><p>Merchant-controllable vs market-driven movement.</p></div></div>
    <div class="driver-list">
      ${rows.map((row) => `<div class="driver-row"><span class="${row.value >= 0 ? "good" : "bad"}">${formatters.points(row.value)}</span><div><strong>${row.label}</strong><em>${row.driver}</em></div></div>`).join("")}
    </div>
  `;
}

function scenarioControls(series) {
  const last = series.at(-1);
  const controls = [
    ["directMixLift", "direct-order mix lift", "%", 0, 12],
    ["foodInflation", "food cost pressure", "%", -3, 8],
    ["volumeGrowth", "order volume growth", "%", -5, 10],
    ["laborEfficiency", "labor efficiency gain", "%", 0, 8],
    ["refundReduction", "refund rate improvement", "pts", 0, 2]
  ];
  return `
    <div class="panel-header"><div><h2>scenario controls</h2><p>Model practical operating levers.</p></div></div>
    <div class="scenario-list">
      ${controls.map(([key, label, unit, min, max]) => `
        <label><span>${label}<em>${state.scenario[key]}${unit}</em></span><input type="range" min="${min}" max="${max}" step="0.1" value="${state.scenario[key]}" data-scenario="${key}" /></label>
      `).join("")}
    </div>
    <div class="scenario-result"><span>week 13 scenario CM%</span><strong>${formatters.percent(last.scenarioMarginPct)}</strong><em>${formatters.points(last.scenarioMarginPct - last.baseMarginPct)} vs base</em></div>
  `;
}

function forecastCard(series) {
  const last = series.at(-1);
  return `
    <div class="forecast-side">
      <span>week 13 forecast</span>
      <dl><dt>base scenario</dt><dd>${formatters.percent(last.baseMarginPct)}</dd><dt>scenario</dt><dd class="good">${formatters.percent(last.scenarioMarginPct)}</dd></dl>
      <strong class="good">↑ ${formatters.points(last.scenarioMarginPct - last.baseMarginPct)}</strong>
      <button class="link-btn" data-view="forecast">view scenarios</button>
    </div>
  `;
}

function previewTable(rows) {
  const headers = Object.keys(rows[0] || {}).slice(0, 7);
  return `<div class="table-wrap"><table class="data-table"><thead><tr>${headers.map((h) => `<th>${h}</th>`).join("")}</tr></thead><tbody>${rows.map((row) => `<tr>${headers.map((h) => `<td>${escapeHtml(row[h])}</td>`).join("")}</tr>`).join("")}</tbody></table></div>`;
}

function simpleDefinitionTable(rows) {
  return `<div class="table-wrap"><table class="data-table"><thead><tr><th>metric</th><th>definition</th></tr></thead><tbody>${rows.map(([metric, definition]) => `<tr><td><strong>${metric}</strong></td><td>${definition}</td></tr>`).join("")}</tbody></table></div>`;
}

function emptyState(text) {
  return `<div class="empty-state">${icon("upload")}<strong>No data loaded</strong><span>${text}</span></div>`;
}

function selectControl(label, key, value, options) {
  return `
    <label class="filter-control">
      <span>${label}</span>
      <select data-filter="${key}">
        ${options.map(([optionValue, optionLabel]) => `<option value="${optionValue}" ${value === optionValue ? "selected" : ""}>${optionLabel}</option>`).join("")}
      </select>
    </label>
  `;
}

function uniqueOptions(rows, key) {
  return [...new Set(rows.map((row) => row[key]))].map((value) => [value, value]);
}

function bindShellEvents() {
  document.querySelectorAll("[data-view]").forEach((button) => {
    button.addEventListener("click", () => {
      state.view = button.dataset.view;
      render();
    });
  });
  document.querySelectorAll("[data-filter]").forEach((select) => {
    select.addEventListener("change", () => updateFilter(select.dataset.filter, select.value));
  });
  document.querySelectorAll("[data-action]").forEach((button) => {
    button.addEventListener("click", () => handleAction(button.dataset.action));
  });
  document.querySelectorAll("[data-status]").forEach((select) => {
    select.addEventListener("change", () => {
      storedActions[select.dataset.status] = select.value;
      localStorage.setItem("salted-actions", JSON.stringify(storedActions));
      notify("Action status updated.");
      render();
    });
  });
  document.querySelectorAll("[data-saved]").forEach((button) => {
    button.addEventListener("click", () => applySavedView(button.dataset.saved));
  });
  document.querySelectorAll("[data-scenario]").forEach((input) => {
    input.addEventListener("input", () => {
      state.scenario[input.dataset.scenario] = Number(input.value);
      render();
    });
  });
  const preset = document.querySelector("[data-scenario-preset]");
  if (preset) preset.addEventListener("change", () => applyPreset(preset.value));
  const menuSort = document.querySelector("[data-menu-sort]");
  if (menuSort) menuSort.addEventListener("change", () => {
    state.menuSort = menuSort.value;
    render();
  });
  const uploadKind = document.querySelector("[data-upload-kind]");
  if (uploadKind) uploadKind.addEventListener("change", () => {
    state.uploadKind = uploadKind.value;
    render();
  });
  const uploadFile = document.querySelector("[data-upload-file]");
  if (uploadFile) uploadFile.addEventListener("change", handleUpload);
}

function renderCharts() {
  const comparison = comparePeriods(sampleData, state.filters);
  const bridge = varianceBridge(comparison.currentSummary, comparison.previousSummary);
  const mix = channelMix(comparison.current.orders);
  const forecast = forecastSeries(sampleData, state.filters, state.scenario);
  const menuRows = menuPerformance(sampleData, state.filters).slice(0, 8);
  const charts = [
    ["waterfall", (node) => renderWaterfall(node, bridge)],
    ["pnl-waterfall", (node) => renderWaterfall(node, bridge)],
    ["donut", (node) => renderDonut(node, mix)],
    ["forecast-chart", (node) => renderForecast(node, forecast)],
    ["forecast-detail-chart", (node) => renderForecast(node, forecast)],
    ["menu-bars", (node) => renderBarTrend(node, menuRows, (row) => row.marginPct, (row) => row.name)]
  ];
  charts.forEach(([id, renderer]) => {
    const node = document.getElementById(id);
    if (node) renderer(node);
  });
  document.querySelectorAll("[data-spark]").forEach((host) => {
    const values = host.dataset.spark.split("|").map(Number);
    renderSparkline(host, values, { color: host.dataset.tone === "good" ? "#2f8a4d" : "#ef4b3d" });
  });
}

function updateFilter(key, value) {
  if (key === "range") {
    state.filters.range =
      value === "current" ? { start: "2026-05-05", end: "2026-05-11" } :
      value === "prior" ? { start: "2026-04-28", end: "2026-05-04" } :
      { start: "2026-04-28", end: "2026-05-25" };
  } else {
    state.filters[key] = value;
    if (key === "market") {
      state.filters.district = "all";
      state.filters.locationId = "all";
    }
  }
  render();
}

function handleAction(action) {
  const summary = weeklySummary({ ...sampleData, actions: currentActions() }, state.filters, state.scenario);
  const locations = locationPerformance(sampleData, state.filters);
  const menuRows = menuPerformance(sampleData, state.filters);
  const forecast = forecastSeries(sampleData, state.filters, state.scenario);
  if (action === "reset") {
    state.filters = { range: { start: "2026-05-05", end: "2026-05-11" }, market: "all", district: "all", locationId: "all", brandId: "all", channelId: "all" };
    notify("Filters reset.");
    render();
  }
  if (action === "save") notify("Saved view locally for this demo session.");
  if (action === "more") notify("More options: export, copy summary, and sample uploads are available in their views.");
  if (action === "copy-summary") copySummary(summary, notify);
  if (action === "download-summary") downloadSummary(summary);
  if (action === "download-samples") downloadSamples();
  if (action === "export-location-performance.csv") exportRows("location-performance.csv", locations.map(locationExportRow));
  if (action === "export-menu-margin.csv") exportRows("menu-margin.csv", menuRows.map(menuExportRow));
  if (action === "export-rolling-forecast.csv") exportRows("rolling-forecast.csv", forecast.map(forecastExportRow));
  if (action === "export-operator-actions.csv") exportRows("operator-actions.csv", buildActionCsv(currentActions()));
}

function exportButton(filename) {
  return `<button class="utility-btn" data-action="export-${filename}">${icon("download")} export CSV</button>`;
}

function applyPreset(value) {
  if (value === "base") state.scenario = { directMixLift: 0, foodInflation: 0, volumeGrowth: 0, laborEfficiency: 0, refundReduction: 0 };
  if (value === "direct") state.scenario = { directMixLift: 6, foodInflation: 0, volumeGrowth: 2, laborEfficiency: 1, refundReduction: 0.7 };
  if (value === "cost") state.scenario = { directMixLift: 2, foodInflation: 4, volumeGrowth: 1, laborEfficiency: 0.5, refundReduction: 0.2 };
  render();
}

async function handleUpload(event) {
  const file = event.target.files[0];
  if (!file) return;
  state.uploadKind = detectUploadKind(file.name, state.uploadKind);
  const text = await file.text();
  state.uploadRows = parseCsv(text);
  notify(`${state.uploadRows.length} CSV rows parsed.`);
  render();
}

function detectUploadKind(filename, fallback) {
  const name = filename.toLowerCase();
  if (name.includes("menu")) return "menu";
  if (name.includes("forecast")) return "forecast";
  if (name.includes("labor")) return "labor";
  if (name.includes("order")) return "orders";
  return fallback;
}

function downloadSamples() {
  const { orderRows, laborRows } = toSampleCsv(sampleData);
  const forecastRows = sampleData.forecast.slice(0, 12).map((row) => ({
    week: row.week,
    location: locationById[row.locationId].name,
    revenue_forecast: row.revenueForecast,
    orders_forecast: row.ordersForecast,
    cogs_forecast: row.cogsForecast,
    labor_forecast: row.laborForecast,
    margin_forecast: row.marginForecast
  }));
  const menuRows = MENU_ITEMS.map((item) => ({
    brand: brandById[item.brand].name,
    item: item.name,
    price: item.price,
    food_cost: item.foodCost,
    packaging_cost: item.packaging,
    labor_minutes: item.laborMinutes,
    category: item.category
  }));
  const text = [
    "orders.csv",
    toCsv(orderRows),
    "",
    "labor.csv",
    toCsv(laborRows),
    "",
    "forecast.csv",
    toCsv(forecastRows),
    "",
    "menu_items.csv",
    toCsv(menuRows)
  ].join("\n\n");
  const blob = new Blob([text], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "salted-sample-csv-templates.txt";
  link.click();
  URL.revokeObjectURL(url);
  notify("Sample CSV templates downloaded.");
}

function applySavedView(name) {
  if (name === "VP finance - weekly") {
    state.view = "summary";
    state.filters = { ...state.filters, market: "all", district: "all", locationId: "all", brandId: "all", channelId: "all" };
  }
  if (name === "LA district - margin") {
    state.view = "pnl";
    state.filters = { ...state.filters, market: "Los Angeles", district: "LA1", locationId: "all", brandId: "all", channelId: "all" };
  }
  if (name === "operators - daily") {
    state.view = "actions";
    state.filters = { ...state.filters, market: "all", district: "all", locationId: "all", brandId: "all", channelId: "all" };
  }
  if (name === "menu review - low margin") {
    state.view = "menu";
    state.menuSort = "marginAsc";
  }
  notify(`Loaded saved view: ${name}.`);
  render();
}

function validationMessage(validation) {
  const parts = [];
  if (validation.missing.length) parts.push(`Missing required fields: ${validation.missing.join(", ")}`);
  if (validation.invalid.length) parts.push(`Invalid values: ${validation.invalid.slice(0, 3).join("; ")}${validation.invalid.length > 3 ? "..." : ""}`);
  return parts.join(" ");
}

function sortMenu(rows) {
  const sorted = [...rows];
  if (state.menuSort === "volumeDesc") return sorted.sort((a, b) => b.summary.quantity - a.summary.quantity);
  if (state.menuSort === "refundDesc") return sorted.sort((a, b) => b.summary.refundRate - a.summary.refundRate);
  return sorted.sort((a, b) => a.marginPct - b.marginPct);
}

function rangeKey() {
  if (state.filters.range.start === "2026-04-28" && state.filters.range.end === "2026-05-04") return "prior";
  if (state.filters.range.start === "2026-04-28" && state.filters.range.end === "2026-05-25") return "all";
  return "current";
}

function statusSelect(action) {
  return `<select class="status-select" data-status="${action.id}">${["open", "queued", "in progress", "done"].map((status) => `<option value="${status}" ${action.status === status ? "selected" : ""}>${status}</option>`).join("")}</select>`;
}

function statusClass(status) {
  return status === "done" ? "low" : status === "in progress" ? "medium" : "high";
}

function notify(message) {
  state.toast = message;
  render();
  window.clearTimeout(notify.timer);
  notify.timer = window.setTimeout(() => {
    state.toast = "";
    render();
  }, 2200);
}

function formatShortDate(date) {
  return new Date(`${date}T00:00:00`).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function locationExportRow(row) {
  return {
    location: row.name,
    district: row.district,
    market: row.market,
    net_sales: row.summary.netSales,
    contribution_margin: row.summary.contributionMargin,
    margin_pct: row.summary.marginPct,
    delta_vs_prior: row.delta,
    risk: row.risk,
    top_driver: row.topDriver?.driver || ""
  };
}

function menuExportRow(row) {
  return {
    item: row.name,
    brand: row.brandName,
    price: row.price,
    food_cost: row.foodCost,
    packaging: row.packaging,
    unit_contribution: row.unitContribution,
    margin_pct: row.marginPct,
    volume_rank: row.volumeRank,
    recommendation: row.recommendation
  };
}

function forecastExportRow(row) {
  return {
    week: row.week,
    revenue: row.revenue,
    orders: row.orders,
    cogs: row.cogs,
    labor: row.labor,
    base_margin_pct: row.baseMarginPct,
    scenario_margin_pct: row.scenarioMarginPct,
    upside_pts: row.scenarioMarginPct - row.baseMarginPct
  };
}

function icon(name) {
  const icons = {
    home: "M3 11l9-8 9 8v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z",
    ledger: "M5 3h14v18H5z M8 7h8 M8 11h8 M8 15h5",
    grid: "M4 4h6v6H4z M14 4h6v6h-6z M4 14h6v6H4z M14 14h6v6h-6z",
    trend: "M4 16l5-5 4 4 7-8 M16 7h4v4",
    user: "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8z M4 21a8 8 0 0 1 16 0",
    calendar: "M5 4h14v17H5z M8 2v4 M16 2v4 M5 9h14",
    upload: "M12 16V4 M7 9l5-5 5 5 M5 20h14",
    book: "M5 4h11a3 3 0 0 1 3 3v14H8a3 3 0 0 0-3 3z M5 4v17",
    refresh: "M20 6v5h-5 M4 18v-5h5 M18 9a6 6 0 0 0-10-3 M6 15a6 6 0 0 0 10 3",
    bookmark: "M6 4h12v17l-6-4-6 4z",
    more: "M5 12h.01 M12 12h.01 M19 12h.01",
    chevron: "M8 10l4 4 4-4",
    dot: "M12 12h.01",
    info: "M12 17v-6 M12 7h.01 M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20",
    search: "M10 18a8 8 0 1 1 5.3-14M15 15l6 6",
    copy: "M8 8h11v11H8z M5 16H4a1 1 0 0 1-1-1V4h11v1",
    download: "M12 3v12 M7 10l5 5 5-5 M5 21h14",
    arrowDown: "M12 5v14 M6 13l6 6 6-6"
  };
  return `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="${icons[name] || icons.dot}" /></svg>`;
}

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" })[char]);
}

render();
