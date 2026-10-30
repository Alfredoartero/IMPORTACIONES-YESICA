/* =========================================================
   Video de bienvenida (intro)
   - Arranca solo, sin sonido (los navegadores no permiten audio automático)
   - Botón "Activar sonido" lo reinicia desde el inicio con audio
   - "Saltar" o al terminar: se desvanece y queda la página
   - Vista previa: entrar con ?intro=1
   ========================================================= */
(function () {
  const q = new URLSearchParams(location.search);
  const PREVIEW = q.has("intro");
  const ACTIVO = true;             // cambiar a true para mostrarla a todos (solo la primera visita)
  const KEY = "iy_intro_v1";
  let visto = false;
  try { visto = localStorage.getItem(KEY) === "1"; } catch (e) {}
  if (!PREVIEW && (!ACTIVO || visto)) return;
  if (matchMedia("(prefers-reduced-motion: reduce)").matches && !PREVIEW) return;

  const vertical = matchMedia("(max-aspect-ratio: 4/5)").matches;
  const src = vertical ? "media/intro-v.mp4?v=1" : "media/intro-h.mp4?v=1";
  const poster = vertical ? "media/intro-v.jpg?v=1" : "media/intro-h.jpg?v=1";

  const css = `
  .iy-intro{position:fixed;inset:0;z-index:9999;background:#050507;display:grid;place-items:center;overflow:hidden;opacity:1;transition:opacity .9s ease,transform .9s cubic-bezier(.2,.7,.2,1)}
  .iy-intro.out{opacity:0;transform:scale(1.04);pointer-events:none}
  .iy-intro video{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;background:#050507}
  .iy-intro .shade{position:absolute;inset:0;pointer-events:none;background:linear-gradient(180deg,rgba(5,5,7,.55) 0,rgba(5,5,7,0) 18%,rgba(5,5,7,0) 70%,rgba(5,5,7,.65) 100%)}
  .iy-top{position:absolute;top:max(18px,env(safe-area-inset-top));left:20px;right:20px;display:flex;justify-content:space-between;align-items:center;gap:12px}
  .iy-brand{font:600 12px/1 Sora,Poppins,sans-serif;letter-spacing:.28em;color:#fff;opacity:.85;white-space:nowrap}
  .iy-brand b{color:#f472b6;font-weight:600}
  .iy-skip{display:flex;align-items:center;gap:8px;border:1px solid rgba(255,255,255,.22);background:rgba(10,10,14,.45);backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);color:#fff;font:600 13px/1 Inter,sans-serif;padding:11px 16px;border-radius:999px;cursor:pointer;transition:background .25s,border-color .25s}
  .iy-skip:hover{background:rgba(219,39,119,.35);border-color:rgba(244,114,182,.6)}
  .iy-skip svg{width:14px;height:14px}
  .iy-sound{position:absolute;left:50%;bottom:max(46px,calc(env(safe-area-inset-bottom) + 34px));transform:translateX(-50%);display:flex;align-items:center;gap:14px;padding:16px 26px 16px 18px;border-radius:999px;border:1px solid rgba(244,114,182,.55);background:linear-gradient(135deg,rgba(219,39,119,.85),rgba(157,23,77,.85));backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);color:#fff;font:600 16px/1 Inter,sans-serif;letter-spacing:.02em;cursor:pointer;box-shadow:0 10px 40px rgba(219,39,119,.45);transition:transform .35s cubic-bezier(.2,.8,.2,1),opacity .4s,box-shadow .3s;animation:iyIn .8s .6s both cubic-bezier(.2,.8,.2,1)}
  .iy-sound:hover{transform:translateX(-50%) scale(1.05);box-shadow:0 14px 50px rgba(219,39,119,.6)}
  .iy-sound::before{content:"";position:absolute;inset:-6px;border-radius:999px;border:2px solid rgba(244,114,182,.55);animation:iyRing 1.8s infinite}
  .iy-sound .ic{width:36px;height:36px;border-radius:50%;background:rgba(255,255,255,.16);display:grid;place-items:center}
  .iy-sound .ic svg{width:19px;height:19px}
  .iy-sound .eq{display:flex;align-items:flex-end;gap:3px;height:16px;margin-left:2px}
  .iy-sound .eq i{width:3px;border-radius:2px;background:#fff;animation:iyEq 1s infinite ease-in-out}
  .iy-sound .eq i:nth-child(2){animation-delay:-.4s}.iy-sound .eq i:nth-child(3){animation-delay:-.2s}.iy-sound .eq i:nth-child(4){animation-delay:-.7s}
  .iy-sound.hide{opacity:0;transform:translateX(-50%) translateY(20px) scale(.9);pointer-events:none}
  .iy-mute{position:absolute;left:20px;bottom:max(26px,calc(env(safe-area-inset-bottom) + 18px));width:44px;height:44px;border-radius:50%;border:1px solid rgba(255,255,255,.22);background:rgba(10,10,14,.45);backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);color:#fff;display:none;place-items:center;cursor:pointer}
  .iy-mute.show{display:grid}.iy-mute svg{width:18px;height:18px}
  .iy-bar{position:absolute;left:0;right:0;bottom:0;height:3px;background:rgba(255,255,255,.12)}
  .iy-bar i{display:block;height:100%;width:0;background:linear-gradient(90deg,#db2777,#f472b6);box-shadow:0 0 12px #db2777}
  .iy-play{position:absolute;display:none;flex-direction:column;align-items:center;gap:14px;border:0;background:none;color:#fff;font:600 15px Inter,sans-serif;cursor:pointer}
  .iy-play span{width:86px;height:86px;border-radius:50%;background:#db2777;display:grid;place-items:center;box-shadow:0 0 0 10px rgba(219,39,119,.25),0 10px 40px rgba(219,39,119,.5)}
  .iy-play.show{display:flex}
  @keyframes iyRing{0%{transform:scale(1);opacity:.9}100%{transform:scale(1.25,1.6);opacity:0}}
  @keyframes iyEq{0%,100%{height:4px}50%{height:16px}}
  @keyframes iyIn{from{opacity:0;transform:translateX(-50%) translateY(24px) scale(.92)}to{opacity:1;transform:translateX(-50%)}}
  @media (max-width:600px){
    .iy-brand{display:none}
    .iy-sound{left:auto;right:14px;bottom:max(18px,calc(env(safe-area-inset-bottom) + 12px));transform:none;gap:8px;padding:8px 13px 8px 8px;font-size:12.5px;font-weight:600;background:rgba(12,12,16,.5);border-color:rgba(244,114,182,.6);box-shadow:0 4px 18px rgba(0,0,0,.35);animation:iyInM .6s .6s both ease-out}
    .iy-sound:hover{transform:none}
    .iy-sound::before{inset:-3px;border-width:1.5px}
    .iy-sound .ic{width:26px;height:26px;background:#db2777}
    .iy-sound .ic svg{width:14px;height:14px}
    .iy-sound .eq{display:none}
    .iy-sound.hide{transform:translateY(12px) scale(.9)}
    .iy-mute{left:auto;right:14px;bottom:max(18px,calc(env(safe-area-inset-bottom) + 12px));width:38px;height:38px}
    .iy-top{justify-content:flex-end}
    .iy-skip{padding:9px 13px;font-size:12px}
  }
  @keyframes iyInM{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:none}}
  `;
  const st = document.createElement("style"); st.textContent = css; document.head.appendChild(st);

  const ICON_ON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 5 6 9H2v6h4l5 4V5z"/><path d="M15.5 8.5a5 5 0 0 1 0 7M19 5a10 10 0 0 1 0 14"/></svg>';
  const ICON_OFF = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 5 6 9H2v6h4l5 4V5z"/><path d="m23 9-6 6M17 9l6 6"/></svg>';
  const el = document.createElement("div");
  el.className = "iy-intro"; el.setAttribute("role", "dialog"); el.setAttribute("aria-label", "Video de bienvenida");
  el.innerHTML = `
    <video playsinline muted autoplay preload="auto" poster="${poster}"><source src="${src}" type="video/mp4"></video>
    <div class="shade"></div>
    <div class="iy-top"><div class="iy-brand">IMPORTACIONES <b>YESICA</b></div>
      <button class="iy-skip" type="button">Saltar intro <svg viewBox="0 0 24 24" fill="currentColor"><path d="M5 5v14l9-7zM15 5h3v14h-3z"/></svg></button></div>
    <button class="iy-sound" type="button"><span class="ic">${ICON_ON}</span>Activar sonido<span class="eq"><i></i><i></i><i></i><i></i></span></button>
    <button class="iy-mute" type="button" aria-label="Silenciar">${ICON_ON}</button>
    <button class="iy-play" type="button"><span><svg width="30" height="30" viewBox="0 0 24 24" fill="#fff"><path d="M8 5v14l11-7z"/></svg></span>Ver video</button>
    <div class="iy-bar"><i></i></div>`;
  document.body.appendChild(el);
  const prevOverflow = document.documentElement.style.overflow;
  document.documentElement.style.overflow = "hidden";

  const v = el.querySelector("video"), bar = el.querySelector(".iy-bar i");
  const btnSound = el.querySelector(".iy-sound"), btnMute = el.querySelector(".iy-mute"), btnPlay = el.querySelector(".iy-play");
  let cerrado = false;
  function cerrar() {
    if (cerrado) return; cerrado = true;
    try { localStorage.setItem(KEY, "1"); } catch (e) {}
    el.classList.add("out");
    // baja el volumen suave mientras se desvanece
    const v0 = v.volume; let k = 0; const iv = setInterval(() => { k++; v.volume = Math.max(0, v0 * (1 - k / 12)); if (k >= 12) { clearInterval(iv); v.pause(); } }, 70);
    setTimeout(() => { el.remove(); st.remove(); document.documentElement.style.overflow = prevOverflow; }, 950);
  }
  function conSonido() {
    v.muted = false; v.volume = 1; v.currentTime = 0;
    v.play().catch(() => {});
    btnSound.classList.add("hide"); btnMute.classList.add("show"); btnMute.innerHTML = ICON_ON;
  }
  btnSound.addEventListener("click", conSonido);
  btnMute.addEventListener("click", () => { v.muted = !v.muted; btnMute.innerHTML = v.muted ? ICON_OFF : ICON_ON; });
  btnPlay.addEventListener("click", () => { btnPlay.classList.remove("show"); conSonido(); });
  el.querySelector(".iy-skip").addEventListener("click", cerrar);
  addEventListener("keydown", e => { if (e.key === "Escape") cerrar(); });
  v.addEventListener("timeupdate", () => { if (v.duration) bar.style.width = (v.currentTime / v.duration * 100) + "%"; });
  v.addEventListener("ended", cerrar);
  v.addEventListener("error", cerrar);
  // si el navegador bloquea incluso el autoplay sin sonido (ahorro de batería), mostrar "Ver video"
  const p = v.play();
  if (p && p.catch) p.catch(() => { btnSound.classList.add("hide"); btnPlay.classList.add("show"); });
})();
