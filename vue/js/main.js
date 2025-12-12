import { loadData } from "./dataService.js";
import { initFiltersFromData, getGlobalFilters, filterBaseData } from "./filters.js";

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
  const baseFiltered = filterBaseData(globalFilters);

  safeChart("experience", () => updateExperienceChart(baseFiltered));
  safeChart("education", () => updateEducationChart(baseFiltered));

  const cloudExpFilter = document.getElementById("cloudExpFilter")?.value ?? "all";
  safeChart("cloud", () => updateCloudChart(baseFiltered, cloudExpFilter));

  const webframeExpFilter = document.getElementById("webframeExpFilter")?.value ?? "all";
  safeChart("webframe", () => updateWebframeChart(baseFiltered, webframeExpFilter));

  const osTopN = parseInt(document.getElementById("osTopN")?.value ?? "5", 10);
  safeChart("os", () => updateOSChart(baseFiltered, osTopN));

  const commTopN = parseInt(document.getElementById("commTopN")?.value ?? "5", 10);
  safeChart("comm", () => updateCommChart(baseFiltered, commTopN));
}


function initUIEvents() {
  ["continentSelect", "countrySelect", "devTypeSelect"].forEach((id) => {
    document.getElementById(id)?.addEventListener("change", updateAllCharts);
  });

  document.getElementById("cloudExpFilter")?.addEventListener("change", updateAllCharts);
  document.getElementById("webframeExpFilter")?.addEventListener("change", updateAllCharts);
  document.getElementById("osTopN")?.addEventListener("change", updateAllCharts);
  document.getElementById("commTopN")?.addEventListener("change", updateAllCharts);
}

document.addEventListener("DOMContentLoaded", async () => {
  initUIEvents();
  await loadData();
  initFiltersFromData();
  updateAllCharts();
});
