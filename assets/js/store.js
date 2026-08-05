/* ============================================================
   Store — 資料層(產品 / 訂單 / 購物車 / 設定)+ Email 發送
   儲存:localStorage,鍵名前綴 cw_
   ============================================================ */

(function (global) {
  'use strict';

  const K = {
    products: 'cw_products',
    orders: 'cw_orders',
    cart: 'cw_cart',
    settings: 'cw_settings',
    bazi: 'cw_bazi_last',
    seq: 'cw_order_seq',
    services: 'cw_services',
    hidden: 'cw_hidden_crystals'
  };

  // 訂單狀態(後台/訂單頁共用)
  const ORDER_STATUSES = ['待處理', '出貨中', 'PDF', '完成', '已取消'];

  const DEFAULT_SETTINGS = {
    shopName: '極晶閣 Auralite',
    currency: 'HKD',
    adminLogin: 'auralite',
    adminPass: 'crystal2026',
    ownerEmail: 'lazycouples@gmail.com',
    provider: 'none',           // none | emailjs | formspree | web3forms
    emailjs: { serviceId: '', templateId: '', publicKey: '' },
    formspree: { endpoint: '' },
    web3forms: { accessKey: '' },
    notifyCustomer: false,
    taxRate: 0,
    shippingFee: 40,
    freeShipAbove: 1000,
    lowStockAlert: 5,
    baziNotes: `【八字深度解析報告 · 解盤說明範本】
本報告以子平八字（四柱命理）為基礎，為您分析先天五行情況與後天補強方向。

★ 報告內容：
1. 四柱命盤：年、月、日、時天干地支，與您的「日主」（本命五行）。
2. 日主強弱：判斷身強或身弱，定出喜用神與忌神。
3. 五行佔比：金木水火土的分布，找出過旺或過弱之處。
4. 喜用神建議：適合您佩戴的五行水晶與對應顏色方向。
5. 配石建議：依喜用神挑選水晶（喜水配藍/黑、喜木配綠、喜火配紅/紫、喜土配黃/棕、喜金配白/金）。

※ 溫馨提示：水晶是陪伴有緣人的隨身能量夥伴，本報告僅供命理參考，不構成醫療、法律或投資建議。

（店家可在此填寫專屬解盤風格、收費說明或報告模板連結。）`,
    baziReportUrl: ''
  };

  /* ---------- 基礎讀寫 ---------- */
  function read(key, fallback) {
    try {
      const v = localStorage.getItem(key);
      return v ? JSON.parse(v) : fallback;
    } catch (e) { return fallback; }
  }
  function write(key, val) {
    try { localStorage.setItem(key, JSON.stringify(val)); return true; }
    catch (e) { console.error('儲存失敗', e); return false; }
  }

  /* ---------- 初始化 ---------- */
  function init() {
    if (!localStorage.getItem(K.products)) {
      write(K.products, JSON.parse(JSON.stringify(global.CrystalData.PRODUCTS)));
    }
    if (!localStorage.getItem(K.settings)) write(K.settings, DEFAULT_SETTINGS);
    if (!localStorage.getItem(K.orders)) write(K.orders, []);
    if (!localStorage.getItem(K.cart)) write(K.cart, []);
    if (!localStorage.getItem(K.seq)) write(K.seq, 1);
    if (!localStorage.getItem(K.services)) {
      write(K.services, JSON.parse(JSON.stringify(global.CrystalData.SERVICES || [])));
    }
    const _hiddenRaw = localStorage.getItem(K.hidden);
    if (_hiddenRaw === null || JSON.parse(_hiddenRaw || '[]').length === 0) {
      const bookIds = (global.CrystalData.CRYSTALS || []).filter(c => c.book).map(c => c.id);
      if (bookIds.length) write(K.hidden, bookIds);
    }
  }

  /* ---------- 設定 ---------- */
  const getSettings = () => Object.assign({}, DEFAULT_SETTINGS, read(K.settings, {}));
  const saveSettings = s => write(K.settings, Object.assign(getSettings(), s));
  function resetAll() {
    Object.values(K).forEach(k => localStorage.removeItem(k));
    init();
  }

  /* ---------- 產品 ---------- */
  const getProducts = () => read(K.products, []);
  const getProduct = id => getProducts().find(p => p.id === id);
  const saveProducts = list => write(K.products, list);

  function upsertProduct(p) {
    const list = getProducts();
    const i = list.findIndex(x => x.id === p.id);
    if (i >= 0) list[i] = Object.assign(list[i], p);
    else list.push(p);
    saveProducts(list);
    return p;
  }
  function deleteProduct(id) {
    saveProducts(getProducts().filter(p => p.id !== id));
  }
  function adjustStock(id, delta) {
    const list = getProducts();
    const p = list.find(x => x.id === id);
    if (p) { p.stock = Math.max(0, (p.stock || 0) + delta); saveProducts(list); }
  }

  /* ---------- 加購服務 ---------- */
  const getServices = () => read(K.services, []);
  const saveServices = list => write(K.services, list);
  function upsertService(s) {
    const list = getServices();
    const i = list.findIndex(x => x.id === s.id);
    if (i >= 0) list[i] = Object.assign(list[i], s);
    else list.push(s);
    saveServices(list);
    return s;
  }
  function deleteService(id) { saveServices(getServices().filter(s => s.id !== id)); }

  /* ---------- 晶石選購可見性(後台開關) ---------- */
  // 存入 cw_hidden_crystals 的字串陣列:被隱藏(不在選購頁出現)的水晶 id
  const getHiddenCrystals = () => read(K.hidden, []);
  const setHiddenCrystals = arr => write(K.hidden, arr);
  function isCrystalVisible(id) { return !getHiddenCrystals().includes(id); }
  function setCrystalVisible(id, visible) {
    const h = getHiddenCrystals();
    const i = h.indexOf(id);
    if (visible && i >= 0) h.splice(i, 1);
    if (!visible && i < 0) h.push(id);
    setHiddenCrystals(h);
  }

  /* ---------- 購物車 ---------- */
  const getCart = () => read(K.cart, []);
  const saveCart = c => { write(K.cart, c); emit('cart'); };

  function addToCart(id, qty, kind, meta) {
    qty = qty || 1;
    kind = kind || 'product';
    const cart = getCart();
    const line = cart.find(l => l.id === id);
    if (line) { line.qty += qty; if (meta) line.meta = meta; }
    else cart.push({ id, qty, kind, meta: meta || null });
    saveCart(cart);
    return cart;
  }
  function setQty(id, qty) {
    const cart = getCart();
    const line = cart.find(l => l.id === id);
    if (!line) return;
    if (qty <= 0) return removeFromCart(id);
    line.qty = qty;
    saveCart(cart);
  }
  function removeFromCart(id) { saveCart(getCart().filter(l => l.id !== id)); }
  function clearCart() { saveCart([]); }

  /** 展開購物車為含完整資料的明細 */
  function cartDetail() {
    const S = getSettings();
    const svc = getServices();
    const lines = getCart().map(l => {
      if (l.meta) {
        const m = l.meta;
        const price = +m.price || 0, cost = +m.cost || 0;
        return {
          id: l.id, kind: 'custom', qty: l.qty,
          name: m.name, en: m.en || '',
          spec: m.spec || '', formLabel: m.formLabel || '定制',
          element: m.element || '—', colors: m.colors || ['#14b8a6', '#38bdf8', '#0e7490'],
          form: m.form || 'pendant',
          price, cost,
          lineTotal: price * l.qty,
          lineCost: cost * l.qty,
          stock: 999
        };
      }
      const src = l.kind === 'service' ? svc.find(s => s.id === l.id) : getProduct(l.id);
      if (!src) return null;
      return {
        id: l.id, kind: l.kind, qty: l.qty,
        name: src.name, en: src.en || '',
        spec: src.spec || '', formLabel: src.formLabel || '定制服務',
        element: src.element || '—', colors: src.colors || ['#14b8a6', '#38bdf8', '#0e7490'],
        form: src.form || 'pendant',
        price: src.price, cost: src.cost,
        lineTotal: src.price * l.qty,
        lineCost: src.cost * l.qty,
        stock: src.stock == null ? 999 : src.stock
      };
    }).filter(Boolean);

    const subtotal = lines.reduce((s, l) => s + l.lineTotal, 0);
    const totalCost = lines.reduce((s, l) => s + l.lineCost, 0);
    const shipping = subtotal === 0 ? 0 : (subtotal >= S.freeShipAbove ? 0 : S.shippingFee);
    const tax = Math.round(subtotal * (S.taxRate / 100));
    const total = subtotal + shipping + tax;
    const profit = total - shipping - tax - totalCost;

    return {
      lines, subtotal, shipping, tax, total, totalCost, profit,
      margin: total ? +(profit / (subtotal || 1) * 100).toFixed(1) : 0,
      count: lines.reduce((s, l) => s + l.qty, 0)
    };
  }

  const cartCount = () => getCart().reduce((s, l) => s + l.qty, 0);

  /* ---------- 八字結果暫存 ---------- */
  const saveBazi = r => write(K.bazi, r);
  const getBazi = () => read(K.bazi, null);
  const clearBazi = () => localStorage.removeItem(K.bazi);

  /* ---------- 訂單 ---------- */
  const getOrders = () => read(K.orders, []);
  const getOrder = no => getOrders().find(o => o.no === no);

  function nextOrderNo() {
    const seq = read(K.seq, 1);
    write(K.seq, seq + 1);
    const d = new Date();
    const ymd = d.getFullYear() + String(d.getMonth() + 1).padStart(2, '0') + String(d.getDate()).padStart(2, '0');
    return 'CA-' + ymd + '-' + String(seq).padStart(4, '0');
  }

  /**
   * 建立訂單:寫入訂單、扣庫存、清空購物車
   */
  function createOrder(customer, opts) {
    opts = opts || {};
    const d = cartDetail();
    if (!d.lines.length) throw new Error('購物車為空');

    const bazi = opts.includeBazi === false ? null : getBazi();
    const order = {
      no: nextOrderNo(),
      createdAt: new Date().toISOString(),
      status: '待處理',
      tracking: '',
      baziReportNotes: '',
      customer,
      items: d.lines.map(l => ({
        id: l.id, kind: l.kind, name: l.name, spec: l.spec,
        formLabel: l.formLabel, element: l.element,
        qty: l.qty, price: l.price, cost: l.cost,
        lineTotal: l.lineTotal, lineCost: l.lineCost
      })),
      subtotal: d.subtotal, shipping: d.shipping, tax: d.tax, total: d.total,
      totalCost: d.totalCost, profit: d.profit, margin: d.margin,
      bazi: bazi ? {
        pillars: bazi.pillars.map(p => ({ label: p.label, gz: p.gz, shishen: p.shishen, nayin: p.nayin })),
        dayMaster: bazi.dayMaster, strength: bazi.strength, strengthIdx: bazi.strengthIdx,
        pct: bazi.pct, favor: bazi.favor, avoid: bazi.avoid,
        zodiac: bazi.zodiac, jieName: bazi.jieName, summary: bazi.summary,
        birth: `${bazi.input.y}-${String(bazi.input.m).padStart(2, '0')}-${String(bazi.input.d).padStart(2, '0')} ${String(bazi.input.h).padStart(2, '0')}:${String(bazi.input.mi || 0).padStart(2, '0')}`,
        gender: bazi.input.gender || '—'
      } : null,
      emailSent: false, emailError: null
    };

    // 扣庫存(僅實體商品)
    order.items.forEach(it => { if (it.kind === 'product') adjustStock(it.id, -it.qty); });

    const orders = getOrders();
    orders.unshift(order);
    write(K.orders, orders);
    clearCart();
    emit('order');
    return order;
  }

  function updateOrder(no, patch) {
    const orders = getOrders();
    const i = orders.findIndex(o => o.no === no);
    if (i < 0) return null;
    orders[i] = Object.assign(orders[i], patch);
    write(K.orders, orders);
    emit('order');
    return orders[i];
  }

  function deleteOrder(no) {
    write(K.orders, getOrders().filter(o => o.no !== no));
    emit('order');
  }

  /* ---------- 統計 ---------- */
  function stats() {
    const orders = getOrders();
    const valid = orders.filter(o => o.status !== '已取消');
    const revenue = valid.reduce((s, o) => s + o.total, 0);
    const cost = valid.reduce((s, o) => s + o.totalCost, 0);
    const profit = valid.reduce((s, o) => s + o.profit, 0);
    const products = getProducts();
    const inventoryValue = products.reduce((s, p) => s + p.cost * p.stock, 0);
    const inventoryRetail = products.reduce((s, p) => s + p.price * p.stock, 0);
    const low = products.filter(p => p.stock > 0 && p.stock <= getSettings().lowStockAlert);
    const out = products.filter(p => p.stock === 0);

    // 熱銷排行
    const sales = {};
    valid.forEach(o => o.items.forEach(it => {
      if (!sales[it.id]) sales[it.id] = { name: it.name, spec: it.spec, qty: 0, revenue: 0, profit: 0 };
      sales[it.id].qty += it.qty;
      sales[it.id].revenue += it.lineTotal;
      sales[it.id].profit += it.lineTotal - it.lineCost;
    }));
    const top = Object.values(sales).sort((a, b) => b.revenue - a.revenue);

    // 五行分佈
    const elDist = { 木: 0, 火: 0, 土: 0, 金: 0, 水: 0 };
    valid.forEach(o => o.items.forEach(it => { if (elDist[it.element] != null) elDist[it.element] += it.qty; }));

    return {
      orderCount: orders.length, validCount: valid.length,
      pending: orders.filter(o => o.status === '待處理').length,
      revenue, cost, profit,
      margin: revenue ? +(profit / revenue * 100).toFixed(1) : 0,
      avgOrder: valid.length ? Math.round(revenue / valid.length) : 0,
      inventoryValue, inventoryRetail,
      productCount: products.length, lowStock: low, outStock: out,
      top, elDist
    };
  }

  /* ---------- 簡易事件 ---------- */
  const listeners = {};
  function on(evt, fn) { (listeners[evt] = listeners[evt] || []).push(fn); }
  function emit(evt) { (listeners[evt] || []).forEach(f => { try { f(); } catch (e) {} }); }

  /* ============================================================
     Email 發送層
     ============================================================ */

  function money(n) { return 'HK$' + Number(n).toLocaleString('en-US'); }

  /** 純文字訂單內文(給店主) */
  function orderTextForOwner(order) {
    const L = [];
    L.push('══════════════════════════════════');
    L.push('  新訂單通知 · ' + getSettings().shopName);
    L.push('══════════════════════════════════');
    L.push('');
    L.push('訂單編號:' + order.no);
    L.push('下單時間:' + new Date(order.createdAt).toLocaleString('zh-HK'));
    L.push('訂單狀態:' + order.status);
    L.push('');
    L.push('── 客戶資料 ──────────────────────');
    L.push('姓名  :' + order.customer.name);
    L.push('電話  :' + order.customer.phone);
    L.push('Email :' + (order.customer.email || '—'));
    L.push('地址  :' + (order.customer.address || '—'));
    if (order.customer.note) L.push('備註  :' + order.customer.note);
    L.push('');

    if (order.bazi) {
      const b = order.bazi;
      L.push('── 八字命盤 ──────────────────────');
      L.push('出生  :' + b.birth + '  性別:' + b.gender);
      L.push('四柱  :' + b.pillars.map(p => p.gz).join('  '));
      L.push('十神  :' + b.pillars.map(p => p.shishen).join('  '));
      L.push('生肖  :' + b.zodiac + '   節令:' + b.jieName);
      L.push('日主  :' + b.dayMaster.yy + b.dayMaster.el + '(' + b.dayMaster.gan + ')  ' + b.strength);
      L.push('五行  :' + Object.entries(b.pct).map(([k, v]) => k + v + '%').join('  '));
      L.push('喜用  :' + b.favor.join('、') + '    忌神:' + b.avoid.join('、'));
      L.push('');
    }

    L.push('── 訂單明細 ──────────────────────');
    const w = [26, 5, 10, 10, 10];
    L.push(pad('品項', w[0]) + pad('數量', w[1]) + padL('單價', w[2]) + padL('成本', w[3]) + padL('小計', w[4]));
    L.push('─'.repeat(w.reduce((a, b) => a + b, 0)));
    order.items.forEach(it => {
      const nm = it.name + (it.spec ? ' ' + it.spec : '');
      L.push(pad(nm, w[0]) + pad('×' + it.qty, w[1]) + padL(String(it.price), w[2]) + padL(String(it.cost), w[3]) + padL(String(it.lineTotal), w[4]));
    });
    L.push('─'.repeat(w.reduce((a, b) => a + b, 0)));
    L.push('');
    L.push('商品小計:' + money(order.subtotal));
    L.push('運費    :' + (order.shipping ? money(order.shipping) : '免運'));
    if (order.tax) L.push('稅金    :' + money(order.tax));
    L.push('───────────────────');
    L.push('訂單總額:' + money(order.total));
    L.push('');
    L.push('【內部成本分析 · 勿轉發客戶】');
    L.push('總成本  :' + money(order.totalCost));
    L.push('毛利    :' + money(order.profit));
    L.push('毛利率  :' + order.margin + '%');
    L.push('');
    L.push('══════════════════════════════════');
    L.push('本郵件由 ' + getSettings().shopName + ' 系統自動發出');
    return L.join('\n');
  }

  /** 客戶確認信內文 */
  function orderTextForCustomer(order) {
    const S = getSettings();
    const L = [];
    L.push('親愛的 ' + order.customer.name + ',您好:');
    L.push('');
    L.push('感謝您於 ' + S.shopName + ' 選購。您的訂單已成功建立,我們會於 1 個工作天內與您聯繫確認。');
    L.push('');
    L.push('訂單編號:' + order.no);
    L.push('下單時間:' + new Date(order.createdAt).toLocaleString('zh-HK'));
    L.push('');
    if (order.bazi) {
      const b = order.bazi;
      L.push('── 您的命盤摘要 ──');
      L.push('四柱:' + b.pillars.map(p => p.gz).join('  '));
      L.push('日主:' + b.dayMaster.yy + b.dayMaster.el + ' · ' + b.strength);
      L.push('喜用五行:' + b.favor.join('、'));
      L.push(b.summary);
      L.push('');
    }
    L.push('── 訂單明細 ──');
    order.items.forEach(it => {
      L.push('· ' + it.name + (it.spec ? ' ' + it.spec : '') + ' ×' + it.qty + '  ' + money(it.lineTotal));
    });
    L.push('');
    L.push('商品小計:' + money(order.subtotal));
    L.push('運費    :' + (order.shipping ? money(order.shipping) : '免運'));
    L.push('應付總額:' + money(order.total));
    L.push('');
    L.push('如有任何疑問,歡迎直接回覆本郵件。');
    L.push('');
    L.push(S.shopName + ' 敬上');
    return L.join('\n');
  }

  function pad(s, n) { s = String(s); const len = charLen(s); return s + ' '.repeat(Math.max(1, n - len)); }
  function padL(s, n) { s = String(s); const len = charLen(s); return ' '.repeat(Math.max(1, n - len)) + s; }
  function charLen(s) { let l = 0; for (const c of s) l += /[\u4e00-\u9fa5\u3000-\u303f\uff00-\uffef]/.test(c) ? 2 : 1; return l; }

  /**
   * 發送訂單通知
   * @returns {Promise<{ok:boolean, provider:string, msg:string}>}
   */
  async function sendOrderEmail(order) {
    const S = getSettings();
    const subject = `【新訂單】${order.no} · ${order.customer.name} · ${money(order.total)}`;
    const body = orderTextForOwner(order);

    if (S.provider === 'none' || !S.provider) {
      return { ok: false, provider: 'none', msg: '尚未設定 Email 服務,訂單已存於本地。請至後台「系統設定」完成設定。' };
    }
    if (!S.ownerEmail) {
      return { ok: false, provider: S.provider, msg: '尚未填寫收件 Email。' };
    }

    try {
      if (S.provider === 'web3forms') {
        if (!S.web3forms.accessKey) throw new Error('缺少 Web3Forms Access Key');
        const res = await fetch('https://api.web3forms.com/submit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify({
            access_key: S.web3forms.accessKey,
            subject, from_name: S.shopName,
            email: order.customer.email || undefined,
            訂單編號: order.no, 客戶: order.customer.name, 電話: order.customer.phone,
            總額: money(order.total), 毛利: money(order.profit),
            訂單內容: body
          })
        });
        const j = await res.json();
        if (!j.success) throw new Error(j.message || '發送失敗');
        return { ok: true, provider: 'Web3Forms', msg: '訂單通知已寄出' };
      }

      if (S.provider === 'formspree') {
        if (!S.formspree.endpoint) throw new Error('缺少 Formspree Endpoint');
        const res = await fetch(S.formspree.endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify({
            _subject: subject,
            email: order.customer.email || S.ownerEmail,
            訂單編號: order.no, 客戶: order.customer.name, 電話: order.customer.phone,
            總額: money(order.total), message: body
          })
        });
        if (!res.ok) { const t = await res.text(); throw new Error('HTTP ' + res.status + ' ' + t.slice(0, 120)); }
        return { ok: true, provider: 'Formspree', msg: '訂單通知已寄出' };
      }

      if (S.provider === 'emailjs') {
        const c = S.emailjs;
        if (!c.serviceId || !c.templateId || !c.publicKey) throw new Error('EmailJS 三項參數未填齊');
        const res = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            service_id: c.serviceId,
            template_id: c.templateId,
            user_id: c.publicKey,
            template_params: {
              to_email: S.ownerEmail,
              subject,
              order_no: order.no,
              customer_name: order.customer.name,
              customer_phone: order.customer.phone,
              customer_email: order.customer.email || '',
              customer_address: order.customer.address || '',
              total: money(order.total),
              profit: money(order.profit),
              message: body,
              shop_name: S.shopName
            }
          })
        });
        if (!res.ok) { const t = await res.text(); throw new Error('HTTP ' + res.status + ' ' + t.slice(0, 160)); }
        return { ok: true, provider: 'EmailJS', msg: '訂單通知已寄出' };
      }

      return { ok: false, provider: S.provider, msg: '未知的服務商' };
    } catch (e) {
      return { ok: false, provider: S.provider, msg: e.message || String(e) };
    }
  }

  /** 測試發送(後台用) */
  async function sendTestEmail() {
    const S = getSettings();
    const fake = {
      no: 'CA-TEST-0000',
      createdAt: new Date().toISOString(),
      status: '測試',
      customer: { name: '測試客戶', phone: '9xxx xxxx', email: S.ownerEmail, address: '香港 · 測試地址', note: '這是一封測試郵件' },
      items: [{ id: 't', kind: 'product', name: '白水晶手鏈', spec: '10mm', formLabel: '手鏈', element: '金', qty: 1, price: 280, cost: 88, lineTotal: 280, lineCost: 88 }],
      subtotal: 280, shipping: 40, tax: 0, total: 320, totalCost: 88, profit: 192, margin: 68.6,
      bazi: null
    };
    return sendOrderEmail(fake);
  }

  /* ---------- 寄送報告給客戶(網站自動發出) ---------- */
  /** 組合給客戶的八字報告 HTML(命盤 + 店主筆記 + 逐客報告) */
  function customerReportHtml(order) {
    const S = getSettings();
    const b = order.bazi;
    const L = [];
    L.push('<div style="font-family:-apple-system,\'PingFang HK\',\'Microsoft YaHei\',sans-serif;max-width:640px;margin:0 auto;color:#1e293b;line-height:1.8">');
    L.push('<h2 style="margin:0 0 6px">親愛的 ' + App.esc(order.customer.name) + ',您好</h2>');
    L.push('<p style="color:#64748b;margin:0 0 16px">這是 ' + App.esc(S.shopName) + ' 為您準備的八字深度解析報告。</p>');
    if (b) {
      L.push('<div style="background:#f1f5f9;border-radius:12px;padding:14px 18px;margin-bottom:14px">');
      L.push('<div style="font-family:serif;font-size:1.5rem;letter-spacing:4px">' + b.pillars.map(p => p.gz).join(' ') + '</div>');
      L.push('<div style="font-size:.85rem;color:#475569;margin-top:6px">出生 ' + App.esc(b.birth) + ' · ' + App.esc(b.gender) + ' · 生肖 ' + App.esc(b.zodiac) + '</div>');
      L.push('<div style="margin-top:8px">日主 <b>' + b.dayMaster.yy + b.dayMaster.el + '</b>(' + App.esc(b.dayMaster.gan) + ') · ' + App.esc(b.strength) + '</div>');
      L.push('<div>喜用五行:' + b.favor.map(e => '<b>' + e + '</b>').join('、') + '　忌神:' + (b.avoid || []).join('、') + '</div>');
      L.push('<div class="tiny" style="margin-top:6px;color:#64748b">五行佔比:' + Object.entries(b.pct).map(([k, v]) => k + v + '%').join('  ') + '</div>');
      L.push('</div>');
    }
    const ownerNotes = (S.baziNotes || '').trim();
    if (ownerNotes) {
      L.push('<div style="background:#ecfeff;border:1px solid #a5f3fc;border-radius:12px;padding:14px 18px;margin-bottom:14px;white-space:pre-wrap">' + App.esc(ownerNotes).replace(/\n/g, '<br>') + '</div>');
    }
    const perNotes = (order.baziReportNotes || '').trim();
    if (perNotes) {
      L.push('<div style="background:#fff;border:1px solid #14b8a6;border-radius:12px;padding:14px 18px;margin-bottom:14px;white-space:pre-wrap">' + App.esc(perNotes).replace(/\n/g, '<br>') + '</div>');
    }
    if (S.baziReportUrl) L.push('<p style="color:#475569">完整報告範本:<a href="' + App.esc(S.baziReportUrl) + '">' + App.esc(S.baziReportUrl) + '</a></p>');
    L.push('<p style="color:#94a3b8;font-size:.78rem;margin-top:22px;border-top:1px solid #e2e8f0;padding-top:10px">本報告由 ' + App.esc(S.shopName) + ' 系統自動寄出,僅供命理參考,不構成醫療、法律或投資建議。</p>');
    L.push('</div>');
    return L.join('');
  }

  /** 寄送八字報告 Email 給客戶 */
  async function sendCustomerEmail(order) {
    const S = getSettings();
    const custEmail = (order.customer.email || '').trim();
    const subject = '【八字深度解析報告】' + order.no + ' · ' + order.customer.name;
    const html = customerReportHtml(order);

    if (S.provider === 'none' || !S.provider) {
      return { ok: false, provider: 'none', msg: '尚未設定 Email 服務,無法寄出。請至後台「系統設定」完成設定。' };
    }
    if (!custEmail) {
      return { ok: false, provider: S.provider, msg: '此訂單沒有客戶 Email,無法寄送。' };
    }
    try {
      if (S.provider === 'emailjs') {
        const c = S.emailjs;
        if (!c.serviceId || !c.templateId || !c.publicKey) throw new Error('EmailJS 三項參數未填齊');
        const res = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            service_id: c.serviceId, template_id: c.templateId, user_id: c.publicKey,
            template_params: {
              to_email: custEmail, subject, from_name: S.shopName,
              customer_name: order.customer.name,
              message: html, shop_name: S.shopName
            }
          })
        });
        if (!res.ok) { const t = await res.text(); throw new Error('HTTP ' + res.status + ' ' + t.slice(0, 160)); }
        return { ok: true, provider: 'EmailJS', msg: '報告已寄至 ' + custEmail };
      }
      // web3forms / formspree 皆寄往店主信箱,由店主轉發給客戶
      if (S.provider === 'web3forms') {
        if (!S.web3forms.accessKey) throw new Error('缺少 Web3Forms Access Key');
        const res = await fetch('https://api.web3forms.com/submit', {
          method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify({
            access_key: S.web3forms.accessKey, subject: '［轉交客戶報告］' + subject,
            from_name: S.shopName, email: custEmail,
            客戶: order.customer.name, 客戶信箱: custEmail, 訂單編號: order.no,
            內容: html
          })
        });
        const j = await res.json();
        if (!j.success) throw new Error(j.message || '發送失敗');
        return { ok: true, provider: 'Web3Forms', msg: '報告已寄至店主信箱,請轉發給 ' + custEmail + '(Web3Forms 僅能寄往店主)' };
      }
      if (S.provider === 'formspree') {
        if (!S.formspree.endpoint) throw new Error('缺少 Formspree Endpoint');
        const res = await fetch(S.formspree.endpoint, {
          method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify({
            _subject: '［轉交客戶報告］' + subject, email: custEmail,
            客戶: order.customer.name, 客戶信箱: custEmail, 訂單編號: order.no, message: html
          })
        });
        if (!res.ok) { const t = await res.text(); throw new Error('HTTP ' + res.status + ' ' + t.slice(0, 120)); }
        return { ok: true, provider: 'Formspree', msg: '報告已寄至店主信箱,請轉發給 ' + custEmail + '(Formspree 僅能寄往店主)' };
      }
      return { ok: false, provider: S.provider, msg: '未知的服務商' };
    } catch (e) {
      return { ok: false, provider: S.provider, msg: e.message || String(e) };
    }
  }

  /* ---------- 匯出 / 匯入 ---------- */
  function exportJSON() {
    return JSON.stringify({
      exportedAt: new Date().toISOString(),
      version: 1,
      settings: getSettings(),
      products: getProducts(),
      orders: getOrders()
    }, null, 2);
  }

  function importJSON(text) {
    const d = JSON.parse(text);
    if (d.settings) write(K.settings, d.settings);
    if (d.products) write(K.products, d.products);
    if (d.orders) write(K.orders, d.orders);
    if (d.services) write(K.services, d.services);
    if (d.hiddenCrystals) write(K.hidden, d.hiddenCrystals);
    return true;
  }

  function ordersCSV() {
    const rows = [['訂單編號', '日期', '狀態', '客戶', '電話', 'Email', '品項數', '商品小計', '運費', '總額', '成本', '毛利', '毛利率%', '喜用神', '日主', '明細']];
    getOrders().forEach(o => {
      rows.push([
        o.no, new Date(o.createdAt).toLocaleString('zh-HK'), o.status,
        o.customer.name, o.customer.phone, o.customer.email || '',
        o.items.reduce((s, i) => s + i.qty, 0),
        o.subtotal, o.shipping, o.total, o.totalCost, o.profit, o.margin,
        o.bazi ? o.bazi.favor.join('/') : '', o.bazi ? o.bazi.dayMaster.el : '',
        o.items.map(i => i.name + (i.spec ? ' ' + i.spec : '') + '×' + i.qty).join(' | ')
      ]);
    });
    return rows.map(r => r.map(c => {
      const s = String(c == null ? '' : c);
      return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
    }).join(',')).join('\n');
  }

  function productsCSV() {
    const rows = [['SKU', '名稱', '英文', '五行', '形態', '規格', '售價', '成本', '毛利', '毛利率%', '庫存', '庫存成本', '產地', '備註']];
    getProducts().forEach(p => {
      rows.push([p.sku, p.name, p.en, p.element, p.formLabel, p.spec, p.price, p.cost,
        p.price - p.cost, ((p.price - p.cost) / p.price * 100).toFixed(1), p.stock, p.cost * p.stock, p.origin, p.note]);
    });
    return rows.map(r => r.map(c => {
      const s = String(c == null ? '' : c);
      return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
    }).join(',')).join('\n');
  }

  function servicesCSV() {
    const rows = [['ID', '名稱', '英文', '價格', '成本', '圖標', '說明']];
    getServices().forEach(s => {
      rows.push([s.id, s.name, s.en, s.price, s.cost, s.icon, s.desc]);
    });
    return rows.map(r => r.map(c => {
      const s = String(c == null ? '' : c);
      return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
    }).join(',')).join('\n');
  }

  function crystalsCSV() {
    const rows = [['ID', '名稱', '英文', '五行', '脈輪', '硬度', '產地']];
    (global.CrystalData.CRYSTALS || []).forEach(c => {
      rows.push([c.id, c.name, c.en, c.element, c.chakra, c.hardness, c.origin]);
    });
    return rows.map(r => r.map(c => {
      const s = String(c == null ? '' : c);
      return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
    }).join(',')).join('\n');
  }

  /* 多工作表 XLS(Excel 可直接開啟的 SpreadsheetML 2003) */
  function xlsXmlEsc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function xlsCell(v) { const t = (typeof v === 'number') ? 'Number' : 'String'; return '<Cell><Data ss:Type="' + t + '">' + xlsXmlEsc(v) + '</Data></Cell>'; }
  function xlsSheet(name, header, rows) {
    let s = '<Worksheet ss:Name="' + xlsXmlEsc(name).slice(0, 31) + '"><Table>';
    s += '<Row>' + header.map(h => xlsCell(h)).join('') + '</Row>';
    rows.forEach(r => { s += '<Row>' + r.map(c => xlsCell(c)).join('') + '</Row>'; });
    return s + '</Table></Worksheet>';
  }
  function exportXLS() {
    const orders = getOrders().map(o => [o.no, new Date(o.createdAt).toLocaleString('zh-HK'), o.status, o.customer.name, o.customer.phone, o.customer.email || '', o.items.reduce((s, i) => s + i.qty, 0), o.subtotal, o.shipping, o.total, o.totalCost, o.profit, o.margin, o.bazi ? o.bazi.favor.join('/') : '', o.tracking || '']);
    const products = getProducts().map(p => [p.sku, p.name, p.en, p.element, p.formLabel, p.spec, p.price, p.cost, p.price - p.cost, ((p.price - p.cost) / p.price * 100).toFixed(1), p.stock, p.cost * p.stock, p.origin, p.note]);
    const services = getServices().map(s => [s.id, s.name, s.en, s.price, s.cost, s.icon, s.desc]);
    const crystals = (global.CrystalData.CRYSTALS || []).map(c => [c.id, c.name, c.en, c.element, c.chakra, c.hardness, c.origin]);
    return '<?xml version="1.0"?>\n<?mso-application progid="Excel.Sheet"?>\n<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">'
      + xlsSheet('訂單', ['編號', '日期', '狀態', '客戶', '電話', 'Email', '品項數', '商品小計', '運費', '總額', '成本', '毛利', '毛利率%', '喜用神', '物流追蹤'], orders)
      + xlsSheet('產品', ['SKU', '名稱', '英文', '五行', '形態', '規格', '售價', '成本', '毛利', '毛利率%', '庫存', '庫存成本', '產地', '備註'], products)
      + xlsSheet('加購服務', ['ID', '名稱', '英文', '價格', '成本', '圖標', '說明'], services)
      + xlsSheet('水晶', ['ID', '名稱', '英文', '五行', '脈輪', '硬度', '產地'], crystals)
      + '</Workbook>';
  }

  /* ---------- 匯出 ---------- */
  global.Store = {
    init, K, DEFAULT_SETTINGS, ORDER_STATUSES,
    getSettings, saveSettings, resetAll,
    getProducts, getProduct, saveProducts, upsertProduct, deleteProduct, adjustStock,
    getServices, saveServices, upsertService, deleteService,
    getHiddenCrystals, setHiddenCrystals, isCrystalVisible, setCrystalVisible,
    getCart, addToCart, setQty, removeFromCart, clearCart, cartDetail, cartCount,
    saveBazi, getBazi, clearBazi,
    getOrders, getOrder, createOrder, updateOrder, deleteOrder, stats,
    sendOrderEmail, sendTestEmail, sendCustomerEmail, customerReportHtml, orderTextForOwner, orderTextForCustomer,
    exportJSON, importJSON, ordersCSV, productsCSV, servicesCSV, crystalsCSV, exportXLS,
    on, money
  };

})(typeof window !== 'undefined' ? window : globalThis);
