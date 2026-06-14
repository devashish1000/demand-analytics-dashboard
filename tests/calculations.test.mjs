import assert from "node:assert/strict";
import { createSampleData } from "../src/data.js";
import {
  comparePeriods,
  filterData,
  forecastSeries,
  locationPerformance,
  menuPerformance,
  orderContribution,
  orderNetRevenue,
  summarize,
  varianceBridge,
  weeklySummary
} from "../src/calculations.js";
import { parseCsv, toCsv, validateUpload } from "../src/csv.js";

const data = createSampleData();
const filters = {
  range: { start: "2026-05-05", end: "2026-05-11" },
  market: "all",
  district: "all",
  locationId: "all",
  brandId: "all",
  channelId: "all"
};

assert.ok(data.orders.length > 1000, "sample orders should be dense enough for dashboards");
assert.ok(data.labor.length > 100, "sample labor rows should exist");
assert.ok(
  data.orders.every((order) => order.date <= data.generatedAt.slice(0, 10)),
  "sample actuals should not extend past the visible data-as-of timestamp"
);

const sampleOrder = data.orders[0];
assert.equal(
  Number(orderNetRevenue(sampleOrder).toFixed(2)),
  Number((sampleOrder.grossSales - sampleOrder.discount - sampleOrder.merchantPromo - sampleOrder.refundMerchant).toFixed(2)),
  "net revenue formula should subtract merchant-funded discounts/promos/refunds"
);
assert.equal(
  Number(orderContribution(sampleOrder).toFixed(2)),
  Number((orderNetRevenue(sampleOrder) - sampleOrder.platformFee - sampleOrder.paymentFee - sampleOrder.foodCost - sampleOrder.packagingCost).toFixed(2)),
  "order contribution should subtract channel fees, payment fees, COGS, and packaging"
);

const summary = summarize(data.orders, data.labor);
assert.ok(summary.netSales > 0, "summary net sales should be positive");
assert.ok(summary.contributionMargin > 0, "summary contribution margin should be positive");
assert.ok(summary.marginPct > 0.05 && summary.marginPct < 0.5, "margin percent should be realistic");
assert.ok(summary.directOrderMix > 0.05 && summary.directOrderMix < 0.35, "direct mix should be realistic");

const comparison = comparePeriods(data, filters);
const bridge = varianceBridge(comparison.currentSummary, comparison.previousSummary);
assert.equal(bridge.at(0).type, "start", "variance bridge should start with prior value");
assert.equal(bridge.at(-1).type, "end", "variance bridge should end with current value");

const locations = locationPerformance(data, filters);
assert.equal(locations.length, data.locations.length, "all locations should appear in performance table");
assert.ok(locations.some((location) => location.risk !== "low"), "risk model should flag at least one attention location");

const laLocations = locationPerformance(data, { ...filters, market: "Los Angeles", district: "LA1" });
assert.ok(laLocations.length > 0, "filtered P&L should retain matching locations with activity");
assert.ok(laLocations.every((location) => location.market === "Los Angeles" && location.district === "LA1"), "filtered P&L should not show zero-order nonmatching markets");

const allFiltered = filterData(data, filters);
const brandFiltered = filterData(data, { ...filters, brandId: "moonbowls" });
const allLaborExpense = summarize(allFiltered.orders, allFiltered.labor).laborExpense;
const brandLaborExpense = summarize(brandFiltered.orders, brandFiltered.labor).laborExpense;
assert.ok(brandLaborExpense > 0, "brand-filtered P&L should include allocated labor");
assert.ok(brandLaborExpense < allLaborExpense, "brand-filtered P&L should not absorb full kitchen labor");

const menuRows = menuPerformance(data, filters);
assert.equal(menuRows.length, data.menuItems.length, "menu table should include all menu items with activity");
assert.ok(menuRows.some((row) => row.recommendation !== "monitor"), "menu recommendations should not be inert");

const forecast = forecastSeries(data, filters, {
  directMixLift: 5,
  foodInflation: 0,
  volumeGrowth: 2,
  laborEfficiency: 1,
  refundReduction: 0.7
});
assert.equal(forecast.length, 13, "forecast should return 13 weeks");
assert.ok(forecast.at(-1).scenarioMarginPct > forecast.at(-1).baseMarginPct, "recommended scenario should improve week 13 margin");

const summaryText = weeklySummary(data, filters, {
  directMixLift: 5,
  foodInflation: 0,
  volumeGrowth: 2,
  laborEfficiency: 1,
  refundReduction: 0.7
});
assert.ok(summaryText.changed.length >= 3, "weekly summary should include what changed");
assert.ok(summaryText.why.length >= 3, "weekly summary should include variance drivers");

const csv = toCsv([{ date: "2026-05-11", location: "Austin - South", brand: "moonbowls", channel: "direct", item: "Spicy Chicken Bowl", quantity: 2, gross_sales: 34.4 }]);
const parsed = parseCsv(csv);
assert.equal(parsed[0].gross_sales, 34.4, "CSV parser should coerce numeric fields");
assert.equal(validateUpload("orders", parsed).ok, true, "sample order CSV should validate");

console.log("calculation smoke tests passed");
