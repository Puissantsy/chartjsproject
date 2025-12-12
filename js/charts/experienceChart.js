import { bucketExperience, parseYears, toEuro } from "../utils.js";
import { renderOrUpdateChart } from "../chartRenderer.js";
import { colorPalettes } from "../config.js";

export function updateExperienceChart(filtered) {
  const aggregates = {};

  filtered.forEach((row) => {
    const years = parseYears(row.YearsCodePro) ?? parseYears(row.WorkExp);
    const bucket = bucketExperience(years);
    const euro = toEuro(row.CompTotal, row.Currency);
    if (!bucket || euro == null) return;

    if (!aggregates[bucket]) aggregates[bucket] = { sum: 0, count: 0 };
    aggregates[bucket].sum += euro;
    aggregates[bucket].count += 1;
  });

  const order = ["0-2", "3-5", "6-10", "10+"];
  const labels = [];
  const values = [];

  order.forEach((b) => {
    if (aggregates[b]) {
      labels.push(b + " ans");
      values.push(Math.round(aggregates[b].sum / aggregates[b].count));
    }
  });

  const config = {
    type: "line",
    data: {
      labels,
      datasets: [{
        label: "Salaire moyen (€)",
        data: values,
        borderColor: colorPalettes.primary[0],
        backgroundColor: colorPalettes.primary[0] + "30",
        tension: 0.4,
        fill: true,
        borderWidth: 3,
        pointRadius: 5,
        pointHoverRadius: 7,
        pointBackgroundColor: "#fff",
        pointBorderWidth: 2
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
          titleFont: { size: 14 },
          bodyFont: { size: 13 },
          callbacks: {
            label: (ctx) => `Salaire: ${ctx.parsed.y.toLocaleString("fr-FR")} €`
          }
        }
      },
      scales: {
        y: {
          beginAtZero: false,
          grid: { color: "rgba(255, 255, 255, 0.05)" },
          ticks: { color: "#94a3b8", callback: (v) => v.toLocaleString("fr-FR") + " €" }
        },
        x: { grid: { display: false }, ticks: { color: "#94a3b8" } }
      }
    }
  };

  renderOrUpdateChart("chartExperience", "experience", config);
}
