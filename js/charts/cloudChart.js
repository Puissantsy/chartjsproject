import {bucketExperience, toEuro,generateColors, parseYears, splitMultiValueField } from "../utils.js";
import { renderOrUpdateChart } from "../chartRenderer.js";

export function updateCloudChart(filtered, experienceBucket) {
  const aggregates = {};

  filtered.forEach((row) => {
    const years = parseYears(row.YearsCodePro) ?? parseYears(row.WorkExp);
    const bucket = bucketExperience(years);
    if (experienceBucket !== "all" && bucket !== experienceBucket) return;

    const euro = toEuro(row.CompTotal, row.Currency);
    if (euro == null) return;

    const platforms = splitMultiValueField(row.PlatformHaveWorkedWith);
    platforms.forEach((p) => {
      if (!aggregates[p]) {
        aggregates[p] = { sum: 0, count: 0 };
      }
      aggregates[p].sum += euro;
      aggregates[p].count += 1;
    });
  });

  const entries = Object.entries(aggregates)
    .filter(([_, v]) => v.count >= 5)
    .sort((a, b) => b[1].sum / b[1].count - a[1].sum / a[1].count)
    .slice(0, 8);

  const labels = entries.map(([k]) => k);
  const values = entries.map(([_, v]) => Math.round(v.sum / v.count));
  const colors = generateColors(entries.length, 'warning');

  const config = {
    type: "polarArea",
    data: {
      labels,
      datasets: [{
        label: "Salaire moyen (€)",
        data: values,
        backgroundColor: colors.map(c => c + '80'),
        borderColor: colors,
        borderWidth: 2
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { 
          display: true,
          position: 'right',
          labels: { 
            color: '#cbd5e1',
            font: { size: 10 },
            padding: 8
          }
        },
        tooltip: {
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          padding: 12,
          callbacks: {
            label: (ctx) => `${ctx.label}: ${ctx.parsed.r.toLocaleString('fr-FR')} €`
          }
        }
      },
      scales: {
        r: {
          grid: { color: 'rgba(255, 255, 255, 0.05)' },
          ticks: { 
            color: '#94a3b8',
            backdropColor: 'transparent'
          }
        }
      }
    }
  };

  renderOrUpdateChart("chartCloud", "cloud", config);
}