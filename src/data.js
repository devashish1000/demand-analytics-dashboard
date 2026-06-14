const START = new Date("2026-04-28T00:00:00");
const DAY_MS = 86400000;

export const LOCATIONS = [
  { id: "aus-south", name: "Austin - South", market: "Austin", district: "ATX", manager: "Priya Shah", opened: "2025-08-11", capacity: "high" },
  { id: "chi-west", name: "Chicago - West", market: "Chicago", district: "CHI", manager: "Marco Bell", opened: "2024-11-04", capacity: "high" },
  { id: "la-culver", name: "LA - Culver City", market: "Los Angeles", district: "LA1", manager: "Elena Ruiz", opened: "2024-05-20", capacity: "high" },
  { id: "hou-midtown", name: "Houston - Midtown", market: "Houston", district: "HOU", manager: "Andre Lewis", opened: "2025-01-15", capacity: "medium" },
  { id: "dal-north", name: "Dallas - North", market: "Dallas", district: "DAL", manager: "Nora Patel", opened: "2024-09-09", capacity: "medium" },
  { id: "phx-central", name: "Phoenix - Central", market: "Phoenix", district: "PHX", manager: "Sam Carter", opened: "2025-02-17", capacity: "medium" },
  { id: "mia-beach", name: "Miami - Beach", market: "Miami", district: "MIA", manager: "Camila Torres", opened: "2025-06-02", capacity: "medium" },
  { id: "den-rino", name: "Denver - RiNo", market: "Denver", district: "DEN", manager: "Taylor Ng", opened: "2025-09-22", capacity: "pilot" }
];

export const BRANDS = [
  { id: "moonbowls", name: "moonbowls", tone: "#215a41" },
  { id: "xenia", name: "xenia", tone: "#9d5a2e" },
  { id: "zuzu", name: "zuzubowls", tone: "#bb7a17" },
  { id: "thrive", name: "thrive protein bowls", tone: "#467c48" },
  { id: "hibachi", name: "hungry hibachi", tone: "#8d3e2d" },
  { id: "hawaiian", name: "big daddy's hawaiian", tone: "#214c5a" }
];

export const CHANNELS = [
  { id: "marketplace", name: "delivery marketplace", commission: 0.245, payment: 0.027, fixed: 0.32, color: "#163d35" },
  { id: "direct", name: "direct order", commission: 0.045, payment: 0.029, fixed: 0.18, color: "#3f8a50" },
  { id: "pickup", name: "pickup", commission: 0.015, payment: 0.027, fixed: 0.12, color: "#f2a51a" },
  { id: "catering", name: "catering", commission: 0.08, payment: 0.025, fixed: 0.55, color: "#5d6e68" }
];

export const MENU_ITEMS = [
  { id: "spicy-chicken-bowl", brand: "moonbowls", name: "Spicy Chicken Bowl", category: "grain bowl", price: 17.2, foodCost: 4.45, packaging: 1.02, laborMinutes: 3.7, imageSlot: 0 },
  { id: "korean-bbq-bowl", brand: "moonbowls", name: "Korean BBQ Bowl", category: "grain bowl", price: 18.1, foodCost: 5.3, packaging: 1.08, laborMinutes: 4.1, imageSlot: 3 },
  { id: "truffle-quinoa", brand: "xenia", name: "Truffle Quinoa Bowl", category: "premium bowl", price: 19.4, foodCost: 5.75, packaging: 1.16, laborMinutes: 4.3, imageSlot: 1 },
  { id: "greek-chicken", brand: "xenia", name: "Greek Chicken Plate", category: "protein plate", price: 18.7, foodCost: 5.15, packaging: 1.1, laborMinutes: 4.0, imageSlot: 1 },
  { id: "thai-crunch", brand: "zuzu", name: "Thai Crunch Bowl", category: "grain bowl", price: 16.9, foodCost: 4.95, packaging: 1.0, laborMinutes: 3.9, imageSlot: 0 },
  { id: "miso-salmon", brand: "zuzu", name: "Miso Salmon Bowl", category: "premium bowl", price: 21.8, foodCost: 7.25, packaging: 1.2, laborMinutes: 4.8, imageSlot: 0 },
  { id: "power-steak", brand: "thrive", name: "Power Steak Bowl", category: "protein bowl", price: 20.2, foodCost: 6.9, packaging: 1.15, laborMinutes: 4.6, imageSlot: 2 },
  { id: "green-goddess", brand: "thrive", name: "Green Goddess Bowl", category: "protein bowl", price: 16.4, foodCost: 4.4, packaging: 0.98, laborMinutes: 3.5, imageSlot: 1 },
  { id: "hibachi-chicken", brand: "hibachi", name: "Hibachi Chicken Bowl", category: "hibachi", price: 17.7, foodCost: 5.1, packaging: 1.05, laborMinutes: 4.2, imageSlot: 2 },
  { id: "hibachi-steak", brand: "hibachi", name: "Hibachi Steak Bowl", category: "hibachi", price: 20.6, foodCost: 7.4, packaging: 1.12, laborMinutes: 4.8, imageSlot: 2 },
  { id: "honey-chick-sando", brand: "hawaiian", name: "Honey Chick Sando", category: "sandwich", price: 15.8, foodCost: 5.8, packaging: 1.18, laborMinutes: 4.4, imageSlot: 3 },
  { id: "island-rice-bowl", brand: "hawaiian", name: "Island Rice Bowl", category: "rice bowl", price: 17.4, foodCost: 5.25, packaging: 1.1, laborMinutes: 4.1, imageSlot: 3 }
];

export const ACTIONS = [
  {
    id: "act-001",
    priority: "high",
    locationId: "aus-south",
    issue: "Review refund causes at Austin - moonbowls PM shift",
    evidence: "Merchant-funded refunds rose 1.4 pts and late pickup notes increased on marketplace orders.",
    estimatedImpactPts: 1.2,
    owner: "ATX ops mgr",
    status: "open",
    due: "2026-05-14"
  },
  {
    id: "act-002",
    priority: "high",
    locationId: "chi-west",
    issue: "Shift promo spend from marketplace to direct ordering in Chicago",
    evidence: "Marketplace discounting increased $46K while direct-order AOV stayed 8.1% higher.",
    estimatedImpactPts: 0.8,
    owner: "CHI market lead",
    status: "in progress",
    due: "2026-05-16"
  },
  {
    id: "act-003",
    priority: "high",
    locationId: "la-culver",
    issue: "Reprice 3 low-margin, high-volume items",
    evidence: "Honey Chick Sando, Korean BBQ Bowl, and Hibachi Steak rank top 5 in volume but bottom quartile in contribution margin.",
    estimatedImpactPts: 1.5,
    owner: "culinary dir.",
    status: "open",
    due: "2026-05-18"
  },
  {
    id: "act-004",
    priority: "medium",
    locationId: "la-culver",
    issue: "Investigate labor variance in LA District 2",
    evidence: "Actual hours per 100 orders moved from 19.8 to 22.1; weekend prep staffing is the largest driver.",
    estimatedImpactPts: 0.6,
    owner: "LA ops dir.",
    status: "open",
    due: "2026-05-17"
  },
  {
    id: "act-005",
    priority: "medium",
    locationId: "dal-north",
    issue: "Reduce packaging cost on xenia bowl line",
    evidence: "Packaging cost/order is 12.4% above district median after container substitution.",
    estimatedImpactPts: 0.4,
    owner: "supply chain",
    status: "open",
    due: "2026-05-20"
  },
  {
    id: "act-006",
    priority: "medium",
    locationId: "hou-midtown",
    issue: "Audit channel fee drift on delivery marketplace orders",
    evidence: "Effective fee rate increased 1.1 pts without matching order growth.",
    estimatedImpactPts: 0.5,
    owner: "finance ops",
    status: "queued",
    due: "2026-05-21"
  }
];

const itemById = Object.fromEntries(MENU_ITEMS.map((item) => [item.id, item]));
const channelById = Object.fromEntries(CHANNELS.map((channel) => [channel.id, channel]));

function seededRandom(seed) {
  let value = seed % 2147483647;
  return () => {
    value = (value * 16807) % 2147483647;
    return (value - 1) / 2147483646;
  };
}

function round(value, digits = 2) {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

function isoDate(dayOffset) {
  return new Date(START.getTime() + dayOffset * DAY_MS).toISOString().slice(0, 10);
}

function weekLabel(dayOffset) {
  return `W${Math.floor(dayOffset / 7) + 1}`;
}

function weightedPick(items, random) {
  const total = items.reduce((sum, item) => sum + item.weight, 0);
  let cursor = random() * total;
  for (const item of items) {
    cursor -= item.weight;
    if (cursor <= 0) return item.value;
  }
  return items.at(-1).value;
}

function channelWeights(locationId, dayOffset) {
  const directLift = ["mia-beach", "phx-central", "den-rino"].includes(locationId) ? 0.04 : 0;
  const marketplacePressure = ["aus-south", "chi-west", "la-culver"].includes(locationId) && dayOffset > 7 ? 0.08 : 0;
  return [
    { value: "marketplace", weight: 54 + marketplacePressure * 100 },
    { value: "direct", weight: 14 + directLift * 100 },
    { value: "pickup", weight: 21 },
    { value: "catering", weight: 7 }
  ];
}

function locationDailyBase(location, dayOffset) {
  const capacity = location.capacity === "high" ? 1.22 : location.capacity === "pilot" ? 0.72 : 0.98;
  const weekend = [5, 6].includes((dayOffset + 2) % 7) ? 1.13 : 1;
  const seasonal = 1 + Math.sin((dayOffset + location.id.length) / 6) * 0.06;
  const pressure = ["aus-south", "chi-west", "la-culver"].includes(location.id) && dayOffset >= 7 ? 0.96 : 1.02;
  return 46 * capacity * weekend * seasonal * pressure;
}

export function createSampleData() {
  const random = seededRandom(7319);
  const orders = [];
  const labor = [];

  for (let day = 0; day < 14; day += 1) {
    for (const location of LOCATIONS) {
      const dailyTarget = Math.max(18, Math.round(locationDailyBase(location, day) + random() * 12));
      const laborBase = dailyTarget * (location.capacity === "high" ? 0.14 : 0.17);
      const laborVariance = ["la-culver", "hou-midtown"].includes(location.id) && day >= 7 ? 1.09 : 1;
      const hourlyRate = location.market === "Los Angeles" ? 23.5 : location.market === "Miami" ? 20.4 : 21.2;
      labor.push({
        date: isoDate(day),
        locationId: location.id,
        scheduledHours: round(laborBase * 0.96, 1),
        actualHours: round(laborBase * laborVariance * (0.94 + random() * 0.16), 1),
        hourlyRate,
        payrollBurdenRate: 0.14
      });

      for (let i = 0; i < dailyTarget; i += 1) {
        const channelId = weightedPick(channelWeights(location.id, day), random);
        const item = weightedPick(
          MENU_ITEMS.map((menuItem) => ({
            value: menuItem,
            weight: menuItem.brand === "moonbowls" ? 1.4 : menuItem.brand === "thrive" ? 1.15 : 1
          })),
          random
        );
        const channel = channelById[channelId];
        const quantity = random() > 0.89 ? 2 : 1;
        const daypart = weightedPick(
          [
            { value: "lunch", weight: 45 },
            { value: "dinner", weight: 43 },
            { value: "late", weight: 12 }
          ],
          random
        );
        const priceModifier = channelId === "catering" ? 1.08 : channelId === "direct" ? 0.99 : 1.02;
        const grossSales = round(item.price * quantity * priceModifier);
        const discountRate = channelId === "marketplace" ? 0.035 + random() * 0.03 : channelId === "direct" ? 0.018 : 0.01;
        const merchantPromo = round(grossSales * discountRate);
        const platformPromoFunding = round(channelId === "marketplace" ? grossSales * (random() > 0.86 ? 0.022 : 0) : 0);
        const refundStress = ["aus-south", "chi-west"].includes(location.id) && day >= 7 && daypart === "dinner" ? 0.035 : 0.012;
        const refundMerchant = round(random() < refundStress ? grossSales * (0.45 + random() * 0.45) : 0);
        const refundPlatform = round(random() < 0.006 ? grossSales * 0.35 : 0);
        const platformFee = round(channel.commission * grossSales + channel.fixed * quantity);
        const paymentFee = round(channel.payment * grossSales);
        const foodInflation = item.category.includes("protein") || item.category === "hibachi" ? 1.045 : 1.018;
        const wasteFactor = ["la-culver", "dal-north"].includes(location.id) && day >= 7 ? 1.04 : 1;
        const foodCost = round(item.foodCost * quantity * foodInflation * wasteFactor);
        const packagingCost = round(item.packaging * quantity * (channelId === "marketplace" ? 1.08 : 1));

        orders.push({
          id: `ord-${day}-${location.id}-${i}`,
          date: isoDate(day),
          week: weekLabel(day),
          locationId: location.id,
          brandId: item.brand,
          channelId,
          itemId: item.id,
          quantity,
          daypart,
          grossSales,
          discount: round(grossSales * 0.006),
          merchantPromo,
          platformPromoFunding,
          refundMerchant,
          refundPlatform,
          taxCollected: round(grossSales * 0.0825),
          tipsCollected: round(channelId === "direct" ? grossSales * 0.06 : grossSales * 0.025),
          platformFee,
          paymentFee,
          foodCost,
          packagingCost,
          laborMinutes: round(item.laborMinutes * quantity * (daypart === "late" ? 1.07 : 1), 1)
        });
      }
    }
  }

  return {
    generatedAt: "2026-05-11T08:30:00",
    locations: LOCATIONS,
    brands: BRANDS,
    channels: CHANNELS,
    menuItems: MENU_ITEMS,
    orders,
    labor,
    forecast: createForecast(orders, labor),
    actions: ACTIONS
  };
}

export function createForecast(orders, labor) {
  const random = seededRandom(1847);
  const byLocation = groupBy(orders, (order) => order.locationId);
  const laborByLocation = groupBy(labor, (row) => row.locationId);
  const weeks = Array.from({ length: 13 }, (_, index) => index + 1);

  return LOCATIONS.flatMap((location) => {
    const locationOrders = byLocation[location.id] || [];
    const locationLabor = laborByLocation[location.id] || [];
    const currentRevenue = locationOrders.reduce((sum, order) => sum + order.grossSales - order.discount - order.merchantPromo - order.refundMerchant, 0);
    const currentOrders = locationOrders.length;
    const currentCogs = locationOrders.reduce((sum, order) => sum + order.foodCost, 0);
    const currentLabor = locationLabor.reduce((sum, row) => sum + row.actualHours * row.hourlyRate * (1 + row.payrollBurdenRate), 0);
    const observedWeeks = Math.max(1, new Set(locationOrders.map((order) => order.week)).size);
    const weeklyRevenue = currentRevenue / observedWeeks;
    const weeklyOrders = currentOrders / observedWeeks;
    const weeklyCogs = currentCogs / observedWeeks;
    const weeklyLabor = currentLabor / observedWeeks;

    return weeks.map((week) => {
      const growth = 1 + week * 0.008 + Math.sin(week + location.id.length) * 0.012;
      const directMixLift = week >= 5 ? 0.012 * (week - 4) : 0;
      const feeRisk = ["chi-west", "hou-midtown"].includes(location.id) && week >= 4 ? 0.015 : 0;
      const revenueForecast = round(weeklyRevenue * growth * (0.985 + random() * 0.03));
      const ordersForecast = Math.round(weeklyOrders * growth * (0.98 + random() * 0.04));
      const cogsForecast = round(weeklyCogs * (growth + 0.012 * week));
      const laborForecast = round(weeklyLabor * (1 + week * 0.004));
      const marginForecast = round(revenueForecast - cogsForecast - laborForecast - revenueForecast * (0.305 - directMixLift + feeRisk));
      return {
        week: `Week ${week}`,
        locationId: location.id,
        revenueForecast,
        ordersForecast,
        cogsForecast,
        laborForecast,
        marginForecast,
        directMixTarget: round(0.145 + directMixLift, 3),
        confidenceLow: round(marginForecast * 0.92),
        confidenceHigh: round(marginForecast * 1.08)
      };
    });
  });
}

function groupBy(rows, keyFn) {
  return rows.reduce((groups, row) => {
    const key = keyFn(row);
    groups[key] ||= [];
    groups[key].push(row);
    return groups;
  }, {});
}

export function toSampleCsv(data) {
  const orderRows = data.orders.slice(0, 48).map((order) => ({
    date: order.date,
    location: LOCATIONS.find((location) => location.id === order.locationId).name,
    brand: BRANDS.find((brand) => brand.id === order.brandId).name,
    channel: CHANNELS.find((channel) => channel.id === order.channelId).name,
    item: itemById[order.itemId].name,
    quantity: order.quantity,
    gross_sales: order.grossSales,
    merchant_promo: order.merchantPromo,
    merchant_refund: order.refundMerchant,
    platform_fee: order.platformFee,
    food_cost: order.foodCost,
    packaging_cost: order.packagingCost,
    labor_minutes: order.laborMinutes
  }));

  const laborRows = data.labor.slice(0, 24).map((row) => ({
    date: row.date,
    location: LOCATIONS.find((location) => location.id === row.locationId).name,
    scheduled_hours: row.scheduledHours,
    actual_hours: row.actualHours,
    hourly_rate: row.hourlyRate,
    payroll_burden_rate: row.payrollBurdenRate
  }));

  return { orderRows, laborRows };
}
