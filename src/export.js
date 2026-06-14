import { formatters } from "./calculations.js";
import { downloadText, toCsv } from "./csv.js";

export function buildWeeklySummaryText(summary) {
  return [
    `${summary.title} (${summary.period})`,
    "",
    "What changed",
    ...summary.changed.map((line) => `- ${line}`),
    "",
    "Why it changed",
    ...summary.why.map((line) => `- ${line}`),
    "",
    "What to do next",
    ...summary.next.map((line) => `- ${line}`),
    "",
    "Risks for next week",
    ...summary.risks.map((line) => `- ${line}`),
    "",
    `Forecast update: base week-13 CM% ${formatters.percent(summary.forecast.base)}; scenario ${formatters.percent(summary.forecast.scenario)} (${formatters.points(summary.forecast.upside)} upside).`,
    "",
    "Disclosure: Sample modeled operating data; not actual Salted data."
  ].join("\n");
}

export async function copySummary(summary, notify) {
  const text = buildWeeklySummaryText(summary);
  try {
    await navigator.clipboard.writeText(text);
    notify("Weekly summary copied to clipboard.");
  } catch {
    notify("Clipboard unavailable. Downloaded summary instead.");
    downloadText("salted-weekly-summary.txt", text);
  }
}

export function downloadSummary(summary) {
  downloadText("salted-weekly-finance-summary.txt", buildWeeklySummaryText(summary));
}

export function exportRows(filename, rows) {
  downloadText(filename, toCsv(rows), "text/csv");
}

export function buildActionCsv(actions) {
  return actions.map((action) => ({
    priority: action.priority,
    location: action.locationName,
    issue: action.issue,
    evidence: action.evidence,
    estimated_margin_impact_pts: action.estimatedImpactPts,
    owner: action.owner,
    status: action.status,
    due: action.due
  }));
}
