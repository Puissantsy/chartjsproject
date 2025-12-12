import { toEuro, generateColors } from "../utils.js";
import { renderOrUpdateChart } from "../chartRenderer.js";

export function updateEducationChart(filtered) {
  const aggregates = {};

  filtered.forEach((row) => {
    const ed = row.EdLevel || "Non renseigné";
    const euro = toEuro(row.CompTotal, row.Currency);
    if (euro == null) return;

    if (!aggregates[ed]) aggregates[ed] = { sum: 0, count: 0 };
    aggregates[ed].sum += euro;
    aggregates[ed].count += 1;
  });

  const entries = Object.entries(aggregates)
    .sort((a, b) => (b[1].sum / b[1].count) - (a[1].sum / a[1].count));

  const labels = entries.map(([k]) => k);
  const values = entries.map(([_, v]) => Math.round(v.sum / v.count));
  const colors = generateColors(entries.length, "success");

  renderOrUpdateChart("chartEducation", "education", {
    type: "bar",
    data: { labels, datasets: [{ label: "Salaire moyen (€)", data: values, backgroundColor: colors, borderWidth: 0 }] },
    options: {
      indexAxis: "y",
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: "rgba(0, 0, 0, 0.8)",
          padding: 12,
          callbacks: { label: (ctx) => `Salaire: ${ctx.parsed.x.toLocaleString("fr-FR")} €` }
        }
      },
      scales: {
        x: { grid: { color: "rgba(255, 255, 255, 0.05)" }, ticks: { color: "#94a3b8", callback: (v) => v.toLocaleString("fr-FR") + " €" } },
        y: { grid: { display: false }, ticks: { color: "#94a3b8", font: { size: 11 } } }
      }
    }
  });
}
