import { state } from "../state.js";
import { generateColors, getContinentFromCountry, isProfessional, splitMultiValueField } from "../utils.js";
import { renderOrUpdateChart } from "../chartRenderer.js";

export function updateOSChart(filtered, topN) {
  // Le sujet demande : top OS par continent + métier (DevType).
  // IMPORTANT : pas de filtre "pays" ici.
  // Pour éviter qu'un filtre global pays n'impacte ce graphique,
  // on reconstruit le dataset à partir de state.rawData.
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
    const oss = splitMultiValueField(row.OpSysProfessionaluse);
    oss.forEach((os) => {
      counts[os] = (counts[os] || 0) + 1;
    });
  });

  const entries = Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, topN);

  const labels = entries.map(([k]) => k);
  const values = entries.map(([_, v]) => v);
  const colors = generateColors(entries.length, "gradient");

  const config = {
    type: "doughnut",
    data: {
      labels,
      datasets: [{
        label: "Nombre d'utilisations",
        data: values,
        backgroundColor: colors,
        borderWidth: 2,
        borderColor: "#1e293b"
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: true,
          position: "right",
          labels: {
            color: "#cbd5e1",
            padding: 10,
            font: { size: 11 }
          }
        },
        tooltip: {
          backgroundColor: "rgba(0, 0, 0, 0.8)",
          padding: 12,
          callbacks: {
            label: (ctx) => `${ctx.label}: ${ctx.parsed} réponses`
          }
        }
      }
    }
  };

  renderOrUpdateChart("chartOS", "os", config);
}
