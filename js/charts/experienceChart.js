import { parseYears, toEuro } from "../utils.js";
import { renderOrUpdateChart } from "../chartRenderer.js";
import { colorPalettes } from "../config.js";

export function updateExperienceChart(filtered) {
  // sum, sumSq, count pour moyenne + écart-type
  const agg = {};
  for (let y = 1; y <= 50; y++) agg[y] = { sum: 0, sumSq: 0, count: 0 };

  filtered.forEach((row) => {
    const yearsRaw = parseYears(row.YearsCodePro) ?? parseYears(row.WorkExp);
    const euro = toEuro(row.CompTotal, row.Currency);
    if (yearsRaw == null || euro == null) return;

    const year = Math.min(50, Math.max(1, Math.round(yearsRaw)));
    const a = agg[year];
    a.sum += euro;
    a.sumSq += euro * euro;
    a.count += 1;
  });

  const labels = [];
  const mean = [];
  const lower = [];
  const upper = [];
  const counts = [];

  for (let y = 1; y <= 50; y++) {
    const a = agg[y];
    if (a.count === 0) continue;

    const m = a.sum / a.count;

    // variance population approx: E[x^2] - (E[x])^2 (clamp pour éviter les -0)
    const ex2 = a.sumSq / a.count;
    const variance = Math.max(0, ex2 - m * m);
    const sd = Math.sqrt(variance);

    // SE = sd / sqrt(n), IC95% ~ mean ± 1.96*SE
    const se = sd / Math.sqrt(a.count);
    const ci95 = 1.96 * se;

    labels.push(`${y} an${y > 1 ? "s" : ""}`);
    mean.push(Math.round(m));
    lower.push(Math.round(m - ci95));
    upper.push(Math.round(m + ci95));
    counts.push(a.count);
  }

  const config = {
    type: "line",
    data: {
      labels,
      datasets: [
        // borne basse (invisible, sert de base au fill)
        {
          label: "IC95% (bas)",
          data: lower,
          borderColor: "rgba(0,0,0,0)",
          pointRadius: 0
        },
        // borne haute (remplit jusqu'à la dataset précédente)
        {
          label: "IC95% (haut)",
          data: upper,
          borderColor: "rgba(0,0,0,0)",
          pointRadius: 0,
          fill: "-1", // fill entre upper et lower
          backgroundColor: colorPalettes.primary[0] + "18"
        },
        // moyenne (celle demandée par le sujet)
        {
          label: "Salaire moyen (€)",
          data: mean,
          borderColor: colorPalettes.primary[0],
          tension: 0.35,
          borderWidth: 3,
          fill: false,
          // Points plus visibles quand n est faible (fiabilité)
          pointRadius: (ctx) => {
            const n = counts[ctx.dataIndex] ?? 0;
            if (n < 5) return 5;
            if (n < 15) return 3;
            return 0; // sinon pas de points (courbe plus clean)
          },
          pointHoverRadius: 6,
          pointBackgroundColor: "#fff",
          pointBorderWidth: 2
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: "index", intersect: false },
      plugins: {
        legend: { display: false },
        filler: { propagate: false }, // évite les remplissages non voulus
        tooltip: {
          callbacks: {
            // on ne montre que le tooltip “utile” sur la moyenne
            label: (ctx) => {
              const i = ctx.dataIndex;
              const n = counts[i] ?? 0;
              const m = mean[i];
              const lo = lower[i];
              const up = upper[i];
              // si on est sur une des 2 datasets IC, on masque
              if (ctx.dataset.label?.startsWith("IC95%")) return null;
              return [
                `Salaire moyen : ${m.toLocaleString("fr-FR")} €`,
                `n = ${n}`,
                `IC95% : [${lo.toLocaleString("fr-FR")} ; ${up.toLocaleString("fr-FR")}] €`
              ];
            }
          }
        }
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: { maxTicksLimit: 10, color: "#94a3b8" }
        },
        y: {
          beginAtZero: false,
          grid: { color: "rgba(255,255,255,0.05)" },
          ticks: {
            color: "#94a3b8",
            callback: (v) => v.toLocaleString("fr-FR") + " €"
          }
        }
      }
    }
  };

  renderOrUpdateChart("chartExperience", "experience", config);
}
