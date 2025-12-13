import {bucketExperience, toEuro, parseYears, splitMultiValueField } from "../utils.js";
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

  const bubbles = entries.map(([label, v], index) => ({
    x: index + 1,
    y: Math.round(v.sum / v.count),
    r: Math.min(30, Math.max(8, Math.sqrt(v.count) * 2)),
    label
  }));

  const colors = [
    "#3b82f6", // bleu
    "#22c55e", // vert
    "#f59e0b", // orange
    "#a855f7", // violet
    "#06b6d4", // cyan
    "#ef4444", // rouge
    "#eab308", // jaune
    "#64748b"  // gris
  ].slice(0, entries.length);


  const config = {
    type: "bubble",
    data: {
      datasets: [{
        label: "Plateformes Cloud",
        data: bubbles,
        backgroundColor: colors.map(c => c + "80"),
        borderColor: colors,
        borderWidth: 2
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (ctx) => {
              const d = ctx.raw;
              return [
                `Plateforme : ${d.label}`,
                `Revenu moyen : ${d.y.toLocaleString("fr-FR")} €`,
                `Répondants : ${Math.round((d.r / 2) ** 2)}`
              ];
            }
          }
        }
      },
      scales: {
        x: {
          title: {
            display: true,
            text: "Plateformes Cloud"
          },
          ticks: {
            callback: (_, index) => bubbles[index]?.label ?? "",
            color: "#cbd5e1",
            maxRotation: 25,
            minRotation: 25
          },
          grid: { display: false },
          offset: true
        },
        y: {
          min: 0,
          ticks: {
            callback: v => `${v.toLocaleString("fr-FR")} €`
          }
        }
      }
    }
  };

  renderOrUpdateChart("chartCloud", "cloud", config);
}