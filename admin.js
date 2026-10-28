/* Panel de administrador — Importaciones Yesica (proyecto Firebase: catalogo-yesica) */
// Evita que el panel se abra dentro de otra página (protección contra clickjacking)
if (window.top !== window.self) { document.documentElement.style.display = "none"; window.top.location = window.self.location; }
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { getFirestore, collection, doc, onSnapshot, setDoc, updateDoc, deleteDoc, writeBatch, serverTimestamp, getDoc, arrayUnion, arrayRemove } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";
import { getStorage, ref, uploadBytesResumable, getDownloadURL, deleteObject } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-storage.js";
import { getAuth, GoogleAuthProvider, signInWithPopup, signInWithRedirect, getRedirectResult, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";

/* Proyecto de Firebase SOLO para la página web (separado del centro de control) */
const firebaseConfig = {
  apiKey: "AIzaSyBa1wCnTDjXPggKWmwoBNCLamLLfvB6Sqw",
  authDomain: "catalogo-yesica.firebaseapp.com",
  projectId: "catalogo-yesica",
  storageBucket: "catalogo-yesica.firebasestorage.app",
  messagingSenderId: "499795566929",
  appId: "1:499795566929:web:a0ffc9903141f2d72fb370"
};
const app = initializeApp(firebaseConfig);
const db = getFirestore(app), storage = getStorage(app), auth = getAuth(app);

/* Quiénes pueden entrar: correos guardados en Firestore → config/admins → emails */
let adminEmails = [];

const $ = id => document.getElementById(id);
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const imgSrc = u => /^https?:\/\//i.test(u) ? u : encodeURI(u);
const MESES = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
const mesActual = () => { const d = new Date(); return `${MESES[d.getMonth()]} ${d.getFullYear()}`; };

function toast(t, err){ const el = $("toast"); el.textContent = t; el.classList.toggle("err", !!err); el.classList.add("show"); clearTimeout(el._t); el._t = setTimeout(() => el.classList.remove("show"), 3200); }

/* ======== Login con Google ======== */
const provider = new GoogleAuthProvider();
provider.setCustomParameters({ prompt: "select_account" });
$("googleBtn").addEventListener("click", async () => {
  $("lgMsg").textContent = "";
  try { await signInWithPopup(auth, provider); }
  catch (err) {
    if (["auth/popup-blocked", "auth/operation-not-supported-in-this-environment", "auth/cancelled-popup-request"].includes(err.code)) return signInWithRedirect(auth, provider);
    if (err.code !== "auth/popup-closed-by-user") $("lgMsg").textContent = "No se pudo entrar: " + (err.code || err.message);
  }
});
getRedirectResult(auth).catch(err => { $("lgMsg").textContent = "No se pudo entrar: " + (err.code || err.message); });
$("logout").addEventListener("click", () => signOut(auth));

let unsub = [];
onAuthStateChanged(auth, async user => {
  unsub.forEach(f => f()); unsub = [];
  if (!user) { $("login").classList.remove("hidden"); $("app").classList.add("hidden"); return; }
  try {
    const snap = await getDoc(doc(db, "config", "admins"));
    adminEmails = (snap.exists() && snap.data().emails) || [];
  } catch (e) { adminEmails = []; }
  if (!adminEmails.includes(user.email)) {
    $("lgMsg").innerHTML = `La cuenta <b>${esc(user.email)}</b> no tiene acceso al panel. Pide a un administrador que la agregue.`;
    await signOut(auth); return;
  }
  $("who").textContent = "Hola, " + (user.displayName || user.email).split(" ")[0];
  $("login").classList.add("hidden"); $("app").classList.remove("hidden");
  listen("web_autos", "autos"); listen("web_entregados", "entregados");
  unsub.push(onSnapshot(doc(db, "config", "admins"), s => { adminEmails = (s.exists() && s.data().emails) || []; renderAdmins(); }));
  setTimeout(movePill, 50);
});

/* ======== Administradores ======== */
function renderAdmins(){
  const box = $("adminList"); if (!box) return;
  const me = auth.currentUser?.email;
  box.innerHTML = adminEmails.map(e => `<div class="adm-row"><span>${esc(e)}${e === me ? ' <small>(tú)</small>' : ""}</span>${e === me ? "" : `<button class="ib danger" data-rm="${esc(e)}">Quitar</button>`}</div>`).join("");
}
$("adminsBtn").addEventListener("click", () => { $("admBack").classList.add("show"); renderAdmins(); setTimeout(() => $("admEmail").focus(), 80); });
$("admClose").addEventListener("click", () => $("admBack").classList.remove("show"));
$("admForm").addEventListener("submit", async e => {
  e.preventDefault();
  const email = $("admEmail").value.trim().toLowerCase();
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) { toast("Escribe un correo válido.", true); return; }
  try { await updateDoc(doc(db, "config", "admins"), { emails: arrayUnion(email) }); $("admEmail").value = ""; toast("Administrador agregado. Ya puede entrar con Google."); }
  catch (err) { toast("No se pudo agregar: " + (err.code || err.message), true); }
});
$("adminList").addEventListener("click", async e => {
  const b = e.target.closest("[data-rm]"); if (!b) return;
  if (!confirm(`¿Quitar el acceso de ${b.dataset.rm}?`)) return;
  try { await updateDoc(doc(db, "config", "admins"), { emails: arrayRemove(b.dataset.rm) }); toast("Acceso quitado."); }
  catch (err) { toast("No se pudo: " + (err.code || err.message), true); }
});

/* ======== Datos en vivo ======== */
const data = { autos: [], entregados: [] };
const COL = { autos: "web_autos", entregados: "web_entregados" };
let tab = "autos", loaded = { autos: false, entregados: false };
function listen(col, key){
  unsub.push(onSnapshot(collection(db, col), snap => {
    data[key] = snap.docs.map(d => ({ id: d.id, ...d.data() })).sort((a, b) => (a.orden ?? 9999) - (b.orden ?? 9999));
    loaded[key] = true; render();
  }, err => { toast("No se pudo leer " + col + ": " + (err.code || err.message) + ". Revisa las reglas de Firebase.", true); }));
}

/* ======== Pestañas ======== */
const tabs = $("tabs");
function movePill(){ const on = tabs.querySelector("button.on"); $("tabPill").style.width = on.offsetWidth + "px"; $("tabPill").style.transform = `translateX(${on.offsetLeft}px)`; }
addEventListener("resize", movePill);
tabs.querySelectorAll("button").forEach(b => b.addEventListener("click", () => {
  tab = b.dataset.tab; tabs.querySelectorAll("button").forEach(x => x.classList.toggle("on", x === b)); movePill(); render();
}));
$("q").addEventListener("input", render);

/* ======== Lista ======== */
const ICO = {
  edit:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 20h4L19 9l-4-4L4 16v4z"/></svg>',
  up:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><path d="m6 15 6-6 6 6"/></svg>',
  down:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><path d="m6 9 6 6 6-6"/></svg>',
  link:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/></svg>',
  sold:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><path d="m5 12 5 5 9-10"/></svg>',
  del:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/></svg>'
};
function render(){
  $("cntAutos").textContent = data.autos.length; $("cntEnt").textContent = data.entregados.length;
  const isA = tab === "autos";
  $("pageTitle").innerHTML = isA ? "Inventario <em>web</em>" : "Carros <em>entregados</em>";
  $("pageSub").textContent = isA ? "Lo que agregues aquí aparece en la página al instante." : "Carros traídos para clientes y vendidos. Salen en la sección de referencias.";
  $("addLabel").textContent = isA ? "Agregar carro" : "Agregar entrega";

  // Banner de importación
  const local = isA ? (window.AUTOS || []) : (window.ENTREGADOS || []);
  $("importBanner").classList.toggle("hidden", !(loaded[tab] && data[tab].length === 0 && local.length > 0));
  $("importTitle").textContent = isA ? `Importar los ${local.length} carros actuales` : `Importar las ${local.length} entregas actuales`;

  const q = $("q").value.trim().toLowerCase();
  const items = data[tab].filter(x => !q || JSON.stringify(x).toLowerCase().includes(q));
  const list = $("list");
  if (!loaded[tab]) { list.innerHTML = '<div class="empty-a"><b>Cargando…</b></div>'; return; }
  if (!items.length) { list.innerHTML = `<div class="empty-a"><b>${q ? "Sin resultados" : (isA ? "Todavía no hay carros" : "Todavía no hay entregas")}</b>${q ? "" : "Toca el botón rosa para agregar el primero."}</div>`; return; }

  list.innerHTML = items.map((x, i) => {
    const fotos = x.fotos || [];
    const sub = isA
      ? `<b>${esc(x.precio || "Consultar")}</b><span class="pill">${esc(x.estado || "Disponible")}</span>${x.millaje ? `<span>${esc(x.millaje)}</span>` : ""}${x.copart ? '<span class="pill cop">Copart</span>' : ""}`
      : `<span class="pill">${x.tipo === "vendido" ? "Vendido" : "Traído para cliente"}</span>${x.fecha ? `<span>${esc(x.fecha)}</span>` : ""}${x.lugar ? `<span>${esc(x.lugar)}</span>` : ""}`;
    return `<div class="a-item ${x.visible === false ? "off" : ""}" data-id="${x.id}">
      <div class="a-thumb">${fotos[0] ? `<img src="${esc(imgSrc(fotos[0]))}" alt="" loading="lazy">` : ""}${fotos.length ? `<span>${fotos.length} fotos</span>` : ""}</div>
      <div class="a-info"><h3>${esc(x.nombre || "Sin nombre")}${x.color ? ` <span style="color:var(--muted);font-weight:400">· ${esc(x.color)}</span>` : ""}</h3><div class="sub">${sub}</div></div>
      <div class="a-actions">
        <button class="switch ${x.visible === false ? "" : "on"}" data-act="vis" title="${x.visible === false ? "Oculto en la página" : "Visible en la página"}" aria-label="Visible"></button>
        <button class="ib" data-act="up" title="Subir" ${i === 0 ? "disabled" : ""}>${ICO.up}</button>
        <button class="ib" data-act="down" title="Bajar" ${i === items.length - 1 ? "disabled" : ""}>${ICO.down}</button>
        <button class="ib" data-act="link" title="Copiar link para compartir">${ICO.link}Link</button>
        ${isA ? `<button class="ib" data-act="sold" title="Pasar a entregados">${ICO.sold}Vendido</button>` : ""}
        <button class="ib pink" data-act="edit">${ICO.edit}Editar</button>
        <button class="ib danger" data-act="del" title="Borrar">${ICO.del}</button>
      </div></div>`;
  }).join("");
}

$("list").addEventListener("click", async e => {
  const b = e.target.closest("[data-act]"); if (!b) return;
  const id = b.closest(".a-item").dataset.id, act = b.dataset.act;
  const arr = data[tab], idx = arr.findIndex(x => x.id === id), item = arr[idx];
  const col = COL[tab];
  try {
    if (act === "edit") openEditor(item);
    if (act === "vis") { await updateDoc(doc(db, col, id), { visible: item.visible === false }); toast(item.visible === false ? "Ahora se ve en la página" : "Oculto de la página"); }
    if (act === "up" || act === "down") {
      const j = act === "up" ? idx - 1 : idx + 1; if (j < 0 || j >= arr.length) return;
      const batch = writeBatch(db);
      arr.forEach((x, k) => { const pos = k === idx ? j : (k === j ? idx : k); if (x.orden !== pos) batch.update(doc(db, col, x.id), { orden: pos }); });
      await batch.commit();
    }
    if (act === "link") {
      const url = "https://ver.importacionesyesica.com/" + (tab === "autos" ? "" : "e/") + encodeURIComponent(id);
      await navigator.clipboard.writeText(url).then(() => toast("Link copiado: listo para pegar en WhatsApp"), () => prompt("Copia este link:", url));
    }
    if (act === "sold") {
      if (!confirm(`¿Pasar "${item.nombre}" a Entregados como vendido? Se quitará del inventario.`)) return;
      const nd = doc(collection(db, "web_entregados"));
      await setDoc(nd, { nombre: item.nombre || "", tipo: "vendido", fecha: mesActual(), lugar: "", millaje: item.millaje || "", nota: "", fotos: item.fotos || [], copart: item.copart || "", visible: true, orden: -Date.now() / 1e10, creado: serverTimestamp() });
      await deleteDoc(doc(db, col, id));
      toast("Pasado a Entregados. Puedes editar la fecha y el lugar ahí.");
    }
    if (act === "del") {
      if (!confirm(`¿Borrar "${item.nombre}"? Esto no se puede deshacer.`)) return;
      await deleteDoc(doc(db, col, id));
      (item.fotos || []).forEach(u => { if (/firebasestorage/.test(u)) deleteObject(ref(storage, u)).catch(() => {}); });
      toast("Borrado");
    }
  } catch (err) { toast("No se pudo: " + (err.code || err.message), true); }
});

/* ======== Importar desde autos.js ======== */
$("importBtn").addEventListener("click", async () => {
  const isA = tab === "autos", local = isA ? (window.AUTOS || []) : (window.ENTREGADOS || []);
  if (!confirm(`Se van a copiar ${local.length} ${isA ? "carros" : "entregas"} al panel. ¿Continuar?`)) return;
  $("importBtn").disabled = true;
  try {
    const batch = writeBatch(db);
    local.forEach((x, i) => batch.set(doc(collection(db, COL[tab])), { ...x, fotos: x.fotos || [], visible: true, orden: i, creado: serverTimestamp() }));
    await batch.commit(); toast("Importado. Ya puedes editarlos aquí.");
  } catch (err) { toast("No se pudo importar: " + (err.code || err.message), true); }
  $("importBtn").disabled = false;
});

/* ======== Editor ======== */
const FIELDS = {
  autos: [
    { k: "nombre", l: "Marca, modelo y año", ph: "Hyundai Elantra SE 2018", req: true },
    { k: "color", l: "Color", ph: "Blanco" },
    { k: "precio", l: "Precio", ph: "$6,500  (o “Consultar”)" },
    { k: "estado", l: "Estado (etiqueta)", type: "select", opts: ["En camino", "Para reparar", "En aduana", "Reparado", "Disponible"] },
    { k: "motor", l: "Motor", ph: "2.0L" },
    { k: "transmision", l: "Transmisión", ph: "Automático" },
    { k: "millaje", l: "Millaje", ph: "85,000 mi" },
    { k: "condicion", l: "Condición", ph: "Run & Drive" },
    { k: "titulo", l: "Título", ph: "Salvage (PA)" },
    { k: "copart", l: "Link de Copart (opcional)", ph: "https://www.copart.com/lot/12345678", help: "Si lo pones, el cliente verá un botón “Ver en Copart”." },
    { k: "detalles", l: "Detalles de subasta", type: "textarea", full: true, ph: "Lote 12345678 • Ubicación: GA - Atlanta • Daño primario: frontal • Arranca y conduce", help: "Separa cada dato con • para que se vea como lista." }
  ],
  entregados: [
    { k: "nombre", l: "Marca, modelo y año", ph: "Toyota Corolla LE 2019", req: true },
    { k: "tipo", l: "Tipo", type: "select", opts: [["cliente", "Traído para cliente"], ["vendido", "Vendido"]] },
    { k: "fecha", l: "Fecha de entrega", ph: "Octubre 2026" },
    { k: "lugar", l: "Lugar", ph: "Ahuachapán" },
    { k: "millaje", l: "Millaje", ph: "68,000 mi" },
    { k: "copart", l: "Link de Copart (opcional)", ph: "https://www.copart.com/lot/12345678" },
    { k: "nota", l: "Nota", type: "textarea", full: true, ph: "Búsqueda personalizada. El cliente pidió un automático con menos de 70,000 millas." }
  ]
};

let ed = null; // { col, id, isNew, fotos:[url], nuevas:[url], subiendo:n }
function openEditor(item){
  const isNew = !item, col = COL[tab];
  const id = isNew ? doc(collection(db, col)).id : item.id;
  ed = { col, id, isNew, fotos: [...(item?.fotos || [])], nuevas: [], subiendo: 0, item };
  $("edTitle").textContent = isNew ? (tab === "autos" ? "Agregar carro" : "Agregar entrega") : "Editar " + (item.nombre || "");
  const v = item || (tab === "entregados" ? { tipo: "cliente", fecha: mesActual() } : { estado: "En camino" });
  $("edBody").innerHTML = `<div class="ed-grid">${FIELDS[tab].map(f => {
    const val = v[f.k] ?? "";
    let input;
    if (f.type === "select") input = `<select id="f_${f.k}">${f.opts.map(o => { const [ov, ol] = Array.isArray(o) ? o : [o, o]; return `<option value="${esc(ov)}" ${ov === val ? "selected" : ""}>${esc(ol)}</option>`; }).join("")}${!f.opts.some(o => (Array.isArray(o) ? o[0] : o) === val) && val ? `<option selected>${esc(val)}</option>` : ""}</select>`;
    else if (f.type === "textarea") input = `<textarea id="f_${f.k}" placeholder="${esc(f.ph || "")}">${esc(val)}</textarea>`;
    else input = `<input id="f_${f.k}" value="${esc(val)}" placeholder="${esc(f.ph || "")}" ${f.req ? "required" : ""}>`;
    return `<div class="fld ${f.full ? "full" : ""}"><label for="f_${f.k}">${f.l}</label>${input}${f.help ? `<small>${f.help}</small>` : ""}</div>`;
  }).join("")}</div>
  <div class="ed-sec">Fotos <span style="color:var(--muted);font-size:12px;font-family:Inter">La primera es la portada. Arrastra o usa las flechas para ordenar.</span></div>
  <div class="drop" id="drop"><b>Toca para subir fotos</b>o arrástralas aquí. Se comprimen solas para que la página cargue rápido.</div>
  <div class="photos" id="photos"></div>`;
  renderPhotos();
  $("edBack").classList.add("show"); document.body.style.overflow = "hidden";
  const drop = $("drop");
  drop.addEventListener("click", () => $("fileIn").click());
  drop.addEventListener("dragover", e => { e.preventDefault(); drop.classList.add("over"); });
  drop.addEventListener("dragleave", () => drop.classList.remove("over"));
  drop.addEventListener("drop", e => { e.preventDefault(); drop.classList.remove("over"); addFiles([...e.dataTransfer.files].filter(f => f.type.startsWith("image/"))); });
  setTimeout(() => $("f_nombre").focus(), 100);
}
$("fileIn").addEventListener("change", e => { addFiles([...e.target.files]); e.target.value = ""; });

function renderPhotos(){
  const box = $("photos"); if (!box) return;
  box.innerHTML = ed.fotos.map((u, i) => `<div class="ph ${i === 0 ? "cover" : ""}" draggable="true" data-i="${i}">
    ${typeof u === "string" ? `<img src="${esc(imgSrc(u))}" alt="">` : `<img src="${u.preview}" alt=""><div class="prog">${u.pct}%<i style="width:${u.pct}%"></i></div>`}
    ${i === 0 ? '<span class="tag">Portada</span>' : ""}
    <div class="ctl"><button data-x="${i}" title="Quitar">✕</button></div>
    <div class="mv"><button data-l="${i}" title="Mover a la izquierda">‹</button><button data-r="${i}" title="Mover a la derecha">›</button></div>
  </div>`).join("");
}
$("edBody").addEventListener("click", e => {
  const t = e.target;
  const move = (a, b) => { if (b < 0 || b >= ed.fotos.length) return; [ed.fotos[a], ed.fotos[b]] = [ed.fotos[b], ed.fotos[a]]; renderPhotos(); };
  if (t.dataset.x != null) { ed.fotos.splice(+t.dataset.x, 1); renderPhotos(); }
  if (t.dataset.l != null) move(+t.dataset.l, +t.dataset.l - 1);
  if (t.dataset.r != null) move(+t.dataset.r, +t.dataset.r + 1);
});
let dragI = null;
$("edBody").addEventListener("dragstart", e => { const p = e.target.closest(".ph"); if (!p) return; dragI = +p.dataset.i; p.classList.add("drag"); });
$("edBody").addEventListener("dragend", e => { const p = e.target.closest(".ph"); if (p) p.classList.remove("drag"); });
$("edBody").addEventListener("dragover", e => { if (dragI != null && e.target.closest(".ph")) e.preventDefault(); });
$("edBody").addEventListener("drop", e => {
  const p = e.target.closest(".ph"); if (dragI == null || !p) return; e.preventDefault();
  const to = +p.dataset.i; const [m] = ed.fotos.splice(dragI, 1); ed.fotos.splice(to, 0, m); dragI = null; renderPhotos();
});

async function comprimir(file, max = 1600, q = .82){
  let src, w, h;
  try { src = await createImageBitmap(file); w = src.width; h = src.height; }
  catch (e) { src = await new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = URL.createObjectURL(file); }); w = src.naturalWidth; h = src.naturalHeight; }
  const k = Math.min(1, max / Math.max(w, h));
  const c = document.createElement("canvas"); c.width = Math.round(w * k); c.height = Math.round(h * k);
  c.getContext("2d").drawImage(src, 0, 0, c.width, c.height);
  return await new Promise(r => c.toBlob(r, "image/jpeg", q));
}
function addFiles(files){
  files.forEach(async file => {
    const slot = { preview: URL.createObjectURL(file), pct: 0 };
    ed.fotos.push(slot); ed.subiendo++; renderPhotos(); status();
    try {
      const blob = await comprimir(file);
      const path = `web/${ed.col}/${ed.id}/${Date.now()}_${Math.random().toString(36).slice(2, 7)}.jpg`;
      const task = uploadBytesResumable(ref(storage, path), blob, { contentType: "image/jpeg", cacheControl: "public,max-age=31536000" });
      await new Promise((res, rej) => task.on("state_changed", s => { slot.pct = Math.round(s.bytesTransferred / s.totalBytes * 100); renderPhotos(); }, rej, res));
      const url = await getDownloadURL(task.snapshot.ref);
      const i = ed.fotos.indexOf(slot); if (i >= 0) ed.fotos[i] = url; ed.nuevas.push(url);
    } catch (err) {
      const i = ed.fotos.indexOf(slot); if (i >= 0) ed.fotos.splice(i, 1);
      toast(/storage\/(unknown|unauthorized|bucket-not-found|project-not-found)|404|retry-limit/.test(String(err.code || err.message))
        ? "Las fotos aún no se pueden subir: falta activar Storage en Firebase (plan Blaze)."
        : "No se pudo subir una foto: " + (err.code || err.message), true);
    }
    ed.subiendo--; renderPhotos(); status();
  });
}
function status(){ $("edStatus").textContent = ed && ed.subiendo ? `Subiendo ${ed.subiendo} foto(s)…` : ""; $("edSave").disabled = !!(ed && ed.subiendo); }

function closeEditor(cancel){
  if (cancel && ed) ed.nuevas.forEach(u => deleteObject(ref(storage, u)).catch(() => {}));
  $("edBack").classList.remove("show"); document.body.style.overflow = ""; ed = null;
}
$("edClose").addEventListener("click", () => { if (!ed?.nuevas.length || confirm("¿Salir sin guardar?")) closeEditor(true); });
$("edCancel").addEventListener("click", () => { if (!ed?.nuevas.length || confirm("¿Salir sin guardar?")) closeEditor(true); });

$("edSave").addEventListener("click", async () => {
  const keyTab = ed.col === "web_autos" ? "autos" : "entregados";
  const out = {};
  FIELDS[keyTab].forEach(f => out[f.k] = ($("f_" + f.k).value || "").trim());
  if (!out.nombre) { toast("Escribe la marca, modelo y año.", true); $("f_nombre").focus(); return; }
  if (out.copart && !/^https?:\/\/(www\.)?copart\.com\//i.test(out.copart)) { toast("El link de Copart debe empezar con https://www.copart.com/", true); $("f_copart").focus(); return; }
  out.fotos = ed.fotos.filter(u => typeof u === "string");
  $("edSave").disabled = true; $("edSave").textContent = "Guardando…";
  try {
    if (ed.isNew) {
      const minOrden = Math.min(0, ...data[keyTab].map(x => x.orden ?? 0));
      await setDoc(doc(db, ed.col, ed.id), { ...out, visible: true, orden: minOrden - 1, creado: serverTimestamp() });
    } else {
      await updateDoc(doc(db, ed.col, ed.id), { ...out, editado: serverTimestamp() });
      // Borra del almacenamiento las fotos que quitaste
      (ed.item.fotos || []).filter(u => !out.fotos.includes(u) && /firebasestorage/.test(u)).forEach(u => deleteObject(ref(storage, u)).catch(() => {}));
    }
    toast(ed.isNew ? "Agregado. Ya aparece en la página." : "Cambios guardados.");
    closeEditor(false);
  } catch (err) { toast("No se pudo guardar: " + (err.code || err.message), true); }
  $("edSave").disabled = false; $("edSave").textContent = "Guardar";
});

$("addBtn").addEventListener("click", () => openEditor(null));
addEventListener("beforeunload", e => { if (ed && (ed.subiendo || ed.nuevas.length)) { e.preventDefault(); e.returnValue = ""; } });
