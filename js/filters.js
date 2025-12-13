import { state } from "./state.js";
import { getContinentFromCountry, isProfessional, splitMultiValueField } from "./utils.js";

let countriesByContinent = {
  Europe: new Set(),
  "North America": new Set(),
};

export function initFiltersFromData() {
  const countrySelect = document.getElementById("countrySelect");
  const continentSelect = document.getElementById("continentSelect");
  const devTypeSelect = document.getElementById("devTypeSelect");
  if (!countrySelect || !continentSelect || !devTypeSelect) return;

  countriesByContinent.Europe.clear();
  countriesByContinent["North America"].clear();

  const devTypes = new Set();

  state.rawData.forEach((row) => {
    if (!isProfessional(row)) return;

    if (row.Country) {
      const continent = getContinentFromCountry(row.Country);
      if (continent && countriesByContinent[continent]) {
        countriesByContinent[continent].add(row.Country);
      }
    }

    if (row.DevType) {
      splitMultiValueField(row.DevType).forEach((t) => devTypes.add(t));
    }
  });

  // Pays dépend du continent
  updateCountrySelect("all");
  continentSelect.addEventListener("change", () => {
    updateCountrySelect(continentSelect.value);
  });

  // DevType (liste complète, indépendante du pays)
  devTypeSelect.innerHTML = '<option value="all">Tous les métiers</option>';
  Array.from(devTypes).sort().forEach((t) => {
    const opt = document.createElement("option");
    opt.value = t;
    opt.textContent = t;
    devTypeSelect.appendChild(opt);
  });
}

function updateCountrySelect(continent) {
  const countrySelect = document.getElementById("countrySelect");
  if (!countrySelect) return;

  countrySelect.innerHTML = '<option value="all">Tous les pays</option>';

  let countries = [];
  if (continent === "all") {
    countries = [
      ...countriesByContinent.Europe,
      ...countriesByContinent["North America"],
    ];
  } else {
    countries = [...countriesByContinent[continent]];
  }

  countries.sort().forEach((country) => {
    const opt = document.createElement("option");
    opt.value = country;
    opt.textContent = country;
    countrySelect.appendChild(opt);
  });
}

export function getGlobalFilters() {
  return {
    continent: document.getElementById("continentSelect")?.value ?? "all",
    country: document.getElementById("countrySelect")?.value ?? "all",
    devType: document.getElementById("devTypeSelect")?.value ?? "all",
  };
}

// Pour revenus + compétences techniques : pro + continent + pays
export function filterBaseData({ continent, country }) {
  return state.rawData.filter((row) => {
    if (!isProfessional(row)) return false;

    if (continent !== "all") {
      const inferred = getContinentFromCountry(row.Country);
      if (inferred !== continent) return false;
    }

    if (country !== "all" && row.Country !== country) return false;

    return true;
  });
}

// Pour OS/Comm : pro + continent + devType (PAS pays)
export function filterTechUsageData({ continent, devType }) {
  return state.rawData.filter((row) => {
    if (!isProfessional(row)) return false;

    if (continent !== "all") {
      const inferred = getContinentFromCountry(row.Country);
      if (inferred !== continent) return false;
    }

    if (devType !== "all") {
      const types = splitMultiValueField(row.DevType);
      if (!types.includes(devType)) return false;
    }

    return true;
  });
}
