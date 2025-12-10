// Pricing: apply surcharge based on difference from 21°C
// If difference <= 1 degree, no surcharge.
// Otherwise, 2% per degree beyond 1.

function computeFinalPrice(basePrice, temperatureC, target = 21) {
  const base = Number(basePrice);
  const diff = Math.abs(temperatureC - target);

  if (diff <= 1) return Number(base.toFixed(2));

  const percentPerDegree = 0.02; // 2% per degree
  const surchargePercent = (diff - 1) * percentPerDegree;
  const final = base * (1 + surchargePercent);

  return Number(final.toFixed(2));
}

module.exports = { computeFinalPrice };
