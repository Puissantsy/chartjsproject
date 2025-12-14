import { toEuro,generateColors, parseYears,bucketExperience, splitMultiValueField } from "../utils.js";
import { renderOrUpdateChart } from "../chartRenderer.js";

export function updateWebframeChart(filtered, experienceBucket) {
  const aggregates = {};

  filtered.forEach((row) => {
    const years = parseYears(row.YearsCodePro) ?? parseYears(row.WorkExp);
    const bucket = bucketExperience(years);
    if (experienceBucket !== "all" && bucket !== experienceBucket) return;

    const euro = toEuro(row.CompTotal, row.Currency);
    if (euro == null) return;

    const frames = splitMultiValueField(row.WebframeHaveWorkedWith);
    frames.forEach((f) => {
      if (!aggregates[f]) {
        aggregates[f] = { sum: 0, count: 0 };
      }
      aggregates[f].sum += euro;
      aggregates[f].count += 1;
    });
  });

  const entries = Object.entries(aggregates)
    .filter(([_, v]) => v.count >= 5)
    .sort((a, b) => b[1].sum / b[1].count - a[1].sum / a[1].count)
    .slice(0, 10);

  const labels = entries.map(([k]) => k);
  const values = entries.map(([_, v]) => Math.round(v.sum / v.count));
  const colors = generateColors(entries.length, 'purple');

  const config = {
    type: "bar",
    data: {
      labels,
      datasets: [{
        label: "Salaire moyen (€)",
        data: values,
        backgroundColor: colors,
        borderWidth: 0,
        borderRadius: 6
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
            label: (ctx) => `Salaire: ${ctx.parsed.y.toLocaleString('fr-FR')} €`
          }
        }
      },
      scales: {
        y: {
          grid: { color: 'rgba(255, 255, 255, 0.05)' },
          ticks: {
            color: '#94a3b8',
            callback: (v) => v.toLocaleString('fr-FR') + ' €'
          }
        },
        x: {
          grid: { display: false },
          ticks: { 
            color: '#94a3b8',
            maxRotation: 45,
            minRotation: 45,
            font: { size: 10 }
          }
        }
      }
    }
  };

  renderOrUpdateChart("chartWebframe", "webframe", config);
}