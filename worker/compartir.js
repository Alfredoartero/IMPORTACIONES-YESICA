/* =========================================================
   Cloudflare Worker: ver.importacionesyesica.com
   ---------------------------------------------------------
   Links para compartir carros con su propia foto en WhatsApp.
     ver.importacionesyesica.com/<id>     -> carro del inventario
     ver.importacionesyesica.com/e/<id>   -> carro entregado
   - WhatsApp / Facebook / iMessage (bots): reciben una página con la
     primera foto, el nombre y el precio del carro.
   - Personas: se redirigen al instante a la página normal con el
     carro abierto. La página principal no cambia en nada.
   ========================================================= */
const SITE = "https://importacionesyesica.com/";
const FS = "https://firestore.googleapis.com/v1/projects/catalogo-yesica/databases/(default)/documents/";
const KEY = "AIzaSyBa1wCnTDjXPggKWmwoBNCLamLLfvB6Sqw";
const BOTS = /facebookexternalhit|facebot|whatsapp|twitterbot|telegrambot|slackbot|discordbot|linkedinbot|skypeuripreview|pinterest|googlebot|bingbot|applebot|embedly|vkshare|redditbot|snapchat|viber|line\//i;

const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
function val(v) {
  if (!v) return null;
  if ("stringValue" in v) return v.stringValue;
  if ("integerValue" in v) return Number(v.integerValue);
  if ("doubleValue" in v) return v.doubleValue;
  if ("booleanValue" in v) return v.booleanValue;
  if ("arrayValue" in v) return (v.arrayValue.values || []).map(val);
  return null;
}
function foto(u) {
  if (typeof u !== "string" || !u) return SITE + "icon-512.png";
  if (/^https:\/\/firebasestorage\.googleapis\.com\//.test(u)) return u;
  if (/^[a-z]+:/i.test(u)) return SITE + "icon-512.png";
  return SITE + u.split("/").map(encodeURIComponent).join("/");
}

export default {
  async fetch(req) {
    const url = new URL(req.url);
    const parts = url.pathname.split("/").filter(Boolean);
    const entrega = parts[0] === "e";
    const id = entrega ? parts[1] : parts[0];
    if (!id || !/^[A-Za-z0-9_-]{1,64}$/.test(id)) return Response.redirect(SITE, 302);

    const destino = SITE + (entrega ? "entregados?entrega=" : "inventario?auto=") + encodeURIComponent(id);
    const ua = req.headers.get("user-agent") || "";
    const vista = url.searchParams.has("vista"); // para probar cómo lo ve WhatsApp
    if (!vista && !BOTS.test(ua)) return Response.redirect(destino, 302);

    let d = null;
    try {
      const r = await fetch(`${FS}${entrega ? "web_entregados" : "web_autos"}/${id}?key=${KEY}`, { cf: { cacheTtl: 60 } });
      if (r.ok) { const j = await r.json(); d = {}; for (const k in (j.fields || {})) d[k] = val(j.fields[k]); }
    } catch (e) {}
    if (!d || d.visible === false) return Response.redirect(destino, 302);

    const nombre = d.nombre || "Vehículo";
    const titulo = nombre + (d.color ? ` (${d.color})` : "");
    const desc = entrega
      ? [d.tipo === "vendido" ? "Vendido" : "Entregado a cliente", d.fecha, d.lugar].filter(Boolean).join(" · ") + " — Importaciones Yesica"
      : [d.precio, d.estado, d.millaje].filter(Boolean).join(" · ") + " — Importaciones Yesica";
    const img = foto((d.fotos || [])[0]);

    const html = `<!doctype html><html lang="es"><head><meta charset="utf-8">
<title>${esc(titulo)} | Importaciones Yesica</title>
<meta name="description" content="${esc(desc)}">
<meta property="og:type" content="website">
<meta property="og:site_name" content="Importaciones Yesica">
<meta property="og:title" content="${esc(titulo)}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:image" content="${esc(img)}">
<meta property="og:image:alt" content="${esc(nombre)}">
<meta property="og:url" content="${esc(url.origin + url.pathname)}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:image" content="${esc(img)}">
<link rel="canonical" href="${esc(destino)}">
<meta name="robots" content="noindex">
${vista ? "" : `<meta http-equiv="refresh" content="0;url=${esc(destino)}">`}
</head><body style="background:#0b0c10;color:#fff;font-family:sans-serif">
<a href="${esc(destino)}" style="color:#db2777">${esc(titulo)}</a>
</body></html>`;
    return new Response(html, { headers: { "content-type": "text/html; charset=utf-8", "cache-control": "public, max-age=300" } });
  }
};
