/* =====================================================
   CONFIGURATION — EDIT THESE VALUES
   ===================================================== */
const CONFIG = {
  // Social links — replace with real URLs
  discord:        'https://discord.gg/SEULINK',
  tiktok:         'https://tiktok.com/@SEUUSER',
  instagram:      'https://instagram.com/SEUUSER',
  commissionLink: 'https://SEULINK.com/comissoes',

  // Media paths — add your own files to the same folder
  profilePhoto:   '',       // e.g. 'profile.png'
  bgMusic:        '',       // e.g. 'music.mp3'
  clickSound:     '',       // e.g. 'click.mp3' (optional)

  // Commission data
  commissionOpen: true,
  queueFilled:    2,
  queueTotal:     5,
  deliveryDays:   '7–14',
};

const DEFAULT_CONFIG = { ...CONFIG };
const CONFIG_FILE = {
  local: 'site-config.json',
  remote: 'https://raw.githubusercontent.com/Ke0nXD/pistachio-creations/main/site-config.json',
  api: 'https://api.github.com/repos/Ke0nXD/pistachio-creations/contents/site-config.json',
  branch: 'main',
};
let configLoadError = null;

/* =====================================================
   LANGUAGE STATE
   ===================================================== */
let currentLang = localStorage.getItem('pistachio-lang') || 'pt';
let currentPage = currentLang === 'pt' ? 'home-pt' : 'home-en';

function toggleLang() {
  currentLang = currentLang === 'pt' ? 'en' : 'pt';
  localStorage.setItem('pistachio-lang', currentLang);
  document.getElementById('lang-label').textContent = currentLang === 'pt' ? 'EN' : 'PT';
  // Update music labels
  updateMusicLabel();
  // Navigate to equivalent home
  if (currentPage.startsWith('home')) {
    navigate('home-' + currentLang);
  } else if (currentPage.startsWith('pistachio')) {
    navigate('pistachio-' + currentLang);
  }
}

function navigate(page) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.getElementById('page-' + page).classList.add('active');
  currentPage = page;
  window.scrollTo({ top: 0, behavior: 'smooth' });
  updateBackBtn(page);
  // Apply profile photo if set
  if (CONFIG.profilePhoto) {
    document.querySelectorAll('.profile-pic-placeholder').forEach(el => {
      el.parentElement.innerHTML = `<img src="${CONFIG.profilePhoto}" alt="Profile" style="width:100%;height:100%;object-fit:cover;border-radius:50%;">`;
    });
  }
}

function updateBackBtn(page) {
  const backBtn = document.querySelector('.back-btn');
  // Back button only visible on inner pages; it's part of the inner pages HTML
}

/* =====================================================
   SITE SETTINGS / ADMIN
   ===================================================== */
function normalizeNumber(value, fallback, min = 0, max = 99) {
  const number = Number.parseInt(value, 10);
  if (!Number.isFinite(number)) return fallback;
  return Math.min(max, Math.max(min, number));
}

function normalizeDelivery(value) {
  const raw = String(value || DEFAULT_CONFIG.deliveryDays).trim();
  return raw.replace(/\s*(dias|dia|days|day)$/i, '').trim() || DEFAULT_CONFIG.deliveryDays;
}

function normalizeConfig(rawConfig = {}) {
  const cleanConfig = {
    commissionOpen: rawConfig.commissionOpen !== false,
    queueFilled: normalizeNumber(rawConfig.queueFilled, DEFAULT_CONFIG.queueFilled, 0, 99),
    queueTotal: normalizeNumber(rawConfig.queueTotal, DEFAULT_CONFIG.queueTotal, 1, 99),
    deliveryDays: normalizeDelivery(rawConfig.deliveryDays),
    commissionLink: String(rawConfig.commissionLink || DEFAULT_CONFIG.commissionLink).trim(),
    discord: String(rawConfig.discord || DEFAULT_CONFIG.discord).trim(),
    tiktok: String(rawConfig.tiktok || DEFAULT_CONFIG.tiktok).trim(),
    instagram: String(rawConfig.instagram || DEFAULT_CONFIG.instagram).trim(),
  };
  cleanConfig.queueFilled = Math.min(cleanConfig.queueFilled, cleanConfig.queueTotal);
  return cleanConfig;
}

function getConfigUrl() {
  const isLocalhost = ['localhost', '127.0.0.1', ''].includes(window.location.hostname);
  const source = isLocalhost ? CONFIG_FILE.local : CONFIG_FILE.remote;
  return `${source}?v=${Date.now()}`;
}

async function fetchJsonWithTimeout(url, options = {}, timeoutMs = 7000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      cache: 'no-store',
      ...options,
      signal: controller.signal,
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } finally {
    clearTimeout(timer);
  }
}

async function loadSiteConfig() {
  configLoadError = null;
  let globalConfig = {};
  try {
    globalConfig = await fetchJsonWithTimeout(getConfigUrl());
  } catch (error) {
    configLoadError = error;
    console.warn('Global config not loaded, using defaults.', error);
  }
  Object.assign(CONFIG, DEFAULT_CONFIG, normalizeConfig(globalConfig));
  CONFIG.commissionOpen = CONFIG.commissionOpen !== false;
  CONFIG.queueTotal = normalizeNumber(CONFIG.queueTotal, DEFAULT_CONFIG.queueTotal, 1, 99);
  CONFIG.queueFilled = normalizeNumber(CONFIG.queueFilled, DEFAULT_CONFIG.queueFilled, 0, CONFIG.queueTotal);
  CONFIG.deliveryDays = normalizeDelivery(CONFIG.deliveryDays);
}

function encodeBase64Utf8(text) {
  const bytes = new TextEncoder().encode(text);
  let binary = '';
  bytes.forEach(byte => { binary += String.fromCharCode(byte); });
  return btoa(binary);
}

async function getConfigFileSha(token) {
  const res = await fetch(CONFIG_FILE.api, {
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${token}`,
      'X-GitHub-Api-Version': '2022-11-28',
    },
    cache: 'no-store',
  });
  if (res.status === 404) return '';
  if (!res.ok) throw new Error(`Não foi possível ler site-config.json (HTTP ${res.status}).`);
  const data = await res.json();
  return data.sha || '';
}

async function persistSiteConfig(cleanConfig, token) {
  const githubToken = String(token || '').trim();
  if (!githubToken) throw new Error('Informe um token do GitHub para salvar globalmente.');
  const payload = {
    ...cleanConfig,
    updatedAt: new Date().toISOString(),
  };
  const sha = await getConfigFileSha(githubToken);
  const body = {
    message: 'chore: update site config from admin',
    branch: CONFIG_FILE.branch,
    content: encodeBase64Utf8(`${JSON.stringify(payload, null, 2)}\n`),
  };
  if (sha) body.sha = sha;

  const res = await fetch(CONFIG_FILE.api, {
    method: 'PUT',
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${githubToken}`,
      'Content-Type': 'application/json',
      'X-GitHub-Api-Version': '2022-11-28',
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    let detail = `HTTP ${res.status}`;
    try {
      const data = await res.json();
      if (data.message) detail = data.message;
    } catch(e) {}
    throw new Error(`Falha ao salvar no GitHub: ${detail}`);
  }
  return payload;
}

async function saveSiteConfig(nextConfig, token) {
  const cleanConfig = normalizeConfig(nextConfig);
  const publishedConfig = await persistSiteConfig(cleanConfig, token);
  Object.assign(CONFIG, cleanConfig);
  return publishedConfig;
}

function setText(selector, text) {
  document.querySelectorAll(selector).forEach(el => {
    el.textContent = text;
  });
}

function setStatusLine(selector, label, value, valueClass = '') {
  document.querySelectorAll(selector).forEach(el => {
    el.textContent = '';
    el.append(document.createTextNode(label));
    const span = document.createElement('span');
    if (valueClass) span.className = valueClass;
    span.textContent = value;
    el.append(span);
  });
}

function setBadge(selector, text, closed = false) {
  document.querySelectorAll(selector).forEach(el => {
    const icon = el.querySelector('.icon')?.cloneNode(true);
    el.textContent = '';
    if (icon) el.append(icon, document.createTextNode(' ' + text));
    else el.textContent = text;
    el.classList.toggle('closed', closed);
  });
}

function setAdminPersistStatus(text, tone = '') {
  const status = document.getElementById('admin-persist-status');
  if (!status) return;
  status.textContent = text;
  status.dataset.tone = tone;
}

function applySiteConfig() {
  const open = CONFIG.commissionOpen !== false;
  const filled = normalizeNumber(CONFIG.queueFilled, DEFAULT_CONFIG.queueFilled, 0, CONFIG.queueTotal);
  const total = normalizeNumber(CONFIG.queueTotal, DEFAULT_CONFIG.queueTotal, 1, 99);
  const delivery = normalizeDelivery(CONFIG.deliveryDays);
  const statusClass = open ? '' : 'status-closed';

  setBadge('#page-home-pt .badges .badge:first-child', open ? 'Comissões Abertas' : 'Comissões Fechadas', !open);
  setBadge('#page-home-en .badges .badge:first-child', open ? 'Open Commissions' : 'Closed Commissions', !open);

  setStatusLine('#page-home-pt .commission-status .comm-item:nth-child(1) .comm-text', 'Status das comissões: ', open ? 'Aberto' : 'Fechado', statusClass);
  setStatusLine('#page-home-en .commission-status .comm-item:nth-child(1) .comm-text', 'Commission Status: ', open ? 'Open' : 'Closed', statusClass);
  setStatusLine('#page-pistachio-pt .inner-status .comm-item:nth-child(1) .comm-text', 'Status: ', open ? 'Aberto' : 'Fechado', statusClass);
  setStatusLine('#page-pistachio-en .inner-status .comm-item:nth-child(1) .comm-text', 'Status: ', open ? 'Open' : 'Closed', statusClass);

  setStatusLine('#page-home-pt .commission-status .comm-item:nth-child(2) .comm-text', `Fila: ${filled}/${total} `, 'vagas preenchidas');
  setStatusLine('#page-home-en .commission-status .comm-item:nth-child(2) .comm-text', `Queue: ${filled}/${total} `, 'slots filled');
  setStatusLine('#page-pistachio-pt .inner-status .comm-item:nth-child(2) .comm-text', `Fila: ${filled}/${total} `, 'vagas');
  setStatusLine('#page-pistachio-en .inner-status .comm-item:nth-child(2) .comm-text', `Queue: ${filled}/${total} `, 'slots');

  setStatusLine('#page-home-pt .commission-status .comm-item:nth-child(3) .comm-text', 'Prazo médio: ', `${delivery} dias`);
  setStatusLine('#page-home-en .commission-status .comm-item:nth-child(3) .comm-text', 'Avg. delivery: ', `${delivery} days`);
  setStatusLine('#page-pistachio-pt .inner-status .comm-item:nth-child(3) .comm-text', 'Prazo: ', `${delivery} dias`);
  setStatusLine('#page-pistachio-en .inner-status .comm-item:nth-child(3) .comm-text', 'Delivery: ', `${delivery} days`);

  const configStatus = configLoadError
    ? 'Não foi possível carregar site-config.json; usando valores padrão.'
    : 'Dados globais carregados de site-config.json.';
  setAdminPersistStatus(configStatus, configLoadError ? 'warn' : 'ok');
}

function fillAdminForm() {
  const fields = {
    'admin-commission-open': CONFIG.commissionOpen !== false,
    'admin-queue-filled': CONFIG.queueFilled,
    'admin-queue-total': CONFIG.queueTotal,
    'admin-delivery-days': CONFIG.deliveryDays,
    'admin-commission-link': CONFIG.commissionLink,
    'admin-discord': CONFIG.discord,
    'admin-tiktok': CONFIG.tiktok,
    'admin-instagram': CONFIG.instagram,
  };

  Object.entries(fields).forEach(([id, value]) => {
    const field = document.getElementById(id);
    if (!field) return;
    if (field.type === 'checkbox') field.checked = !!value;
    else field.value = value || '';
  });
}

function getAdminToken() {
  return document.getElementById('admin-github-token')?.value.trim() || '';
}

function collectAdminConfig() {
  return {
    commissionOpen: document.getElementById('admin-commission-open').checked,
    queueFilled: document.getElementById('admin-queue-filled').value,
    queueTotal: document.getElementById('admin-queue-total').value,
    deliveryDays: document.getElementById('admin-delivery-days').value,
    commissionLink: document.getElementById('admin-commission-link').value,
    discord: document.getElementById('admin-discord').value,
    tiktok: document.getElementById('admin-tiktok').value,
    instagram: document.getElementById('admin-instagram').value,
  };
}

function setAdminBusy(isBusy) {
  document.querySelectorAll('#admin-form button, #admin-form input').forEach(el => {
    if (el.id !== 'admin-close-btn') el.disabled = isBusy;
  });
  document.getElementById('admin-form')?.classList.toggle('is-saving', isBusy);
}

function openAdminPanel() {
  const panel = document.getElementById('admin-panel');
  if (!panel) return;
  document.body.classList.add('admin-mode', 'admin-panel-open');
  document.getElementById('admin-open-btn')?.removeAttribute('hidden');
  panel.hidden = false;
  panel.setAttribute('aria-hidden', 'false');
  fillAdminForm();
}

function closeAdminPanel() {
  const panel = document.getElementById('admin-panel');
  if (!panel) return;
  document.body.classList.remove('admin-panel-open');
  panel.hidden = true;
  panel.setAttribute('aria-hidden', 'true');
}

function initAdmin() {
  const openBtn = document.getElementById('admin-open-btn');
  const closeBtn = document.getElementById('admin-close-btn');
  const resetBtn = document.getElementById('admin-reset-btn');
  const form = document.getElementById('admin-form');

  openBtn?.addEventListener('click', openAdminPanel);
  closeBtn?.addEventListener('click', closeAdminPanel);
  document.getElementById('admin-panel')?.addEventListener('click', e => {
    if (e.target.id === 'admin-panel') closeAdminPanel();
  });

  form?.addEventListener('submit', async e => {
    e.preventDefault();
    const token = getAdminToken();
    setAdminBusy(true);
    setAdminPersistStatus('Salvando no GitHub...', 'saving');
    try {
      await saveSiteConfig(collectAdminConfig(), token);
      configLoadError = null;
      applySiteConfig();
      fillAdminForm();
      setAdminPersistStatus('Configurações publicadas globalmente.', 'ok');
      showToast('Configurações publicadas.');
    } catch (error) {
      setAdminPersistStatus(error.message, 'error');
      showToast(error.message);
    } finally {
      setAdminBusy(false);
    }
  });

  resetBtn?.addEventListener('click', async () => {
    const token = getAdminToken();
    setAdminBusy(true);
    setAdminPersistStatus('Resetando no GitHub...', 'saving');
    try {
      await saveSiteConfig(DEFAULT_CONFIG, token);
      configLoadError = null;
      applySiteConfig();
      fillAdminForm();
      setAdminPersistStatus('Configurações globais resetadas.', 'ok');
      showToast('Configurações globais resetadas.');
    } catch (error) {
      setAdminPersistStatus(error.message, 'error');
      showToast(error.message);
    } finally {
      setAdminBusy(false);
    }
  });

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') closeAdminPanel();
    if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'a') {
      e.preventDefault();
      document.body.classList.add('admin-mode');
      document.getElementById('admin-open-btn')?.removeAttribute('hidden');
      openAdminPanel();
    }
  });

  if (window.location.hash === '#admin' || new URLSearchParams(window.location.search).has('admin')) {
    openAdminPanel();
  }
}

function openLink(url) {
  if (url && !url.includes('SEULINK') && !url.includes('SEUUSER')) {
    window.open(url, '_blank');
  } else {
    // Show placeholder message
    const msg = currentLang === 'pt'
      ? 'Configure o link em CONFIG no código.'
      : 'Set the link in CONFIG in the code.';
    showToast(msg);
  }
}

/* =====================================================
   TOAST
   ===================================================== */
function showToast(msg) {
  const t = document.createElement('div');
  t.textContent = msg;
  Object.assign(t.style, {
    position: 'fixed', bottom: '80px', left: '50%',
    transform: 'translateX(-50%)',
    background: 'rgba(255,255,255,0.95)',
    border: '2px solid var(--pink-light)',
    borderRadius: '20px', padding: '10px 20px',
    fontFamily: 'var(--font-body)', fontWeight: '700',
    fontSize: '13px', color: 'var(--text-dark)',
    boxShadow: '0 4px 20px rgba(244,114,182,0.2)',
    zIndex: '9999', pointerEvents: 'none',
    whiteSpace: 'nowrap',
    animation: 'cardEntrance 0.3s ease both',
  });
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 2500);
}

/* =====================================================
   MUSIC
   ===================================================== */
let audioCtx = null;
let musicSource = null;
let gainNode = null;
let musicPlaying = false;
let musicPref = localStorage.getItem('pistachio-music');

const LABELS = {
  pt: { idle: 'Somzinho', playing: 'Tocando', paused: 'Pausado' },
  en: { idle: 'Music', playing: 'On', paused: 'Off' },
};

function updateMusicLabel() {
  const l = LABELS[currentLang];
  document.getElementById('music-label').textContent =
    musicPlaying ? l.playing : (musicPref === 'paused' ? l.paused : l.idle);
}

function initAudio() {
  if (!CONFIG.bgMusic || audioCtx) return;
  try {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    gainNode = audioCtx.createGain();
    gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
    gainNode.connect(audioCtx.destination);
  } catch(e) {}
}

async function startMusic() {
  if (!CONFIG.bgMusic) return;
  initAudio();
  if (!audioCtx) return;
  try {
    if (audioCtx.state === 'suspended') await audioCtx.resume();
    const res = await fetch(CONFIG.bgMusic);
    const buf = await audioCtx.decodeAudioData(await res.arrayBuffer());
    if (musicSource) musicSource.stop();
    musicSource = audioCtx.createBufferSource();
    musicSource.buffer = buf;
    musicSource.loop = true;
    musicSource.connect(gainNode);
    musicSource.start();
    // Fade in
    gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.25, audioCtx.currentTime + 1.5);
    musicPlaying = true;
    localStorage.setItem('pistachio-music', 'playing');
    updateMusicLabel();
  } catch(e) { console.log('Music not loaded'); }
}

function stopMusic() {
  if (gainNode && audioCtx) {
    gainNode.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 0.5);
    setTimeout(() => { if(musicSource) musicSource.stop(); }, 600);
  }
  musicPlaying = false;
  musicPref = 'paused';
  localStorage.setItem('pistachio-music', 'paused');
  updateMusicLabel();
}

function toggleMusic() {
  if (musicPlaying) {
    stopMusic();
  } else {
    musicPref = null;
    startMusic();
  }
}

// Click sounds via Web Audio API (no file needed)
function playClick() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.connect(g); g.connect(ctx.destination);
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.1);
    g.gain.setValueAtTime(0.15, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
    osc.start(); osc.stop(ctx.currentTime + 0.15);
  } catch(e) {}
}

/* =====================================================
   CLICK PARTICLES
   ===================================================== */
const PARTICLE_SHAPES = ['shape-star', 'shape-heart', 'shape-paw', 'shape-spark'];
document.addEventListener('click', function(e) {
  if (e.target.closest('#music-btn, #lang-btn, .back-btn, button')) {
    for (let i = 0; i < 5; i++) {
      setTimeout(() => spawnParticle(e.clientX, e.clientY), i * 60);
    }
  }
});
function spawnParticle(x, y) {
  const p = document.createElement('div');
  const shape = PARTICLE_SHAPES[Math.floor(Math.random() * PARTICLE_SHAPES.length)];
  p.className = `click-particle ${shape}`;
  p.style.left = (x + (Math.random()-0.5)*30) + 'px';
  p.style.top = y + 'px';
  p.style.animationDuration = (0.6 + Math.random() * 0.4) + 's';
  document.body.appendChild(p);
  setTimeout(() => p.remove(), 1100);
}

/* =====================================================
   CUSTOM CURSOR
   ===================================================== */
const cursor = document.getElementById('custom-cursor');
document.addEventListener('mousemove', e => {
  cursor.style.left = e.clientX + 'px';
  cursor.style.top = e.clientY + 'px';
});
document.addEventListener('mouseover', e => {
  if (e.target.closest('button, a, [onclick]')) {
    cursor.classList.add('hover');
  }
});
document.addEventListener('mouseout', e => {
  if (e.target.closest('button, a, [onclick]')) {
    cursor.classList.remove('hover');
  }
});

/* =====================================================
   MASCOT
   ===================================================== */
const MASCOT_PHRASES = {
  pt: ['Boop!', 'Pistache gostou do carinho!', 'Você encontrou o cantinho secreto!'],
  en: ['Boop!', 'Pistache liked that!', 'You found the cozy corner!'],
};
let phraseIdx = 0;
const mascotDrag = {
  active: false,
  moved: false,
  pointerId: null,
  startX: 0,
  startY: 0,
  offsetX: 0,
  offsetY: 0,
  nextX: 0,
  nextY: 0,
  raf: 0,
  suppressClick: false,
};

function getMascotPhrases() {
  const statusPhrase = CONFIG.commissionOpen !== false
    ? { pt: 'Comissões abertas!', en: 'Commissions open!' }
    : { pt: 'Comissões fechadas por enquanto!', en: 'Commissions are closed for now!' };
  return currentLang === 'pt'
    ? [MASCOT_PHRASES.pt[0], MASCOT_PHRASES.pt[1], statusPhrase.pt, MASCOT_PHRASES.pt[2]]
    : [MASCOT_PHRASES.en[0], MASCOT_PHRASES.en[1], statusPhrase.en, MASCOT_PHRASES.en[2]];
}

function mascotClick() {
  playClick();
  const mascot = document.getElementById('mascot');
  const bubble = document.getElementById('speech-bubble');
  const phrases = getMascotPhrases();
  bubble.textContent = phrases[phraseIdx % phrases.length];
  phraseIdx++;
  mascot.classList.add('booped');
  bubble.classList.add('visible');
  clearTimeout(window._mascotTimer);
  clearTimeout(window._mascotReactTimer);
  window._mascotReactTimer = setTimeout(() => mascot.classList.remove('booped'), 3200);
  window._mascotTimer = setTimeout(() => bubble.classList.remove('visible'), 2800);
}

function clampMascotPosition(x, y) {
  const mascot = document.getElementById('mascot');
  const rect = mascot.getBoundingClientRect();
  const maxX = Math.max(0, window.innerWidth - rect.width);
  const maxY = Math.max(0, window.innerHeight - rect.height);
  return {
    x: Math.min(maxX, Math.max(0, x)),
    y: Math.min(maxY, Math.max(0, y)),
  };
}

function applyMascotPosition(x, y) {
  const mascot = document.getElementById('mascot');
  const pos = clampMascotPosition(x, y);
  mascot.style.left = `${pos.x}px`;
  mascot.style.top = `${pos.y}px`;
  mascot.style.right = 'auto';
  mascot.style.bottom = 'auto';
}

function queueMascotPosition() {
  if (mascotDrag.raf) return;
  mascotDrag.raf = requestAnimationFrame(() => {
    mascotDrag.raf = 0;
    applyMascotPosition(mascotDrag.nextX, mascotDrag.nextY);
  });
}

function onMascotPointerDown(event) {
  if (event.button !== undefined && event.button !== 0) return;
  const mascot = document.getElementById('mascot');
  const rect = mascot.getBoundingClientRect();
  mascotDrag.active = true;
  mascotDrag.moved = false;
  mascotDrag.pointerId = event.pointerId;
  mascotDrag.startX = event.clientX;
  mascotDrag.startY = event.clientY;
  mascotDrag.offsetX = event.clientX - rect.left;
  mascotDrag.offsetY = event.clientY - rect.top;
  mascotDrag.nextX = rect.left;
  mascotDrag.nextY = rect.top;
  mascot.classList.add('is-dragging');
  mascot.style.left = `${rect.left}px`;
  mascot.style.top = `${rect.top}px`;
  mascot.style.right = 'auto';
  mascot.style.bottom = 'auto';
  mascot.setPointerCapture?.(event.pointerId);
  event.preventDefault();
}

function onMascotPointerMove(event) {
  if (!mascotDrag.active || event.pointerId !== mascotDrag.pointerId) return;
  const dx = event.clientX - mascotDrag.startX;
  const dy = event.clientY - mascotDrag.startY;
  if (Math.hypot(dx, dy) > 4) mascotDrag.moved = true;
  mascotDrag.nextX = event.clientX - mascotDrag.offsetX;
  mascotDrag.nextY = event.clientY - mascotDrag.offsetY;
  queueMascotPosition();
  event.preventDefault();
}

function endMascotDrag(event) {
  if (!mascotDrag.active || event.pointerId !== mascotDrag.pointerId) return;
  const mascot = document.getElementById('mascot');
  if (mascotDrag.raf) {
    cancelAnimationFrame(mascotDrag.raf);
    mascotDrag.raf = 0;
    applyMascotPosition(mascotDrag.nextX, mascotDrag.nextY);
  }
  mascot.classList.remove('is-dragging');
  mascot.releasePointerCapture?.(event.pointerId);
  const wasDrag = mascotDrag.moved;
  mascotDrag.active = false;
  mascotDrag.pointerId = null;
  mascotDrag.suppressClick = true;
  setTimeout(() => { mascotDrag.suppressClick = false; }, 0);
  if (!wasDrag && event.type === 'pointerup') mascotClick();
  event.preventDefault();
}

function initDraggableMascot() {
  const mascot = document.getElementById('mascot');
  if (!mascot) return;
  mascot.addEventListener('pointerdown', onMascotPointerDown);
  mascot.addEventListener('pointermove', onMascotPointerMove);
  mascot.addEventListener('pointerup', endMascotDrag);
  mascot.addEventListener('pointercancel', endMascotDrag);
  mascot.addEventListener('click', event => {
    if (mascotDrag.suppressClick) {
      event.preventDefault();
      event.stopPropagation();
      return;
    }
    mascotClick();
  });
  window.addEventListener('resize', () => {
    const rect = mascot.getBoundingClientRect();
    if (mascot.style.left || mascot.style.top) applyMascotPosition(rect.left, rect.top);
  });
}

/* =====================================================
   CANVAS PARTICLES
   ===================================================== */
(function initParticles() {
  const canvas = document.getElementById('particles-canvas');
  const ctx = canvas.getContext('2d');
  const SHAPES = ['heart', 'paw', 'heart', 'paw', 'spark'];
  let particles = [];

  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.floor(window.innerWidth * dpr);
    canvas.height = Math.floor(window.innerHeight * dpr);
    canvas.style.width = `${window.innerWidth}px`;
    canvas.style.height = `${window.innerHeight}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  resize();
  window.addEventListener('resize', resize);

  const particleCount = window.innerWidth < 720 ? 24 : 40;
  for (let i = 0; i < particleCount; i++) {
    particles.push({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      vx: (Math.random() - 0.5) * 0.22,
      vy: -0.12 - Math.random() * 0.24,
      size: 10 + Math.random() * 12,
      shape: SHAPES[Math.floor(Math.random() * SHAPES.length)],
      alpha: 0.22 + Math.random() * 0.36,
      phase: Math.random() * Math.PI * 2,
    });
  }

  function makeGradient(x, y, size, start, end, t, phase) {
    const shift = Math.sin(t * 0.8 + phase) * size * 0.42;
    const gradient = ctx.createLinearGradient(x - size + shift, y - size, x + size, y + size + shift);
    gradient.addColorStop(0, start);
    gradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.72)');
    gradient.addColorStop(1, end);
    return gradient;
  }

  function drawStar(x, y, size, color) {
    const points = 8;
    ctx.beginPath();
    for (let i = 0; i < points * 2; i++) {
      const radius = i % 2 === 0 ? size : size * 0.34;
      const angle = Math.PI / points * i - Math.PI / 2;
      const px = x + Math.cos(angle) * radius;
      const py = y + Math.sin(angle) * radius;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();
  }

  function drawHeart(x, y, size, color) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(size / 24, size / 24);
    ctx.beginPath();
    ctx.moveTo(0, 8);
    ctx.bezierCurveTo(-14, -3, -10, -15, 0, -8);
    ctx.bezierCurveTo(10, -15, 14, -3, 0, 8);
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();
    ctx.restore();
  }

  function drawPaw(x, y, size, color) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.ellipse(x, y + size * 0.25, size * 0.34, size * 0.25, 0, 0, Math.PI * 2);
    ctx.fill();
    const toes = [
      [-0.46, -0.2],
      [-0.16, -0.36],
      [0.18, -0.36],
      [0.48, -0.18],
    ];
    toes.forEach(([tx, ty]) => {
      ctx.beginPath();
      ctx.ellipse(x + tx * size, y + ty * size, size * 0.17, size * 0.2, 0, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  function drawParticle(p, t) {
    const size = p.size * (0.82 + Math.sin(t + p.phase) * 0.12);
    if (p.shape === 'paw') {
      drawPaw(p.x, p.y, size, makeGradient(p.x, p.y, size, '#9cf070', '#ff91bf', t, p.phase));
    } else if (p.shape === 'heart') {
      drawHeart(p.x, p.y, size, makeGradient(p.x, p.y, size, '#ff78b4', '#9cf070', t, p.phase));
    } else {
      drawStar(p.x, p.y, size, makeGradient(p.x, p.y, size, '#c989ff', '#9cf070', t, p.phase));
    }
  }

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const t = Date.now() / 1000;
    particles.forEach(p => {
      p.x += p.vx + Math.sin(t + p.phase) * 0.15;
      p.y += p.vy;
      if (p.y < -30) { p.y = canvas.height + 20; p.x = Math.random() * canvas.width; }
      if (p.x < -30) p.x = canvas.width + 20;
      if (p.x > canvas.width + 30) p.x = -20;
      ctx.globalAlpha = p.alpha * (0.7 + 0.3 * Math.sin(t * 1.5 + p.phase));
      drawParticle(p, t);
    });
    ctx.globalAlpha = 1;
    requestAnimationFrame(draw);
  }
  draw();
})();

/* =====================================================
   INIT
   ===================================================== */
document.addEventListener('DOMContentLoaded', async () => {
  await loadSiteConfig();
  // Set lang
  const savedLang = localStorage.getItem('pistachio-lang') || 'pt';
  currentLang = savedLang;
  document.getElementById('lang-label').textContent = currentLang === 'pt' ? 'EN' : 'PT';
  navigate(currentLang === 'pt' ? 'home-pt' : 'home-en');
  applySiteConfig();
  initAdmin();
  initDraggableMascot();
  updateMusicLabel();

  // Try autoplay music
  if (CONFIG.bgMusic && localStorage.getItem('pistachio-music') !== 'paused') {
    setTimeout(() => startMusic(), 800);
  }
});
