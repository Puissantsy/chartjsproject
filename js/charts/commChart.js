import { state } from "../state.js";
import { getContinentFromCountry, isProfessional, splitMultiValueField } from "../utils.js";
import { renderOrUpdateChart } from "../chartRenderer.js";
import { colorPalettes } from "../config.js";

export function updateCommChart(filtered, topN) {
  // Le sujet demande : top outils de communication... en fonction du métier (DevType)
  // et du continent (PAS le pays). On repart donc de state.rawData.
  const continent = document.getElementById("continentSelect")?.value ?? "all";
  const devType = document.getElementById("devTypeSelect")?.value ?? "all";

  const base = state.rawData.filter((row) => {
    if (!isProfessional(row)) return false;
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

  const counts = {};

  base.forEach((row) => {
    const tools = [
      ...splitMultiValueField(row.OfficeStackAsyncHaveWorkedWith),
      ...splitMultiValueField(row.OfficeStackSyncHaveWorkedWith),
    ]
      .map((t) => t.trim())
      .filter((t) => t && t !== "NA");

    tools.forEach((t) => {
      counts[t] = (counts[t] || 0) + 1;
    });
  });

  const entries = Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, topN);

  const labels = entries.map(([k]) => k);
  const values = entries.map(([_, v]) => v);

  const config = {
    type: "radar",
    data: {
      labels,
      datasets: [{
        label: "Nombre d'utilisations",
        data: values,
        borderColor: colorPalettes.primary[0],
        backgroundColor: colorPalettes.primary[0] + "40",
        borderWidth: 2,
        pointBackgroundColor: colorPalettes.primary[0],
        pointBorderColor: "#fff",
        pointRadius: 4,
        pointHoverRadius: 6
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: "rgba(0, 0, 0, 0.8)",
          padding: 12,
          callbacks: {
            label: (ctx) => `${ctx.label}: ${ctx.parsed.r} réponses`
          }
        }
      },
      scales: {
        r: {
          grid: { color: "rgba(255, 255, 255, 0.1)" },
          angleLines: { color: "rgba(255, 255, 255, 0.1)" },
          pointLabels: {
            color: "#cbd5e1",
            font: { size: 11 }
          },
          ticks: {
            color: "#94a3b8",
            backdropColor: "transparent"
          }
        }
      }
    }
  };

  renderOrUpdateChart("chartComm", "comm", config);
}
