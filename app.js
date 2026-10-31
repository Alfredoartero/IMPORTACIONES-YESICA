/* =========================================================
   Importaciones Yesica — lógica compartida (inicio e inventario)
   Los carros se editan en autos.js
   ========================================================= */

/* ====== CONFIGURACIÓN: cambia aquí los números ====== */
// Números de WhatsApp y qué porcentaje de clientes le toca a cada uno (los botones generales)
const WA_NUMS = [
  { num: "50360196897", peso: 40 },   // 6019-6897
  { num: "50370644476", peso: 30 },   // 7064-4476
  { num: "50377686303", peso: 30 },   // 7768-6303
];
// Cada visitante queda asignado a un número (según el reparto) y siempre le toca el mismo,
// para que el cliente no termine hablando con dos personas distintas.
const WA_MAIN = (() => {
  const KEY = "iy_wa_v1";
  try { const g = localStorage.getItem(KEY); if (WA_NUMS.some(x => x.num === g)) return g; } catch (e) {}
  const total = WA_NUMS.reduce((a, x) => a + x.peso, 0); let r = Math.random() * total, pick = WA_NUMS[0].num;
  for (const x of WA_NUMS) { if ((r -= x.peso) < 0) { pick = x.num; break; } }
  try { localStorage.setItem(KEY, pick); } catch (e) {}
  return pick;
})();

const $ = id => document.getElementById(id);
const waUrl = (num, text) => `https://wa.me/${num}` + (text ? `?text=${encodeURIComponent(text)}` : "");
const fmtPhone = n => "+503 " + n.slice(3,7) + "-" + n.slice(7);
const normalizeSrc = p => /^https?:\/\//i.test(p) ? p.trim() : encodeURI(p.trim());
const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
const finePointer = matchMedia("(pointer:fine)").matches;
const ARROW_R = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M5 12h14M13 6l6 6-6 6"/></svg>';
const ARROW_UR = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" width="16" height="16"><path d="M7 17 17 7M8 7h9v9"/></svg>';
const CAM = '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="6" width="18" height="14" rx="2"/><circle cx="12" cy="13" r="3.5"/><path d="M8 6l1.5-2h5L16 6"/></svg>';
const pad = n => String(n).padStart(2, "0");
const hdr = $("hdr");
// Franja oscura en el borde inferior (evita que Safari pinte su barra de verde)
document.body.appendChild(Object.assign(document.createElement("div"), { className: "edge-tint", ariaHidden: "true" }));
const DEEP = (() => { const p = new URLSearchParams(location.search); return { auto: p.get("auto"), entrega: p.get("entrega") }; })();

/* ---- Siempre abrir arriba (el navegador no recuerda dónde te quedaste) ---- */
if ("scrollRestoration" in history) history.scrollRestoration = "manual";
(() => {
  const goTop = () => {
    const target = location.hash && document.querySelector(location.hash);
    if (target) target.scrollIntoView({block: "start"});
    else window.scrollTo(0, 0);
  };
  goTop();
  addEventListener("load", goTop);
  addEventListener("pageshow", e => { if (e.persisted) goTop(); });
})();

/* ---- Datos ---- */
// Solo se aceptan links reales de Copart (evita links peligrosos aunque alguien los escribiera)
const safeCopart = u => (typeof u === "string" && /^https:\/\/(www\.)?copart\.com\/[^\s"'<>]*$/i.test(u.trim())) ? u.trim() : "";
// Solo se aceptan fotos de Firebase Storage o del propio sitio
// Marca = primera palabra que no sea un año (ej. "2021 KIA FORTE" -> KIA), siempre en mayúsculas
function marcaDe(nombre){
  const w = String(nombre || "").trim().split(/\s+/).find(p => !/^(19|20)\d{2}$/.test(p) && /[a-z]/i.test(p));
  return w ? w.replace(/[^\wáéíóúñ-]/gi, "").toUpperCase() : "OTROS";
}
const safeImg = u => typeof u === "string" && (/^https:\/\/firebasestorage\.googleapis\.com\//.test(u) || !/^[a-z]+:/i.test(u));
const slugUsed = {};
const slug = s => { let b = String(s).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "auto"; let k = b, n = 2; while (slugUsed[k]) k = b + "-" + n++; slugUsed[k] = 1; return k; };
const cars = (window.AUTOS || []).map((a, order) => {
  const images = (a.fotos || []).filter(safeImg);
  const name = a.nombre || "Vehículo";
  const title = a.color ? `${name} (${a.color})` : name;
  const price = a.precio || "Consultar";
  const parts = [a.motor, a.transmision, a.millaje, a.condicion, a.titulo].map(x => (x || "").trim());
  return {
    id: a.id || slug(title), copart: safeCopart(a.copart), kind: "auto",
    images, parts, title, name, price, order,
    brand: marcaDe(name),
    year: +(name.match(/\b(19|20)\d{2}\b/) || [0])[0],
    priceNum: +(price.replace(/[^\d.]/g, "")) || null,
    desc: a.detalles || "",
    meta: parts.join(" "),
    badge: a.estado || "Disponible",
    cover: images[0] ? normalizeSrc(images[0]) : ""
  };
});

/* Carga la primera foto que sí exista de una lista */
function loadFirst(img, list, onFail){
  const q = [...new Set(list.filter(Boolean).map(normalizeSrc))].slice(0, 3); let i = 0;
  const next = () => { if (i >= q.length) { onFail && onFail(); return; } img.src = q[i++]; };
  img.onerror = next; next();
}

/* ---- Intro: pantalla "IMPORTACIONES YESICA" al entrar al inicio ---- */
(() => {
  const loader = $("loader");
  const ready = () => document.body.classList.add("ready");
  if (!loader || reduce) {
    if (loader) loader.style.display = "none";
    requestAnimationFrame(ready); setTimeout(ready, 60);
    return;
  }
  const txt = "IMPORTACIONES YESICA";
  $("loaderLogo").innerHTML = [...txt].map((ch, i) => `<span class="${i > 13 ? "pk" : ""}" style="animation-delay:${i * 35}ms">${ch === " " ? "&nbsp;" : ch}</span>`).join("");
  document.body.classList.add("locked");
  setTimeout(() => { loader.classList.add("done"); document.body.classList.remove("locked"); window.scrollTo(0, 0); ready(); }, 1500);
})();

/* ---- Títulos palabra por palabra ---- */
document.querySelectorAll(".split-words").forEach(h => {
  let i = 0;
  const wrap = node => {
    [...node.childNodes].forEach(n => {
      if (n.nodeType === 3) {
        const frag = document.createDocumentFragment();
        n.textContent.split(/(\s+)/).forEach(part => {
          if (!part) return;
          if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(" ")); return; }
          const w = document.createElement("span"); w.className = "w";
          const inner = document.createElement("span"); inner.textContent = part;
          inner.style.transitionDelay = (0.2 + i++ * 0.08) + "s";
          w.appendChild(inner); frag.appendChild(w);
        });
        n.replaceWith(frag);
      } else if (n.nodeType === 1) wrap(n);
    });
  };
  wrap(h);
});

/* ---- Contacto y WhatsApp ---- */
const generalMsg = "Hola, quisiera información sobre sus vehículos.";
document.querySelectorAll(".js-wa").forEach(a => a.href = waUrl(WA_MAIN, generalMsg));
// Números escritos (Contacto y pie de página): cada uno lleva a su propio número
WA_NUMS.forEach((x, i) => {
  document.querySelectorAll(".js-wa" + (i + 1)).forEach(a => a.href = waUrl(x.num, generalMsg));
  document.querySelectorAll(".js-phone" + (i + 1)).forEach(el => el.textContent = fmtPhone(x.num));
});
document.querySelectorAll(".js-wa-search").forEach(a => a.href = waUrl(WA_MAIN, "Hola, quiero iniciar una búsqueda personalizada. Busco: "));
document.querySelectorAll(".js-year").forEach(el => el.textContent = new Date().getFullYear());
document.querySelectorAll(".js-count").forEach(el => el.textContent = cars.length);

const menuBtn = $("toggleMenu");
if (menuBtn) {
  menuBtn.addEventListener("click", () => menuBtn.setAttribute("aria-expanded", hdr.classList.toggle("open")));
  document.querySelectorAll("#mobileNav a").forEach(a => a.addEventListener("click", () => hdr.classList.remove("open")));
}
if ($("contactForm")) $("contactForm").addEventListener("submit", e => {
  e.preventDefault();
  const n = $("nombre").value.trim(), m = $("modelo").value.trim(), msj = $("mensaje").value.trim();
  window.open(waUrl(WA_MAIN, `Hola, soy ${n}. Me interesa: ${m}. ${msj}`), "_blank");
});

/* ---- Tarjeta de carro ---- */
function buildCard(car){
  const card = document.createElement("article");
  card.className = "card";
  const go = /camino/i.test(car.badge);
  card.innerHTML = `
    <div class="c-head">
      <div><h3></h3><p class="from">Precio<b></b></p></div>
      <span class="c-badge ${go ? "go" : ""}"></span>
    </div>
    <div class="c-media"><span class="photo-count">${CAM}${car.images.length}</span><div class="scrub"></div></div>
    <div class="specs"></div>
    <div class="c-foot"><span class="c-btn">Ver detalles ${ARROW_R}</span></div>`;
  card.querySelector("h3").textContent = car.name;
  card.querySelector(".from b").textContent = car.price;
  card.querySelector(".c-badge").textContent = car.badge;
  const media = card.querySelector(".c-media");
  if (car.images.length < 2) media.querySelector(".photo-count").remove();
  const noPhoto = () => { const d = document.createElement("div"); d.className = "no-photo"; d.textContent = "Foto próximamente"; return d; };
  if (car.cover) {
    const img = document.createElement("img"); img.alt = car.name; img.loading = "lazy";
    media.prepend(img);
    loadFirst(img, car.images, () => img.replaceWith(noPhoto()));
  } else media.prepend(noPhoto());

  // Ver más ángulos al pasar el mouse
  const n = Math.min(5, car.images.length), scrub = media.querySelector(".scrub");
  if (n > 1 && finePointer) {
    scrub.innerHTML = "<i></i>".repeat(n);
    const bars = [...scrub.children]; bars[0].classList.add("on");
    let cur = 0;
    media.addEventListener("mousemove", e => {
      const r = media.getBoundingClientRect();
      const k = Math.min(n - 1, Math.floor((e.clientX - r.left) / r.width * n));
      if (k === cur) return; cur = k;
      const img = media.querySelector("img"); if (img) { img.onerror = null; img.src = normalizeSrc(car.images[k]); }
      bars.forEach((b, j) => b.classList.toggle("on", j === k));
    });
    media.addEventListener("mouseleave", () => {
      cur = 0; const img = media.querySelector("img"); if (img) img.src = car.cover;
      bars.forEach((b, j) => b.classList.toggle("on", j === 0));
    });
  } else scrub.remove();

  const specs = card.querySelector(".specs");
  [[car.parts[2], "Millaje"], [car.parts[0], "Motor"], [car.parts[3], "Condición"]].forEach(([v, l]) => {
    const d = document.createElement("div"); d.textContent = (!v || /por confirmar/i.test(v)) ? "—" : v;
    const s = document.createElement("small"); s.textContent = l; d.appendChild(s); specs.appendChild(d);
  });

  card.tabIndex = 0; card.setAttribute("role", "button"); card.setAttribute("aria-label", "Ver " + car.name);
  card.addEventListener("click", () => openModal(car));
  card.addEventListener("keydown", e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); openModal(car); } });

  if (finePointer && !reduce) {
    card.addEventListener("mousemove", e => {
      const r = card.getBoundingClientRect(), x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
      card.style.setProperty("--mx", x * 100 + "%"); card.style.setProperty("--my", y * 100 + "%");
      card.style.transform = `perspective(1000px) rotateX(${(0.5 - y) * 6}deg) rotateY(${(x - 0.5) * 6}deg) translateY(-6px)`;
    });
    card.addEventListener("mouseleave", () => card.style.transform = "");
  }
  car.card = card;
  return card;
}

/* ---- Sin carros todavía ---- */
const EMPTY_HTML = `<div class="empty"><b>Muy pronto, nuevos vehículos</b>Estamos preparando el inventario. Escríbenos por WhatsApp y te contamos qué viene en camino.</div>`;
if (!cars.length) {
  document.querySelectorAll(".slide-card, .stories, .row-nav, .row-actions .round, #vehiculos .row-foot, #vehiculos .row-head .lead").forEach(el => el.style.display = "none");
  document.querySelectorAll('[data-count="auto"]').forEach(el => el.closest("div").style.display = "none");
  const numbers = $("numbers"); if (numbers) numbers.classList.add("three");
}

/* ---- INICIO: una sola fila ---- */
const row = $("previewRow");
if (row && !cars.length) { row.outerHTML = EMPTY_HTML; }
else if (row) {
  const MAX = 10; // máximo de carros en la fila del inicio (el resto está en inventario.html)
  cars.slice(0, MAX).forEach(c => row.appendChild(buildCard(c)));
  const more = document.createElement("a");
  more.href = "inventario"; more.className = "row-more";
  more.innerHTML = `<div><div class="rm-count">${cars.length}</div><div class="rm-label">Ver todo el inventario</div><p>Filtra por marca, busca por modelo y ordena por precio.</p></div><div class="rm-go"><span>Abrir inventario</span><span>${ARROW_UR}</span></div>`;
  row.appendChild(more);

  // El "snap" se activa solo cuando la persona usa la fila (evita que Safari salte aquí al cargar)
  const enableSnap = () => row.classList.add("snap");
  ["touchstart", "pointerdown", "wheel"].forEach(ev => row.addEventListener(ev, enableSnap, {passive:true, once:true}));
  const prev = $("rowPrev"), next = $("rowNext"), bar = $("rowBar");
  const step = () => (row.querySelector(".card")?.offsetWidth || 300) + 22;
  prev.addEventListener("click", () => enableSnap() || row.scrollBy({left: -step(), behavior: "smooth"}));
  next.addEventListener("click", () => enableSnap() || row.scrollBy({left: step(), behavior: "smooth"}));
  const upd = () => {
    const max = row.scrollWidth - row.clientWidth;
    const p = max > 0 ? row.scrollLeft / max : 1;
    bar.style.width = Math.min(100, (row.scrollLeft + row.clientWidth) / row.scrollWidth * 100) + "%";
    prev.disabled = row.scrollLeft < 8; next.disabled = row.scrollLeft > max - 8;
  };
  row.addEventListener("scroll", upd, {passive:true}); addEventListener("resize", upd); setTimeout(upd, 100);

  // Arrastrar con el mouse
  if (finePointer) {
    let down = false, sx = 0, sl = 0, moved = false;
    row.addEventListener("mousedown", e => { down = true; moved = false; sx = e.clientX; sl = row.scrollLeft; row.style.scrollSnapType = "none"; row.style.scrollBehavior = "auto"; });
    addEventListener("mousemove", e => { if (!down) return; const dx = e.clientX - sx; if (Math.abs(dx) > 5) moved = true; row.scrollLeft = sl - dx; });
    addEventListener("mouseup", () => { if (!down) return; down = false; row.style.scrollSnapType = ""; row.style.scrollBehavior = ""; });
    row.addEventListener("click", e => { if (moved) { e.stopPropagation(); e.preventDefault(); moved = false; } }, true);
  }

  // Aparecen en cascada al llegar
  const rio = new IntersectionObserver(es => es.forEach(e => {
    if (!e.isIntersecting) return; rio.disconnect();
    [...row.children].forEach((c, i) => { c.style.animationDelay = (i * 90) + "ms"; c.classList.add("pop"); });
  }), {threshold:.2});
  rio.observe(row);
}

/* ---- INVENTARIO: filtros, buscador y orden ---- */
const grid = $("grid");
if (grid && !cars.length) { grid.innerHTML = EMPTY_HTML; $("controls") && ($("controls").style.display = "none"); $("resultCount") && ($("resultCount").closest("p").style.display = "none"); }
else if (grid) {
  cars.forEach(c => grid.appendChild(buildCard(c)));
  const seg = $("seg"), pill = $("segPill");
  const brands = {}; cars.forEach(c => brands[c.brand] = (brands[c.brand] || 0) + 1);
  const params = new URLSearchParams(location.search);
  let curBrand = brands[params.get("marca")] ? params.get("marca") : "all";
  if (params.get("q")) $("q").value = params.get("q");

  [["all", "Todos", cars.length], ...Object.keys(brands).sort().map(b => [b, b, brands[b]])].forEach(([key, label, count]) => {
    const b = document.createElement("button"); b.dataset.brand = key;
    b.innerHTML = `<span></span><small>${count}</small>`; b.querySelector("span").textContent = label;
    if (key === curBrand) b.classList.add("on");
    b.addEventListener("click", () => { curBrand = key; seg.querySelectorAll("button").forEach(x => x.classList.toggle("on", x === b)); movePill(); applyFilters(); });
    seg.appendChild(b);
  });
  function movePill(){
    const on = seg.querySelector("button.on"); if (!on) return;
    pill.style.width = on.offsetWidth + "px"; pill.style.transform = `translateX(${on.offsetLeft}px)`;
  }
  addEventListener("resize", movePill); setTimeout(movePill, 60); document.fonts && document.fonts.ready.then(movePill);

  const empty = document.createElement("div"); empty.className = "empty";
  empty.innerHTML = "<b>No encontramos ese modelo</b>Escríbenos y lo buscamos por ti en subasta.";
  function applyFilters(){
    const q = $("q").value.trim().toLowerCase(), sort = $("sort").value;
    let list = cars.filter(c => (curBrand === "all" || c.brand === curBrand) && (!q || (c.title + " " + c.meta + " " + c.desc).toLowerCase().includes(q)));
    const val = (c, dir) => c.priceNum == null ? (dir > 0 ? Infinity : -Infinity) : c.priceNum;
    if (sort === "asc") list.sort((a, b) => val(a, 1) - val(b, 1));
    else if (sort === "desc") list.sort((a, b) => val(b, -1) - val(a, -1));
    else if (sort === "year") list.sort((a, b) => b.year - a.year || a.order - b.order);
    else list.sort((a, b) => a.order - b.order);
    cars.forEach(c => c.card.style.display = "none");
    list.forEach((c, i) => {
      c.card.style.display = ""; grid.appendChild(c.card);
      c.card.classList.remove("pop"); void c.card.offsetWidth;
      c.card.style.animationDelay = (i * 60) + "ms"; c.card.classList.add("pop");
    });
    if (!list.length) grid.appendChild(empty); else empty.remove();
    $("resultCount").textContent = list.length;
    $("resultWord").textContent = list.length === 1 ? "vehículo" : "vehículos";
    // Guarda el filtro en el enlace para poder compartirlo
    const u = new URLSearchParams();
    if (curBrand !== "all") u.set("marca", curBrand);
    if (q) u.set("q", q);
    history.replaceState(null, "", location.pathname + (u.toString() ? "?" + u : ""));
  }
  $("q").addEventListener("input", applyFilters);
  $("sort").addEventListener("change", applyFilters);
  applyFilters();

  // Barra de filtros fija con fondo al pegarse arriba
  const ctl = $("controls");
  const sentinel = document.createElement("div"); ctl.before(sentinel);
  new IntersectionObserver(([e]) => ctl.classList.toggle("stuck", !e.isIntersecting), {rootMargin:"-100px 0px 0px 0px"}).observe(sentinel);
}

/* ---- ENTREGADOS: traídos para clientes y vendidos ---- */
const TIPO = { cliente: "Traído para cliente", vendido: "Vendido" };
const DEMO = new URLSearchParams(location.search).has("demo");
const deliveredSrc = (window.ENTREGADOS && window.ENTREGADOS.length) ? window.ENTREGADOS : (DEMO ? (window.ENTREGADOS_DEMO || []) : []);
const usingDemo = DEMO && deliveredSrc === window.ENTREGADOS_DEMO;
const delivered = deliveredSrc.map((d, order) => {
  const images = (d.fotos || []).filter(safeImg);
  const name = d.nombre || "Vehículo";
  const tipo = d.tipo === "vendido" ? "vendido" : "cliente";
  return {
    id: d.id || slug("entrega " + name + " " + (d.fecha || "")), copart: safeCopart(d.copart), kind: "entrega",
    tipo, order, images, name, title: name,
    brand: TIPO[tipo], badge: (usingDemo ? "Ejemplo · " : "") + TIPO[tipo],
    price: d.fecha || (tipo === "vendido" ? "Vendido" : "Entregado"),
    priceLabel: tipo === "vendido" ? "Vendido en" : "Entregado en",
    fecha: d.fecha || "", lugar: d.lugar || "",
    parts: ["", "", "", "", d.lugar || ""],
    specList: [["cal", "Fecha", d.fecha], ["pin", "Lugar", d.lugar], ["miles", "Millaje", d.millaje], ["user", "Tipo", TIPO[tipo]]],
    desc: d.nota || "",
    detailsTitle: "Detalles",
    note: "¿Quieres uno similar? Te lo buscamos en subasta.",
    cta: "Quiero uno similar",
    waMsg: `Hola, vi el ${name} que ${tipo === "vendido" ? "vendieron" : "le trajeron a un cliente"}. Quiero uno similar.`,
    cover: images[0] ? normalizeSrc(images[0]) : ""
  };
});
document.querySelectorAll(".js-dcount").forEach(el => el.textContent = delivered.length);
if (!delivered.length) document.querySelectorAll(".js-needs-delivered").forEach(el => el.remove());
// En vista previa, los enlaces internos conservan ?demo=1
if (DEMO) document.querySelectorAll('a[href="./"], a[href^="./#"], a[href^="inventario"], a[href^="entregados"]').forEach(a => {
  const [path, hash] = a.getAttribute("href").split("#");
  a.setAttribute("href", path + (path.includes("?") ? "&" : "?") + "demo=1" + (hash ? "#" + hash : ""));
});

const CHECK = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" width="12" height="12"><path d="m5 12 5 5 9-10"/></svg>';
function buildDeliveredCard(d){
  const card = document.createElement("article");
  card.className = "card done-card";
  card.innerHTML = `
    <div class="c-media">
      <span class="done-badge ${d.tipo}">${CHECK}<span></span></span>
      <span class="photo-count">${CAM}${d.images.length}</span>
    </div>
    <div class="done-body">
      <h3></h3>
      <div class="done-meta"><span class="dm-date"></span><span class="dm-place"></span></div>
    </div>`;
  card.querySelector(".done-badge span").textContent = d.badge;
  card.querySelector("h3").textContent = d.name;
  card.querySelector(".dm-date").textContent = d.fecha;
  card.querySelector(".dm-place").textContent = d.lugar;
  if (!d.fecha) card.querySelector(".dm-date").remove();
  if (!d.lugar) card.querySelector(".dm-place").remove();
  const media = card.querySelector(".c-media");
  if (d.images.length < 2) media.querySelector(".photo-count").remove();
  const noPhoto = () => { const x = document.createElement("div"); x.className = "no-photo"; x.textContent = "Foto próximamente"; return x; };
  if (d.cover) { const img = document.createElement("img"); img.alt = d.name; img.loading = "lazy"; media.prepend(img); loadFirst(img, d.images, () => img.replaceWith(noPhoto())); }
  else media.prepend(noPhoto());
  card.tabIndex = 0; card.setAttribute("role", "button"); card.setAttribute("aria-label", "Ver " + d.name);
  card.addEventListener("click", () => openModal(d));
  card.addEventListener("keydown", e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); openModal(d); } });
  d.card = card;
  return card;
}

/* Botones tipo píldora con indicador deslizante */
function makeSeg(seg, options, current, onChange){
  const pill = seg.querySelector(".seg-pill");
  options.forEach(([key, label, count]) => {
    const b = document.createElement("button"); b.dataset.key = key;
    b.innerHTML = `<span></span><small>${count}</small>`; b.querySelector("span").textContent = label;
    if (key === current) b.classList.add("on");
    b.addEventListener("click", () => { seg.querySelectorAll("button").forEach(x => x.classList.toggle("on", x === b)); move(); onChange(key); });
    seg.appendChild(b);
  });
  function move(){ const on = seg.querySelector("button.on"); if (!on) return; pill.style.width = on.offsetWidth + "px"; pill.style.transform = `translateX(${on.offsetLeft}px)`; }
  addEventListener("resize", move); setTimeout(move, 60); document.fonts && document.fonts.ready.then(move);
}
const tipoOptions = () => {
  const n = t => delivered.filter(d => d.tipo === t).length;
  return [["all", "Todos", delivered.length], ["cliente", "Para clientes", n("cliente")], ["vendido", "Vendidos", n("vendido")]].filter(o => o[0] === "all" || o[2] > 0);
};
function showFiltered(container, list, key){
  list.forEach(d => d.card.style.display = "none");
  list.filter(d => key === "all" || d.tipo === key).forEach((d, i) => {
    d.card.style.display = ""; d.card.classList.remove("pop"); void d.card.offsetWidth;
    d.card.style.animationDelay = (i * 60) + "ms"; d.card.classList.add("pop");
  });
  container.scrollLeft = 0;
}

// Inicio: fila de entregas
const dRow = $("deliveredRow");
if (dRow && delivered.length) {
  delivered.slice(0, 8).forEach(d => dRow.appendChild(buildDeliveredCard(d)));
  if (delivered.length > 8) {
    const more = document.createElement("a"); more.href = "entregados"; more.className = "row-more";
    more.innerHTML = `<div><div class="rm-count">${delivered.length}</div><div class="rm-label">Ver todas las entregas</div><p>Carros traídos para clientes y vendidos.</p></div><div class="rm-go"><span>Abrir galería</span><span>${ARROW_UR}</span></div>`;
    dRow.appendChild(more);
  }
  makeSeg($("dSeg"), tipoOptions(), "all", key => showFiltered(dRow, delivered.slice(0, 8), key));
  const bar = $("dBar");
  const upd = () => { bar.style.width = Math.min(100, (dRow.scrollLeft + dRow.clientWidth) / dRow.scrollWidth * 100) + "%"; };
  dRow.addEventListener("scroll", upd, {passive:true}); addEventListener("resize", upd); setTimeout(upd, 120);
  ["touchstart", "pointerdown", "wheel"].forEach(ev => dRow.addEventListener(ev, () => dRow.classList.add("snap"), {passive:true, once:true}));
  if (finePointer) {
    let down = false, sx = 0, sl = 0, moved = false;
    dRow.addEventListener("mousedown", e => { down = true; moved = false; sx = e.clientX; sl = dRow.scrollLeft; dRow.style.scrollSnapType = "none"; dRow.style.scrollBehavior = "auto"; });
    addEventListener("mousemove", e => { if (!down) return; const dx = e.clientX - sx; if (Math.abs(dx) > 5) moved = true; dRow.scrollLeft = sl - dx; });
    addEventListener("mouseup", () => { if (!down) return; down = false; dRow.style.scrollSnapType = ""; dRow.style.scrollBehavior = ""; });
    dRow.addEventListener("click", e => { if (moved) { e.stopPropagation(); e.preventDefault(); moved = false; } }, true);
  }
}

// Página de entregas
const dGrid = $("deliveredGrid");
if (dGrid) {
  if (!delivered.length) {
    dGrid.innerHTML = '<div class="empty"><b>Muy pronto</b>Aquí vas a ver los carros que ya entregamos a nuestros clientes.</div>';
    $("dSegWrap") && $("dSegWrap").remove();
  } else {
    delivered.forEach(d => dGrid.appendChild(buildDeliveredCard(d)));
    const params = new URLSearchParams(location.search);
    const start = ["cliente", "vendido"].includes(params.get("tipo")) ? params.get("tipo") : "all";
    makeSeg($("dSeg"), tipoOptions(), start, key => {
      showFiltered(dGrid, delivered, key);
      history.replaceState(null, "", location.pathname + (key !== "all" ? "?tipo=" + key : ""));
    });
    showFiltered(dGrid, delivered, start);
  }
}

/* ---- Franja ---- */
if ($("tickerTrack")) {
  const brandNames = [...new Set(cars.map(c => c.brand))];
  const words = [...brandNames, "Copart", "IAAI", "USA → El Salvador", "Fotos en cada etapa"];
  $("tickerTrack").innerHTML = words.map(w => `<span>${w.replace(/</g, "&lt;")}</span>`).join("").repeat(4);
}

/* ---- Portada: slideshow ---- */
const slidesBox = $("heroSlides");
if (slidesBox) {
  const stories = $("stories");
  const heroCars = cars.filter(c => c.cover);
  const DUR = 6000;
  let hIdx = 0, hTimer = null;
  heroCars.forEach((c, i) => {
    const im = document.createElement("img"); im.alt = ""; if (i > 0) im.loading = "lazy";
    slidesBox.appendChild(im); loadFirst(im, c.images, () => { im.style.display = "none"; c.broken = true; if (hIdx === i) showSlide(i + 1); });
    const ci = document.createElement("img"); ci.alt = c.name; if (i > 0) ci.loading = "lazy";
    $("scMedia").appendChild(ci); loadFirst(ci, c.images, () => ci.style.display = "none");
    const b = document.createElement("button"); b.setAttribute("aria-label", c.name); b.innerHTML = "<span></span>";
    b.style.setProperty("--dur", DUR + "ms");
    b.addEventListener("click", () => showSlide(i));
    stories.appendChild(b);
  });
  if ($("scTotal")) $("scTotal").textContent = pad(heroCars.length);
  function showSlide(i){
    if (!heroCars.length) return;
    hIdx = (i + heroCars.length) % heroCars.length;
    let guard = 0;
    while (heroCars[hIdx].broken && guard++ < heroCars.length) hIdx = (hIdx + 1) % heroCars.length;
    const c = heroCars[hIdx];
    [...slidesBox.children].forEach((im, k) => im.classList.toggle("on", k === hIdx));
    [...$("scMedia").querySelectorAll("img")].forEach((im, k) => im.classList.toggle("on", k === hIdx));
    $("scTag").textContent = c.badge;
    [...stories.children].forEach((b, k) => { b.classList.remove("on", "done"); if (k < hIdx) b.classList.add("done"); });
    const cur = stories.children[hIdx]; if (cur) { void cur.offsetWidth; cur.classList.add("on"); }
    const t = $("scText"); t.classList.add("out");
    setTimeout(() => { $("scName").textContent = c.name; $("scPrice").textContent = c.price; if ($("scIdx")) $("scIdx").textContent = pad(hIdx + 1); t.classList.remove("out"); }, 250);
    clearTimeout(hTimer); hTimer = setTimeout(() => showSlide(hIdx + 1), DUR);
  }
  showSlide(0);
  $("scOpen").addEventListener("click", () => openModal(heroCars[hIdx]));
}

/* ---- Collage de búsqueda personalizada ---- */
const collage = $("collage");
if (collage) {
  const withMany = cars.filter(c => c.images.length > 1);
  const a = withMany[0] || cars[0], b = withMany[1] || cars[1] || cars[0];
  if (a) loadFirst($("promoImg"), [a.images[1], a.images[0], a.cover, ...cars.map(c => c.cover)], () => $("promoImg").remove());
  if (b) loadFirst($("promoImg2"), [b.images[0], b.cover, ...cars.map(c => c.cover).reverse()], () => $("promoImg2").remove());
  const cio = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { collage.classList.add("in"); cio.disconnect(); } }), {threshold:.3});
  cio.observe(collage);
}

/* ---- Pasos: se llenan solos al llegar ---- */
const timeline = $("timeline");
if (timeline) {
  const steps = [...timeline.querySelectorAll(".tl-step")];
  const tio = new IntersectionObserver(es => es.forEach(e => {
    if (!e.isIntersecting) return; tio.disconnect();
    timeline.classList.add("run");
    steps.forEach((s, i) => setTimeout(() => s.classList.add("on"), reduce ? 0 : 150 + i * 750));
  }), {threshold:.45});
  tio.observe(timeline);
}

/* ---- Ocultar el botón flotante en Contacto ---- */
const contactSec = $("contacto");
if (contactSec) new IntersectionObserver(([e]) => document.body.classList.toggle("near-contact", e.isIntersecting), {threshold:.15}).observe(contactSec);

/* ---- Botones magnéticos ---- */
if (finePointer && !reduce) document.querySelectorAll(".magnetic").forEach(el => {
  el.addEventListener("mousemove", e => {
    const r = el.getBoundingClientRect();
    el.style.transform = `translate(${(e.clientX - r.left - r.width / 2) * .22}px, ${(e.clientY - r.top - r.height / 2) * .32}px)`;
  });
  el.addEventListener("mouseleave", () => { el.style.transition = "transform .6s cubic-bezier(.2,.8,.2,1)"; el.style.transform = ""; setTimeout(() => el.style.transition = "", 600); });
});

/* ---- Brillo del cursor ---- */
if (finePointer && !reduce && $("glow")) {
  const g = $("glow"); let gx = innerWidth / 2, gy = innerHeight / 2, tx = gx, ty = gy;
  addEventListener("mousemove", e => { tx = e.clientX; ty = e.clientY; g.classList.add("on"); }, {passive:true});
  (function loop(){ gx += (tx - gx) * .08; gy += (ty - gy) * .08; g.style.transform = `translate3d(${gx}px,${gy}px,0)`; requestAnimationFrame(loop); })();
}

/* ---- Efectos con el scroll ---- */
const road = $("road"), heroContent = $("heroContent");
let lastY = 0, ticking = false, mx = 0, my = 0, hidden = false, travel = 0;
const KEEP_HDR = !!document.querySelector(".controls.sticky");
if (KEEP_HDR) document.body.classList.add("has-sticky");
if (finePointer && slidesBox) addEventListener("mousemove", e => { mx = e.clientX / innerWidth - .5; my = e.clientY / innerHeight - .5; if (!ticking) { requestAnimationFrame(onScroll); ticking = true; } }, {passive:true});
function setHidden(h){ if (h === hidden) return; hidden = h; hdr.classList.toggle("hide", h); document.body.classList.toggle("hdr-hidden", h); }
function onScroll(){
  const y = scrollY, H = document.documentElement.scrollHeight - innerHeight;
  if (road) road.style.width = (H > 0 ? y / H * 100 : 0) + "%";
  hdr.classList.toggle("scrolled", y > 30);
  // Mostrar/ocultar el menú con margen: solo cambia tras un desplazamiento real
  // (antes reaccionaba a 1px, al rebote del iPhone y al mover el mouse, y hacía saltar las barras)
  const dy = y - lastY;
  // En Inventario el menú se queda fijo: así las barras de marcas/búsqueda no brincan
  if (KEEP_HDR || hdr.classList.contains("open") || y < 300) { setHidden(false); travel = 0; }
  else if (dy !== 0 && y >= 0 && y <= H) {
    travel = (Math.sign(dy) === Math.sign(travel)) ? travel + dy : dy;
    if (travel > 24) setHidden(true);
    else if (travel < -60) setHidden(false);
  }
  lastY = y;
  if (!reduce && slidesBox && y < innerHeight) {
    const p = y / innerHeight;
    slidesBox.style.transform = `translate3d(${mx * -18}px, ${y * .3 + my * -12}px, 0) scale(${1 + p * .08})`;
    heroContent.style.transform = `translate3d(0, ${y * -.18}px, 0)`;
    heroContent.style.opacity = 1 - p * 1.3;
  }
  ticking = false;
}
addEventListener("scroll", () => { if (!ticking) { requestAnimationFrame(onScroll); ticking = true; } }, {passive:true});
onScroll();

/* ---- Aparecer al hacer scroll + contadores ---- */
const io = new IntersectionObserver(entries => entries.forEach(e => {
  if (!e.isIntersecting) return;
  e.target.classList.add("in"); io.unobserve(e.target);
}), {threshold:.15, rootMargin:"0px 0px -40px 0px"});
document.querySelectorAll(".reveal").forEach((el, i) => { el.style.transitionDelay = (i % 4) * 90 + "ms"; io.observe(el); });

if ($("numbers")) {
  const countIO = new IntersectionObserver(entries => entries.forEach(e => {
    if (!e.isIntersecting) return; countIO.unobserve(e.target);
    e.target.querySelectorAll("[data-count]").forEach(el => {
      const end = el.dataset.count === "auto" ? cars.length : +el.dataset.count;
      if (reduce || end === 0) { el.textContent = end; return; }
      const t0 = performance.now(), dur = 1600;
      (function tick(t){ const k = Math.min(1, (t - t0) / dur), ease = 1 - Math.pow(1 - k, 4); el.textContent = Math.round(end * ease); if (k < 1) requestAnimationFrame(tick); })(t0);
    });
  }), {threshold:.4});
  countIO.observe($("numbers"));
}


    /* ======== VENTANA DE FOTOS ======== */
let currentShareCar = null;
function shareUrl(car){
  // Link corto con foto del carro en WhatsApp (ver.importacionesyesica.com, Cloudflare Worker).
  // Carros sin id de Firebase usan el link normal de la página.
  if (/^[A-Za-z0-9_-]{8,64}$/.test(String(car.id || "")))
    return "https://ver.importacionesyesica.com/" + (car.kind === "entrega" ? "e/" : "") + car.id;
  const base = location.href.replace(/[^/]*([?#].*)?$/, "");
  return base + (car.kind === "entrega" ? "entregados?entrega=" : "inventario?auto=") + encodeURIComponent(car.id);
}
function toastMsg(t){
  let el = document.getElementById("pubToast");
  if (!el) { el = document.createElement("div"); el.id = "pubToast"; el.className = "pub-toast"; document.body.appendChild(el); }
  el.textContent = t; el.classList.add("show"); clearTimeout(el._t); el._t = setTimeout(() => el.classList.remove("show"), 2600);
}
document.addEventListener("click", async e => {
  if (!e.target.closest("#modalShare") || !currentShareCar) return;
  const car = currentShareCar, url = shareUrl(car);
  const text = `${car.title}${car.price && car.kind === "auto" ? " · " + car.price : ""} — Importaciones Yesica`;
  if (navigator.share) { try { await navigator.share({ title: car.title, text, url }); return; } catch (err) { if (err.name === "AbortError") return; } }
  try { await navigator.clipboard.writeText(url); toastMsg("Link copiado. Pégalo en WhatsApp o donde quieras."); }
  catch (err) { prompt("Copia este link:", url); }
});
const backdrop = $("modalBackdrop"), modalEl = $("modal");
const modalImg = $("modalImg"), viewer = $("viewer"), stage = $("stage"), stageBg = $("stageBg");
const thumbsBox = $("modalThumbs"), prevBtn = $("prevBtn"), nextBtn = $("nextBtn");
const counter = $("counter"), progressBar = $("progressBar");
let gallery = [], index = 0, modalOpen = false;

const SPEC_ICONS = {
  cal:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/></svg>',
  pin:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 21s-7-6.2-7-11a7 7 0 0 1 14 0c0 4.8-7 11-7 11z"/><circle cx="12" cy="10" r="2.5"/></svg>',
  user:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="8" r="4"/><path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6"/></svg>',
  motor:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 10h3l2-3h6l2 3h3v7H4z"/><path d="M8 17v2M16 17v2M2 12v3M22 12v3"/></svg>',
  trans:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="6" cy="6" r="2"/><circle cx="12" cy="6" r="2"/><circle cx="18" cy="6" r="2"/><circle cx="6" cy="18" r="2"/><circle cx="12" cy="18" r="2"/><path d="M6 8v8M12 8v8M18 8v4H6"/></svg>',
  miles:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 14l4-4"/><path d="M3.3 17a9 9 0 1 1 17.4 0"/></svg>',
  cond:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 3 4 6v6c0 4.5 3.4 8.3 8 9 4.6-.7 8-4.5 8-9V6z"/><path d="m9 12 2 2 4-4"/></svg>'
};

function loadGallery(list){
  return Promise.all(list.map(src => new Promise(resolve => {
    const im = new Image(), url = normalizeSrc(src);
    im.onload = () => resolve(url);
    im.onerror = () => { console.warn("No cargó:", src); resolve(null); };
    im.src = url;
  }))).then(r => r.filter(Boolean));
}
function renderThumbs(){
  thumbsBox.innerHTML = "";
  gallery.forEach((src, i) => {
    const t = document.createElement("img");
    t.src = src; t.alt = "Foto " + (i + 1); t.loading = "lazy";
    if (i === index) t.className = "active";
    t.addEventListener("click", () => setIndex(i));
    thumbsBox.appendChild(t);
  });
  thumbsBox.parentElement.style.display = gallery.length > 1 ? "" : "none";
}
function setIndex(i, animate = true){
  if (!gallery.length) return;
  index = (i + gallery.length) % gallery.length;
  resetZoom();
  modalImg.src = gallery[index];
  stageBg.style.backgroundImage = `url("${gallery[index]}")`;
  if (animate) { modalImg.classList.remove("swap"); void modalImg.offsetWidth; modalImg.classList.add("swap"); }
  counter.textContent = `${index + 1} / ${gallery.length}`;
  progressBar.style.width = ((index + 1) / gallery.length * 100) + "%";
  [...thumbsBox.children].forEach((el, k) => {
    el.classList.toggle("active", k === index);
    if (k === index) {
      const box = thumbsBox, left = el.offsetLeft - box.clientWidth / 2 + el.clientWidth / 2;
      box.scrollTo({left, behavior:"smooth"});
    }
  });
}

function fillInfo(car){
  const p = car.parts;
  $("modalBrand").textContent = car.brand;
  $("modalTitle").textContent = car.title;
  $("modalBadge").textContent = car.badge;
  $("modalPrice").textContent = car.price;
  $("modalPriceLabel").textContent = car.priceLabel || "Precio";
  $("modalNote").textContent = car.note || "Pregunta por disponibilidad y tiempos de entrega.";
  $("modalCta").textContent = car.cta || "Reservar por WhatsApp";
  $("modalDetailsTitle").textContent = car.detailsTitle || "Detalles de subasta";
  $("modalDetailsTitle").style.display = car.desc ? "" : "none";

  const chips = $("modalChips"); chips.innerHTML = "";
  const addChip = (txt, cls) => { if (!txt) return; const c = document.createElement("span"); c.className = "chip" + (cls ? " " + cls : ""); c.textContent = txt; chips.appendChild(c); };
  addChip(car.badge);
  p.slice(4).forEach(x => addChip(x, "neutral"));

  const specs = $("modalSpecs"); specs.innerHTML = "";
  (car.specList || [["motor","Motor",p[0]],["trans","Transmisión",p[1]],["miles","Millaje",p[2]],["cond","Condición",p[3]]]).forEach(([ic, label, val]) => {
    const d = document.createElement("div"); d.className = "m-spec";
    d.innerHTML = `<span class="ic">${SPEC_ICONS[ic]}</span><span><small></small><b></b></span>`;
    d.querySelector("small").textContent = label;
    d.querySelector("b").textContent = val || "—";
    specs.appendChild(d);
  });

  // Observaciones -> filas "Etiqueta: valor"
  const ul = $("modalDetails"); ul.innerHTML = "";
  car.desc.split(/\s[•·|]\s|\.\s(?=[A-ZÁÉÍÓÚ✅✔☑])|\s*(?=[✅✔☑])|\n+/).map(s => s.trim().replace(/^[✅✔☑️\s-]+/u, "").replace(/\.$/, "")).filter(Boolean).forEach(seg => {
    const li = document.createElement("li");
    const m = seg.match(/^([^:]{2,28}):\s*(.+)$/);
    if (m) {
      const s = document.createElement("span"); s.textContent = /^vin$/i.test(m[1].trim()) ? "VIN" : m[1];
      const b = document.createElement("b"); b.textContent = m[2];
      li.append(s, b);
    } else {
      const lot = seg.match(/^(?:Copart\s+)?(Lote|VIN)\s+(.+)$/i);
      if (lot) {
        const s = document.createElement("span"); s.textContent = /vin/i.test(lot[1]) ? "VIN" : "Lote";
        const b = document.createElement("b"); b.textContent = lot[2];
        li.append(s, b);
      } else { li.className = "note"; li.textContent = seg + "."; }
    }
    ul.appendChild(li);
  });

  const cop = $("modalCopart");
  if (cop) { cop.style.display = car.copart ? "" : "none"; cop.href = car.copart || "#"; cop.parentElement.classList.toggle("one", !car.copart); }
  currentShareCar = car;
  $("modalWhats").href = waUrl(WA_MAIN, car.waMsg || `Hola, quiero reservar: ${car.title} (${car.price}). ¿Sigue disponible?`);
}

async function openModal(car){
  if (!car) return;
  fillInfo(car);
  modalEl.classList.remove("fs");
  modalEl.querySelector(".info-scroll").scrollTop = 0;

  gallery = car.images.map(normalizeSrc); index = 0;
  thumbsBox.innerHTML = "";
  if (gallery.length) setIndex(0, false); else { modalImg.removeAttribute("src"); stageBg.style.backgroundImage = ""; counter.textContent = ""; }

  backdrop.style.display = "flex";
  document.documentElement.style.overflow = "hidden";
  modalOpen = true;
  requestAnimationFrame(() => { backdrop.classList.add("show"); modalEl.classList.add("open"); });

  gallery = await loadGallery(car.images);
  const multi = gallery.length > 1;
  prevBtn.style.display = nextBtn.style.display = multi ? "" : "none";
  counter.style.display = multi ? "" : "none";
  $("progressBar").parentElement.style.display = multi ? "" : "none";
  if (!gallery.length) {
    modalImg.removeAttribute("src"); stageBg.style.backgroundImage = "";
    thumbsBox.parentElement.style.display = "none";
  } else { setIndex(0, false); renderThumbs(); }
}
function closeModal(){
  if (!modalOpen) return;
  modalOpen = false;
  modalEl.classList.remove("open"); backdrop.classList.remove("show");
  modalEl.style.transform = "";
  document.documentElement.style.overflow = "";
  setTimeout(() => { if (!modalOpen) backdrop.style.display = "none"; }, 400);
}
$("closeModal").addEventListener("click", closeModal);
$("fsBtn").addEventListener("click", () => modalEl.classList.toggle("fs"));
backdrop.addEventListener("click", e => { if (e.target === backdrop) closeModal(); });
window.addEventListener("keydown", e => {
  if (!modalOpen) return;
  if (e.key === "Escape") { modalEl.classList.contains("fs") ? modalEl.classList.remove("fs") : closeModal(); }
  if (e.key === "ArrowLeft") setIndex(index - 1);
  if (e.key === "ArrowRight") setIndex(index + 1);
  if (e.key.toLowerCase() === "f") modalEl.classList.toggle("fs");
});
prevBtn.addEventListener("click", () => setIndex(index - 1));
nextBtn.addEventListener("click", () => setIndex(index + 1));

// Celular: arrastrar hacia abajo para cerrar
(() => {
  const zone = $("dragZone"); let y0 = null, dy = 0;
  zone.addEventListener("touchstart", e => { y0 = e.touches[0].clientY; dy = 0; modalEl.classList.add("dragging"); }, {passive:true});
  zone.addEventListener("touchmove", e => { if (y0 === null) return; dy = Math.max(0, e.touches[0].clientY - y0); modalEl.style.transform = `translateY(${dy}px)`; }, {passive:true});
  zone.addEventListener("touchend", () => {
    modalEl.classList.remove("dragging");
    if (dy > 110) closeModal(); else modalEl.style.transform = "";
    y0 = null;
  });
})();

/* Zoom y deslizar entre fotos */
let scale = 1, tx = 0, ty = 0, dragging = false, sx = 0, sy = 0, lastTap = 0, swipeX = null;
function applyT(){ modalImg.style.transform = `translate(${tx}px, ${ty}px) scale(${scale})`; viewer.classList.toggle("zoomed", scale > 1); }
function resetZoom(){ scale = 1; tx = 0; ty = 0; applyT(); }
function zoomAt(x, y, ds){
  const r = modalImg.getBoundingClientRect(), cx = x - (r.left + r.width / 2), cy = y - (r.top + r.height / 2);
  const ns = Math.min(4, Math.max(1, scale * ds));
  tx -= (cx / scale - cx / ns); ty -= (cy / scale - cy / ns); scale = ns;
  if (scale === 1) { tx = 0; ty = 0; }
  applyT();
}
modalImg.addEventListener("dblclick", e => { e.preventDefault(); scale === 1 ? zoomAt(e.clientX, e.clientY, 2.5) : resetZoom(); });
stage.addEventListener("wheel", e => { e.preventDefault(); zoomAt(e.clientX, e.clientY, e.deltaY < 0 ? 1.15 : .87); }, {passive:false});
const startDrag = (x, y) => { if (scale <= 1) return; dragging = true; sx = x - tx; sy = y - ty; };
const moveDrag = (x, y) => { if (!dragging) return; tx = x - sx; ty = y - sy; applyT(); };
modalImg.addEventListener("mousedown", e => { e.preventDefault(); startDrag(e.clientX, e.clientY); });
window.addEventListener("mousemove", e => moveDrag(e.clientX, e.clientY));
window.addEventListener("mouseup", () => dragging = false);
modalImg.addEventListener("touchstart", e => {
  if (e.touches.length !== 1) return;
  const t = e.touches[0], now = Date.now();
  if (now - lastTap < 300) { e.preventDefault(); scale === 1 ? zoomAt(t.clientX, t.clientY, 2.5) : resetZoom(); lastTap = 0; return; }
  lastTap = now;
  if (scale > 1) startDrag(t.clientX, t.clientY); else swipeX = t.clientX;
}, {passive:false});
modalImg.addEventListener("touchmove", e => {
  if (!dragging || e.touches.length !== 1) return;
  e.preventDefault(); moveDrag(e.touches[0].clientX, e.touches[0].clientY);
}, {passive:false});
modalImg.addEventListener("touchend", e => {
  if (swipeX !== null && scale === 1) {
    const dx = e.changedTouches[0].clientX - swipeX;
    if (Math.abs(dx) > 45) setIndex(index + (dx < 0 ? 1 : -1));
  }
  swipeX = null; dragging = false;
});



/* ---- Abrir un carro directo desde un link compartido (?auto=ID o ?entrega=ID) ---- */
(() => {
  const id = DEEP.auto, eid = DEEP.entrega;
  const target = id ? cars.find(c => c.id === id) : (eid ? delivered.find(d => d.id === eid) : null);
  if ((id || eid) && !target) { setTimeout(() => toastMsg("Ese carro ya no está disponible. Mira los demás."), 900); return; }
  if (target) setTimeout(() => openModal(target), document.getElementById("loader") ? 1600 : 400);
})();
