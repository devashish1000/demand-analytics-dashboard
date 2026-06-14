import { BRANDS, CHANNELS, LOCATIONS, MENU_ITEMS } from "./data.js";

const channelById = Object.fromEntries(CHANNELS.map((channel) => [channel.id, channel]));
const locationById = Object.fromEntries(LOCATIONS.map((location) => [location.id, location]));
const brandById = Object.fromEntries(BRANDS.map((brand) => [brand.id, brand]));
const itemById = Object.fromEntries(MENU_ITEMS.map((item) => [item.id, item]));

export const formatters = {
  currency(value, compact = false) {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      notation: compact ? "compact" : "standard",
      maximumFractionDigits: compact ? 2 : 0
    }).format(value || 0);
  },
  number(value) {
    return new Intl.NumberFormat("en-US").format(Math.round(value || 0));
  },
  percent(value, digits = 1) {
    return `${((value || 0) * 100).toFixed(digits)}%`;
  },
  points(value, digits = 1) {
    const sign = value > 0 ? "+" : "";
    return `${sign}${((value || 0) * 100).toFixed(digits)} pts`;
  }
};

export function round(value, digits = 2) {
  const factor = 10 ** digits;
  return Math.round((value + Number.EPSILON) * factor) / factor;
}

export function orderNetRevenue(order) {
  return order.grossSales - order.discount - order.merchantPromo - order.refundMerchant;
}

export function orderContribution(order) {
  return (
    orderNetRevenue(order) -
    order.platformFee -
    order.paymentFee -
    order.foodCost -
    order.packagingCost
  );
}

export function laborCost(row) {
  return row.actualHours * row.hourlyRate * (1 + row.payrollBurdenRate);
}

/*
 * Labor rows are exported by date/location, while brand and channel filters are
 * order-level. Allocate location labor to the filtered order set by modeled prep
 * minutes so filtered P&Ls stay credible instead of charging one brand or channel
 * for the entire kitchen shift.
 */
export function filterData(data, filters) {
  const baseOrders = data.orders.filter((order) => {
    const location = locationById[order.locationId];
    const dateOk = !filters.range || isDateInRange(order.date, filters.range);
    return (
      dateOk &&
      matches(filters.market, location.market) &&
      matches(filters.district, location.district) &&
      matches(filters.locationId, order.locationId)
    );
  });

  const orders = baseOrders.filter((order) =>
    matches(filters.brandId, order.brandId) &&
    matches(filters.channelId, order.channelId)
  );

  const baseMinutesByKey = minutesByLaborKey(baseOrders);
  const selectedMinutesByKey = minutesByLaborKey(orders);
  const labor = data.labor.flatMap((row) => {
    const location = locationById[row.locationId];
    const dateOk = !filters.range || isDateInRange(row.date, filters.range);
    const locationOk =
      dateOk &&
      matches(filters.market, location.market) &&
      matches(filters.district, location.district) &&
      matches(filters.locationId, row.locationId);
    if (!locationOk) return [];

    const key = laborKey(row);
    const selectedMinutes = selectedMinutesByKey.get(key) || 0;
    if (!selectedMinutes) return [];

    const share = safeDivide(selectedMinutes, baseMinutesByKey.get(key) || selectedMinutes);
    return [{
      ...row,
      scheduledHours: row.scheduledHours * share,
      actualHours: row.actualHours * share,
      allocatedShare: share
    }];
  });

  return { ...data, orders, labor };
}

function minutesByLaborKey(orders) {
  return orders.reduce((totals, order) => {
    const key = laborKey(order);
    totals.set(key, (totals.get(key) || 0) + order.laborMinutes);
    return totals;
  }, new Map());
}

function laborKey(row) {
  return `${row.date}|${row.locationId}`;
}

export function actionLocationMatches(action, filters) {
  const location = locationById[action.locationId];
  return Boolean(
    location &&
      matches(filters.market, location.market) &&
      matches(filters.district, location.district) &&
      matches(filters.locationId, action.locationId)
  );
}

export function matchingLocations(filters) {
  return LOCATIONS.filter((location) =>
    matches(filters.market, location.market) &&
    matches(filters.district, location.district) &&
    matches(filters.locationId, location.id)
  );
}

function matches(filterValue, actualValue) {
  return !filterValue || filterValue === "all" || filterValue === actualValue;
}

function isDateInRange(date, range) {
  const value = new Date(`${date}T00:00:00`).getTime();
  return value >= new Date(`${range.start}T00:00:00`).getTime() && value <= new Date(`${range.end}T00:00:00`).getTime();
}

export function summarize(orders, labor = []) {
  const grossSales = sum(orders, (order) => order.grossSales);
  const discounts = sum(orders, (order) => order.discount);
  const merchantPromo = sum(orders, (order) => order.merchantPromo);
  const merchantRefunds = sum(orders, (order) => order.refundMerchant);
  const platformRefunds = sum(orders, (order) => order.refundPlatform);
  const netSales = sum(orders, orderNetRevenue);
  const platformFees = sum(orders, (order) => order.platformFee);
  const paymentFees = sum(orders, (order) => order.paymentFee);
  const foodCost = sum(orders, (order) => order.foodCost);
  const packagingCost = sum(orders, (order) => order.packagingCost);
  const directSales = sum(orders.filter((order) => order.channelId === "direct"), orderNetRevenue);
  const laborExpense = sum(labor, laborCost);
  const contributionBeforeLabor = netSales - platformFees - paymentFees - foodCost - packagingCost;
  const contributionMargin = contributionBeforeLabor - laborExpense;
  const orderCount = orders.length;
  const quantity = sum(orders, (order) => order.quantity);

  return {
    grossSales,
    discounts,
    merchantPromo,
    merchantRefunds,
    platformRefunds,
    netSales,
    platformFees,
    paymentFees,
    foodCost,
    packagingCost,
    laborExpense,
    contributionBeforeLabor,
    contributionMargin,
    marginPct: safeDivide(contributionMargin, netSales),
    orderCount,
    quantity,
    directOrderMix: safeDivide(directSales, netSales),
    refundRate: safeDivide(merchantRefunds, grossSales),
    effectiveFeeRate: safeDivide(platformFees + paymentFees, netSales),
    laborPerOrder: safeDivide(laborExpense, orderCount),
    cogsRate: safeDivide(foodCost, netSales),
    packagingPerOrder: safeDivide(packagingCost, orderCount),
    aov: safeDivide(netSales, orderCount)
  };
}

export function comparePeriods(data, filters) {
  const current = filterData(data, filters);
  const previousRange = shiftRange(filters.range, -7);
  const previous = filterData(data, { ...filters, range: previousRange });
  return {
    current,
    previous,
    currentSummary: summarize(current.orders, current.labor),
    previousSummary: summarize(previous.orders, previous.labor)
  };
}

function shiftRange(range, days) {
  if (!range) return null;
  return {
    start: addDays(range.start, days),
    end: addDays(range.end, days)
  };
}

function addDays(date, days) {
  const next = new Date(`${date}T00:00:00`);
  next.setDate(next.getDate() + days);
  return next.toISOString().slice(0, 10);
}

export function varianceBridge(currentSummary, previousSummary) {
  const start = previousSummary.marginPct || 0;
  const channelMix = currentSummary.directOrderMix - previousSummary.directOrderMix;
  const feeRate = -(currentSummary.effectiveFeeRate - previousSummary.effectiveFeeRate);
  const refunds = -(currentSummary.refundRate - previousSummary.refundRate);
  const cogs = -(currentSummary.cogsRate - previousSummary.cogsRate);
  const labor = -(safeDivide(currentSummary.laborExpense, currentSummary.netSales) - safeDivide(previousSummary.laborExpense, previousSummary.netSales));
  const end = currentSummary.marginPct || 0;
  const rawDrivers = [
    { id: "channel", label: "channel mix", value: channelMix, driver: channelMix >= 0 ? "direct-order mix improved" : "marketplace mix increased" },
    { id: "fees", label: "platform fees", value: feeRate, driver: feeRate >= 0 ? "effective fee rate improved" : "effective fee rate increased" },
    { id: "refunds", label: "refunds", value: refunds, driver: refunds >= 0 ? "refund rate improved" : "merchant-funded refunds increased" },
    { id: "cogs", label: "COGS / food cost", value: cogs, driver: cogs >= 0 ? "item mix and food cost improved" : "item mix and food cost worsened" },
    { id: "labor", label: "labor efficiency", value: labor, driver: labor >= 0 ? "labor efficiency improved" : "labor hours/order increased" }
  ];
  const residual = end - start - rawDrivers.reduce((total, item) => total + item.value, 0);
  return [
    { id: "start", label: "prior 7 days", value: start, type: "start" },
    ...rawDrivers,
    { id: "other", label: "other", value: residual, driver: "volume, AOV, and rounding effects" },
    { id: "end", label: "current 7 days", value: end, type: "end" }
  ];
}

export function channelMix(orders) {
  const grouped = groupBy(orders, (order) => order.channelId);
  const totalNetSales = sum(orders, orderNetRevenue);
  return Object.entries(grouped)
    .map(([channelId, rows]) => ({
      id: channelId,
      label: channelById[channelId]?.name || channelId,
      value: sum(rows, orderNetRevenue),
      pct: safeDivide(sum(rows, orderNetRevenue), totalNetSales),
      color: channelById[channelId]?.color || "#777",
      orders: rows.length
    }))
    .sort((a, b) => b.value - a.value);
}

export function locationPerformance(data, filters) {
  return matchingLocations(filters).map((location) => {
    const locationFilters = { ...filters, locationId: location.id };
    const { currentSummary, previousSummary, current, previous } = comparePeriods(data, locationFilters);
    const delta = currentSummary.marginPct - previousSummary.marginPct;
    const bridge = varianceBridge(currentSummary, previousSummary).filter((item) => item.type !== "start" && item.type !== "end");
    const topDriver = bridge.sort((a, b) => Math.abs(b.value) - Math.abs(a.value))[0];
    const riskScore =
      (currentSummary.marginPct < 0.16 ? 3 : currentSummary.marginPct < 0.19 ? 1 : 0) +
      (delta < -0.02 ? 3 : delta < -0.008 ? 1 : 0) +
      (currentSummary.refundRate > 0.035 ? 2 : 0);
    return {
      ...location,
      summary: currentSummary,
      delta,
      topDriver,
      risk: riskScore >= 5 ? "high" : riskScore >= 2 ? "medium" : "low",
      orders: current.orders.length,
      previousOrders: previous.orders.length
    };
  }).filter((location) => location.orders + location.previousOrders > 0).sort((a, b) => {
    const order = { high: 3, medium: 2, low: 1 };
    return order[b.risk] - order[a.risk] || a.summary.marginPct - b.summary.marginPct;
  });
}

export function menuPerformance(data, filters) {
  const filtered = filterData(data, filters);
  const grouped = groupBy(filtered.orders, (order) => order.itemId);
  const previous = filterData(data, { ...filters, range: shiftRange(filters.range, -7) });
  const previousGrouped = groupBy(previous.orders, (order) => order.itemId);
  const rows = Object.entries(grouped).map(([itemId, rowsForItem]) => {
    const item = itemById[itemId];
    const previousSummary = summarize(previousGrouped[itemId] || [], []);
    const summary = summarize(rowsForItem, []);
    const unitContribution = safeDivide(summary.contributionBeforeLabor, summary.quantity);
    const marginPct = summary.marginPct || safeDivide(summary.contributionBeforeLabor, summary.netSales);
    return {
      ...item,
      brandName: brandById[item.brand]?.name || item.brand,
      summary,
      unitContribution,
      marginPct,
      delta: marginPct - (previousSummary.marginPct || 0),
      volumeRank: 0,
      recommendation: recommendationForItem(summary, marginPct, rowsForItem.length)
    };
  });

  rows.sort((a, b) => b.summary.quantity - a.summary.quantity).forEach((row, index) => {
    row.volumeRank = index + 1;
  });

  return rows.sort((a, b) => a.marginPct - b.marginPct);
}

function recommendationForItem(summary, marginPct, orderCount) {
  if (orderCount > 120 && marginPct < 0.35) return "reprice / reduce promo";
  if (summary.refundRate > 0.04) return "audit quality";
  if (marginPct > 0.55 && orderCount > 80) return "promote";
  return "monitor";
}

export function forecastSeries(data, filters, scenario = {}) {
  const locationIds = new Set(
    LOCATIONS.filter((location) =>
      matches(filters.market, location.market) &&
      matches(filters.district, location.district) &&
      matches(filters.locationId, location.id)
    ).map((location) => location.id)
  );
  const grouped = groupBy(data.forecast.filter((row) => locationIds.has(row.locationId)), (row) => row.week);
  const scenarioDirectLift = Number(scenario.directMixLift || 0) / 100;
  const scenarioFoodInflation = Number(scenario.foodInflation || 0) / 100;
  const scenarioVolumeGrowth = Number(scenario.volumeGrowth || 0) / 100;
  const scenarioLaborEfficiency = Number(scenario.laborEfficiency || 0) / 100;
  const scenarioRefundReduction = Number(scenario.refundReduction || 0) / 100;

  return Object.entries(grouped).map(([week, rows], index) => {
    const revenue = sum(rows, (row) => row.revenueForecast) * (1 + scenarioVolumeGrowth);
    const baseRevenue = sum(rows, (row) => row.revenueForecast);
    const orders = sum(rows, (row) => row.ordersForecast) * (1 + scenarioVolumeGrowth);
    const cogs = sum(rows, (row) => row.cogsForecast) * (1 + scenarioFoodInflation);
    const labor = sum(rows, (row) => row.laborForecast) * (1 - scenarioLaborEfficiency);
    const baseMargin = sum(rows, (row) => row.marginForecast);
    const scenarioMargin =
      baseMargin +
      revenue * scenarioDirectLift * 0.17 +
      revenue * scenarioRefundReduction * 0.8 -
      (cogs - sum(rows, (row) => row.cogsForecast)) -
      (labor - sum(rows, (row) => row.laborForecast));
    return {
      week,
      index: index + 1,
      revenue,
      orders,
      cogs,
      labor,
      baseMargin,
      scenarioMargin,
      baseMarginPct: safeDivide(baseMargin, baseRevenue),
      scenarioMarginPct: safeDivide(scenarioMargin, revenue),
      confidenceLow: sum(rows, (row) => row.confidenceLow),
      confidenceHigh: sum(rows, (row) => row.confidenceHigh)
    };
  });
}

export function weeklySummary(data, filters, scenario) {
  const { currentSummary, previousSummary } = comparePeriods(data, filters);
  const bridge = varianceBridge(currentSummary, previousSummary);
  const drivers = bridge
    .filter((item) => !item.type)
    .sort((a, b) => Math.abs(b.value) - Math.abs(a.value))
    .slice(0, 3);
  const forecast = forecastSeries(data, filters, scenario);
  const week13 = forecast.at(-1);
  const actions = data.actions.filter((action) => actionLocationMatches(action, filters));
  const next = actions.length
    ? actions.slice(0, 3).map((action) => `${action.issue} (${formatters.points(action.estimatedImpactPts / 100)} modeled impact).`)
    : ["No operator action is scoped to the current filter; monitor variance drivers before assigning field work."];
  return {
    title: "Weekly finance summary",
    period: "May 5 - May 11, 2026",
    changed: [
      `Net sales ${deltaText(currentSummary.netSales, previousSummary.netSales)} vs prior week.`,
      `Contribution margin moved ${formatters.points(currentSummary.marginPct - previousSummary.marginPct)} to ${formatters.percent(currentSummary.marginPct)}.`,
      `Direct-order mix is ${formatters.percent(currentSummary.directOrderMix)} (${formatters.points(currentSummary.directOrderMix - previousSummary.directOrderMix)}).`
    ],
    why: drivers.map((driver) => `${driver.driver}: ${formatters.points(driver.value)} impact.`),
    next,
    risks: [
      "Platform fee increase expected in 3 weeks.",
      "Chicken and packaging cost volatility remains elevated.",
      laborRiskLine(filters)
    ],
    forecast: {
      base: week13?.baseMarginPct || 0,
      scenario: week13?.scenarioMarginPct || 0,
      upside: (week13?.scenarioMarginPct || 0) - (week13?.baseMarginPct || 0)
    }
  };
}

function laborRiskLine(filters) {
  if (filters.market && filters.market !== "all") return `Weekend labor availability is below target in ${filters.market}.`;
  if (filters.district && filters.district !== "all") return `Weekend labor availability is below target in ${filters.district}.`;
  return "Weekend labor availability is below target in LA and Austin.";
}

function deltaText(current, previous) {
  const delta = safeDivide(current - previous, previous);
  const sign = delta >= 0 ? "increased" : "decreased";
  return `${sign} ${Math.abs(delta * 100).toFixed(1)}%`;
}

function sum(rows, accessor) {
  return rows.reduce((total, row) => total + (Number(accessor(row)) || 0), 0);
}

function groupBy(rows, keyFn) {
  return rows.reduce((groups, row) => {
    const key = keyFn(row);
    groups[key] ||= [];
    groups[key].push(row);
    return groups;
  }, {});
}

function safeDivide(numerator, denominator) {
  return denominator ? numerator / denominator : 0;
}
