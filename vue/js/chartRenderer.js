import { state } from "./state.js";

export function renderOrUpdateChart(canvasId, key, config) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;

  const ctx = canvas.getContext("2d");

  if (state.charts[key]) {
    state.charts[key].data = config.data;
    state.charts[key].options = config.options || {};
    state.charts[key].update("none");
  } else {
    state.charts[key] = new Chart(ctx, config);
  }
}
