/* ============================================================
   i18n — 中英雙語切換核心 (Bilingual toggle core)
   設計: 中文為預設/來源;英文覆寫。
   - 靜態 HTML: 加 data-i18n="key",中文留在 DOM,英文放 dict.en[key]
   - JS 動態字串: I18N.t('key','中文預設') → 英文取 dict.en[key],中文取第二引數
   - 資料欄位: I18N.data(obj,'name') → obj.nameEn / obj.name
   ============================================================ */
(function (global) {
  'use strict';

  const KEY = 'cw_lang';
  // 僅需維護英文詞典;中文保留在來源(HTML 或 t() 第二引數)
  const dict = {
    en: {
      // 導覽
      'nav.home': 'Home', 'nav.bazi': 'BaZi Custom', 'nav.shop': 'Crystals',
      'nav.knowledge': 'Crystal Guide', 'nav.orders': 'Orders',
      'nav.cart': 'Cart', 'nav.menu': 'Menu',
      // 通用
      'common.cart': 'Cart', 'common.emptyCart': 'Your cart is empty',
      'common.items': 'items', 'common.add': 'Add', 'common.save': 'Save',
      'common.cancel': 'Cancel', 'common.close': 'Close', 'common.remove': 'Remove',
      'common.quantity': 'Qty', 'common.subtotal': 'Subtotal', 'common.shipping': 'Shipping',
      'common.free': 'Free', 'common.total': 'Total', 'common.checkout': 'Checkout',
      'common.loading': 'Loading…',
      // 五行條/環共用
      'wx.favor': 'Favor', 'wx.avoid': 'Avoid',
      // 提示 / 錯誤
      'err.date': 'Please enter your birth date', 'err.time': 'Please enter your birth time',
      'err.year': 'Currently supported: 1900–2100', 'err.fail': 'Chart failed: ',
      'err.nochart': 'Please generate the chart first',
      'err.popup': 'Browser blocked the popup; please allow pop-ups and retry',
      'err.nocart': 'Please select at least one crystal first',
      'ok.report': 'Report window opened — save as PDF or print',
      // 八字報告 (PDF)
      'rep.tpl': 'Owner Report Template', 'rep.cust': 'Client', 'rep.contact': 'Contact',
      'rep.order': 'Order No.', 'rep.items': 'Ordered Items', 'rep.notes': 'Notes',
      'rep.custTitle': 'Client Info & Order',
      // 頁尾
      'footer.shop': 'Shop', 'footer.all': 'All Products', 'footer.bazi': 'BaZi Custom',
      'footer.wood': 'Wood Crystals', 'footer.fire': 'Fire Crystals',
      'footer.water': 'Water Crystals', 'footer.knowledge': 'Knowledge',
      'footer.purify': 'Cleansing', 'footer.wear': 'How to Wear',
      'footer.wuxing': 'Five Elements', 'footer.fake': 'Authenticity',
      'footer.service': 'Service', 'footer.orderQuery': 'Order Query',
      'footer.admin': 'Admin', 'footer.chakra': 'Chakra Map',
      'footer.desc': 'Based on traditional BaZi (Four Pillars) astrology, we calculate your Five-Element affinities and pair you with the right energy crystals. Natural rough stones — one life, one chart, made to measure.',
      'footer.copy': '© ' + new Date().getFullYear() + ' 極晶閣 Auralite · Content is for reference only and not medical or investment advice',
      'footer.local': 'Data is stored locally in your browser',
      // 商品卡
      'card.add': 'Add', 'card.soldout': 'Sold Out', 'card.low': 'Low Stock', 'card.instock': 'In Stock',
      'card.zoom': '🔍 Click to zoom', 'card.out': 'Out of Stock',
      'card.form.bracelet': 'Bracelet', 'card.form.pendant': 'Pendant', 'card.form.point': 'Crystal Point',
      'card.form.sphere': 'Sphere', 'card.form.raw': 'Raw Stone', 'card.form.cluster': 'Cluster',
      'card.form.ring': 'Ring', 'card.form.chips': 'Chips', 'card.form.necklace': 'Necklace'
    }
  };

  let lang = 'zh';
  try { const v = localStorage.getItem(KEY); if (v === 'en' || v === 'zh') lang = v; } catch (e) {}

  /** 取 UI 字串: 英文用 dict.en[key],中文用 zhDefault(內聯中文) */
  function t(key, zhDefault) {
    if (lang === 'en') {
      const v = dict.en[key];
      if (v != null) return v;
      if (zhDefault != null) return zhDefault;
      return key;
    }
    return zhDefault != null ? zhDefault : key;
  }

  /** 取雙語資料欄: obj.nameEn / obj.name */
  function data(obj, field) {
    if (!obj) return '';
    const suf = lang === 'en' ? 'En' : '';
    const v = obj[field + suf];
    if (v != null && v !== '') return v;
    return obj[field] != null ? obj[field] : '';
  }

  const ELEMENT_EN = { '木': 'Wood', '火': 'Fire', '土': 'Earth', '金': 'Metal', '水': 'Water' };
  const CHAKRA_EN = {
    '眉心輪': 'Brow / Third Eye', '頂輪': 'Crown', '心輪': 'Heart',
    '太陽輪': 'Solar Plexus', '海底輪': 'Root', '喉輪': 'Throat',
    '臍輪': 'Sacral', '全脈輪': 'All Chakras',
    '心輪 · 太陽輪': 'Heart · Solar Plexus', '心輪 · 太陽輪 ': 'Heart · Solar Plexus',
    '臍輪 · 太陽輪': 'Sacral · Solar Plexus', '眉心輪 · 頂輪': 'Brow · Crown',
    '太陽輪 · 海底輪': 'Solar Plexus · Root', '喉輪 · 眉心輪': 'Throat · Brow'
  };
  function elEn(e) { return ELEMENT_EN[e] || e; }
  function chakraEn(c) { return CHAKRA_EN[c] || c; }

  /** 掃描 [data-i18n] 替換文字;中文捕獲自 DOM,英文覆寫 */
  function apply(root) {
    root = root || document;
    try {
      root.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        const isHtml = el.dataset.i18nHtml === '1';
        // 首次套用時快取:html 模式存 innerHTML(保留 <strong> 等子標籤),
        // 純文字模式存 textContent(避免把子元素的 HTML 標籤當成純文字渲染)
        if (el._i18n_zh == null) {
          el._i18n_zh = isHtml ? el.innerHTML : el.textContent;
        }
        const en = dict.en[key];
        let val;
        if (lang === 'en') val = (en != null) ? en : el._i18n_zh;
        else val = el._i18n_zh;
        if (isHtml) el.innerHTML = val;
        else el.textContent = val;
      });
    } catch (e) { console.error('i18n apply', e); }
  }

  const listeners = [];
  function onLangChange(fn) { if (typeof fn === 'function') listeners.push(fn); }
  function setLang(l) {
    lang = (l === 'en') ? 'en' : 'zh';
    try { localStorage.setItem(KEY, lang); } catch (e) {}
    document.documentElement.lang = (lang === 'en') ? 'en' : 'zh-Hant';
    apply();
    listeners.forEach(fn => { try { fn(); } catch (e) { console.error(e); } });
  }
  function toggle() { setLang(lang === 'en' ? 'zh' : 'en'); }
  function getLang() { return lang; }
  /** 頁面/模組貢獻自己的英文詞典。支援兩種寫法:
   *  I18N.add({ key: 'val' })  或  I18N.add('en', { key: 'val' }) */
  function add(a, b) {
    const obj = (b != null) ? b : a;
    if (obj && typeof obj === 'object') Object.assign(dict.en, obj);
  }

  global.I18N = {
    t, data, elEn, chakraEn, apply, onLangChange, setLang, toggle, getLang, add,
    dict, KEY, ELEMENT_EN, CHAKRA_EN
  };
})(window);
