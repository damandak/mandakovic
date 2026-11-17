/* Amigo Secreto — núcleo compartido (cifrado, sorteo, avatares, confeti, sonido).
   Scripts clásicos (sin módulos) para que el panel funcione incluso abriendo index.html con doble clic. */
(function () {
  'use strict';
  const AS = (window.AS = {});

  /* ───────── utilidades ───────── */
  AS.ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'; // sin 0/O/1/I/L para evitar confusiones
  AS.esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  AS.$ = (s, r) => (r || document).querySelector(s);
  AS.$$ = (s, r) => Array.from((r || document).querySelectorAll(s));
  AS.rm = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  AS.wait = (ms) => new Promise((r) => setTimeout(r, ms));
  AS.rand = (n) => { const a = new Uint32Array(1); crypto.getRandomValues(a); return a[0] % n; };
  AS.shuffle = (arr) => { const a = arr.slice(); for (let i = a.length - 1; i > 0; i--) { const j = AS.rand(i + 1); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  AS.normCode = (s) => String(s || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
  AS.fmtCode = (c) => (c.length > 3 ? c.slice(0, 3) + '-' + c.slice(3) : c);
  AS.newCode = () => { let s = ''; for (let i = 0; i < 6; i++) s += AS.ALPHABET[AS.rand(AS.ALPHABET.length)]; return s; };
  AS.slug = (n) => String(n).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'persona';
  AS.uid = (n) => AS.slug(n) + '-' + Math.random().toString(36).slice(2, 5);
  AS.store = {
    get(k) { try { return JSON.parse(localStorage.getItem(k)); } catch (e) { return null; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch (e) { return false; } },
    del(k) { try { localStorage.removeItem(k); } catch (e) {} },
  };
  const b64 = {
    enc: (buf) => { let s = ''; const b = new Uint8Array(buf); for (let i = 0; i < b.length; i++) s += String.fromCharCode(b[i]); return btoa(s); },
    dec: (str) => Uint8Array.from(atob(str), (c) => c.charCodeAt(0)),
  };

  AS.fmtDate = (iso) => {
    if (!iso) return '';
    const [y, m, d] = iso.split('-').map(Number);
    return new Date(y, m - 1, d).toLocaleDateString('es-CL', { day: 'numeric', month: 'long' });
  };
  AS.daysUntil = (iso) => {
    if (!iso) return null;
    const [y, m, d] = iso.split('-').map(Number);
    const t = new Date(); t.setHours(0, 0, 0, 0);
    return Math.round((new Date(y, m - 1, d) - t) / 86400000);
  };
  AS.countdown = (iso) => {
    const n = AS.daysUntil(iso);
    if (n == null) return '';
    if (n > 1) return `faltan ${n} días`;
    if (n === 1) return 'es mañana';
    if (n === 0) return 'es hoy';
    return 'ya pasó';
  };

  AS.toast = (msg) => {
    const t = document.getElementById('toast'); if (!t) return;
    t.textContent = msg; t.classList.add('show');
    clearTimeout(t._t); t._t = setTimeout(() => t.classList.remove('show'), 2800);
  };
  AS.copy = async (text) => {
    try { await navigator.clipboard.writeText(text); }
    catch (e) { const ta = document.createElement('textarea'); ta.value = text; ta.style.cssText = 'position:fixed;opacity:0'; document.body.appendChild(ta); ta.select(); document.execCommand('copy'); ta.remove(); }
  };
  AS.download = (name, text, mime) => {
    const url = URL.createObjectURL(new Blob([text], { type: mime || 'application/octet-stream' }));
    const a = document.createElement('a'); a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  };
  AS.vibrate = (ms) => { try { navigator.vibrate && navigator.vibrate(ms); } catch (e) {} };

  /* ───────── temas ───────── */
  AS.THEMES = {
    pino:      { name: 'Pino',      sw: ['#0d2620', '#e04a5f', '#ffd48a'] },
    medianoche:{ name: 'Medianoche',sw: ['#0b1230', '#ffc857', '#9fc2ff'] },
    frambuesa: { name: 'Frambuesa', sw: ['#2a0f26', '#ff7aa8', '#ffd6a5'] },
    cobre:     { name: 'Cobre',     sw: ['#16181a', '#e08a4c', '#f5c9a3'] },
  };
  AS.applyTheme = (t) => { document.documentElement.dataset.theme = AS.THEMES[t] ? t : 'pino'; };

  /* ───────── íconos ───────── */
  const ic = (d, extra) => `<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" ${extra || ''}>${d}</svg>`;
  AS.icons = {
    gift: ic('<rect x="3" y="8" width="18" height="4" rx="1"/><path d="M12 8v13M5 12v8a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-8M7.5 8a2.5 2.5 0 1 1 0-5C10 3 12 8 12 8s2-5 4.5-5a2.5 2.5 0 1 1 0 5"/>'),
    cal: ic('<rect x="3" y="5" width="18" height="16" rx="3"/><path d="M8 3v4M16 3v4M3 10h18"/>'),
    pin: ic('<path d="M12 21s7-6.2 7-11a7 7 0 1 0-14 0c0 4.8 7 11 7 11z"/><circle cx="12" cy="10" r="2.5"/>'),
    users: ic('<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c.6-3.6 3.2-5.5 6.5-5.5s5.9 1.9 6.5 5.5"/><path d="M16 4.7a3.5 3.5 0 0 1 0 6.6M18.5 14.8c1.6.7 2.7 2.3 3 5.2"/>'),
    soundOn: ic('<path d="M4 9.5v5h3.5L12 18.5v-13L7.5 9.5z"/><path d="M15.5 9a4 4 0 0 1 0 6M18 6.5a7.5 7.5 0 0 1 0 11"/>'),
    soundOff: ic('<path d="M4 9.5v5h3.5L12 18.5v-13L7.5 9.5z"/><path d="M16 9.5l5 5M21 9.5l-5 5"/>'),
    cam: ic('<path d="M4 8h3l1.5-2h7L17 8h3a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1z"/><circle cx="12" cy="13.5" r="3.5"/>'),
    x: ic('<path d="M6 6l12 12M18 6L6 18"/>'),
    check: ic('<path d="M5 12.5l4.5 4.5L19 7.5"/>'),
    back: ic('<path d="M15 5l-7 7 7 7"/>'),
    plus: ic('<path d="M12 5v14M5 12h14"/>'),
    upload: ic('<path d="M12 16V4M7 9l5-5 5 5M4 16v3a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-3"/>'),
    down: ic('<path d="M12 4v12M7 11l5 5 5-5M4 20h16"/>'),
    copy: ic('<rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V6a2 2 0 0 1 2-2h9"/>'),
    send: ic('<path d="M21 3L10 14M21 3l-7 18-4-7-7-4z"/>'),
    eye: ic('<path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>'),
    refresh: ic('<path d="M20 11a8 8 0 0 0-14.5-3.5L4 9M4 4v5h5M4 13a8 8 0 0 0 14.5 3.5L20 15M20 20v-5h-5"/>'),
    shield: ic('<path d="M12 3l8 3v6c0 4.5-3.2 8-8 9-4.8-1-8-4.5-8-9V6z"/><path d="M8.5 12l2.5 2.5L15.5 10"/>'),
    sparkle: ic('<path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z"/><path d="M19 17v4M17 19h4"/>'),
  };

  /* ───────── cifrado: PBKDF2 + AES-GCM ─────────
     Cada persona recibe un código. Con ese código se descifra SOLO su asignación.
     El archivo sorteo.json es público para quien tenga el link, pero no revela a nadie. */
  AS.ITER = 250000;
  async function deriveKey(code, salt, iter) {
    const base = await crypto.subtle.importKey('raw', new TextEncoder().encode(AS.normCode(code)), 'PBKDF2', false, ['deriveKey']);
    return crypto.subtle.deriveKey({ name: 'PBKDF2', salt, iterations: iter, hash: 'SHA-256' }, base, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
  }
  AS.seal = async (code, payload, iter) => {
    iter = iter || AS.ITER;
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const key = await deriveKey(code, salt, iter);
    const ct = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, new TextEncoder().encode(JSON.stringify(payload)));
    return { iter, salt: b64.enc(salt), iv: b64.enc(iv), ct: b64.enc(ct) };
  };
  AS.open = async (code, rec) => {
    try {
      const key = await deriveKey(code, b64.dec(rec.salt), rec.iter || AS.ITER);
      const pt = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: b64.dec(rec.iv) }, key, b64.dec(rec.ct));
      return JSON.parse(new TextDecoder().decode(pt));
    } catch (e) { return null; }
  };

  /* ───────── sorteo ─────────
     Un único ciclo (A→B→C→…→A): nadie se regala a sí mismo, no hay intercambios A↔B
     y se respetan los grupos (misma marca de color = no se regalan entre sí). */
  AS.draw = (list) => {
    const n = list.length; if (n < 3) return null;
    const ok = (a, b) => a.id !== b.id && !(a.group && a.group === b.group);
    for (let attempt = 0; attempt < 60; attempt++) {
      const order = [list[AS.rand(n)]]; const used = new Set([order[0].id]); let steps = 0;
      const dfs = () => {
        if (++steps > 30000) return false;
        if (order.length === n) return ok(order[n - 1], order[0]);
        const last = order[order.length - 1];
        for (const c of AS.shuffle(list.filter((p) => !used.has(p.id) && ok(last, p)))) {
          order.push(c); used.add(c.id);
          if (dfs()) return true;
          order.pop(); used.delete(c.id);
        }
        return false;
      };
      if (dfs()) { const map = {}; order.forEach((p, i) => (map[p.id] = order[(i + 1) % n].id)); return map; }
    }
    return null;
  };

  /* ───────── fotos y avatares ───────── */
  AS.fileToPhoto = async (file, size) => {
    size = size || 480;
    let src, w, h;
    try { src = await createImageBitmap(file, { imageOrientation: 'from-image' }); w = src.width; h = src.height; }
    catch (e) {
      src = await new Promise((res, rej) => { const u = URL.createObjectURL(file); const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = u; });
      w = src.naturalWidth; h = src.naturalHeight;
    }
    const s = Math.min(w, h), sx = (w - s) / 2, sy = h > w ? (h - s) * 0.2 : 0; // en fotos verticales, la cara suele estar arriba
    const cv = document.createElement('canvas'); cv.width = cv.height = size;
    const cx = cv.getContext('2d'); cx.imageSmoothingQuality = 'high';
    cx.drawImage(src, sx, sy, s, s, 0, 0, size, size);
    return cv.toDataURL('image/jpeg', 0.82);
  };
  AS.nameFromFile = (fname) => {
    let n = fname.replace(/\.[a-z0-9]+$/i, '').replace(/[_\-]+/g, ' ').replace(/\s+/g, ' ').trim();
    if (n === n.toLowerCase()) n = n.replace(/(^|\s)(\S)/g, (m, a, b) => a + b.toUpperCase());
    return n;
  };
  const PAIRS = [['#ff8a5c', '#e0457b'], ['#ffcf6b', '#ef8a3d'], ['#7ad7a5', '#2f9e8f'], ['#7bb8ff', '#5a6cf0'], ['#c59bff', '#8a5cf0'], ['#ff9bc2', '#e0558f'], ['#9be0e6', '#4a9fb5'], ['#f5c27a', '#b9744a']];
  AS.avatar = (name, size) => {
    size = size || 480; let h = 0; for (const ch of name) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
    const [a, b] = PAIRS[h % PAIRS.length];
    const cv = document.createElement('canvas'); cv.width = cv.height = size; const c = cv.getContext('2d');
    const g = c.createLinearGradient(0, 0, size, size); g.addColorStop(0, a); g.addColorStop(1, b);
    c.fillStyle = g; c.fillRect(0, 0, size, size);
    c.fillStyle = 'rgba(255,255,255,.16)'; c.beginPath(); c.arc(size * 0.2, size * 0.1, size * 0.42, 0, 7); c.fill();
    c.fillStyle = 'rgba(0,0,0,.12)'; c.beginPath(); c.arc(size * 0.95, size * 1.0, size * 0.5, 0, 7); c.fill();
    const words = name.trim().split(/\s+/); const ini = (words[words.length - 1] || '?')[0].toUpperCase();
    c.fillStyle = 'rgba(255,255,255,.94)'; c.textAlign = 'center'; c.textBaseline = 'middle';
    c.font = `${size * 0.46}px "Young Serif", Georgia, serif`; c.fillText(ini, size / 2, size * 0.54);
    return cv.toDataURL('image/jpeg', 0.85);
  };
  AS.DEMO_PEOPLE = [
    ['Abuela Rosa', 'Le encantan los chocolates, los chalecos de lana y los libros de crucigramas.'],
    ['Tío Pancho', 'Café de grano, algo para el asado o una buena botella de vino.'],
    ['Cami', 'Todo lo de plantas, libretas bonitas y velas aromáticas.'],
    ['Vicho', 'Videojuegos, zapatillas talla 42 y cualquier cosa de Colo-Colo.'],
    ['Tía Marta', 'Té, tazas con diseño y un buen libro de misterio.'],
    ['Nico', 'Auriculares, música en vinilo y snacks raros.'],
    ['Javi', 'Juegos de mesa, rompecabezas y stickers.'],
    ['Fran', 'Maquillaje, cosas para el pelo y pijamas calentitos.'],
  ];

  /* ───────── sonido (WebAudio, muy suave) ───────── */
  let actx = null;
  const ac = () => { if (!actx) { const C = window.AudioContext || window.webkitAudioContext; if (C) actx = new C(); } if (actx && actx.state === 'suspended') actx.resume(); return actx; };
  AS.sound = {
    on: AS.store.get('as.sound') !== false,
    toggle() { this.on = !this.on; AS.store.set('as.sound', this.on); if (this.on) this.tick(1); return this.on; },
    prime() { if (this.on) ac(); },
    _note(freq, t0, dur, type, vol) {
      const c = ac(); if (!c) return;
      const o = c.createOscillator(), g = c.createGain(); o.type = type; o.frequency.value = freq;
      const t = c.currentTime + t0; g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.006); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.connect(g).connect(c.destination); o.start(t); o.stop(t + dur + 0.05);
    },
    tick(i) { if (!this.on) return; this._note(820 + ((i || 0) % 6) * 70, 0, 0.05, 'triangle', 0.05); },
    pop() {
      if (!this.on) return; const c = ac(); if (!c) return;
      const o = c.createOscillator(), g = c.createGain(); o.type = 'sine'; o.frequency.setValueAtTime(260, c.currentTime); o.frequency.exponentialRampToValueAtTime(60, c.currentTime + 0.28);
      g.gain.setValueAtTime(0.22, c.currentTime); g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + 0.3);
      o.connect(g).connect(c.destination); o.start(); o.stop(c.currentTime + 0.35);
    },
    chime() { if (!this.on) return; [784, 988, 1175, 1568].forEach((f, i) => this._note(f, i * 0.09, 1.2, 'sine', 0.07)); },
  };

  /* ───────── confeti ───────── */
  let ccv, cctx, parts = [], craf = 0;
  const ensureCv = () => {
    if (ccv) return;
    ccv = document.createElement('canvas'); ccv.id = 'confetti'; ccv.setAttribute('aria-hidden', 'true');
    document.body.appendChild(ccv); cctx = ccv.getContext('2d');
    const fit = () => { const d = Math.min(devicePixelRatio || 1, 2); ccv.width = innerWidth * d; ccv.height = innerHeight * d; cctx.setTransform(d, 0, 0, d, 0, 0); };
    fit(); addEventListener('resize', fit);
  };
  const loop = () => {
    cctx.clearRect(0, 0, innerWidth, innerHeight);
    parts = parts.filter((p) => p.y < innerHeight + 40 && p.life < 300);
    for (const p of parts) {
      p.vy += 0.26; p.vx *= 0.992; p.vy *= 0.996; p.x += p.vx; p.y += p.vy; p.rot += p.vr; p.life++;
      cctx.save(); cctx.translate(p.x, p.y); cctx.rotate(p.rot);
      cctx.globalAlpha = Math.max(0, Math.min(1, (300 - p.life) / 80));
      cctx.fillStyle = p.color;
      if (p.shape) { cctx.beginPath(); cctx.arc(0, 0, p.w / 2, 0, 7); cctx.fill(); } else cctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h * Math.abs(Math.cos(p.life * 0.08)) + 1);
      cctx.restore();
    }
    if (parts.length) craf = requestAnimationFrame(loop); else { craf = 0; cctx.clearRect(0, 0, innerWidth, innerHeight); }
  };
  AS.confetti = (x, y, o) => {
    if (AS.rm()) return; o = o || {}; ensureCv();
    const cs = getComputedStyle(document.documentElement);
    const colors = [cs.getPropertyValue('--accent'), cs.getPropertyValue('--gold'), cs.getPropertyValue('--glow'), '#ffffff', cs.getPropertyValue('--paper')].map((s) => s.trim() || '#fff');
    const n = o.count || 140;
    for (let i = 0; i < n; i++) {
      const ang = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI * (o.spread || 1.1), sp = (6 + Math.random() * 10) * (o.power || 1);
      parts.push({ x, y, vx: Math.cos(ang) * sp, vy: Math.sin(ang) * sp, w: 6 + Math.random() * 7, h: 8 + Math.random() * 9, rot: Math.random() * 6, vr: (Math.random() - 0.5) * 0.4, color: colors[i % colors.length], life: 0, shape: Math.random() < 0.25 });
    }
    if (!craf) craf = requestAnimationFrame(loop);
  };

  /* ───────── polvo de luz (fondo) ───────── */
  AS.ambient = (() => {
    let cv, c, motes = [], raf = 0, on = false;
    const fit = () => { const d = Math.min(devicePixelRatio || 1, 2); cv.width = innerWidth * d; cv.height = innerHeight * d; c.setTransform(d, 0, 0, d, 0, 0); };
    const mk = () => ({ x: Math.random() * innerWidth, y: Math.random() * innerHeight, r: 0.6 + Math.random() * 1.9, a: 0.12 + Math.random() * 0.4, vy: -(0.08 + Math.random() * 0.22), ph: Math.random() * 6, sw: 0.2 + Math.random() * 0.5 });
    const step = (t) => {
      c.clearRect(0, 0, innerWidth, innerHeight);
      const col = getComputedStyle(document.documentElement).getPropertyValue('--glow').trim() || '#ffd48a';
      c.fillStyle = col;
      for (const m of motes) {
        m.y += m.vy; m.x += Math.sin(t / 1800 + m.ph) * m.sw * 0.3;
        if (m.y < -6) { m.y = innerHeight + 6; m.x = Math.random() * innerWidth; }
        c.globalAlpha = m.a * (0.6 + 0.4 * Math.sin(t / 900 + m.ph)); c.beginPath(); c.arc(m.x, m.y, m.r, 0, 7); c.fill();
      }
      raf = on ? requestAnimationFrame(step) : 0;
    };
    return {
      start() {
        if (AS.rm() || on) return; cv = document.getElementById('ambient'); if (!cv) return; c = cv.getContext('2d');
        fit(); addEventListener('resize', fit); motes = Array.from({ length: innerWidth < 600 ? 28 : 55 }, mk); on = true; raf = requestAnimationFrame(step);
        document.addEventListener('visibilitychange', () => { if (document.hidden) { on = false; } else if (!on) { on = true; raf = requestAnimationFrame(step); } });
      },
    };
  })();
})();
