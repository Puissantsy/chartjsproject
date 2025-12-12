import { state } from "./state.js";

// IMPORTANT: le fichier doit être SERVI en HTTP (ex: placé dans /public)
// Exemple: public/data/test/output.jsonl  =>  "/data/test/output.jsonl"
const DATA_URL = "/data/output.jsonl";

export async function loadData() {
  try {
    updateStatus("Chargement des données...", "loading");

    const res = await fetch(DATA_URL);
    if (!res.ok) throw new Error(`HTTP ${res.status} (${DATA_URL})`);
    if (!res.body) throw new Error("Streaming non supporté par ce navigateur");

    const totalBytes = Number(res.headers.get("Content-Length")) || 0;

    const reader = res.body.getReader();
    const decoder = new TextDecoder();

    let receivedBytes = 0;
    let buffer = "";
    const all = [];

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      receivedBytes += value.byteLength;
      buffer += decoder.decode(value, { stream: true });

      const lines = buffer.split("\n");
      buffer = lines.pop() || "";

      for (const line of lines) {
        const s = line.trim();
        if (!s) continue;
        all.push(JSON.parse(s));
      }

      
    }

    // Dernière ligne (si pas finie par \n)
    const tail = buffer.trim();
    if (tail) all.push(JSON.parse(tail));

    state.rawData = all;
    updateStatus(`${state.rawData.length} réponses chargées`, "success");
    return state.rawData;
  } catch (err) {
    console.error(err);
    updateStatus("Erreur de chargement", "error");
    state.rawData = [];
    return [];
  }
}
