import { loadData } from "./dataService.js";
import { initFiltersFromData, getGlobalFilters, filterBaseData, filterTechUsageData } from "./filters.js";


import { updateExperienceChart } from "./charts/experienceChart.js";
import { updateEducationChart } from "./charts/educationChart.js";
import { updateCloudChart } from "./charts/cloudChart.js";
import { updateWebframeChart } from "./charts/webframeChart.js";
import { updateOSChart } from "./charts/osChart.js";
import { updateCommChart } from "./charts/commChart.js";

function safeChart(name, fn) {
  try {
    fn();
  } catch (err) {
    console.error(`[Chart error] ${name}`, err);

    // Optionnel: afficher un petit message dans une zone dédiée
    const el = document.querySelector(`[data-chart-status="${name}"]`);
    if (el) el.textContent = `Erreur: ${err?.message ?? err}`;
  }
}

function updateAllCharts() {
  const globalFilters = getGlobalFilters();

  // 1) Revenus + compétences : continent + pays
  const baseFiltered = filterBaseData(globalFilters);

  safeChart("experience", () => updateExperienceChart(baseFiltered));
  safeChart("education", () => updateEducationChart(baseFiltered));

  const cloudExpFilter = document.getElementById("cloudExpFilter")?.value ?? "all";
  safeChart("cloud", () => updateCloudChart(baseFiltered, cloudExpFilter));

  const webframeExpFilter = document.getElementById("webframeExpFilter")?.value ?? "all";
  safeChart("webframe", () => updateWebframeChart(baseFiltered, webframeExpFilter));

  // 2) Technologies utilisées : continent + DevType (pas pays)
  const usageFiltered = filterTechUsageData(globalFilters);

  const osTopN = parseInt(document.getElementById("osTopN")?.value ?? "5", 10);
  safeChart("os", () => updateOSChart(usageFiltered, osTopN));

  const commTopN = parseInt(document.getElementById("commTopN")?.value ?? "5", 10);
  safeChart("comm", () => updateCommChart(usageFiltered, commTopN));
}



function initUIEvents() {
  // Filtres globaux (continent/pays) -> revenus + cloud + webframe
  ["continentSelect", "countrySelect"].forEach((id) => {
    document.getElementById(id)?.addEventListener("change", updateAllCharts);
  });

  // Filtres spécifiques cloud/webframe
  document.getElementById("cloudExpFilter")?.addEventListener("change", updateAllCharts);
  document.getElementById("webframeExpFilter")?.addEventListener("change", updateAllCharts);

  // Filtres section 3 (OS/Comm)
  document.getElementById("devTypeSelect")?.addEventListener("change", updateAllCharts);
  document.getElementById("osTopN")?.addEventListener("change", updateAllCharts);
  document.getElementById("commTopN")?.addEventListener("change", updateAllCharts);
}


document.addEventListener("DOMContentLoaded", async () => {
  initUIEvents();
  await loadData();
  initFiltersFromData();
  updateAllCharts();
});
