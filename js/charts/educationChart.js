import { toEuro, generateColors } from "../utils.js";
import { renderOrUpdateChart } from "../chartRenderer.js";

export function updateEducationChart(filtered) {
  // sum + sumSq + count pour moyenne + IC
  const aggregates = {};

  filtered.forEach((row) => {
    const ed = row.EdLevel || "Non renseigné";
    const euro = toEuro(row.CompTotal, row.Currency);
    if (euro == null) return;

    if (!aggregates[ed]) aggregates[ed] = { sum: 0, sumSq: 0, count: 0 };
    aggregates[ed].sum += euro;
    aggregates[ed].sumSq += euro * euro;
    aggregates[ed].count += 1;
  });

  // Ordre “logique” (plus lisible qu’un tri par salaire)
  const ordered = [
    "Primary/elementary school",
    "Secondary school (e.g. American high school, German Realschule or Gymnasium, etc.)",
    "Some college/university study without earning a degree",
    "Associate degree (A.A., A.S., etc.)",
    "Bachelor’s degree (B.A., B.S., B.Eng., etc.)",
    "Master’s degree (M.A., M.S., M.Eng., MBA, etc.)",
    "Professional degree (JD, MD, Ph.D, Ed.D, etc.)",
    "Something else",
    "Non renseigné"
  ];

  // Labels + valeurs uniquement pour les catégories présentes
  const entries = ordered
    .filter((k) => aggregates[k])
    .map((k) => [k, aggregates[k]]);

  const labels = entries.map(([k]) => k);
  const means = entries.map(([_, v]) => Math.round(v.sum / v.count));

  // IC95% (approx) : mean ± 1.96 * (sd / sqrt(n))
  // (formule standard pour un grand échantillon) :contentReference[oaicite:5]{index=5}
  const ci = entries.map(([_, v]) => {
    const mean = v.sum / v.count;
    const ex2 = v.sumSq / v.count;
    const variance = Math.max(0, ex2 - mean * mean);
    const sd = Math.sqrt(variance);
    const se = sd / Math.sqrt(v.count);
    const delta = 1.96 * se;
    return {
      n: v.count,
      low: Math.round(mean - delta),
      high: Math.round(mean + delta)
    };
  });

  const colors = generateColors(entries.length, "success");

  renderOrUpdateChart("chartEducation", "education", {
    type: "bar",
    data: {
      labels,
      datasets: [{
        label: "Salaire moyen (€)",
        data: means,
        backgroundColor: colors,
        borderWidth: 0
      }]
    },
    options: {
      indexAxis: "y",
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            // multi-lignes : Chart.js accepte un tableau de strings :contentReference[oaicite:6]{index=6}
            label: (ctx) => {
              const i = ctx.dataIndex;
              const m = ctx.parsed.x;
              const { n, low, high } = ci[i];
              return [
                `Salaire moyen : ${m.toLocaleString("fr-FR")} €`,
                `n = ${n}`,
                `IC95% : [${low.toLocaleString("fr-FR")} ; ${high.toLocaleString("fr-FR")}] €`
              ];
            }
          }
        }
      },
      scales: {
        x: {
          grid: { color: "rgba(255, 255, 255, 0.05)" },
          ticks: {
            color: "#94a3b8",
            callback: (v) => v.toLocaleString("fr-FR") + " €"
          }
        },
        y: { grid: { display: false }, ticks: { color: "#94a3b8", font: { size: 11 } } }
      }
    }
  });
}
