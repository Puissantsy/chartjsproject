import { state } from "./state.js";
import { getContinentFromCountry, splitMultiValueField } from "./utils.js";

export function initFiltersFromData() {
  const countrySelect = document.getElementById("countrySelect");
  const devTypeSelect = document.getElementById("devTypeSelect");
  if (!countrySelect || !devTypeSelect) return;

  const countries = new Set();
  const devTypes = new Set();

  state.rawData.forEach((row) => {
    if (row.Country) countries.add(row.Country);
    if (row.DevType) splitMultiValueField(row.DevType).forEach((t) => devTypes.add(t));
  });

  countrySelect.innerHTML = '<option value="all">Tous les pays</option>';
  Array.from(countries).sort().forEach((c) => {
    const opt = document.createElement("option");
    opt.value = c;
    opt.textContent = c;
    countrySelect.appendChild(opt);
  });

  devTypeSelect.innerHTML = '<option value="all">Tous les métiers</option>';
  Array.from(devTypes).sort().forEach((t) => {
    const opt = document.createElement("option");
    opt.value = t;
    opt.textContent = t;
    devTypeSelect.appendChild(opt);
  });
}

export function getGlobalFilters() {
  return {
    continent: document.getElementById("continentSelect")?.value ?? "all",
    country: document.getElementById("countrySelect")?.value ?? "all",
    devType: document.getElementById("devTypeSelect")?.value ?? "all"
  };
}

export function filterBaseData({ continent, country, devType }) {
  return state.rawData.filter((row) => {
    if (country !== "all" && row.Country !== country) return false;

    if (continent !== "all") {
      const inferred = getContinentFromCountry(row.Country);
      if (inferred !== continent) return false;
    }

    if (devType !== "all") {
      const devTypes = splitMultiValueField(row.DevType);
      if (!devTypes.includes(devType)) return false;
    }

    return true;
  });
}
