window.SyncModule = (() => {
  const STORAGE_KEY = "malin-flow-v1";

  function saveLocal(data) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }

  function loadLocal() {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  }

  function clearLocal() {
    localStorage.removeItem(STORAGE_KEY);
  }

  function exportJson(data) {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const date = new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-");
    a.href = url;
    a.download = `malin-flow-backup-${date}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function copyJson(data) {
    return navigator.clipboard.writeText(JSON.stringify(data, null, 2));
  }

  function importFromFile(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        try {
          resolve(JSON.parse(reader.result));
        } catch (error) {
          reject(new Error("JSON-filen kunde inte läsas."));
        }
      };
      reader.onerror = () => reject(new Error("Filen kunde inte läsas."));
      reader.readAsText(file);
    });
  }

  function parseJsonText(text) {
    return JSON.parse(text);
  }

  return {
    saveLocal,
    loadLocal,
    clearLocal,
    exportJson,
    copyJson,
    importFromFile,
    parseJsonText,
  };
})();
