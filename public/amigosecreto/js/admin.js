/* Amigo Secreto — panel del organizador (todo ocurre en el navegador, no se envía nada a ningún servidor) */
(function () {
  'use strict';
  const { esc, $, $$, icons } = AS;
  const KEY = 'as.admin.v1', RKEY = 'as.admin.result.v1', SKEY = 'as.admin.site';
  const GC = ['#ff7a7a', '#ffb84d', '#7bdc8e', '#5ec8ff', '#a99bff', '#ff8fd1'];
  const GN = ['rojo', 'naranjo', 'verde', 'celeste', 'violeta', 'rosado'];
  const defaults = () => ({ step: 0, event: { title: 'Amigo Secreto Familia', date: '', budget: '', place: '', note: '', organizer: '', theme: 'pino' }, people: [], dirty: false });
  let S, root, result = null, drawing = false, pendingPhoto = null, saveT = 0;
  const avCache = new Map();

  /* ───────── estado ───────── */
  function load() {
    const d = AS.store.get(KEY) || {};
    S = Object.assign(defaults(), d); S.event = Object.assign(defaults().event, d.event || {}); S.people = d.people || [];
    result = AS.store.get(RKEY);
  }
  function save() {
    clearTimeout(saveT);
    saveT = setTimeout(() => { if (!AS.store.set(KEY, S)) AS.toast('El navegador no pudo guardar el borrador. Usa fotos más livianas.'); }, 250);
  }
  const touch = () => { S.dirty = true; save(); };
  const newPerson = (name, photo) => ({ id: AS.uid(name || 'persona'), name: name || '', photo: photo || '', hint: '', phone: '', group: 0, code: AS.newCode() });
  const avatarFor = (p) => { if (p.photo) return p.photo; const k = p.id + '|' + p.name; if (!avCache.has(k)) avCache.set(k, AS.avatar(p.name || '?')); return avCache.get(k); };
  const sig = (ids) => ids.slice().sort().join('|');
  const ready = () => S.people.length >= 3;
  const hasResult = () => !!(result && result.data && sig(result.ids) === sig(S.people.map((p) => p.id)));
  const site = () => {
    let s = AS.store.get(SKEY);
    if (s == null) s = /^https?:/.test(location.protocol) ? location.origin + location.pathname.replace(/[^/]*$/, '') : '';
    return s;
  };
  const baseUrl = () => { let s = (site() || '').trim(); if (s && !/^https?:\/\//.test(s)) s = 'https://' + s; return s ? s.replace(/#.*$/, '').replace(/\/?$/, '/') : ''; };
  const link = (p) => `${baseUrl()}#/yo/${encodeURIComponent(p.id)}?c=${p.code}`;
  const message = (p) => `🎁 ¡Hola ${p.name}! Ya está listo nuestro amigo secreto.\nDescubre a quién te toca entrando aquí: ${link(p)}\nTu código es ${AS.fmtCode(p.code)}.\nShhh, es un secreto 🤫`;
  const waUrl = (p) => { let d = (p.phone || '').replace(/\D/g, ''); if (d.length === 9 && d[0] === '9') d = '56' + d; return `https://wa.me/${d}?text=${encodeURIComponent(message(p))}`; };

  /* ───────── cascarón ───────── */
  function mount(el) {
    root = el; load(); AS.applyTheme(S.event.theme);
    document.title = 'Panel del organizador';
    root.innerHTML = `<div class="screen adm">
      <header class="topbar"><a class="brand" href="#/">${icons.gift}Amigo secreto</a><a class="btn ghost sm" href="#/">Salir del panel</a></header>
      <h1 tabindex="-1">Panel del organizador</h1>
      <p class="lead">Arma la familia, haz el sorteo y publica un solo archivo. Todo ocurre en tu navegador: las fotos y los nombres no se envían a ningún servidor.</p>
      <nav class="stepper" aria-label="Pasos"></nav>
      <div id="stage"></div>
      <input type="file" id="f-multi" accept="image/*" multiple hidden>
      <input type="file" id="f-dir" webkitdirectory hidden>
      <input type="file" id="f-one" accept="image/*" hidden>
    </div>`;
    renderStepper(); renderStage();
  }
  function renderStepper() {
    const done = [!!S.event.title.trim(), ready(), hasResult()];
    $('.stepper').innerHTML = ['Evento', 'Familia', 'Sorteo'].map((t, i) =>
      `<button data-a="step" data-s="${i}" class="${S.step === i ? 'on' : ''} ${done[i] && S.step !== i ? 'ok' : ''}" ${S.step === i ? 'aria-current="step"' : ''}><span class="n">${done[i] && S.step !== i ? icons.check.replace('class="ic"', 'class="ic" style="width:15px;height:15px"') : i + 1}</span>${t}</button>`).join('');
  }
  function setStep(n) {
    if (n >= 1 && !S.event.title.trim()) { AS.toast('Ponle un nombre al evento.'); n = 0; }
    if (n === 2 && !ready()) { AS.toast('Necesitas al menos 3 personas para sortear.'); n = 1; }
    S.step = n; save(); renderStepper(); renderStage(); window.scrollTo(0, 0);
    if (n === 2 && result && S.dirty && hasResult()) refresh();
  }
  function renderStage() { [stageEvent, stageFamily, stageDraw][S.step](); }

  /* ───────── paso 1: evento ───────── */
  function stageEvent() {
    const e = S.event, f = (k, label, ph, extra, cls) => `<label class="f ${cls || ''}">${label}<input class="in" data-ev="${k}" value="${esc(e[k])}" placeholder="${esc(ph || '')}" ${extra || ''}></label>`;
    $('#stage').innerHTML = `<section class="panel">
      <h2>Datos del evento</h2><p class="sub">Esto es lo que verá la familia en la portada. Solo el nombre es obligatorio.</p>
      <div class="fields">
        ${f('title', 'Nombre del evento', 'Amigo Secreto Familia Rojas', '', 'wide')}
        ${f('date', 'Fecha del intercambio', '', 'type="date"')}
        ${f('budget', 'Presupuesto sugerido', '$15.000')}
        ${f('place', 'Lugar', 'Cena de Navidad en casa de la abuela')}
        ${f('organizer', 'Quién organiza', 'Mamá')}
        <label class="f wide">Mensaje de bienvenida <small>Opcional. Aparece bajo el título.</small><textarea class="in" data-ev="note" rows="2" placeholder="Este año con tope de $15.000. ¡Que nadie se entere!">${esc(e.note)}</textarea></label>
      </div></section>
      <section class="panel"><h2>Estilo</h2><p class="sub">Cambia la paleta de toda la experiencia. Se ve al instante.</p>
        <div class="themes">${Object.entries(AS.THEMES).map(([k, t]) => `<button data-a="theme" data-t="${k}" aria-pressed="${e.theme === k}"><span class="sw">${t.sw.map((c) => `<i style="background:${c}"></i>`).join('')}</span>${t.name}</button>`).join('')}</div>
      </section>
      <div class="bar"><button class="linkbtn danger" data-a="reset">Borrar todo y empezar de nuevo</button><button class="btn primary" data-a="next">Siguiente: la familia</button></div>`;
  }

  /* ───────── paso 2: familia ───────── */
  function stageFamily() {
    $('#stage').innerHTML = `<section class="panel">
      <h2>La familia</h2><p class="sub">Suma a todos los que participan. Si a alguien le falta la foto, se le crea una con su inicial.</p>
      <div class="drop" id="drop">
        <div class="big">Suelta aquí las fotos de la familia</div>
        <p>Pon como nombre de cada archivo el de la persona (<b>Tía Carmen.jpg</b>) y lo detecto solo. Puedes soltar muchas a la vez.</p>
        <div class="row"><button class="btn primary" data-a="pick">${icons.upload}Elegir fotos</button><button class="btn ghost" data-a="pickdir">Elegir una carpeta</button><button class="btn ghost" data-a="addone">${icons.plus}Agregar sin foto</button><button class="btn ghost" data-a="sample">Cargar familia de ejemplo</button></div>
      </div>
      <div id="people"></div></section>
      <div class="bar" id="famBar"></div>`;
    renderPeople();
  }
  function renderPeople() {
    const box = $('#people'); if (!box) return;
    const ppl = S.people;
    box.innerHTML = ppl.length ? `<div class="tip">${icons.sparkle}<span>El punto de color de cada tarjeta sirve para evitar cruces: quienes compartan color no se regalan entre sí (parejas, hermanos). Déjalo sin color si no aplica.</span></div>
      <div class="pgrid">${ppl.map((p) => `<article class="pcard" data-id="${esc(p.id)}">
        <button class="ph" data-a="photo" aria-label="Cambiar la foto de ${esc(p.name || 'esta persona')}"><figure class="polaroid">${p.photo ? `<img class="pic" src="${p.photo}" alt="">` : '<div class="nophoto">Sin foto</div>'}</figure><span class="cam">${icons.cam}</span></button>
        <div class="col">
          <input class="in nm" data-p="name" value="${esc(p.name)}" placeholder="Nombre" aria-label="Nombre">
          <textarea class="in" data-p="hint" rows="2" placeholder="Gustos o ideas de regalo (opcional)" aria-label="Ideas de regalo">${esc(p.hint)}</textarea>
          <input class="in" data-p="phone" inputmode="tel" value="${esc(p.phone)}" placeholder="WhatsApp, para enviarle el código (opcional)" aria-label="WhatsApp">
          <div class="groups" role="radiogroup" aria-label="Grupo"><span class="lbl">Grupo</span>${[0, 1, 2, 3, 4, 5, 6].map((g) => `<button data-a="group" data-g="${g}" role="radio" aria-checked="${p.group === g}" aria-label="${g ? GN[g - 1] : 'Sin grupo'}" title="${g ? GN[g - 1] : 'Sin grupo'}" style="${g ? `--c:${GC[g - 1]}` : ''}"></button>`).join('')}</div>
        </div>
        <button class="x" data-a="del" aria-label="Quitar a ${esc(p.name || 'esta persona')}">${icons.x}</button></article>`).join('')}</div>` : '';
    const n = ppl.length;
    $('#famBar').innerHTML = `<button class="btn ghost" data-a="prev">Atrás</button><span class="l">${n === 0 ? 'Aún no hay nadie' : n + (n === 1 ? ' persona' : ' personas') + (n < 3 ? ', necesitas al menos 3' : '')}</span><button class="btn primary" data-a="next" ${n < 3 ? 'disabled' : ''}>Siguiente: el sorteo</button>`;
    renderStepper();
  }
  const CAMERA_NAME = /^(img|dsc|dscn|pxl|photo|foto|image|imagen|whatsapp|screenshot|captura|picture)[\s\d]*/i;
  async function addFiles(list) {
    const files = [...list].filter((f) => /^image\//.test(f.type) || /\.(jpe?g|png|webp|gif|heic|avif)$/i.test(f.name));
    if (!files.length) return AS.toast('No encontré imágenes en lo que elegiste.');
    AS.toast('Procesando ' + files.length + (files.length === 1 ? ' foto…' : ' fotos…'));
    let added = 0, filled = 0, failed = 0;
    for (const f of files.sort((a, b) => a.name.localeCompare(b.name, 'es', { numeric: true }))) {
      try {
        const photo = await AS.fileToPhoto(f); let name = AS.nameFromFile(f.name);
        if (CAMERA_NAME.test(name) || /^[\d\s]+$/.test(name)) name = '';
        const ex = name && S.people.find((p) => AS.slug(p.name) === AS.slug(name));
        if (ex) { ex.photo = photo; filled++; } else { S.people.push(newPerson(name, photo)); added++; }
      } catch (e) { failed++; }
    }
    touch(); renderPeople();
    AS.toast([added && `Agregué ${added}`, filled && `Actualicé ${filled} foto${filled > 1 ? 's' : ''}`, failed && `${failed} no se pudo${failed > 1 ? 'ieron' : ''} leer (¿HEIC? conviértela a JPG)`].filter(Boolean).join(', ') + '.');
    const empty = $$('.pcard').find((c) => !c.querySelector('[data-p=name]').value); if (empty) empty.querySelector('[data-p=name]').focus();
  }
  async function addSample() {
    try { await document.fonts.load('48px "Young Serif"'); } catch (e) {}
    AS.DEMO_PEOPLE.forEach(([name, hint]) => { if (!S.people.some((p) => p.name === name)) { const p = newPerson(name, AS.avatar(name)); p.hint = hint; S.people.push(p); } });
    touch(); renderPeople(); AS.toast('Listo, cargué una familia de ejemplo.');
  }

  /* ───────── paso 3: sorteo ───────── */
  function problems() {
    const out = [], ppl = S.people, n = ppl.length;
    out.push([n >= 3 ? 'ok' : 'bad', n >= 3 ? `${n} personas participan` : 'Necesitas al menos 3 personas']);
    const noName = ppl.filter((p) => !p.name.trim()).length;
    out.push([noName ? 'bad' : 'ok', noName ? `Falta el nombre de ${noName} persona${noName > 1 ? 's' : ''}` : 'Todos tienen nombre']);
    const names = ppl.map((p) => AS.slug(p.name)).filter(Boolean); const dup = names.length - new Set(names).size;
    if (dup) out.push(['warn', 'Hay nombres repetidos. Agrega el apellido para distinguirlos.']);
    const np = ppl.filter((p) => !p.photo).length;
    out.push([np ? 'warn' : 'ok', np ? `${np} sin foto: se usará una con su inicial` : 'Todos tienen foto']);
    const cnt = {}; ppl.forEach((p) => p.group && (cnt[p.group] = (cnt[p.group] || 0) + 1));
    const big = Object.entries(cnt).find(([, c]) => c > n / 2);
    if (big) out.push(['bad', `El grupo ${GN[big[0] - 1]} tiene demasiada gente para sortear sin cruces`]);
    return out;
  }
  function stageDraw() {
    const probs = problems(), blocked = probs.some((x) => x[0] === 'bad'), has = hasResult();
    const stale = result && result.data && !has;
    let html = '';
    if (!has) {
      html += `<section class="panel"><h2>Todo listo para sortear</h2>
        <p class="sub">El sorteo se hace aquí mismo y queda cifrado. No se muestra en pantalla, así que la sorpresa también es tuya.</p>
        ${stale ? `<div class="tip">${icons.sparkle}<span>Cambió la lista de personas desde el último sorteo, así que hay que hacerlo de nuevo y volver a subir el archivo.</span></div><div class="mt"></div>` : ''}
        <ul class="checks">${probs.map(([k, t]) => `<li class="${k}">${icons[k === 'ok' ? 'check' : 'x']}<span>${esc(t)}</span></li>`).join('')}</ul>
        <div id="drawzone"><button class="btn primary" data-a="draw" ${blocked ? 'disabled' : ''}>${icons.gift}Hacer el sorteo</button></div></section>
        <div class="bar"><button class="btn ghost" data-a="prev">Atrás</button></div>`;
    } else {
      const ppl = S.people, b = baseUrl();
      html += `<section class="panel">
        <div class="done-head">${icons.check}<div><h2>El sorteo está listo</h2><p class="sub" style="margin:0">Verificado: nadie se regala a sí mismo y cada persona da y recibe un solo regalo.</p></div></div>
        <ol class="how">
          <li><b>Descarga el archivo del sorteo</b><span>Contiene la familia, las fotos y los resultados cifrados.</span><div class="mt"><button class="btn primary" data-a="dl">${icons.down}Descargar sorteo.json</button></div></li>
          <li><b>Publícalo en tu sitio</b><span>Guárdalo como <code>public/amigosecreto/data/sorteo.json</code> en tu repositorio, reemplazando el que hay, y haz commit y push. Netlify lo publica solo en un minuto.</span></li>
          <li><b>Avisa a cada persona</b><span>Cada una recibe un link personal con su código. Abajo puedes enviarlos por WhatsApp con un toque.</span></li>
        </ol></section>
        <section class="panel"><h2>Mensajes para la familia</h2>
          <label class="f">Dirección de tu sitio <small>Con la dirección completa del sitio publicado.</small><input class="in" id="site" value="${esc(site())}" placeholder="https://www.mandakovic.cl/amigosecreto/"></label>
          <div class="bar" style="margin-top:1rem"><span class="l">${b ? '' : 'Escribe la dirección para armar los links.'}</span><div style="display:flex;gap:.6rem;flex-wrap:wrap"><button class="btn ghost sm" data-a="copyall">${icons.copy}Copiar todos</button><button class="btn ghost sm" data-a="codes">${icons.down}Descargar códigos</button></div></div>
          <div class="share">${ppl.map((p) => `<div class="srow" data-id="${esc(p.id)}"><img src="${avatarFor(p)}" alt=""><div><span class="nmx">${esc(p.name)}</span><span class="cd">${AS.fmtCode(p.code)}</span></div>
            <div class="acts"><a class="btn primary sm" data-a="wa" href="${b ? waUrl(p) : '#'}" target="_blank" rel="noopener" ${b ? '' : 'aria-disabled="true" style="opacity:.45;pointer-events:none"'}>${icons.send}WhatsApp</a><button class="btn ghost sm" data-a="copy">${icons.copy}Copiar mensaje</button></div></div>`).join('')}</div>
        </section>
        <div class="bar"><button class="btn ghost" data-a="prev">Atrás</button><button class="linkbtn danger" data-a="redraw">Rehacer el sorteo</button></div>`;
    }
    $('#stage').innerHTML = html;
  }
  async function sealAll(map) {
    const by = Object.fromEntries(S.people.map((p) => [p.id, p]));
    const people = await Promise.all(S.people.map(async (p) => ({ id: p.id, name: p.name.trim(), photo: avatarFor(p), ...(await AS.seal(p.code, { from: p.id, to: map[p.id], hint: (by[map[p.id]].hint || '').trim() })) })));
    return { v: 1, event: { ...S.event, title: S.event.title.trim() }, people, createdAt: new Date().toISOString() };
  }
  async function verify(data) {
    const by = Object.fromEntries(S.people.map((p) => [p.id, p])), tos = new Set();
    for (const rec of data.people) { const pl = await AS.open(by[rec.id].code, rec); if (!pl || pl.from !== rec.id || pl.to === rec.id || !by[pl.to]) return false; if (by[rec.id].group && by[rec.id].group === by[pl.to].group) return false; tos.add(pl.to); }
    return tos.size === data.people.length;
  }
  const persistResult = () => { if (!AS.store.set(RKEY, result)) AS.toast('Descarga el archivo ahora: el navegador no pudo guardarlo para después.'); };
  async function doDraw() {
    if (drawing) return; drawing = true;
    const zone = $('#drawzone');
    zone.innerHTML = `<div class="shuffle" aria-live="polite">${AS.shuffle(S.people).slice(0, 8).map((p, i) => `<img style="--i:${i}" src="${avatarFor(p)}" alt="">`).join('')}</div><p class="sub" style="text-align:center">Mezclando…</p>`;
    try {
      const map = AS.draw(S.people.map((p) => ({ id: p.id, group: p.group })));
      if (!map) { AS.toast('Con esos grupos no hay forma de sortear. Quita algún color e inténtalo de nuevo.'); drawing = false; return stageDraw(); }
      const [data] = await Promise.all([sealAll(map), AS.wait(1700)]);
      if (!(await verify(data))) throw new Error('verify');
      result = { at: Date.now(), ids: S.people.map((p) => p.id), data }; S.dirty = false; persistResult(); save();
      drawing = false; renderStepper(); stageDraw(); window.scrollTo(0, 0);
      const r = $('.done-head .ic').getBoundingClientRect(); AS.confetti(r.left + r.width / 2, r.top + 20, { count: 120 });
    } catch (e) { drawing = false; AS.toast('Algo falló al sortear. Inténtalo de nuevo.'); stageDraw(); }
  }
  async function refresh() { // reaplica nombres, fotos, ideas y datos del evento sin cambiar quién le toca a quién
    try {
      const by = Object.fromEntries(S.people.map((p) => [p.id, p])), map = {};
      for (const rec of result.data.people) { const pl = await AS.open(by[rec.id].code, rec); if (!pl) throw 0; map[rec.id] = pl.to; }
      result.data = await sealAll(map); S.dirty = false; persistResult(); save();
    } catch (e) { AS.toast('No pude actualizar el archivo. Rehaz el sorteo.'); }
  }

  /* ───────── eventos ───────── */
  const pid = (el) => { const c = el.closest('[data-id]'); return c && S.people.find((p) => p.id === c.dataset.id); };
  document.addEventListener('input', (e) => {
    if (!root || !root.contains(e.target)) return;
    const t = e.target;
    if (t.dataset.ev) { S.event[t.dataset.ev] = t.value; touch(); }
    else if (t.dataset.p) { const p = pid(t); if (p) { p[t.dataset.p] = t.value; touch(); if (t.dataset.p === 'name') { avCache.clear(); renderStepper(); } } }
    else if (t.id === 'site') { AS.store.set(SKEY, t.value); }
  });
  document.addEventListener('change', async (e) => {
    if (!root || !root.contains(e.target)) return;
    const t = e.target;
    if (t.id === 'f-multi' || t.id === 'f-dir') { const fs = t.files; await addFiles(fs); t.value = ''; }
    else if (t.id === 'f-one') {
      const f = t.files[0]; t.value = ''; const p = S.people.find((x) => x.id === pendingPhoto); if (!f || !p) return;
      try { p.photo = await AS.fileToPhoto(f); if (!p.name) p.name = AS.nameFromFile(f.name).replace(CAMERA_NAME, ''); touch(); renderPeople(); } catch (x) { AS.toast('No pude leer esa imagen. Prueba con un JPG o PNG.'); }
    } else if (t.id === 'site') { AS.store.set(SKEY, t.value); stageDraw(); }
  });
  document.addEventListener('click', async (e) => {
    if (!root || !root.contains(e.target)) return;
    const b = e.target.closest('[data-a]'); if (!b) return; const a = b.dataset.a;
    if (a === 'wa') return; // es un link normal
    if (a === 'step') setStep(+b.dataset.s);
    else if (a === 'next') setStep(S.step + 1);
    else if (a === 'prev') setStep(S.step - 1);
    else if (a === 'theme') { S.event.theme = b.dataset.t; AS.applyTheme(S.event.theme); touch(); $$('.themes button').forEach((x) => x.setAttribute('aria-pressed', x === b)); }
    else if (a === 'reset') { if (confirm('Se borrarán la familia, las fotos y el sorteo de este navegador. ¿Seguro?')) { AS.store.del(KEY); AS.store.del(RKEY); load(); AS.applyTheme(S.event.theme); renderStepper(); renderStage(); window.scrollTo(0, 0); } }
    else if (a === 'pick') $('#f-multi').click();
    else if (a === 'pickdir') $('#f-dir').click();
    else if (a === 'addone') { S.people.push(newPerson('', '')); touch(); renderPeople(); const l = $$('.pcard').pop(); l && l.querySelector('[data-p=name]').focus(); }
    else if (a === 'sample') addSample();
    else if (a === 'photo') { const p = pid(b); if (p) { pendingPhoto = p.id; $('#f-one').click(); } }
    else if (a === 'del') { const p = pid(b); if (p && (!p.name || confirm(`¿Quitar a ${p.name}?`))) { S.people = S.people.filter((x) => x !== p); touch(); renderPeople(); } }
    else if (a === 'group') { const p = pid(b); if (p) { p.group = +b.dataset.g; touch(); $$('[data-a=group]', b.parentNode).forEach((x) => x.setAttribute('aria-checked', x === b)); } }
    else if (a === 'draw') doDraw();
    else if (a === 'redraw') { if (confirm('Se hará un sorteo nuevo y tendrás que volver a subir el archivo. Si alguien ya abrió su regalo, verá otro resultado. ¿Continuar?')) { result = null; AS.store.del(RKEY); renderStepper(); stageDraw(); } }
    else if (a === 'dl') { if (S.dirty) await refresh(); AS.download('sorteo.json', JSON.stringify(result.data), 'application/json'); AS.toast('Descargado. Ahora ponlo en la carpeta data.'); }
    else if (a === 'copy') { const p = pid(b); if (p && baseUrl()) { await AS.copy(message(p)); AS.toast('Mensaje de ' + p.name + ' copiado.'); } else AS.toast('Escribe primero la dirección de tu sitio.'); }
    else if (a === 'copyall') { if (!baseUrl()) return AS.toast('Escribe primero la dirección de tu sitio.'); await AS.copy(S.people.map((p) => `— ${p.name} —\n${message(p)}`).join('\n\n')); AS.toast('Copiados todos los mensajes.'); }
    else if (a === 'codes') AS.download('codigos-PRIVADO.txt', 'Códigos del amigo secreto. No lo compartas.\n\n' + S.people.map((p) => `${p.name}\t${AS.fmtCode(p.code)}\t${baseUrl() ? link(p) : ''}`).join('\n'), 'text/plain');
  });
  // arrastrar y soltar fotos
  ['dragover', 'drop'].forEach((ev) => window.addEventListener(ev, (e) => { if (root && $('.adm', root)) e.preventDefault(); }));
  document.addEventListener('dragover', (e) => { const d = e.target.closest && e.target.closest('#drop'); $$('#drop').forEach((x) => x.classList.toggle('over', x === d)); });
  document.addEventListener('dragleave', (e) => { if (!e.relatedTarget) $$('#drop').forEach((x) => x.classList.remove('over')); });
  document.addEventListener('drop', (e) => { const d = e.target.closest && e.target.closest('#drop'); $$('#drop').forEach((x) => x.classList.remove('over')); if (d && e.dataTransfer.files.length) addFiles(e.dataTransfer.files); });

  AS.admin = { mount };
})();
