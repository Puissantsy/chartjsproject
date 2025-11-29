// ==========================================
// CONFIGURATION & DONNÉES GLOBALES
// ==========================================
let rawData = [];
const charts = {};

// Taux de conversion des devises vers EUR
const currencyToEurRate = {
  EUR: 1,
  USD: 0.93,
  CAD: 0.68,
  GBP: 1.16,
  INR: 0.011,
  AUD: 0.61
};

// Définition des pays par continent
const europeCountries = new Set([
  "France", "Germany", "United Kingdom", "UK", "Spain", "Italy", "Portugal",
  "Netherlands", "Belgium", "Switzerland", "Austria", "Sweden", "Norway",
  "Denmark", "Finland", "Poland", "Czech Republic", "Czechia", "Ireland",
  "Greece", "Romania", "Hungary"
]);

const northAmericaCountries = new Set([
  "United States of America", "United States", "USA", "Canada", "Mexico"
]);

// Palettes de couleurs pour les graphiques
const colorPalettes = {
  primary: ['#3b82f6', '#60a5fa', '#93c5fd', '#bfdbfe', '#dbeafe'],
  success: ['#10b981', '#34d399', '#6ee7b7', '#a7f3d0', '#d1fae5'],
  warning: ['#f59e0b', '#fbbf24', '#fcd34d', '#fde68a', '#fef3c7'],
  purple: ['#8b5cf6', '#a78bfa', '#c4b5fd', '#ddd6fe', '#ede9fe'],
  gradient: ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981']
};

// ==========================================
// FONCTIONS UTILITAIRES
// ==========================================

/**
 * Détermine le continent à partir du pays
 */
function getContinentFromCountry(country) {
  if (!country) return null;
  if (europeCountries.has(country)) return "Europe";
  if (northAmericaCountries.has(country)) return "North America";
  return null;
}

/**
 * Convertit un montant dans une devise vers l'euro
 */
function toEuro(amount, currency) {
  if (amount == null || amount === "") return null;
  const num = Number(amount);
  if (Number.isNaN(num) || num <= 0) return null;

  const code = (currency || "").split(" ")[0].trim();
  const rate = currencyToEurRate[code] || 1;
  return num * rate;
}

/**
 * Parse une valeur d'années (peut être texte ou nombre)
 */
function parseYears(value) {
  if (!value) return null;
  const s = String(value).trim();
  if (!s) return null;

  if (s.toLowerCase().includes("less than 1")) return 0.5;
  if (s.toLowerCase().includes("more than")) {
    const num = parseInt(s.replace(/\D+/g, ""), 10);
    return Number.isNaN(num) ? 50 : num;
  }

  const parsed = parseFloat(s.replace(",", "."));
  if (!Number.isNaN(parsed)) return parsed;

  const m = s.match(/\d+/);
  return m ? parseFloat(m[0]) : null;
}

/**
 * Catégorise l'expérience en tranches
 */
function bucketExperience(years) {
  if (years == null) return null;
  if (years <= 2) return "0-2";
  if (years <= 5) return "3-5";
  if (years <= 10) return "6-10";
  return "10+";
}

/**
 * Sépare les champs à valeurs multiples (séparateur ';')
 */
function splitMultiValueField(value) {
  if (!value) return [];
  return String(value)
    .split(";")
    .map((v) => v.trim())
    .filter((v) => v.length > 0);
}

/**
 * Met à jour le badge de statut
 */
function updateStatus(message, type = 'loading') {
  const badge = document.getElementById('statusBadge');
  const text = document.getElementById('statusText');
  
  badge.className = `status-badge ${type}`;
  text.textContent = message;
}

/**
 * Crée ou met à jour un graphique Chart.js
 */
function renderOrUpdateChart(canvasId, key, config) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;
  
  const ctx = canvas.getContext("2d");

  if (charts[key]) {
    charts[key].data = config.data;
    charts[key].options = config.options || {};
    charts[key].update('none'); // Animation désactivée pour les updates
  } else {
    charts[key] = new Chart(ctx, config);
  }
}

/**
 * Génère des couleurs dégradées
 */
function generateColors(count, palette = 'gradient') {
  const colors = colorPalettes[palette] || colorPalettes.gradient;
  const result = [];
  for (let i = 0; i < count; i++) {
    result.push(colors[i % colors.length]);
  }
  return result;
}

// ==========================================
// CHARGEMENT DES DONNÉES
// ==========================================

async function loadData() {
  try {
    updateStatus("Chargement des données...", 'loading');
    
    const res = await fetch("https://chartjsproject-api.vercel.app/api/survey-results?limit=40704");
    
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }
    
    const json = await res.json();
    rawData = json.data || [];

    updateStatus(`${rawData.length} réponses chargées`, 'success');
    
    initFiltersFromData();
    updateAllCharts();
  } catch (err) {
    console.error(err);
    updateStatus("Erreur de chargement", 'error');
  }
}

// ==========================================
// GESTION DES FILTRES
// ==========================================

/**
 * Initialise les options des filtres depuis les données
 */
function initFiltersFromData() {
  const countrySelect = document.getElementById("countrySelect");
  const devTypeSelect = document.getElementById("devTypeSelect");

  const countries = new Set();
  const devTypes = new Set();

  rawData.forEach((row) => {
    if (row.Country) countries.add(row.Country);
    if (row.DevType) {
      splitMultiValueField(row.DevType).forEach((t) => devTypes.add(t));
    }
  });

  // Remplir select pays
  countrySelect.innerHTML = '<option value="all">Tous les pays</option>';
  Array.from(countries).sort().forEach((c) => {
    const opt = document.createElement("option");
    opt.value = c;
    opt.textContent = c;
    countrySelect.appendChild(opt);
  });

  // Remplir select métiers
  devTypeSelect.innerHTML = '<option value="all">Tous les métiers</option>';
  Array.from(devTypes).sort().forEach((t) => {
    const opt = document.createElement("option");
    opt.value = t;
    opt.textContent = t;
    devTypeSelect.appendChild(opt);
  });
}

/**
 * Récupère les valeurs des filtres globaux
 */
function getGlobalFilters() {
  return {
    continent: document.getElementById("continentSelect").value,
    country: document.getElementById("countrySelect").value,
    devType: document.getElementById("devTypeSelect").value
  };
}

/**
 * Filtre les données selon les critères globaux
 */
function filterBaseData({ continent, country, devType }) {
  return rawData.filter((row) => {
    if (country !== "all" && row.Country !== country) return false;

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
}

// ==========================================
// FONCTIONS DE CALCUL POUR CHAQUE GRAPHIQUE
// ==========================================

/**
 * Chart 1: Revenu moyen vs Expérience (Line Chart)
 */
function updateExperienceChart(filtered) {
  const aggregates = {};

  filtered.forEach((row) => {
    const years = parseYears(row.YearsCodePro) ?? parseYears(row.WorkExp);
    const bucket = bucketExperience(years);
    const euro = toEuro(row.CompTotal, row.Currency);

    if (!bucket || euro == null) return;

    if (!aggregates[bucket]) {
      aggregates[bucket] = { sum: 0, count: 0 };
    }
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
        backgroundColor: colorPalettes.primary[0] + '30',
        tension: 0.4,
        fill: true,
        borderWidth: 3,
        pointRadius: 5,
        pointHoverRadius: 7,
        pointBackgroundColor: '#fff',
        pointBorderWidth: 2
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
          titleFont: { size: 14 },
          bodyFont: { size: 13 },
          callbacks: {
            label: (ctx) => `Salaire: ${ctx.parsed.y.toLocaleString('fr-FR')} €`
          }
        }
      },
      scales: {
        y: {
          beginAtZero: false,
          grid: { color: 'rgba(255, 255, 255, 0.05)' },
          ticks: {
            color: '#94a3b8',
            callback: (v) => v.toLocaleString('fr-FR') + ' €'
          }
        },
        x: {
          grid: { display: false },
          ticks: { color: '#94a3b8' }
        }
      }
    }
  };

  renderOrUpdateChart("chartExperience", "experience", config);
}

/**
 * Chart 2: Revenu moyen vs Niveau d'études (Horizontal Bar)
 */
function updateEducationChart(filtered) {
  const aggregates = {};

  filtered.forEach((row) => {
    const ed = row.EdLevel || "Non renseigné";
    const euro = toEuro(row.CompTotal, row.Currency);
    if (euro == null) return;

    if (!aggregates[ed]) {
      aggregates[ed] = { sum: 0, count: 0 };
    }
    aggregates[ed].sum += euro;
    aggregates[ed].count += 1;
  });

  const entries = Object.entries(aggregates)
    .sort((a, b) => b[1].sum / b[1].count - a[1].sum / a[1].count);

  const labels = entries.map(([key]) => key);
  const values = entries.map(([_, v]) => Math.round(v.sum / v.count));
  const colors = generateColors(entries.length, 'success');

  const config = {
    type: "bar",
    data: {
      labels,
      datasets: [{
        label: "Salaire moyen (€)",
        data: values,
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
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          padding: 12,
          callbacks: {
            label: (ctx) => `Salaire: ${ctx.parsed.x.toLocaleString('fr-FR')} €`
          }
        }
      },
      scales: {
        x: {
          grid: { color: 'rgba(255, 255, 255, 0.05)' },
          ticks: {
            color: '#94a3b8',
            callback: (v) => v.toLocaleString('fr-FR') + ' €'
          }
        },
        y: {
          grid: { display: false },
          ticks: { 
            color: '#94a3b8',
            font: { size: 11 }
          }
        }
      }
    }
  };

  renderOrUpdateChart("chartEducation", "education", config);
}

/**
 * Chart 3: Revenu moyen vs Cloud (Polar Area)
 */
function updateCloudChart(filtered, experienceBucket) {
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

/**
 * Chart 4: Revenu moyen vs Frameworks (Vertical Bar)
 */
function updateWebframeChart(filtered, experienceBucket) {
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

/**
 * Chart 5: Top OS (Doughnut Chart)
 */
function updateOSChart(filtered, topN) {
  const counts = {};

  filtered.forEach((row) => {
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
  const colors = generateColors(entries.length, 'gradient');

  const config = {
    type: "doughnut",
    data: {
      labels,
      datasets: [{
        label: "Nombre d'utilisations",
        data: values,
        backgroundColor: colors,
        borderWidth: 2,
        borderColor: '#1e293b'
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
            padding: 10,
            font: { size: 11 }
          }
        },
        tooltip: {
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
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

/**
 * Chart 6: Top Communication (Radar Chart)
 */
function updateCommChart(filtered, topN) {
  const counts = {};

  filtered.forEach((row) => {
    const tools = splitMultiValueField(
      row.CommunicationToolsHaveWorkedWith || row.CommunicationTools
    );
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

// ==========================================
// MISE À JOUR GLOBALE DES GRAPHIQUES
// ==========================================

function updateAllCharts() {
  if (!rawData.length) return;
  
  const globalFilters = getGlobalFilters();
  const baseFiltered = filterBaseData(globalFilters);

  // Charts 1 & 2: Revenus
  updateExperienceChart(baseFiltered);
  updateEducationChart(baseFiltered);

  // Charts 3 & 4: Compétences techniques
  const cloudExpFilter = document.getElementById("cloudExpFilter").value;
  const webframeExpFilter = document.getElementById("webframeExpFilter").value;
  updateCloudChart(baseFiltered, cloudExpFilter);
  updateWebframeChart(baseFiltered, webframeExpFilter);

  // Charts 5 & 6: Technologies populaires
  const osTopN = parseInt(document.getElementById("osTopN").value, 10);
  const commTopN = parseInt(document.getElementById("commTopN").value, 10);
  updateOSChart(baseFiltered, osTopN);
  updateCommChart(baseFiltered, commTopN);
}

// ==========================================
// INITIALISATION DES ÉVÉNEMENTS
// ==========================================

function initUIEvents() {
  // Filtres globaux
  ["continentSelect", "countrySelect", "devTypeSelect"].forEach(id => {
    document.getElementById(id).addEventListener("change", updateAllCharts);
  });

  // Filtres spécifiques par graphique
  document.getElementById("cloudExpFilter").addEventListener("change", () => {
    const globalFilters = getGlobalFilters();
    const baseFiltered = filterBaseData(globalFilters);
    const cloudExpFilter = document.getElementById("cloudExpFilter").value;
    updateCloudChart(baseFiltered, cloudExpFilter);
  });

  document.getElementById("webframeExpFilter").addEventListener("change", () => {
    const globalFilters = getGlobalFilters();
    const baseFiltered = filterBaseData(globalFilters);
    const webframeExpFilter = document.getElementById("webframeExpFilter").value;
    updateWebframeChart(baseFiltered, webframeExpFilter);
  });

  document.getElementById("osTopN").addEventListener("change", () => {
    const globalFilters = getGlobalFilters();
    const baseFiltered = filterBaseData(globalFilters);
    const osTopN = parseInt(document.getElementById("osTopN").value, 10);
    updateOSChart(baseFiltered, osTopN);
  });

  document.getElementById("commTopN").addEventListener("change", () => {
    const globalFilters = getGlobalFilters();
    const baseFiltered = filterBaseData(globalFilters);
    const commTopN = parseInt(document.getElementById("commTopN").value, 10);
    updateCommChart(baseFiltered, commTopN);
  });
}

// ==========================================
// DÉMARRAGE DE L'APPLICATION
// ==========================================

document.addEventListener("DOMContentLoaded", () => {
  initUIEvents();
  loadData();
});