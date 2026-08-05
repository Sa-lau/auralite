/* ============================================================
   App — 共用 UI:導覽列、Toast、購物車抽屜、動畫、工具
   ============================================================ */

(function (global) {
  'use strict';

  const CD = global.CrystalData;
  const S = global.Store;

  /* ---------- 工具 ---------- */
  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
  const money = n => 'HK$' + Number(n || 0).toLocaleString('en-US');
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const dt = iso => new Date(iso).toLocaleString('zh-HK', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });

  /* ---------- Toast ---------- */
  function toast(msg, type, ms) {
    let box = $('#toasts');
    if (!box) { box = document.createElement('div'); box.id = 'toasts'; document.body.appendChild(box); }
    const el = document.createElement('div');
    el.className = 'toast ' + (type || '');
    el.textContent = msg;
    box.appendChild(el);
    setTimeout(() => {
      el.style.transition = 'opacity .3s, transform .3s';
      el.style.opacity = '0'; el.style.transform = 'translateY(10px)';
      setTimeout(() => el.remove(), 320);
    }, ms || 2400);
  }

  /* ---------- Logo ---------- */
  const LOGO = `<svg class="brand-mark" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
    <defs><linearGradient id="lg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#7dd3c0"/><stop offset="50%" stop-color="#14b8a6"/><stop offset="100%" stop-color="#38bdf8"/>
    </linearGradient></defs>
    <path d="M20 2 L33 13 L28 34 L12 34 L7 13 Z" fill="url(#lg)" opacity=".95"/>
    <path d="M20 2 L7 13 L20 17 L33 13 Z" fill="#fff" opacity=".45"/>
    <path d="M20 17 L20 34" stroke="#fff" stroke-opacity=".5" stroke-width="1.2"/>
    <path d="M7 13 L12 34 M33 13 L28 34" stroke="#fff" stroke-opacity=".28" stroke-width="1"/>
  </svg>`;

  const ICON = {
    cart: '<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.7 13.4a2 2 0 0 0 2 1.6h9.7a2 2 0 0 0 2-1.6L23 6H6"/></svg>',
    close: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg>',
    menu: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M3 6h18M3 12h18M3 18h18"/></svg>',
    chevron: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6 9l6 6 6-6"/></svg>',
    trash: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"/></svg>',
    arrow: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>'
  };

  const NAV_ITEMS = [
    { href: 'index.html', label: '首頁' },
    { href: 'bazi.html', label: '八字定制' },
    { href: 'shop.html', label: '晶石選購' },
    { href: 'knowledge.html', label: '水晶百科' },
    { href: 'orders.html', label: '訂單查詢' }
  ];

  /* ---------- 導覽列 ---------- */
  function renderNav(active) {
    const el = $('#nav');
    if (!el) return;
    el.className = 'nav';
    el.innerHTML = `<div class="nav-inner">
      <a href="index.html" class="brand">${LOGO}<span>極晶閣<span class="brand-sub">AURALITE</span></span></a>
      <button class="nav-toggle" id="navToggle" aria-label="選單">${ICON.menu}</button>
      <nav class="nav-links" id="navLinks">
        ${NAV_ITEMS.map(i => `<a href="${i.href}"${i.href === active ? ' class="active"' : ''}>${i.label}</a>`).join('')}
      </nav>
      <button class="nav-cart" id="cartBtn">${ICON.cart}<span>購物車</span><span class="cart-badge" id="cartBadge">0</span></button>
    </div>`;
    $('#navToggle').onclick = () => $('#navLinks').classList.toggle('open');
    $('#cartBtn').onclick = openCart;
    updateBadge();
  }

  function updateBadge() {
    const b = $('#cartBadge');
    if (b) b.textContent = S.cartCount();
  }

  /* ---------- 頁尾 ---------- */
  function renderFooter() {
    const el = $('#footer');
    if (!el) return;
    el.className = 'footer';
    el.innerHTML = `<div class="wrap"><div class="footer-grid">
      <div>
        <div class="brand" style="margin-bottom:12px">${LOGO}<span>極晶閣<span class="brand-sub">AURALITE</span></span></div>
        <p class="small muted" style="max-width:330px">以正統子平八字為據,為您推算五行喜忌,配對相應能量水晶。天然原礦,一人一命一盤,量身定制。</p>
      </div>
      <div><h4>選購</h4>
        <a href="shop.html">全部商品</a><a href="bazi.html">八字定制</a>
        <a href="shop.html?el=木">木屬性水晶</a><a href="shop.html?el=火">火屬性水晶</a>
        <a href="shop.html?el=水">水屬性水晶</a></div>
      <div><h4>知識</h4>
        <a href="knowledge.html#purify">淨化與消磁</a><a href="knowledge.html#wear">佩戴法則</a>
        <a href="knowledge.html#wuxing">五行原理</a><a href="knowledge.html#fake">真偽辨識</a></div>
      <div><h4>服務</h4>
        <a href="orders.html">訂單查詢</a><a href="admin.html">後台管理</a>
        <a href="knowledge.html#chakra">脈輪對照</a></div>
    </div>
    <div class="footer-bottom">
      <span>© ${new Date().getFullYear()} 極晶閣 Auralite · 本站命理內容僅供參考,不構成醫療或投資建議</span>
      <span>資料儲存於您的瀏覽器本機</span>
    </div></div>`;
  }

  /* ---------- 購物車抽屜 ---------- */
  function ensureDrawer() {
    if ($('#cartDrawer')) return;
    const mask = document.createElement('div');
    mask.className = 'drawer-mask'; mask.id = 'cartMask';
    const d = document.createElement('aside');
    d.className = 'drawer'; d.id = 'cartDrawer';
    d.innerHTML = `
      <div class="drawer-head">
        <div><div class="h-3">購物車</div><div class="tiny faint" id="cartHint">— 件商品</div></div>
        <button class="icon-btn" id="cartClose">${ICON.close}</button>
      </div>
      <div class="drawer-body" id="cartBody"></div>
      <div class="drawer-foot" id="cartFoot"></div>`;
    document.body.appendChild(mask);
    document.body.appendChild(d);
    mask.onclick = closeCart;
    $('#cartClose').onclick = closeCart;
  }

  function openCart() { ensureDrawer(); renderCart(); $('#cartMask').classList.add('open'); $('#cartDrawer').classList.add('open'); document.body.style.overflow = 'hidden'; }
  function closeCart() { const m = $('#cartMask'), d = $('#cartDrawer'); if (m) m.classList.remove('open'); if (d) d.classList.remove('open'); document.body.style.overflow = ''; }

  function renderCart() {
    ensureDrawer();
    const d = S.cartDetail();
    const body = $('#cartBody'), foot = $('#cartFoot'), hint = $('#cartHint');
    hint.textContent = d.count + ' 件商品';

    if (!d.lines.length) {
      body.innerHTML = `<div class="empty"><div class="empty-icon">◇</div><p>購物車還是空的</p>
        <a href="bazi.html" class="btn btn-primary btn-sm" style="margin-top:14px">先算八字選晶石</a></div>`;
      foot.innerHTML = '';
      updateBadge();
      return;
    }

    body.innerHTML = d.lines.map(l => `
      <div class="cart-item">
        <div class="cart-thumb">${l.kind === 'service' ? `<div style="font-size:1.5rem">${svcIcon(l.id)}</div>` : CD.crystalSVG(l.form, l.colors[0], l.colors[1], l.colors[2], 'c' + l.id.replace(/[^a-z0-9]/gi, ''))}</div>
        <div style="flex:1;min-width:0">
          <div class="row-between" style="align-items:flex-start;gap:8px">
            <div style="min-width:0">
              <div style="font-weight:600;font-size:.92rem">${esc(l.name)}</div>
              <div class="tiny faint">${esc(l.formLabel)}${l.spec ? ' · ' + esc(l.spec) : ''}${l.element !== '—' ? ' · ' + l.element : ''}</div>
            </div>
            <button class="icon-btn" style="width:26px;height:26px" data-rm="${l.id}" title="移除">${ICON.trash}</button>
          </div>
          <div class="row-between" style="margin-top:8px">
            <div class="qty">
              <button data-dec="${l.id}">−</button>
              <input type="number" value="${l.qty}" min="1" data-qty="${l.id}">
              <button data-inc="${l.id}">+</button>
            </div>
            <div style="font-family:var(--font-mono);font-weight:700;color:var(--gold)">${money(l.lineTotal)}</div>
          </div>
        </div>
      </div>`).join('');

    foot.innerHTML = `
      <div class="row-between small"><span class="muted">商品小計</span><span class="mono">${money(d.subtotal)}</span></div>
      <div class="row-between small" style="margin-top:5px"><span class="muted">運費</span><span class="mono">${d.shipping ? money(d.shipping) : '<span class="pos">免運</span>'}</span></div>
      ${d.tax ? `<div class="row-between small" style="margin-top:5px"><span class="muted">稅金</span><span class="mono">${money(d.tax)}</span></div>` : ''}
      <div class="row-between" style="margin-top:11px;padding-top:11px;border-top:1px solid var(--border)">
        <span style="font-weight:700">總計</span>
        <span style="font-size:1.35rem;font-weight:800;font-family:var(--font-mono);color:var(--gold)">${money(d.total)}</span>
      </div>
      ${d.subtotal < S.getSettings().freeShipAbove ? `<div class="tiny faint" style="margin-top:6px">再購 ${money(S.getSettings().freeShipAbove - d.subtotal)} 即可免運</div>` : ''}
      <a href="checkout.html" class="btn btn-primary btn-block" style="margin-top:14px">前往結帳 ${ICON.arrow}</a>
      <button class="btn btn-ghost btn-block btn-sm" style="margin-top:8px" id="cartClear">清空購物車</button>`;

    $$('[data-inc]', foot.parentElement).forEach(b => b.onclick = () => { S.addToCart(b.dataset.inc, 1, kindOf(b.dataset.inc)); renderCart(); });
    $$('[data-dec]').forEach(b => b.onclick = () => {
      const line = S.getCart().find(x => x.id === b.dataset.dec);
      if (line) S.setQty(b.dataset.dec, line.qty - 1);
      renderCart();
    });
    $$('[data-rm]').forEach(b => b.onclick = () => { S.removeFromCart(b.dataset.rm); renderCart(); toast('已移除'); });
    $$('[data-qty]').forEach(inp => inp.onchange = () => { S.setQty(inp.dataset.qty, parseInt(inp.value) || 1); renderCart(); });
    const cc = $('#cartClear');
    if (cc) cc.onclick = () => { if (confirm('確定清空購物車?')) { S.clearCart(); renderCart(); toast('已清空'); } };
    updateBadge();
  }

  function kindOf(id) { if (String(id).indexOf('custom-') === 0) return 'custom'; return CD.SERVICES.some(s => s.id === id) ? 'service' : 'product'; }
  function svcIcon(id) { const s = CD.SERVICES.find(x => x.id === id); return s ? s.icon : '◇'; }

  /* ---------- 加入購物車(含庫存檢查) ---------- */
  function addItem(id, qty, kind) {
    kind = kind || kindOf(id);
    qty = qty || 1;
    if (kind === 'product') {
      const p = S.getProduct(id);
      if (!p) return toast('商品不存在', 'err');
      const inCart = (S.getCart().find(l => l.id === id) || {}).qty || 0;
      if (inCart + qty > p.stock) return toast(`庫存僅剩 ${p.stock} 件`, 'err');
    }
    S.addToCart(id, qty, kind);
    updateBadge();
    let nm;
    if (kind === 'service') nm = (CD.SERVICES.find(s => s.id === id) || {}).name;
    else if (kind === 'custom') nm = ((S.getCart().find(l => l.id === id) || {}).meta || {}).name;
    else nm = (S.getProduct(id) || {}).name;
    toast('已加入購物車 · ' + (nm || '商品'), 'ok');
    const badge = $('#cartBadge');
    if (badge) { badge.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.5)' }, { transform: 'scale(1)' }], { duration: 340 }); }
  }

  /* ---------- 產品卡 ---------- */
  // 若水晶有實拍圖則優先顯示,載入失敗自動退回 SVG
  function prodImgTag(p) {
    const c = CD.getCrystal(p.crystalId);
    const img = (c && c.img) || p.img || (c && CD.CRYSTAL_IMG[c.id]);
    return img ? `<img class="prod-photo" src="${img}" alt="${esc(p.name)}" loading="lazy" onerror="this.remove()">` : '';
  }

  function productCard(p, opts) {
    opts = opts || {};
    const stockCls = p.stock === 0 ? 'out' : (p.stock <= 5 ? 'low' : '');
    const stockTxt = p.stock === 0 ? '售罄' : (p.stock <= 5 ? '僅剩 ' + p.stock : '現貨 ' + p.stock);
    return `<article class="prod-card" data-pid="${p.id}">
      <div class="prod-img">
        ${CD.crystalSVG(p.form, p.colors[0], p.colors[1], p.colors[2], 'p' + p.id.replace(/[^a-z0-9]/gi, ''))}
        ${prodImgTag(p)}
        ${opts.matchLabel ? `<span class="badge-match">${opts.matchLabel}</span>` : ''}
        <span class="badge-stock ${stockCls}">${stockTxt}</span>
      </div>
      <div class="prod-body">
        <div class="row" style="gap:7px"><span class="wx wx-${p.element}"><span class="dot"></span>${p.element}</span><span class="tag">${p.formLabel}</span></div>
        <div>
          <div class="prod-name">${esc(p.name)}</div>
          <div class="prod-en">${esc(p.en)}</div>
        </div>
        <div class="tiny faint">${esc(p.spec)}${p.note ? ' · ' + esc(p.note) : ''}</div>
        <div class="prod-foot">
          <div class="prod-price">${money(p.price)}</div>
          <div class="spacer"></div>
          <button class="btn btn-primary btn-sm" data-add="${p.id}" ${p.stock === 0 ? 'disabled' : ''}>${p.stock === 0 ? '售罄' : '加入'}</button>
        </div>
      </div>
    </article>`;
  }

  function bindAddButtons(root) {
    $$('[data-add]', root || document).forEach(b => {
      if (b._bound) return;
      b._bound = true;
      b.onclick = e => { e.stopPropagation(); addItem(b.dataset.add, 1); };
    });
  }

  /* ---------- 五行條 ---------- */
  function wxBars(pct, favor, avoid) {
    const C = { 木: 'var(--wx-wood)', 火: 'var(--wx-fire)', 土: 'var(--wx-earth)', 金: 'var(--wx-metal)', 水: 'var(--wx-water)' };
    const max = Math.max(...Object.values(pct), 1);
    return `<div class="wx-bars">${['木', '火', '土', '金', '水'].map(e => {
      const isF = favor && favor.includes(e), isA = avoid && avoid.includes(e);
      return `<div class="wx-bar-row">
        <div class="row" style="gap:5px"><span class="el-${e}" style="font-weight:700;font-size:1.05rem;font-family:var(--font-serif)">${e}</span></div>
        <div class="wx-bar-track"><div class="wx-bar-fill" style="width:${(pct[e] / max * 100).toFixed(1)}%;background:linear-gradient(90deg,${C[e]},${C[e]}88)"></div></div>
        <div style="text-align:right"><span class="mono small">${pct[e]}%</span>
        ${isF ? '<span class="tiny pos" style="display:block;line-height:1">喜用</span>' : isA ? '<span class="tiny" style="display:block;line-height:1;color:var(--text-faint)">節制</span>' : ''}</div>
      </div>`;
    }).join('')}</div>`;
  }

  /* ---------- 五行環(SVG) ---------- */
  function wxRing(pct, favor) {
    const els = ['木', '火', '土', '金', '水'];
    const C = { 木: '#4ade80', 火: '#fb7185', 土: '#fbbf24', 金: '#d4d9e6', 水: '#60a5fa' };
    const cx = 100, cy = 100, R = 62;
    let paths = '', labels = '', lines = '';
    // 相生環(順時針)
    els.forEach((e, i) => {
      const a = (i / 5) * Math.PI * 2 - Math.PI / 2;
      const x = cx + R * Math.cos(a), y = cy + R * Math.sin(a);
      const r = 12 + (pct[e] / 100) * 26;
      const isF = favor && favor.includes(e);
      paths += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${r.toFixed(1)}" fill="${C[e]}" fill-opacity="${isF ? .34 : .13}" stroke="${C[e]}" stroke-width="${isF ? 2.4 : 1}" ${isF ? 'stroke-dasharray="none"' : 'stroke-opacity=".5"'}/>`;
      labels += `<text x="${x.toFixed(1)}" y="${(y + 6).toFixed(1)}" text-anchor="middle" fill="${C[e]}" font-size="19" font-weight="700" font-family="serif">${e}</text>`;
      labels += `<text x="${x.toFixed(1)}" y="${(y + r + 14).toFixed(1)}" text-anchor="middle" fill="${C[e]}" font-size="10" opacity=".8" font-family="monospace">${pct[e]}%</text>`;
      // 相生線(指向下一個)
      const a2 = ((i + 1) / 5) * Math.PI * 2 - Math.PI / 2;
      const x2 = cx + R * Math.cos(a2), y2 = cy + R * Math.sin(a2);
      lines += `<line x1="${x.toFixed(1)}" y1="${y.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" stroke="${C[e]}" stroke-opacity=".22" stroke-width="1.4"/>`;
      // 相剋線(隔一個)
      const a3 = ((i + 2) / 5) * Math.PI * 2 - Math.PI / 2;
      const x3 = cx + R * Math.cos(a3), y3 = cy + R * Math.sin(a3);
      lines += `<line x1="${x.toFixed(1)}" y1="${y.toFixed(1)}" x2="${x3.toFixed(1)}" y2="${y3.toFixed(1)}" stroke="#ffffff" stroke-opacity=".07" stroke-width="1" stroke-dasharray="3 4"/>`;
    });
    return `<svg viewBox="0 0 200 200" style="width:100%;height:auto">${lines}${paths}${labels}</svg>`;
  }

  /* ---------- 捲動動畫 ---------- */
  function initReveal() {
    const els = $$('.reveal');
    if (!els.length) return;
    if (!('IntersectionObserver' in window)) return els.forEach(e => e.classList.add('in'));
    const io = new IntersectionObserver(en => en.forEach(x => {
      if (x.isIntersecting) { x.target.classList.add('in'); io.unobserve(x.target); }
    }), { threshold: 0.08, rootMargin: '0px 0px -40px 0px' });
    els.forEach((e, i) => { e.style.transitionDelay = (i % 6) * 60 + 'ms'; io.observe(e); });
  }

  /* ---------- 手風琴 ---------- */
  function initAcc(root) {
    $$('.acc-head', root || document).forEach(h => {
      h.onclick = () => h.parentElement.classList.toggle('open');
    });
  }

  /* ---------- 頁面初始化 ---------- */
  function boot(activePage) {
    S.init();
    renderNav(activePage);
    renderFooter();
    ensureDrawer();
    initReveal();
    initAcc();
    S.on('cart', updateBadge);
    document.addEventListener('keydown', e => { if (e.key === 'Escape') closeCart(); });
  }

  /* ---------- 下載工具 ---------- */
  function download(filename, content, mime) {
    const blob = new Blob([mime && mime.indexOf('csv') >= 0 ? '\uFEFF' + content : content], { type: mime || 'text/plain;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  }

  function copyText(t) {
    if (navigator.clipboard) return navigator.clipboard.writeText(t).then(() => toast('已複製到剪貼簿', 'ok'));
    const ta = document.createElement('textarea');
    ta.value = t; document.body.appendChild(ta); ta.select();
    document.execCommand('copy'); ta.remove(); toast('已複製', 'ok');
  }

  /* ---------- 匯出 ---------- */
  global.App = {
    $, $$, money, esc, dt, toast, boot,
    renderNav, renderFooter, updateBadge,
    openCart, closeCart, renderCart, addItem,
    productCard, bindAddButtons,
    wxBars, wxRing, initReveal, initAcc,
    download, copyText, ICON, LOGO, kindOf
  };

})(typeof window !== 'undefined' ? window : globalThis);
