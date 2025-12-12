import { splitMultiValueField } from "../utils.js";
import { renderOrUpdateChart } from "../chartRenderer.js";
import { colorPalettes } from "../config.js";


export function updateCommChart(filtered, topN) {
  const counts = {};

  filtered.forEach((row) => {
    // On récupère tous les outils (async + sync, have + want)
    const tools = [
      ...splitMultiValueField(row.OfficeStackAsyncHaveWorkedWith),
      ...splitMultiValueField(row.OfficeStackSyncHaveWorkedWith),
    ]
      .map((t) => t.trim())
      .filter((t) => t && t !== "NA"); // on enlève les vides / NA éventuels

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
        backgroundColor: colorPalettes.primary[0] + '40',
        borderWidth: 2,
        pointBackgroundColor: colorPalettes.primary[0],
        pointBorderColor: '#fff',
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
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          padding: 12,
          callbacks: {
            label: (ctx) => `${ctx.label}: ${ctx.parsed.r} réponses`
          }
        }
      },
      scales: {
        r: {
          grid: { color: 'rgba(255, 255, 255, 0.1)' },
          angleLines: { color: 'rgba(255, 255, 255, 0.1)' },
          pointLabels: {
            color: '#cbd5e1',
            font: { size: 11 }
          },
          ticks: {
            color: '#94a3b8',
            backdropColor: 'transparent'
          }
        }
      }
    }
  };

  renderOrUpdateChart("chartComm", "comm", config);
}
