import { currencyToEurRate, europeCountries, northAmericaCountries, colorPalettes } from "./config.js";

export function getContinentFromCountry(country) {
  if (!country) return null;
  if (europeCountries.has(country)) return "Europe";
  if (northAmericaCountries.has(country)) return "North America";
  return null;
}

export function toEuro(amount, currency) {
  if (amount == null || amount === "") return null;
  const num = Number(amount);
  if (Number.isNaN(num) || num <= 0) return null;

  const code = (currency || "").split(" ")[0].trim();
  const rate = currencyToEurRate[code] || 1;
  return num * rate;
}

export function parseYears(value) {
  if (!value) return null;
  const s = String(value).trim();
  if (!s) return null;

  if (s.toLowerCase().includes("less than 1")) return 0.5;
  if (s.toLowerCase().includes("more than")) {
    const num = parseInt(s.replace(/\D+/g, ""), 10);
    return Number.isNaN(num) ? 50 : num;
  }

  const parsed = parseFloat(s.replace(",", "."));
  if (!Number.isNaN(parsed)) return parsed;

  const m = s.match(/\d+/);
  return m ? parseFloat(m[0]) : null;
}

export function bucketExperience(years) {
  if (years == null) return null;
  if (years <= 2) return "0-2";
  if (years <= 5) return "3-5";
  if (years <= 10) return "6-10";
  return "10+";
}

export function splitMultiValueField(value) {
  if (!value) return [];
  return String(value)
    .split(";")
    .map((v) => v.trim())
    .filter((v) => v.length > 0);
}

export function updateStatus(message, type = "loading") {
  const badge = document.getElementById("statusBadge");
  const text = document.getElementById("statusText");
  if (!badge || !text) return;

  badge.className = `status-badge ${type}`;
  text.textContent = message;
}

export function generateColors(count, palette = "gradient") {
  const colors = colorPalettes[palette] || colorPalettes.gradient;
  const result = [];
  for (let i = 0; i < count; i++) result.push(colors[i % colors.length]);
  return result;
}
