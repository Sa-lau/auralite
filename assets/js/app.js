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
    { href: 'index.html', key: 'nav.home', label: '首頁' },
    { href: 'bazi.html', key: 'nav.bazi', label: '八字定制' },
    { href: 'shop.html', key: 'nav.shop', label: '晶石選購' },
    { href: 'knowledge.html', key: 'nav.knowledge', label: '水晶百科' },
    { href: 'orders.html', key: 'nav.orders', label: '訂單查詢' }
  ];

  /* ---------- 導覽列 ---------- */
  function renderNav(active) {
    const el = $('#nav');
    if (!el) return;
    el.className = 'nav';
    el.innerHTML = `<div class="nav-inner">
      <a href="index.html" class="brand"><span class="brand-svg">${LOGO}</span><img class="brand-logo-img" src="" alt="店鋪 Logo" style="height:32px;width:auto;display:none"><span>極晶閣<span class="brand-sub">AURALITE</span></span></a>
      <button class="nav-toggle" id="navToggle" aria-label="選單">${ICON.menu}</button>
      <nav class="nav-links" id="navLinks">
        ${NAV_ITEMS.map(i => `<a href="${i.href}"${i.href === active ? ' class="active"' : ''}>${I18N.t(i.key, i.label)}</a>`).join('')}
      </nav>
      <button class="nav-lang" id="langBtn" aria-label="Language">${I18N.getLang() === 'en' ? '中' : 'EN'}</button>
      <button class="nav-cart" id="cartBtn">${ICON.cart}<span class="nav-cart-label">${I18N.t('nav.cart', '購物車')}</span><span class="cart-badge" id="cartBadge">0</span></button>
    </div>`;
    $('#navToggle').onclick = () => $('#navLinks').classList.toggle('open');
    $('#langBtn').onclick = () => I18N.toggle();
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
        <div class="brand" style="margin-bottom:12px"><span class="brand-svg">${LOGO}</span><img class="brand-logo-img" src="" alt="店鋪 Logo" style="height:34px;width:auto;display:none"><span>極晶閣<span class="brand-sub">AURALITE</span></span></div>
        <p class="small muted" style="max-width:330px">${I18N.t('footer.desc', '以正統子平八字為據,為您推算五行喜忌,配對相應能量水晶。天然原礦,一人一命一盤,量身定制。')}</p>
      </div>
      <div><h4>${I18N.t('footer.shop', '選購')}</h4>
        <a href="shop.html">${I18N.t('footer.all', '全部商品')}</a><a href="bazi.html">${I18N.t('footer.bazi', '八字定制')}</a>
        <a href="shop.html?el=木">${I18N.t('footer.wood', '木屬性水晶')}</a><a href="shop.html?el=火">${I18N.t('footer.fire', '火屬性水晶')}</a>
        <a href="shop.html?el=水">${I18N.t('footer.water', '水屬性水晶')}</a></div>
      <div><h4>${I18N.t('footer.knowledge', '知識')}</h4>
        <a href="knowledge.html#purify">${I18N.t('footer.purify', '淨化與消磁')}</a><a href="knowledge.html#wear">${I18N.t('footer.wear', '佩戴法則')}</a>
        <a href="knowledge.html#wuxing">${I18N.t('footer.wuxing', '五行原理')}</a><a href="knowledge.html#fake">${I18N.t('footer.fake', '真偽辨識')}</a></div>
      <div><h4>${I18N.t('footer.service', '服務')}</h4>
        <a href="orders.html">${I18N.t('footer.orderQuery', '訂單查詢')}</a><a href="admin.html">${I18N.t('footer.admin', '後台管理')}</a>
        <a href="knowledge.html#chakra">${I18N.t('footer.chakra', '脈輪對照')}</a></div>
    </div>
    <div class="footer-bottom">
      <span>${I18N.t('footer.copy', '© ' + new Date().getFullYear() + ' 極晶閣 Auralite · 本站命理內容僅供參考,不構成醫療或投資建議')}</span>
      <span>${I18N.t('footer.local', '資料儲存於您的瀏覽器本機')}</span>
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

  function kindOf(id) { if (String(id).indexOf('custom-') === 0) return 'custom'; return Store.getServices().some(s => s.id === id) ? 'service' : 'product'; }
  function svcIcon(id) { const s = Store.getServices().find(x => x.id === id); return s ? s.icon : '◇'; }

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
    const stockTxt = p.stock === 0 ? I18N.t('card.soldout', '售罄') : (p.stock <= 5 ? I18N.t('card.low', '僅剩 ') + p.stock : I18N.t('card.instock', '現貨 ') + p.stock);
    const en = I18N.getLang() === 'en';
    const elBadge = en ? I18N.elEn(p.element) : p.element;
    const formLabel = en ? (I18N.t('card.form.' + p.form, p.formLabel) || p.formLabel) : p.formLabel;
    const name = I18N.data(p, 'name');
    const sub = en ? esc(p.name) : esc(p.en || '');
    return `<article class="prod-card" data-pid="${p.id}">
      <div class="prod-img" data-zoom>
        ${CD.crystalSVG(p.form, p.colors[0], p.colors[1], p.colors[2], 'p' + p.id.replace(/[^a-z0-9]/gi, ''))}
        ${prodImgTag(p)}
        ${opts.matchLabel ? `<span class="badge-match">${opts.matchLabel}</span>` : ''}
        <span class="badge-stock ${stockCls}">${stockTxt}</span>
        <span class="zoom-hint">${I18N.t('card.zoom', '🔍 點擊放大')}</span>
      </div>
      <div class="prod-body">
        <div class="row" style="gap:7px"><span class="wx wx-${p.element}"><span class="dot"></span>${elBadge}</span><span class="tag">${formLabel}</span></div>
        <div>
          <div class="prod-name">${esc(name)}</div>
          <div class="prod-en">${sub}</div>
        </div>
        <div class="tiny faint">${esc(p.spec)}${p.note ? ' · ' + esc(p.note) : ''}</div>
        <div class="prod-foot">
          <div class="prod-price">${money(p.price)}</div>
          <div class="spacer"></div>
          <button class="btn btn-primary btn-sm" data-add="${p.id}" ${p.stock === 0 ? 'disabled' : ''}>${p.stock === 0 ? I18N.t('card.soldout', '售罄') : I18N.t('card.add', '加入')}</button>
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

  /* ---------- 通用 lightbox 觸發(產品/水晶) ---------- */
  // 監聽整個容器的 click,排除「加入」按鈕、accordion 切換
  function bindZoomInGrid(grid, type) {
    if (!grid) return;
    if (grid._zoomBound) return;
    grid._zoomBound = true;
    grid.addEventListener('click', e => {
      // 排除加入按鈕
      if (e.target.closest('[data-add]')) return;
      // 排除 modal 開啟按鈕
      if (e.target.closest('[data-modal-open]')) return;
      const card = e.target.closest('.prod-card') || e.target.closest('.crystal-card');
      if (!card) return;
      e.preventDefault();
      if (type === 'crystal' && card.dataset.cid) {
        App.openCrystalLightbox(card.dataset.cid);
      } else {
        const p = S.getProduct(card.dataset.pid);
        if (!p) return;
        // 放大只需跟著原圖:與商品卡 prodImgTag 同一鏈,確保來源一致
        const c = CD.getCrystal(p.crystalId);
        const photo = (c && c.img) || p.img || (c && CD.CRYSTAL_IMG && CD.CRYSTAL_IMG[c.id]);
        if (photo) {
          App.openImageLightbox(photo, p.name);
        } else if (p.crystalId) {
          App.openCrystalLightbox(p.crystalId);
        } else {
          App.toast('此商品未綁定水晶資料', 'err');
        }
      }
    });
  }

  /* ---------- 五行條 ---------- */
  function wxBars(pct, favor, avoid) {
    const C = { 木: 'var(--wx-wood)', 火: 'var(--wx-fire)', 土: 'var(--wx-earth)', 金: 'var(--wx-metal)', 水: 'var(--wx-water)' };
    const en = (typeof I18N !== 'undefined' && I18N.getLang() === 'en');
    const L = e => en ? I18N.elEn(e) : e;
    const max = Math.max(...Object.values(pct), 1);
    return `<div class="wx-bars">${['木', '火', '土', '金', '水'].map(e => {
      const isF = favor && favor.includes(e), isA = avoid && avoid.includes(e);
      return `<div class="wx-bar-row">
        <div class="row" style="gap:5px"><span class="el-${e}" style="font-weight:700;font-size:1.05rem;font-family:var(--font-serif)">${L(e)}</span></div>
        <div class="wx-bar-track"><div class="wx-bar-fill" style="width:${(pct[e] / max * 100).toFixed(1)}%;background:linear-gradient(90deg,${C[e]},${C[e]}88)"></div></div>
        <div style="text-align:right"><span class="mono small">${pct[e]}%</span>
        ${isF ? `<span class="tiny pos" style="display:block;line-height:1">${I18N.t('wx.favor','喜用')}</span>` : isA ? `<span class="tiny" style="display:block;line-height:1;color:var(--text-faint)">${I18N.t('wx.avoid','節制')}</span>` : ''}</div>
      </div>`;
    }).join('')}</div>`;
  }

  /* ---------- 五行環(SVG) ---------- */
  function wxRing(pct, favor) {
    const els = ['木', '火', '土', '金', '水'];
    const C = { 木: '#4ade80', 火: '#fb7185', 土: '#fbbf24', 金: '#d4d9e6', 水: '#60a5fa' };
    const en = (typeof I18N !== 'undefined' && I18N.getLang() === 'en');
    const L = e => en ? I18N.elEn(e) : e;
    const cx = 100, cy = 100, R = 62;
    let paths = '', labels = '', lines = '';
    // 相生環(順時針)
    els.forEach((e, i) => {
      const a = (i / 5) * Math.PI * 2 - Math.PI / 2;
      const x = cx + R * Math.cos(a), y = cy + R * Math.sin(a);
      const r = 12 + (pct[e] / 100) * 26;
      const isF = favor && favor.includes(e);
      paths += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${r.toFixed(1)}" fill="${C[e]}" fill-opacity="${isF ? .34 : .13}" stroke="${C[e]}" stroke-width="${isF ? 2.4 : 1}" ${isF ? 'stroke-dasharray="none"' : 'stroke-opacity=".5"'}/>`;
      labels += `<text x="${x.toFixed(1)}" y="${(y + 6).toFixed(1)}" text-anchor="middle" fill="${C[e]}" font-size="19" font-weight="700" font-family="serif">${L(e)}</text>`;
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

  /* ---------- 品牌 Logo 套用 ---------- */
  /* ---------- 資料即時同步 ----------
   後台改了產品/服務/晶石可見性/設定 → 切回或重新聚焦此分頁時自動 re-render。
   同分頁(history.back 或 location.href=...回來)會觸發 pageshow；
   跨分頁(localStorage 變更)會觸發 storage 事件；
   同分頁內也可監聽 Store 的 'products'/'services'/'hidden'/'settings' 主動 emit。
   用法:App.bindStoreRefresh(() => render());
*/
function bindStoreRefresh(refresh) {
  if (typeof refresh !== 'function') return;
  // 同分頁內(後台跳過來、或本頁面內操作)
  ['products', 'services', 'hidden', 'settings', 'text'].forEach(evt => S.on(evt, () => {
    try { refresh(); } catch (err) { console.error(err); }
    // 文字類事件另外重新套用 data-t 元素
    if (evt === 'text' && typeof I18N !== 'undefined' && I18N.applyText) {
      try { I18N.applyText(); } catch (e) {}
    }
  }));
  // 跨分頁 — localStorage 變更時
  window.addEventListener('storage', e => {
    const k = e.key || '';
    if (/^cw_/.test(k)) {
      try { refresh(); } catch (err) { console.error(err); }
      if (k === 'cw_text' && typeof I18N !== 'undefined' && I18N.applyText) {
        try { I18N.applyText(); } catch (e) {}
      }
    }
  });
  // 從 history.back / 切回前景分頁 / 一頁載入完成 (cached) — 重新抓資料
  window.addEventListener('pageshow', e => {
    try { refresh(); } catch (err) { console.error(err); }
    if (typeof I18N !== 'undefined' && I18N.applyText) { try { I18N.applyText(); } catch (e) {} }
  });
  window.addEventListener('focus', () => {
    try { refresh(); } catch (err) { console.error(err); }
    if (typeof I18N !== 'undefined' && I18N.applyText) { try { I18N.applyText(); } catch (e) {} }
  });
}

function applyLogo() {
    const logo = (Store.getSettings().logo || '').trim();
    document.querySelectorAll('.brand-logo-img').forEach(img => {
      if (logo) { img.src = logo; img.style.display = ''; }
      else { img.removeAttribute('src'); img.style.display = 'none'; }
    });
    document.querySelectorAll('.brand-svg').forEach(s => { s.style.display = logo ? 'none' : ''; });
    const hero = document.getElementById('heroLogo');
    if (hero) { if (logo) { hero.src = logo; hero.style.display = ''; } else { hero.style.display = 'none'; } }
  }

  /* ---------- 頁面初始化 ---------- */
  function boot(activePage) {
    S.init();
    App._active = activePage;
    renderNav(activePage);
    renderFooter();
    applyLogo();
    ensureDrawer();
    initReveal();
    initAcc();
    S.on('cart', updateBadge);
    document.addEventListener('keydown', e => { if (e.key === 'Escape') closeCart(); });
    // 雙語:套用靜態 data-i18n + 設定 html lang
    document.documentElement.lang = I18N.getLang() === 'en' ? 'en' : 'zh-Hant';
    I18N.apply();
    I18N.onLangChange(() => {
      document.documentElement.lang = I18N.getLang() === 'en' ? 'en' : 'zh-Hant';
      renderNav(App._active); renderFooter(); I18N.apply(); applyLogo();
    });
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

  /** 訂單狀態 → CSS class */
  function statusClass(st) {
    const M = { '待處理': 'pending', '出貨中': 'shipped', 'PDF': 'pdf', '完成': 'done', '已完成': 'done', '已取消': 'cancel' };
    return M[st] || 'pending';
  }

  /* ---------- 圖片放大燈箱 ---------- */
  function lightbox(html, title) {
    let box = document.getElementById('lightbox');
    if (!box) {
      box = document.createElement('div');
      box.className = 'lightbox'; box.id = 'lightbox';
      box.innerHTML = '<div class="lightbox-mask"></div><div class="lightbox-box"><button class="lightbox-close" aria-label="關閉">&times;</button><div class="lightbox-title"></div><div class="lightbox-body"></div></div>';
      document.body.appendChild(box);
      box.querySelector('.lightbox-mask').onclick = closeLightbox;
      box.querySelector('.lightbox-close').onclick = closeLightbox;
      document.addEventListener('keydown', e => { if (e.key === 'Escape') closeLightbox(); });
    }
    box.querySelector('.lightbox-title').textContent = title || '';
    box.querySelector('.lightbox-body').innerHTML = html;
    box.classList.add('open');
    document.body.style.overflow = 'hidden';
  }
  function closeLightbox() {
    const b = document.getElementById('lightbox');
    if (b) b.classList.remove('open');
    document.body.style.overflow = '';
  }
  /** 打開某水晶的放大圖(SVG + 實拍) */
  function openCrystalLightbox(crystalId) {
    const c = CD.getCrystal(crystalId);
    if (!c) return;
    const product = Store.getProducts().find(p => p.crystalId === crystalId && p.img) || null;
    const photo = product && product.img ? `<img class="lb-photo" src="${esc(product.img)}" alt="${esc(c.name)}" onerror="this.style.display='none'">` : '';
    const svg = CD.crystalSVG('cluster', c.colors[0], c.colors[1], c.colors[2], 'lb' + crystalId);
    const html = `<div class="lb-stage">${svg}${photo}</div>
      <div class="lb-meta">
        <div class="row" style="gap:8px;align-items:center;justify-content:center"><span class="wx wx-${c.element}"><span class="dot"></span>${c.element}</span><strong style="font-size:1.15rem">${esc(c.name)}</strong></div>
        <div class="tiny faint">${esc(c.en)} · ${esc(c.chakra)} · 硬度 ${esc(c.hardness)}</div>
        <p class="small muted" style="line-height:1.7;margin-top:10px;text-align:left">${esc(c.story)}</p>
      </div>`;
    lightbox(html, c.name);
  }

  /* ---------- 八字詳列報告(PDF) — 共用建構器 ---------- */
  function elColorBazi(e){ return { 木:'#16a34a', 火:'#ef4444', 土:'#d97706', 金:'#ca8a04', 水:'#2563eb' }[e] || '#0f172a'; }
  function buildBaziReportHtml(R, recAll, cust) {
    const s = Store.getSettings();
    const logo = (s.logo || '').trim();
    const logoHtml = logo ? `<div style="text-align:center;margin-bottom:18px"><img src="${logo}" alt="logo" style="max-height:74px;max-width:260px;object-fit:contain"></div>` : '';
    const en = (typeof I18N !== 'undefined' && I18N.getLang() === 'en');
    const L = e => en ? I18N.elEn(e) : e;
    const T = (k, zh) => (typeof I18N !== 'undefined' && I18N.t) ? I18N.t(k, zh) : zh;
    const bars = ['木','火','土','金','水'].map(e => {
      const pct = R.pct[e] || 0;
      return `<div style="display:flex;align-items:center;gap:10px;margin:6px 0">
        <div style="width:34px;font-weight:700">${L(e)}</div>
        <div style="flex:1;height:14px;background:#eef2f4;border-radius:7px;overflow:hidden">
          <div style="width:${pct}%;height:100%;background:linear-gradient(90deg,#14b8a6,#38bdf8)"></div></div>
        <div style="width:46px;text-align:right;font-variant-numeric:tabular-nums">${pct}%</div></div>`;
    }).join('');
    const pillarRows = R.pillars.map(p => `<td style="border:1px solid #cbd5e1;padding:8px 6px;text-align:center;vertical-align:top">
        <div style="font-weight:700;color:#0f172a">${en ? p.labelEn : p.label}${p.key==='day'?(en?'<br>(Self)':'<br>(命主)'):''}</div>
        <div style="font-size:1.4rem;font-family:serif;margin:4px 0">
          <span style="color:${elColorBazi(p.ganEl)}">${en ? p.ganCharEn : p.ganChar}</span> <span style="color:${elColorBazi(p.zhiEl)}">${en ? p.zhiCharEn : p.zhiChar}</span></div>
        <div style="font-size:.78rem;color:#475569">${en ? (p.ganYYEn + ' ' + L(p.ganEl)) : (p.ganYY + p.ganEl)} · ${en ? (p.zhiYYEn + ' ' + L(p.zhiEl)) : (p.zhiYY + p.zhiEl)}</div>
        <div style="font-size:.74rem;color:#14b8a6;margin-top:2px">${en ? (BaZi.SHISHEN_EN[p.shishen] || p.shishen) : p.shishen}</div>
        <div style="font-size:.72rem;color:#94a3b8;margin-top:4px">${en ? 'Hidden: ' : '藏干 '}${BaZi.HIDDEN[p.zhiChar].map(g=>en?BaZi.GAN_PINYIN[g]:BaZi.GAN[g]).join(' ')}${en?'':('<br>'+p.nayin)}</div></td>`).join('');
    const recRows = (recAll || []).slice(0, 8).map((p, i) => `<tr>
        <td style="border:1px solid #cbd5e1;padding:6px 8px">${i+1}</td>
        <td style="border:1px solid #cbd5e1;padding:6px 8px;font-weight:600;color:${elColorBazi(p.element)}">${App.esc(I18N.data(p,'name'))}</td>
        <td style="border:1px solid #cbd5e1;padding:6px 8px;text-align:center">${L(p.element)}</td>
        <td style="border:1px solid #cbd5e1;padding:6px 8px;text-align:right">${money(p.price)}</td></tr>`).join('');
    const i = R.input;
    const sections = Store.getBaziReportSections().filter(x => x.enabled !== false);
    const sectionsHtml = sections.map(sec => `
      <h2 style="font-size:1.15rem;margin:26px 0 10px;border-left:5px solid #14b8a6;padding-left:10px">${App.esc(sec.title || '')}</h2>
      <div style="white-space:pre-wrap;line-height:1.85">${App.esc(sec.body || '')}</div>`).join('');
    const urlHtml = s.baziReportUrl ? `<div style="margin-top:10px;color:#475569">${T('rep.tpl','店主報告範本')}:<a href="${App.esc(s.baziReportUrl)}">${App.esc(s.baziReportUrl)}</a></div>` : '';
    // 客戶資料卡(後台手填):顯示於標題下方
    let custBlock = '';
    if (cust && cust.show !== false) {
      const rows = [];
      if (cust.name) rows.push(`<div><b>${T('rep.cust','客戶')}：</b>${App.esc(cust.name)}</div>`);
      if (cust.contact) rows.push(`<div><b>${T('rep.contact','聯絡')}：</b>${App.esc(cust.contact)}</div>`);
      if (cust.orderNo) rows.push(`<div><b>${T('rep.order','訂單編號')}：</b>${App.esc(cust.orderNo)}</div>`);
      if (cust.items && cust.items.trim()) rows.push(`<div style="margin-top:6px"><b>${T('rep.items','訂購項目')}：</b></div><div style="white-space:pre-wrap;margin-top:2px">${App.esc(cust.items)}</div>`);
      if (cust.notes && cust.notes.trim()) rows.push(`<div style="margin-top:6px"><b>${T('rep.notes','備註')}：</b></div><div style="white-space:pre-wrap;margin-top:2px">${App.esc(cust.notes)}</div>`);
      if (rows.length) custBlock = `<h2 style="font-size:1.15rem;margin:22px 0 10px;border-left:5px solid #14b8a6;padding-left:10px">${T('rep.custTitle','客戶資料與訂單')}</h2><div class="note">${rows.join('')}</div>`;
    }
    const dmGan = en ? BaZi.GAN_PINYIN[R.dayMaster.index] : R.dayMaster.gan;
    const dmSub = en ? (R.dayMaster.yyEn + ' ' + L(R.dayMaster.el)) : (R.dayMaster.yy + R.dayMaster.el);
    const strTxt = en ? BaZi.STRENGTH_EN[R.strength] : R.strength;
    const logicTxt = en ? R.logicEn : R.logic;
    const sumTxt = en ? R.summaryEn : R.summary;
    const tiaoTxt = en ? (R.tiaohou ? R.tiaohou.whyEn : '') : (R.tiaohou ? R.tiaohou.why : '');
    const favTags = R.favor.map(e => `<span class="tag">${L(e)}</span>`).join('');
    const avoidTags = R.avoid.map(e => `<span class="tag" style="background:#fef2f2;color:#b91c1c;border-color:#fecaca">${L(e)}</span>`).join('');
    return `<!DOCTYPE html><html lang="${en?'en':'zh-Hant'}"><head><meta charset="UTF-8">
<title>${en ? 'BaZi Deep Reading Report' : '八字命盤深度解析報告'} · ${App.esc(s.shopName || '極晶閣 Auralite')}</title>
<style>
  *{box-sizing:border-box} body{font-family:"PingFang HK","Microsoft YaHei",sans-serif;color:#1e293b;max-width:760px;margin:0 auto;padding:36px 28px;line-height:1.7}
  h1{font-size:1.7rem;margin:0 0 4px} h2{font-size:1.15rem;margin:26px 0 10px;border-left:5px solid #14b8a6;padding-left:10px}
  .sub{color:#64748b;margin:0 0 18px} table{border-collapse:collapse;width:100%} .muted{color:#64748b;font-size:.85rem}
  .tag{display:inline-block;background:#ecfeff;color:#0e7490;border:1px solid #a5f3fc;border-radius:999px;padding:3px 12px;margin:3px;font-size:.85rem}
  .note{background:#f1f5f9;border-radius:10px;padding:12px 14px;margin-top:14px;color:#334155}
  footer{margin-top:28px;border-top:1px solid #e2e8f0;padding-top:12px;color:#94a3b8;font-size:.78rem}
</style></head><body>
  ${logoHtml}
  <h1>${en ? 'BaZi Deep Reading Report' : '八字命盤深度解析報告'}</h1>
  <p class="sub">${App.esc(s.shopName || '極晶閣 Auralite')} · ${en ? 'Generated ' : '生成時間 '}${new Date().toLocaleString(en ? 'en-US' : 'zh-HK')}</p>
  <div class="note">${en ? 'Birth chart of:' : '命主生辰:'}<b>${i.y} ${en?'Y':'年'} ${i.m} ${en?'M':'月'} ${i.d} ${en?'D':'日'} ${String(i.h).padStart(2,'0')}:${String(i.mi||0).padStart(2,'0')}</b> · ${en ? (i.gender==='男'?'Male':i.gender==='女'?'Female':i.gender) : i.gender} · ${en?'Time Zone UTC':'時區 UTC'}${i.tz>=0?'+':''}${i.tz}<br>
    ${en ? 'Zodiac: ' : '生肖 '}${en ? R.zodiacEn : R.zodiac} · ${en ? 'Term: ' : '節令 '}${en ? R.jieNameEn : R.jieName}</div>
  ${custBlock}

  <h2>${en ? '1. Four Pillars (BaZi)' : '一、四柱八字'}</h2>
  <table><tr>${pillarRows}</tr></table>

  <h2>${en ? '2. Five-Element Strength' : '二、五行力量分佈'}</h2>
  ${bars}
  <div class="muted" style="margin-top:6px">${en ? `Same-faction (supporting the Day Master) strength: ${R.supportPct}%.` : `同黨(生扶日主)力量占比 ${R.supportPct}%。`}</div>

  <h2>${en ? '3. Day Master & Strength' : '三、日主與強弱'}</h2>
  <p>${en ? 'Day Master' : '日主'} <b style="font-size:1.2rem;color:${elColorBazi(R.dayMaster.el)}">${dmGan}</b>(${dmSub}),${en ? ' assessed as ' : '命格判為 '}<b>${strTxt}</b>。${en ? R.strengthDescEn : R.strengthDesc}</p>
  <div>${en ? 'Favorable: ' : '喜用神：'}${favTags}</div>
  <div>${en ? 'Moderate: ' : '節制：'}${avoidTags}</div>

  <h2>${en ? '4. Logic & Seasonal Adjustment' : '四、命理邏輯與調候'}</h2>
  <div class="note">${logicTxt}</div>
  ${R.tiaohou?`<div class="note" style="background:#fffbeb;border-color:#fde68a;color:#92400e"><b>${en?'Seasonal Adjustment':'調候補充'}</b>——${tiaoTxt}</div>`:''}
  <div class="note">${sumTxt}</div>

  <h2>${en ? '5. Crystal Recommendations' : '五、配石建議'}</h2>
  <p class="muted">${en ? 'Recommendations are ordered by priority of favorable elements; add to cart from the shop page, or add the "BaZi Deep Reading Report" for the owner’s personal notes.' : '依喜用神優先序推薦,可到選購頁加入購物車,或加購「八字深度解析報告」由店主依個人筆記詳批。'}</p>
  <table><thead><tr><th style="border:1px solid #cbd5e1;padding:6px 8px;text-align:left">#</th><th style="border:1px solid #cbd5e1;padding:6px 8px;text-align:left">${en?'Crystal':'水晶'}</th><th style="border:1px solid #cbd5e1;padding:6px 8px">${en?'Element':'五行'}</th><th style="border:1px solid #cbd5e1;padding:6px 8px;text-align:right">${en?'Suggested Price':'建議售價'}</th></tr></thead><tbody>${recRows}</tbody></table>

  ${sectionsHtml}
  ${urlHtml}

  <footer>${en ? 'This report is auto-generated by the Four-Pillars (Zi Ping) algorithm for reference only; it is not medical, legal or investment advice. © ' : '本報告由子平四柱演算法自動生成,僅供命理參考,不構成醫療、法律或投資建議。© '}${new Date().getFullYear()} ${App.esc(s.shopName || '極晶閣 Auralite')}</footer>
  <script>window.onload=function(){setTimeout(function(){window.print();},300);};<\/script>
</body></html>`;
  }
  function previewBaziReport() {
    if (typeof BaZi === 'undefined' || !BaZi.calculate) { App.toast('排盤引擎未載入', 'err'); return; }
    const c = Store.getSettings().baziReportCustomer || {};
    let R = null;
    if (c.y && c.m && c.d) {
      try {
        R = BaZi.calculate({
          y: +c.y, m: +c.m, d: +c.d,
          h: (c.h !== '' && c.h != null) ? +c.h : 12,
          mi: (c.mi !== '' && c.mi != null) ? +c.mi : 0,
          tz: (c.tz !== '' && c.tz != null) ? +c.tz : 8,
          gender: c.gender || '女'
        });
      } catch (e) { R = null; }
    }
    if (!R) {
      try { R = BaZi.calculate({ y: 1990, m: 5, d: 15, h: 10, mi: 30, tz: 8, gender: '男' }); }
      catch (e) { return App.toast('範例排盤失敗', 'err'); }
    }
    const recAll = (typeof CrystalData !== 'undefined' && CrystalData.recommendByElements)
      ? CrystalData.recommendByElements(R.favor, R.avoid, { products: Store.getProducts() }) : [];
    const html = buildBaziReportHtml(R, recAll, c);
    const w = window.open('', '_blank');
    if (!w) { App.toast('瀏覽器阻擋了新視窗,請允許彈出後再試', 'err'); return; }
    w.document.open(); w.document.write(html); w.document.close();
    App.toast('已開啟範例八字詳列報告,可按「另存為 PDF」或列印', 'ok');
  }
  function openImageLightbox(src, alt) {
    const html = `<div style="display:flex;justify-content:center;align-items:center;min-height:58vh">
      <img src="${esc(src)}" alt="${esc(alt || '')}" style="max-width:min(94vw,980px);max-height:90vh;width:auto;height:auto;border-radius:18px;box-shadow:0 24px 70px rgba(0,0,0,.55)">
    </div>`;
    lightbox(html, alt || '');
  }

  /* ---------- 匯出 ---------- */
  global.App = {
    $, $$, money, esc, dt, toast, boot,
    renderNav, renderFooter, applyLogo, updateBadge, bindStoreRefresh,
    openCart, closeCart, renderCart, addItem,
    productCard, bindAddButtons, bindZoomInGrid,
    wxBars, wxRing, initReveal, initAcc,
    download, copyText, statusClass, ICON, LOGO, kindOf,
    buildBaziReportHtml, previewBaziReport, openImageLightbox,
    lightbox, closeLightbox, openCrystalLightbox,
    t: I18N.t, i18nData: I18N.data, elEn: I18N.elEn, chakraEn: I18N.chakraEn,
    onLangChange: I18N.onLangChange, getLang: I18N.getLang, setLang: I18N.setLang,
    /**
     * 店主可編輯文案:優先讀 cw_text(後台「頁面文案」管理),否則用頁面傳入的預設。
     * @param {string} key 文案鍵
     * @param {string} zhDefault 中文預設(若 cw_text 沒此 key 或值為空則用)
     * @param {string} [enDefault] 英文預設(若 cw_text 沒此 key 或值為空則用);若未傳,英文模式退回中文
     * @returns {string}
     */
    T: function (key, zhDefault, enDefault) {
      try {
        const all = (Store && Store.getAllText) ? Store.getAllText() : null;
        const e = all ? all[key] : null;
        const lang = I18N.getLang();
        if (e) {
          if (lang === 'en') {
            if (e.en != null && e.en !== '') return e.en;
            if (enDefault) return enDefault;
            if (e.zh != null && e.zh !== '') return e.zh;
            return zhDefault || '';
          }
          if (e.zh != null && e.zh !== '') return e.zh;
          return zhDefault || '';
        }
      } catch (err) { /* Store 未載入,退回預設 */ }
      if (I18N.getLang() === 'en' && enDefault) return enDefault;
      return zhDefault || '';
    }
  };

})(typeof window !== 'undefined' ? window : globalThis);
