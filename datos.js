/* =========================================================
   Carga los carros desde Firebase (panel admin.html).
   Si Firebase no responde, se usan los de autos.js.
   ========================================================= */
(function () {
  const PROJECT = "catalogo-yesica";
  const API_KEY = "AIzaSyBa1wCnTDjXPggKWmwoBNCLamLLfvB6Sqw";
  const BASE = `https://firestore.googleapis.com/v1/projects/${PROJECT}/databases/(default)/documents/`;
  const APP_SRC = document.currentScript.getAttribute("data-app");

  // Convierte el formato de Firestore REST a objetos normales
  function val(v) {
    if (!v) return null;
    if ("stringValue" in v) return v.stringValue;
    if ("integerValue" in v) return Number(v.integerValue);
    if ("doubleValue" in v) return v.doubleValue;
    if ("booleanValue" in v) return v.booleanValue;
    if ("timestampValue" in v) return v.timestampValue;
    if ("nullValue" in v) return null;
    if ("arrayValue" in v) return (v.arrayValue.values || []).map(val);
    if ("mapValue" in v) return obj(v.mapValue.fields || {});
    return null;
  }
  function obj(fields) { const o = {}; for (const k in fields) o[k] = val(fields[k]); return o; }

  async function leer(col) {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 3500);
    try {
      const r = await fetch(`${BASE}${col}?pageSize=300&key=${API_KEY}`, { signal: ctrl.signal, cache: "no-store" });
      if (!r.ok) return null;
      const j = await r.json();
      return (j.documents || [])
        .map(d => ({ id: d.name.split("/").pop(), ...obj(d.fields || {}) }))
        .filter(x => x.visible !== false)
        .sort((a, b) => (a.orden ?? 9999) - (b.orden ?? 9999));
    } catch (e) {
      return null;
    } finally { clearTimeout(t); }
  }

  function arrancar() {
    const s = document.createElement("script");
    s.src = APP_SRC;
    document.body.appendChild(s);
  }

  Promise.all([leer("web_autos"), leer("web_entregados")]).then(([autos, entregados]) => {
    if (autos && autos.length) window.AUTOS = autos;
    if (entregados && entregados.length) window.ENTREGADOS = entregados;
    window.DATOS_ORIGEN = (autos && autos.length) ? "firebase" : "autos.js";
  }).finally(arrancar);
})();
