/* Amigo Secreto — app de participantes */
(function () {
  'use strict';
  const { esc, $, $$, icons } = AS;
  const app = document.getElementById('app');
  const S = { data: null, demo: false, dealt: false, me: null, secret: null, raf: 0, returnId: null };
  const ROT = [-2.4, 1.6, -1, 2.2, -1.8, 0.9, 2.6, -0.6];

  /* ───────── datos ───────── */
  const toBlobUrl = (dataUrl) => {
    try {
      const [h, b] = dataUrl.split(',');
      const mime = (h.match(/:(.*?);/) || [])[1] || 'image/jpeg';
      const bin = atob(b); const u8 = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) u8[i] = bin.charCodeAt(i);
      return URL.createObjectURL(new Blob([u8], { type: mime }));
    } catch (e) { return dataUrl; }
  };
  function setData(j) {
    S.data = j;
    j.people.forEach((p) => { p.src = p.photo ? toBlobUrl(p.photo) : AS.avatar(p.name); });
    document.title = j.event.title || 'Amigo Secreto';
  }
  async function loadData() {
    try {
      const r = await fetch('data/sorteo.json?v=' + Date.now(), { cache: 'no-store' });
      if (!r.ok) throw 0;
      const j = await r.json();
      if (!j || !Array.isArray(j.people) || j.people.length < 3) throw 0;
      setData(j);
    } catch (e) { S.data = null; }
  }
  async function buildDemo() {
    try { await document.fonts.load('48px "Young Serif"'); } catch (e) {}
    const code = 'AMIGOS';
    const people = AS.DEMO_PEOPLE.map(([name, hint]) => ({ id: AS.uid(name), name, hint, group: 0 }));
    const map = AS.draw(people); const by = Object.fromEntries(people.map((p) => [p.id, p]));
    const recs = await Promise.all(people.map(async (p) => ({ id: p.id, name: p.name, photo: AS.avatar(p.name), ...(await AS.seal(code, { from: p.id, to: map[p.id], hint: by[map[p.id]].hint }, 15000)) })));
    const d = new Date(); d.setDate(d.getDate() + 38);
    const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    setData({ v: 1, event: { title: 'Amigo Secreto Familia Demo', date: iso, budget: '$15.000', place: 'Casa de la abuela', note: 'Esto es una demo con una familia inventada. Prueba todo el recorrido con el código AMIGOS.', theme: AS.store.get('as.admin.v1') && AS.store.get('as.admin.v1').event ? AS.store.get('as.admin.v1').event.theme : 'pino', organizer: 'Mamá' }, people: recs });
    S.demo = true;
  }

  /* ───────── navegación ───────── */
  function transition(fn) {
    cancelAnimationFrame(S.raf);
    window.scrollTo(0, 0);
    if (document.startViewTransition && !AS.rm()) { try { document.startViewTransition(() => { fn(); }); return; } catch (e) {} }
    fn();
  }
  function go(hash, replace) {
    history[replace ? 'replaceState' : 'pushState'](null, '', hash);
    route();
  }
  function route() {
    const h = location.hash || '#/';
    if (h.startsWith('#/admin')) { transition(() => AS.admin.mount(app, { demo: S.demo })); return; }
    transition(() => {
      AS.applyTheme(S.data ? S.data.event.theme : 'pino');
      const m = h.match(/^#\/yo\/([^?]+)(?:\?(.*))?$/);
      if (!S.data) return renderEmpty();
      if (m) {
        const p = S.data.people.find((x) => x.id === decodeURIComponent(m[1]));
        if (p) {
          const c = new URLSearchParams(m[2] || '').get('c');
          if (c) history.replaceState(null, '', '#/yo/' + encodeURIComponent(p.id)); // limpia el código de la barra de direcciones
          return renderWho(p, c);
        }
      }
      S.me = S.secret = null;
      renderHome();
    });
  }

  /* ───────── piezas ───────── */
  const topbar = (back) => `
    <header class="topbar">
      ${back ? `<button class="back" data-a="home">${icons.back}Volver</button>` : `<a class="brand" href="#/">${icons.gift}Amigo secreto</a>`}
      <button class="iconbtn" data-a="sound" aria-label="Sonido" aria-pressed="${AS.sound.on}">${AS.sound.on ? icons.soundOn : icons.soundOff}</button>
    </header>`;
  const chip = (icon, text) => `<li class="fact">${icon}<span>${esc(text)}</span></li>`;
  function facts(ev, withPeople) {
    const a = [];
    if (ev.date) { const c = AS.countdown(ev.date); a.push(chip(icons.cal, AS.fmtDate(ev.date) + (c ? ', ' + c : ''))); }
    if (ev.budget) a.push(chip(icons.gift, 'Presupuesto ' + ev.budget));
    if (ev.place) a.push(chip(icons.pin, ev.place));
    if (withPeople) a.push(chip(icons.users, S.data.people.length + ' personas'));
    return a.length ? `<ul class="facts">${a.join('')}</ul>` : '';
  }
  const GIFT_SVG = `<svg viewBox="0 0 200 200" aria-hidden="true">
    <ellipse cx="100" cy="186" rx="64" ry="8" fill="rgba(0,0,0,.35)"/>
    <rect x="38" y="92" width="124" height="88" rx="9" fill="var(--accent)"/>
    <rect x="100" y="92" width="62" height="88" rx="9" fill="rgba(0,0,0,.16)"/>
    <rect x="91" y="92" width="18" height="88" fill="var(--gold)"/>
    <rect x="30" y="68" width="140" height="32" rx="9" fill="var(--accent)"/>
    <rect x="30" y="68" width="140" height="14" rx="7" fill="rgba(255,255,255,.14)"/>
    <rect x="91" y="68" width="18" height="32" fill="var(--gold)"/>
    <path d="M100 68C72 22 34 36 56 62c12 12 36 8 44 6z" fill="var(--gold)"/>
    <path d="M100 68c28-46 66-32 44-6-12 12-36 8-44 6z" fill="var(--gold)"/>
    <path d="M100 68C84 44 66 44 66 54c0 8 20 12 34 14z" fill="rgba(0,0,0,.14)"/>
    <circle cx="100" cy="68" r="10" fill="var(--gold-deep)"/>
  </svg>`;

  /* ───────── pantalla: vacío ───────── */
  function renderEmpty() {
    app.innerHTML = `<div class="screen">${topbar()}
      <main class="empty">
        <h1 tabindex="-1">Aquí aparecerá el amigo secreto de la familia</h1>
        <p>Todavía no hay un sorteo publicado. Si organizas tú, créalo en el panel y sube el archivo. Si eres de la familia, avísale a quien organiza.</p>
        <div class="row"><a class="btn primary" href="#/admin">Abrir panel del organizador</a><button class="btn ghost" data-a="demo">Probar con una familia de ejemplo</button></div>
      </main></div>`;
  }

  /* ───────── pantalla: portada ───────── */
  function renderHome() {
    const ev = S.data.event, ppl = S.data.people;
    const deal = !S.dealt && !AS.rm(); S.dealt = true;
    app.innerHTML = `<div class="screen">${topbar()}
      <section class="hero">
        <h1 tabindex="-1">${esc(ev.title || 'Amigo Secreto')}</h1>
        ${ev.note ? `<p class="lede">${esc(ev.note)}</p>` : ''}
        ${facts(ev, true)}
      </section>
      <section aria-labelledby="who">
        <div class="who-head"><h2 id="who">¿Quién eres?</h2><p>Toca tu foto para descubrir a quién le regalas.</p></div>
        <div class="wall ${deal ? 'deal' : ''}">
          ${ppl.map((p, i) => `<button class="card" data-id="${esc(p.id)}" aria-label="Soy ${esc(p.name)}">
            <figure class="polaroid" style="--r:${ROT[i % ROT.length]}deg;--i:${i};--dx:${((i % 5) - 2) * 40}px${S.returnId === p.id ? ';view-transition-name:who' : ''}">
              <img class="pic" src="${p.src}" alt="" decoding="async"><figcaption>${esc(p.name)}</figcaption></figure></button>`).join('')}
        </div>
      </section>
      <footer class="foot"><span class="priv">${icons.shield}Solo tú puedes ver a quién le regalas.</span>
        ${S.demo ? '<button class="linkbtn" data-a="exitdemo">Salir de la demo</button>' : '<a href="#/admin">Organizador</a>'}</footer>
    </div>`;
    S.returnId = null;
  }

  /* ───────── pantalla: código ───────── */
  function renderWho(p, prefill) {
    app.innerHTML = `<div class="screen">${topbar(true)}
      <main class="who-step">
        <figure class="polaroid big"><img class="pic" src="${p.src}" alt="Foto de ${esc(p.name)}"><figcaption>${esc(p.name)}</figcaption></figure>
        <form class="code-card" autocomplete="off" novalidate>
          <h2 tabindex="-1">Hola, ${esc(p.name)}</h2>
          <p class="sub">Escribe el código que te llegó por mensaje y abre tu regalo.</p>
          <div class="otp" data-otp>
            ${[0, 1, 2].map(() => '<div class="cell"></div>').join('')}<span class="dash"></span>${[0, 1, 2].map(() => '<div class="cell"></div>').join('')}
            <input inputmode="text" autocapitalize="characters" autocomplete="off" autocorrect="off" spellcheck="false" maxlength="9" aria-label="Código de 6 caracteres" enterkeyhint="go">
          </div>
          <p class="err" role="alert"></p>
          <div class="actions"><button class="btn primary" type="submit">Abrir mi regalo</button><button type="button" class="linkbtn" data-a="home">No soy ${esc(p.name)}</button></div>
          ${S.data.event.organizer ? `<p class="sub" style="margin:1.2rem 0 0;font-size:.93rem">¿No te llegó el código? Pídeselo a ${esc(S.data.event.organizer)}.</p>` : ''}
          ${S.demo ? '<p class="demo-note">Estás en la demo. El código de todos es <b>AMIGOS</b>.</p>' : ''}
        </form>
      </main></div>`;
    const form = $('.code-card'), inp = $('.otp input'), cells = $$('.otp .cell'), err = $('.err'), otp = $('.otp'), btn = $('button[type=submit]');
    let busy = false;
    const paint = () => { const v = AS.normCode(inp.value).slice(0, 6); const act = document.activeElement === inp; cells.forEach((c, i) => { c.textContent = v[i] || ''; c.classList.toggle('full', !!v[i]); c.classList.toggle('on', act && i === Math.min(v.length, 5)); }); return v; };
    async function submit(e) {
      if (e) e.preventDefault();
      if (busy) return;
      const v = AS.normCode(inp.value);
      if (v.length < 6) { err.textContent = 'El código tiene 6 caracteres. Te faltan ' + (6 - v.length) + '.'; return; }
      busy = true; btn.disabled = true; btn.innerHTML = '<span class="spin"></span>Comprobando';
      const [payload] = await Promise.all([AS.open(v, p), AS.wait(350)]);
      busy = false; btn.disabled = false; btn.textContent = 'Abrir mi regalo';
      if (!payload || payload.from !== p.id) {
        err.textContent = 'Ese código no es el de ' + p.name + '. Revisa el mensaje que te enviaron.';
        otp.classList.add('bad'); AS.vibrate([40, 40, 40]);
        setTimeout(() => { otp.classList.remove('bad'); inp.value = ''; paint(); inp.focus(); }, 520);
        return;
      }
      S.me = p; S.secret = payload;
      transition(renderGift);
    }
    inp.addEventListener('input', () => { inp.value = AS.normCode(inp.value).slice(0, 6); err.textContent = ''; if (paint().length === 6) submit(); });
    inp.addEventListener('focus', paint); inp.addEventListener('blur', paint);
    otp.addEventListener('click', () => inp.focus());
    form.addEventListener('submit', submit);
    paint();
    if (prefill) { inp.value = AS.normCode(prefill).slice(0, 6); paint(); setTimeout(submit, 500); }
    else setTimeout(() => inp.focus(), 450);
  }

  /* ───────── pantalla: regalo (mantén presionado) ───────── */
  function renderGift() {
    AS.applyTheme(S.data.event.theme);
    app.innerHTML = `<div class="screen">${topbar(true)}
      <main class="gift-step">
        <p class="hello">Hola, ${esc(S.me.name)}</p>
        <h2 tabindex="-1">Tu amigo secreto ya está elegido</h2>
        <button class="gift" type="button" aria-label="Abrir regalo. Mantén presionado, o presiona Enter">
          <span class="halo"></span><span class="box">${GIFT_SVG}</span>
          <svg class="ring" viewBox="0 0 100 100" aria-hidden="true"><circle class="t" cx="50" cy="50" r="48"/><circle class="g" cx="50" cy="50" r="48" pathLength="1"/></svg>
        </button>
        <p class="hold-hint">Mantén presionado el regalo para abrirlo</p>
      </main></div>`;
    const g = $('.gift'), box = $('.box', g), ring = $('.ring .g', g);
    const DUR = 1300; let holding = false, t0 = 0, opened = false, lastTick = -1;
    const setP = (p) => { g.style.setProperty('--p', p); ring.style.strokeDashoffset = 1 - p; };
    const frame = (now) => {
      if (!holding) return;
      const p = Math.min(1, (now - t0) / DUR), amp = p * p * 7;
      setP(p);
      box.style.transform = `translate(${(Math.random() - 0.5) * amp}px,${(Math.random() - 0.5) * amp}px) rotate(${(Math.random() - 0.5) * amp * 0.5}deg) scale(${1 + p * 0.08})`;
      const tk = Math.floor(p * 14); if (tk !== lastTick) { lastTick = tk; AS.sound.tick(tk); if (tk % 3 === 0) AS.vibrate(10); }
      if (p >= 1) { holding = false; open(); return; }
      S.raf = requestAnimationFrame(frame);
    };
    const start = (e) => {
      if (opened) return; AS.sound.prime();
      if (AS.rm()) { open(); return; }
      try { g.setPointerCapture(e.pointerId); } catch (x) {}
      holding = true; t0 = performance.now(); lastTick = -1; g.classList.add('hold'); ring.style.transition = 'none'; box.style.transition = 'none'; S.raf = requestAnimationFrame(frame);
    };
    const stop = () => {
      if (!holding) return; holding = false; cancelAnimationFrame(S.raf); g.classList.remove('hold');
      box.style.transition = 'transform .45s var(--ease)'; box.style.transform = ''; ring.style.transition = 'stroke-dashoffset .35s'; setP(0);
    };
    async function open() {
      if (opened) return; opened = true; g.classList.add('burst'); setP(1);
      const r = g.getBoundingClientRect(); AS.sound.pop(); AS.vibrate([20, 30, 40]); AS.confetti(r.left + r.width / 2, r.top + r.height / 2, { count: 60, power: 0.8, spread: 2 });
      await AS.wait(AS.rm() ? 0 : 560); transition(renderReveal);
    }
    g.addEventListener('pointerdown', start);
    g.addEventListener('pointerup', stop); g.addEventListener('pointercancel', stop); g.addEventListener('lostpointercapture', stop);
    g.addEventListener('contextmenu', (e) => e.preventDefault());
    g.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); AS.sound.prime(); open(); } });
  }

  /* ───────── pantalla: revelado (ruleta) ───────── */
  function buildSeq(target, people, N) {
    const seq = []; let last = null;
    while (seq.length < N - 1) for (const p of AS.shuffle(people)) { if (seq.length >= N - 1) break; if (p.id === last) continue; seq.push(p); last = p.id; }
    if (seq[seq.length - 1].id === target.id) seq[seq.length - 1] = AS.shuffle(people.filter((p) => p.id !== target.id))[0];
    seq.push(target); return seq;
  }
  async function renderReveal() {
    const ppl = S.data.people, target = ppl.find((p) => p.id === S.secret.to), ev = S.data.event;
    const N = AS.rm() ? 2 : 34, seq = buildSeq(target, ppl, N);
    app.innerHTML = `<div class="screen">${topbar(true)}
      <main class="reveal">
        <p class="kicker">Sorteando entre la familia…</p>
        <div class="reel-wrap" aria-hidden="true"><div class="track">${seq.map((p) => `<div class="reel-item"><figure class="polaroid"><img class="pic" src="${p.src}" alt="" decoding="async"><figcaption>${esc(p.name)}</figcaption></figure></div>`).join('')}</div></div>
        <h2 class="nm spinning" aria-live="polite">${esc(seq[0].name)}</h2>
        <div class="after" hidden>
          ${S.secret.hint ? `<div class="hint"><h3>Ideas para su regalo</h3><p>${esc(S.secret.hint)}</p></div>` : '<span></span>'}
          ${facts(ev, false) || '<span></span>'}
          <p class="secret">Es un secreto: no se lo cuentes a nadie.</p>
          <div class="btns"><button class="btn primary" data-a="home">Listo, guardar el secreto</button><button class="btn ghost" data-a="again">${icons.eye}Verlo otra vez</button></div>
        </div>
        <button class="linkbtn skip" data-a="skip">Saltar animación</button>
      </main></div>`;
    const wrap = $('.reel-wrap'), track = $('.track'), nm = $('.nm'), kick = $('.kicker'), after = $('.after'), skip = $('.skip');
    await Promise.all($$('.reel-item img').map((i) => (i.decode ? i.decode().catch(() => {}) : 0)));
    const T = $('.reel-item').offsetHeight, Wh = wrap.offsetHeight, y0 = (Wh - T) / 2, dist = (N - 1) * T, D = AS.rm() ? 1 : 4800;
    let finished = false, lastIdx = -1;
    const finish = async () => {
      if (finished) return; finished = true; cancelAnimationFrame(S.raf); skip.remove();
      track.style.filter = ''; nm.classList.remove('spinning'); nm.textContent = target.name; nm.classList.add('pop');
      kick.textContent = 'Te toca regalarle a';
      wrap.classList.add('landed'); track.style.transition = 'transform .65s var(--ease)'; track.style.transform = `translate3d(0,${-dist}px,0)`;
      AS.sound.chime(); AS.vibrate([30, 40, 30, 40, 60]);
      const r = wrap.getBoundingClientRect(); AS.confetti(r.left + r.width / 2, r.top + r.height * 0.4, { count: 170, power: 1.1, spread: 1.5 });
      setTimeout(() => AS.confetti(r.left + r.width * 0.15, r.top + r.height * 0.6, { count: 60, power: 0.9, spread: 0.8 }), 180);
      setTimeout(() => AS.confetti(r.left + r.width * 0.85, r.top + r.height * 0.6, { count: 60, power: 0.9, spread: 0.8 }), 300);
      await AS.wait(AS.rm() ? 0 : 700);
      track.style.transition = 'none'; track.style.transform = 'none'; $$('.reel-item', track).slice(0, -1).forEach((n) => n.remove());
      wrap.classList.add('done'); after.hidden = false;
      const first = $('.btn.primary', after); first && first.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    };
    skip.addEventListener('click', () => { cancelAnimationFrame(S.raf); track.style.transform = `translate3d(0,${y0 - dist}px,0)`; finish(); });
    if (AS.rm()) { track.style.transform = `translate3d(0,${y0 - dist}px,0)`; return finish(); }
    track.style.transform = `translate3d(0,${y0}px,0)`;
    await AS.wait(300);
    const start = performance.now();
    const frame = (now) => {
      if (finished) return;
      const t = Math.min(1, (now - start) / D), e = 1 - Math.pow(1 - t, 4), pos = e * dist;
      track.style.transform = `translate3d(0,${y0 - pos}px,0)`;
      const v = Math.pow(1 - t, 3) * 4 * dist / D * 1000, bl = Math.min(4, v / 2600);
      track.style.filter = bl > 0.35 ? `blur(${bl.toFixed(2)}px)` : '';
      const idx = Math.min(N - 1, Math.round(pos / T));
      if (idx !== lastIdx) { lastIdx = idx; nm.textContent = seq[idx].name; AS.sound.tick(idx); if (idx % 2 === 0 && t < 0.8) AS.vibrate(6); }
      if (t < 1) S.raf = requestAnimationFrame(frame); else finish();
    };
    S.raf = requestAnimationFrame(frame);
  }

  /* ───────── eventos globales ───────── */
  document.addEventListener('click', async (e) => {
    const card = e.target.closest('.card[data-id]');
    if (card && app.contains(card)) {
      const pol = $('.polaroid', card); pol.style.viewTransitionName = 'who'; AS.sound.prime();
      go('#/yo/' + encodeURIComponent(card.dataset.id)); return;
    }
    const b = e.target.closest('[data-a]'); if (!b || !app.contains(b)) return;
    const a = b.dataset.a;
    if (a === 'sound') { const on = AS.sound.toggle(); b.innerHTML = on ? icons.soundOn : icons.soundOff; b.setAttribute('aria-pressed', on); }
    else if (a === 'home') { S.returnId = S.me ? S.me.id : null; S.me = S.secret = null; go('#/'); }
    else if (a === 'again') transition(renderGift);
    else if (a === 'demo') { b.disabled = true; b.innerHTML = '<span class="spin"></span>Preparando'; await buildDemo(); go('#/', true); }
    else if (a === 'exitdemo') { S.demo = false; await loadData(); go('#/', true); }
  });
  window.addEventListener('hashchange', route);

  (async function boot() {
    try { await document.fonts.ready; } catch (e) {}
    await loadData();
    AS.ambient.start();
    route();
  })();
})();
