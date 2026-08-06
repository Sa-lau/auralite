/* ============================================================
   BaZi Engine — 完整四柱八字排盤引擎
   ------------------------------------------------------------
   • 以天文太陽視黃經定節氣(非查表),支援 1900–2100
   • 年柱以「立春」為界,月柱以「十二節」為界
   • 日柱以儒略日推算,子時(23:00)換日
   • 以鐘錶時間(配合時區)直接排盤,不另作真太陽時修正
   • 地支藏干加權、月令司令、日主強弱、喜用神推導
   ============================================================ */

(function (global) {
  'use strict';

  /* ---------- 基礎常數 ---------- */
  const GAN = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'];
  const ZHI = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];

  const GAN_EL = ['木', '木', '火', '火', '土', '土', '金', '金', '水', '水'];
  const GAN_YY = ['陽', '陰', '陽', '陰', '陽', '陰', '陽', '陰', '陽', '陰'];
  const ZHI_EL = ['水', '土', '木', '木', '土', '火', '火', '土', '金', '金', '土', '水'];
  const ZHI_YY = ['陽', '陰', '陽', '陰', '陽', '陰', '陽', '陰', '陽', '陰', '陽', '陰'];

  const ZODIAC = ['鼠', '牛', '虎', '兔', '龍', '蛇', '馬', '羊', '猴', '雞', '狗', '豬'];

  // 地支藏干:[本氣, 中氣, 餘氣] — 以天干索引表示
  const HIDDEN = {
    '子': [9],            // 癸
    '丑': [5, 9, 7],      // 己 癸 辛
    '寅': [0, 2, 4],      // 甲 丙 戊
    '卯': [1],            // 乙
    '辰': [4, 1, 9],      // 戊 乙 癸
    '巳': [2, 6, 4],      // 丙 庚 戊
    '午': [3, 5],         // 丁 己
    '未': [5, 3, 1],      // 己 丁 乙
    '申': [6, 8, 4],      // 庚 壬 戊
    '酉': [7],            // 辛
    '戌': [4, 7, 3],      // 戊 辛 丁
    '亥': [8, 0]          // 壬 甲
  };
  // 藏干權重:本氣 / 中氣 / 餘氣
  const HIDDEN_W = [1.0, 0.45, 0.2];

  // 十二節(節令)名稱,對應太陽黃經 315° 起每 30°
  const JIE = ['立春', '驚蟄', '清明', '立夏', '芒種', '小暑', '立秋', '白露', '寒露', '立冬', '大雪', '小寒'];
  // 月支序:寅卯辰巳午未申酉戌亥子丑
  const MONTH_ZHI = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 0, 1];

  const SHENG = { '木': '火', '火': '土', '土': '金', '金': '水', '水': '木' }; // 生
  const KE = { '木': '土', '土': '水', '水': '火', '火': '金', '金': '木' };    // 剋
  const SHENG_BY = { '火': '木', '土': '火', '金': '土', '水': '金', '木': '水' }; // 被生(印)
  const KE_BY = { '土': '木', '水': '土', '火': '水', '金': '火', '木': '金' };   // 被剋(官殺)

  const ELEMENTS = ['木', '火', '土', '金', '水'];

  /* ---------- English glosses (for the bilingual EN version) ---------- */
  const ELEMENT_EN  = { '木': 'Wood', '火': 'Fire', '土': 'Earth', '金': 'Metal', '水': 'Water' };
  const GAN_PINYIN  = ['Jia','Yi','Bing','Ding','Wu','Ji','Geng','Xin','Ren','Gui'];
  const ZHI_PINYIN  = ['Zi','Chou','Yin','Mao','Chen','Si','Wu','Wei','Shen','You','Xu','Hai'];
  const ZODIAC_EN   = ['Rat','Ox','Tiger','Rabbit','Dragon','Snake','Horse','Goat','Monkey','Rooster','Dog','Pig'];
  const JIE_EN      = ['Beginning of Spring','Awakening of Insects','Pure Brightness','Beginning of Summer','Grain in Ear','Minor Heat','Beginning of Autumn','White Dew','Cold Dew','Beginning of Winter','Major Snow','Minor Cold'];
  const STRENGTH_EN = {'身旺':'Strong','偏旺':'Slightly Strong','中和':'Balanced','偏弱':'Slightly Weak','身弱':'Weak'};
  const SHISHEN_EN  = {'比肩':'Friend','劫財':'Rob Wealth','食神':'Eating God','傷官':'Hurting Officer','偏財':'Indirect Wealth','正財':'Direct Wealth','七殺':'Seven Killings','正官':'Direct Officer','偏印':'Indirect Seal','正印':'Direct Seal'};
  const RELATION_EN = {'比劫':'Companions','印星':'Seals','食傷':'Output','財星':'Wealth','官殺':'Officers'};
  const ROLE_EN     = {'官殺':'Officer','食傷':'Output','財星':'Wealth','印星':'Seal','比劫':'Companion'};
  const PILLAR_EN   = {'年柱':'Year Pillar','月柱':'Month Pillar','日柱':'Day Pillar','時柱':'Hour Pillar'};
  const YY_EN       = {'陽':'Yang','陰':'Yin'};

  const NAYIN = ['海中金','爐中火','大林木','路旁土','劍鋒金','山頭火','澗下水','城頭土','白蠟金','楊柳木',
    '泉中水','屋上土','霹靂火','松柏木','長流水','沙中金','山下火','平地木','壁上土','金箔金',
    '覆燈火','天河水','大驛土','釵釧金','桑柘木','大溪水','沙中土','天上火','石榴木','大海水'];

  /* ============================================================
     一、天文計算
     ============================================================ */

  /** JS Date(UTC 時刻) → 儒略日 */
  function toJD(date) {
    return date.getTime() / 86400000 + 2440587.5;
  }
  function fromJD(jd) {
    return new Date(Math.round((jd - 2440587.5) * 86400000));
  }

  /**
   * 太陽視黃經(度) — Meeus《Astronomical Algorithms》ch.25 低精度算法
   * 含中心差、章動與光行差修正,精度約 0.01°(≈15 分鐘)
   */
  function sunLongitude(jd) {
    const T = (jd - 2451545.0) / 36525;
    const L0 = 280.46646 + 36000.76983 * T + 0.0003032 * T * T;
    const M = 357.52911 + 35999.05029 * T - 0.0001537 * T * T;
    const Mr = M * Math.PI / 180;
    const C = (1.914602 - 0.004817 * T - 0.000014 * T * T) * Math.sin(Mr)
            + (0.019993 - 0.000101 * T) * Math.sin(2 * Mr)
            + 0.000289 * Math.sin(3 * Mr);
    const trueLong = L0 + C;
    const omega = (125.04 - 1934.136 * T) * Math.PI / 180;
    const lambda = trueLong - 0.00569 - 0.00478 * Math.sin(omega);
    return ((lambda % 360) + 360) % 360;
  }

  /** 牛頓迭代:求太陽黃經達到 targetLon 的儒略日,guessJD 為初值 */
  function findSolarTerm(targetLon, guessJD) {
    let jd = guessJD;
    for (let i = 0; i < 40; i++) {
      const lon = sunLongitude(jd);
      let diff = targetLon - lon;
      while (diff > 180) diff -= 360;
      while (diff < -180) diff += 360;
      if (Math.abs(diff) < 1e-8) break;
      jd += diff / 0.98564736;
      }
    return jd;
  }

  /** 某公曆年的立春時刻(儒略日,UTC) */
  function lichunJD(year) {
    const guess = toJD(new Date(Date.UTC(year, 1, 4)));
    return findSolarTerm(315, guess);
  }

  /** 該年 24 節氣時刻(UTC Date),index 0 = 小寒(285°) 依傳統順序 */
  function solarTerms(year) {
    const names = ['小寒','大寒','立春','雨水','驚蟄','春分','清明','穀雨','立夏','小滿','芒種','夏至',
                   '小暑','大暑','立秋','處暑','白露','秋分','寒露','霜降','立冬','小雪','大雪','冬至'];
    const out = [];
    for (let i = 0; i < 24; i++) {
      const lon = (285 + i * 15) % 360;
      // 粗估日期:小寒約 1/6,之後每項 +15 天
      const guess = toJD(new Date(Date.UTC(year, 0, 6))) + i * 15.218;
      const jd = findSolarTerm(lon, guess);
      out.push({ name: names[i], lon, jd, date: fromJD(jd) });
    }
    return out;
  }

  // 均時差 / 真太陽時修正已移除(依需求以鐘錶時間直接排盤)

  /* ============================================================
     二、干支推算
     ============================================================ */

  /** 日干支索引(0=甲子)。錨點驗證:1949-10-01 = 甲子日 ✓ */
  function dayGZIndex(y, m, d) {
    const jdn = Math.floor(toJD(new Date(Date.UTC(y, m - 1, d, 12, 0, 0))) + 0.5);
    return ((jdn + 49) % 60 + 60) % 60;
  }

  function gzName(idx) {
    return GAN[idx % 10] + ZHI[idx % 12];
  }

  /* ============================================================
     三、主排盤函式
     ============================================================ */

  /**
   * @param {Object} o
   *   y,m,d,h,mi : 出生公曆年月日時分(當地鐘錶時間)
   *   tz         : 時區偏移小時,預設 8
   *   gender     : 'M' | 'F'
   */
  function calculate(o) {
    const tz = o.tz == null ? 8 : Number(o.tz);

    // 鐘錶時間(配合時區) → UTC 儒略日
    const clockUTC = Date.UTC(o.y, o.m - 1, o.d, o.h, o.mi || 0, 0);
    const jd = toJD(new Date(clockUTC)) - tz / 24;

    // 當地日曆時刻(用於時辰交界警示)
    const localAdj = fromJD(jd + tz / 24);
    const ay = localAdj.getUTCFullYear();
    const am = localAdj.getUTCMonth() + 1;
    const ad = localAdj.getUTCDate();
    const ah = localAdj.getUTCHours();
    const ami = localAdj.getUTCMinutes();

    /* --- 年柱:以立春為界 --- */
    const lc = lichunJD(ay);
    const baziYear = jd >= lc ? ay : ay - 1;
    const yGanI = ((baziYear - 4) % 10 + 10) % 10;
    const yZhiI = ((baziYear - 4) % 12 + 12) % 12;

    /* --- 月柱:以太陽黃經定節令 --- */
    const lon = sunLongitude(jd);
    const jieIdx = Math.floor((((lon - 315) % 360) + 360) % 360 / 30); // 0=寅月
    const mZhiI = MONTH_ZHI[jieIdx];
    // 五虎遁:月干 = (年干 % 5) * 2 + 2 + 月序
    const mGanI = (((yGanI % 5) * 2 + 2 + jieIdx) % 10 + 10) % 10;

    /* --- 日柱:子時(23:00)換日 --- */
    let dy = ay, dm = am, dd = ad;
    if (ah >= 23) {
      const nx = new Date(Date.UTC(ay, am - 1, ad + 1));
      dy = nx.getUTCFullYear(); dm = nx.getUTCMonth() + 1; dd = nx.getUTCDate();
    }
    const dGZ = dayGZIndex(dy, dm, dd);
    const dGanI = dGZ % 10;
    const dZhiI = dGZ % 12;

    /* --- 時柱:五鼠遁 --- */
    const hZhiI = Math.floor(((ah + 1) % 24) / 2) % 12;
    const hGanI = (((dGanI % 5) * 2 + hZhiI) % 10 + 10) % 10;

    const pillars = [
      { key: 'year',  label: '年柱', gan: yGanI, zhi: yZhiI },
      { key: 'month', label: '月柱', gan: mGanI, zhi: mZhiI },
      { key: 'day',   label: '日柱', gan: dGanI, zhi: dZhiI },
      { key: 'hour',  label: '時柱', gan: hGanI, zhi: hZhiI }
    ].map(p => ({
      ...p,
      ganChar: GAN[p.gan], zhiChar: ZHI[p.zhi],
      ganCharEn: GAN_PINYIN[p.gan], zhiCharEn: ZHI_PINYIN[p.zhi],
      ganEl: GAN_EL[p.gan], zhiEl: ZHI_EL[p.zhi],
      ganYY: GAN_YY[p.gan], zhiYY: ZHI_YY[p.zhi],
      ganYYEn: YY_EN[GAN_YY[p.gan]], zhiYYEn: YY_EN[ZHI_YY[p.zhi]],
      gz: GAN[p.gan] + ZHI[p.zhi],
      labelEn: PILLAR_EN[p.label],
      nayin: NAYIN[Math.floor((((p.gan - p.zhi) % 12 + 12) % 12) / 2 * 5 + 0) % 30] // 見下方修正
    }));

    // 納音正確算法:以六十甲子序號 / 2
    pillars.forEach(p => {
      const idx60 = sixtyIndex(p.gan, p.zhi);
      p.nayin = NAYIN[Math.floor(idx60 / 2)];
      p.sixtyIndex = idx60;
    });

    /* --- 五行力量統計 --- */
    const score = { 木: 0, 火: 0, 土: 0, 金: 0, 水: 0 };
    const detail = [];

    // 天干:各記 1.0(月干、日干權重略高,因透干得力)
    const ganWeight = { year: 0.9, month: 1.1, day: 1.0, hour: 0.9 };
    pillars.forEach(p => {
      const w = ganWeight[p.key];
      score[p.ganEl] += w;
      detail.push({ src: p.label + '天干', char: p.ganChar, el: p.ganEl, w: +w.toFixed(2) });
    });

    // 地支藏干:本氣/中氣/餘氣加權;月支為月令,額外 ×1.5
    const zhiWeight = { year: 1.0, month: 1.5, day: 1.2, hour: 1.0 };
    pillars.forEach(p => {
      const base = zhiWeight[p.key];
      const hid = HIDDEN[p.zhiChar];
      hid.forEach((gi, i) => {
        const w = base * HIDDEN_W[i];
        const el = GAN_EL[gi];
        score[el] += w;
        detail.push({ src: p.label + '地支藏' + GAN[gi], char: GAN[gi], el, w: +w.toFixed(2) });
      });
    });

    const total = ELEMENTS.reduce((s, e) => s + score[e], 0);
    const pct = {};
    ELEMENTS.forEach(e => { pct[e] = total ? +(score[e] / total * 100).toFixed(1) : 0; });
    ELEMENTS.forEach(e => { score[e] = +score[e].toFixed(2); });

    /* --- 日主與強弱 --- */
    const dayMasterEl = GAN_EL[dGanI];
    const dayMasterYY = GAN_YY[dGanI];
    const dayMasterYYEn = YY_EN[dayMasterYY];
    const bijie = dayMasterEl;                 // 比劫(同我)
    const yin = SHENG_BY[dayMasterEl];         // 印(生我)
    const shishang = SHENG[dayMasterEl];       // 食傷(我生)
    const cai = KE[dayMasterEl];               // 財(我剋)
    const guansha = KE_BY[dayMasterEl];        // 官殺(剋我)

    const supportScore = score[bijie] + score[yin];
    const drainScore = score[shishang] + score[cai] + score[guansha];
    const supportPct = total ? supportScore / total * 100 : 0;

    // 月令加權:得令 +8,失令 −8
    const monthEl = ZHI_EL[mZhiI];
    let seasonBonus = 0;
    if (monthEl === bijie) seasonBonus = 10;
    else if (monthEl === yin) seasonBonus = 7;
    else if (monthEl === shishang) seasonBonus = -5;
    else if (monthEl === cai) seasonBonus = -7;
    else if (monthEl === guansha) seasonBonus = -8;

    const strengthIdx = supportPct + seasonBonus;

    let strength, strengthDesc, strengthDescEn;
    if (strengthIdx >= 58) { strength = '身旺'; strengthDesc = '日主得令得勢,能量充沛有餘'; strengthDescEn = 'The Day Master is strong and well-supported, with abundant energy to spare.'; }
    else if (strengthIdx >= 48) { strength = '偏旺'; strengthDesc = '日主稍強,略有盈餘'; strengthDescEn = 'The Day Master is slightly strong, with a mild surplus.'; }
    else if (strengthIdx >= 40) { strength = '中和'; strengthDesc = '日主與四周力量相當,格局平衡'; strengthDescEn = 'The Day Master is balanced, with surrounding forces in equilibrium.'; }
    else if (strengthIdx >= 30) { strength = '偏弱'; strengthDesc = '日主略顯不足,需適度扶助'; strengthDescEn = 'The Day Master is slightly weak and needs moderate support.'; }
    else { strength = '身弱'; strengthDesc = '日主失令乏力,亟需生扶'; strengthDescEn = 'The Day Master is weak and urgently needs nourishment.'; }

    /* --- 喜用神推導(扶抑為主 + 調候輔助) --- */
    const strong = strengthIdx >= 48;
    let favor = [], avoid = [], logic = '', logicEn = '';

    if (strong) {
      // 身強:喜剋洩耗
      const cands = [
        { el: guansha, s: score[guansha], role: '官殺' },
        { el: shishang, s: score[shishang], role: '食傷' },
        { el: cai, s: score[cai], role: '財星' }
      ].sort((a, b) => a.s - b.s); // 越弱越需補
      favor = [cands[0].el, cands[1].el];
      avoid = [bijie, yin];
      logic = `日主【${dayMasterEl}】偏旺,宜「剋、洩、耗」以疏導過剩能量。優先補【${cands[0].el}】(${cands[0].role})與【${cands[1].el}】(${cands[1].role}),使命局趨於中和。忌再加強【${bijie}】(比劫)與【${yin}】(印星)。`;
      logicEn = `Your Day Master (${ELEMENT_EN[dayMasterEl]}) is strong; it is best to "control, drain, and consume" to channel the excess. Prioritize supplementing ${ELEMENT_EN[cands[0].el]} (${ROLE_EN[cands[0].role]}) and ${ELEMENT_EN[cands[1].el]} (${ROLE_EN[cands[1].role]}) to bring the chart toward balance. Avoid further strengthening ${ELEMENT_EN[bijie]} (Companions) and ${ELEMENT_EN[yin]} (Seals).`;
    } else {
      // 身弱:喜生扶
      const cands = [
        { el: yin, s: score[yin], role: '印星' },
        { el: bijie, s: score[bijie], role: '比劫' }
      ].sort((a, b) => a.s - b.s);
      favor = [cands[0].el, cands[1].el];
      // 忌神取命中最旺的剋洩耗五行
      const bad = [
        { el: guansha, s: score[guansha] },
        { el: cai, s: score[cai] },
        { el: shishang, s: score[shishang] }
      ].sort((a, b) => b.s - a.s);
      avoid = [bad[0].el, bad[1].el];
      logic = `日主【${dayMasterEl}】偏弱,宜「生、扶」以補足根基。優先補【${cands[0].el}】(${cands[0].role})與【${cands[1].el}】(${cands[1].role})。命中【${bad[0].el}】過旺形成消耗,宜適度制衡。`;
      logicEn = `Your Day Master (${ELEMENT_EN[dayMasterEl]}) is weak; it is best to "nourish and support" to rebuild its foundation. Prioritize supplementing ${ELEMENT_EN[cands[0].el]} (${ROLE_EN[cands[0].role]}) and ${ELEMENT_EN[cands[1].el]} (${ROLE_EN[cands[1].role]}). The ${ELEMENT_EN[bad[0].el]} in your chart is excessively strong and drains you, so moderate it appropriately.`;
    }

    // 調候(寒暖燥濕)微調
    let tiaohou = null;
    const winterZhi = ['亥', '子', '丑'];
    const summerZhi = ['巳', '午', '未'];
    const mz = ZHI[mZhiI];
    if (winterZhi.includes(mz) && score['火'] < total * 0.12) {
      tiaohou = { el: '火', why: `生於${mz}月天寒地凍,命中火弱,需【火】暖局調候,方能生機流通。`,
        whyEn: `Born in the ${ZHI_PINYIN[mZhiI]} month, it is cold and frozen, with weak Fire in the chart; Fire is needed to warm and harmonize the chart so vitality can flow.` };
      if (!favor.includes('火')) favor.push('火');
    } else if (summerZhi.includes(mz) && score['水'] < total * 0.12) {
      tiaohou = { el: '水', why: `生於${mz}月炎熱燥烈,命中水弱,需【水】潤局調候,以免燥土焦木。`,
        whyEn: `Born in the ${ZHI_PINYIN[mZhiI]} month, it is hot and dry, with weak Water in the chart; Water is needed to moisten and harmonize so the dry earth does not scorch the wood.` };
      if (!favor.includes('水')) favor.push('水');
    }

    // 補缺:五行完全缺失者列出
    const missing = ELEMENTS.filter(e => pct[e] < 4);
    const weakest = ELEMENTS.slice().sort((a, b) => score[a] - score[b])[0];
    const strongest = ELEMENTS.slice().sort((a, b) => score[b] - score[a])[0];

    favor = [...new Set(favor)].filter(e => !avoid.includes(e) || favor.indexOf(e) === 0);
    avoid = [...new Set(avoid)].filter(e => !favor.includes(e));

    /* --- 十神(以日主為我,標註各柱天干) --- */
    pillars.forEach(p => { p.shishen = tenGod(dGanI, p.gan); });

    /* --- 生肖與節氣資訊 --- */
    const zodiac = ZODIAC[yZhiI];
    const zodiacEn = ZODIAC_EN[yZhiI];
    const jieName = JIE[jieIdx];
    const jieNameEn = JIE_EN[jieIdx];

    return {
      input: { ...o, tz },
      correction: {
        adjustedTime: `${ay}-${pad(am)}-${pad(ad)} ${pad(ah)}:${pad(ami)}`
      },
      baziYear, zodiac, zodiacEn, jieName, jieNameEn,
      solarLongitude: +lon.toFixed(3),
      pillars,
      dayMaster: { gan: GAN[dGanI], el: dayMasterEl, yy: dayMasterYY, yyEn: YY_EN[dayMasterYY], index: dGanI },
      relations: { bijie, yin, shishang, cai, guansha },
      score, pct, total: +total.toFixed(2), detail,
      strength, strengthDesc, strengthDescEn, strengthIdx: +strengthIdx.toFixed(1),
      supportPct: +supportPct.toFixed(1),
      favor, avoid, logic, logicEn, tiaohou, missing, weakest, strongest,
      summary: buildSummary({ dayMasterEl, dayMasterYY, strength, favor, avoid, zodiac, jieName, pct }),
      summaryEn: buildSummaryEn({ dayMasterEl, dayMasterYY, dayMasterYYEn, strength, favor, avoid, zodiac, zodiacEn, jieName, jieNameEn, pct })
    };
  }

  function pad(n) { return String(n).padStart(2, '0'); }

  /** 六十甲子序號(0–59) */
  function sixtyIndex(ganI, zhiI) {
    for (let i = 0; i < 60; i++) {
      if (i % 10 === ganI && i % 12 === zhiI) return i;
    }
    return 0;
  }

  /** 十神:以日主天干為我,判斷 other 天干的十神關係 */
  function tenGod(dayGan, otherGan) {
    const meEl = GAN_EL[dayGan], meYY = GAN_YY[dayGan];
    const oEl = GAN_EL[otherGan], oYY = GAN_YY[otherGan];
    const same = meYY === oYY;
    if (oEl === meEl) return same ? '比肩' : '劫財';
    if (SHENG[meEl] === oEl) return same ? '食神' : '傷官';
    if (KE[meEl] === oEl) return same ? '偏財' : '正財';
    if (KE_BY[meEl] === oEl) return same ? '七殺' : '正官';
    if (SHENG_BY[meEl] === oEl) return same ? '偏印' : '正印';
    return '—';
  }

  function buildSummary(d) {
    const top = Object.entries(d.pct).sort((a, b) => b[1] - a[1]);
    return `您生肖屬${d.zodiac},命主為${d.dayMasterYY}${d.dayMasterEl}日主,節令入【${d.jieName}】。` +
      `命局五行以【${top[0][0]}】最盛(${top[0][1]}%)、【${top[4][0]}】最弱(${top[4][1]}%),整體判為「${d.strength}」。` +
      `調理方向:宜補【${d.favor.join('、')}】,節制【${d.avoid.join('、')}】。`;
  }

  function buildSummaryEn(d) {
    const top = Object.entries(d.pct).sort((a, b) => b[1] - a[1]);
    return `Your zodiac is ${d.zodiacEn}, and your Day Master is ${d.dayMasterYYEn} ${ELEMENT_EN[d.dayMasterEl]}. ` +
      `The solar term at birth was ${d.jieNameEn}. ` +
      `Among the Five Elements, ${ELEMENT_EN[top[0][0]]} is strongest (${top[0][1]}%) and ${ELEMENT_EN[top[4][0]]} is weakest (${top[4][1]}%); overall the chart is assessed as "${d.strength}". ` +
      `Regulation: favor supplementing ${d.favor.map(e => ELEMENT_EN[e]).join(', ')}; moderate ${d.avoid.map(e => ELEMENT_EN[e]).join(', ')}.`;
  }

  /* ============================================================
     四、輔助:五行關係說明
     ============================================================ */
  const EL_INFO = {
    '木': { color: '#4ade80', season: '春', dir: '東', organ: '肝膽', trait: '仁、成長、開創、伸展', desc: '木主生發,象徵成長與開拓。木旺者有主見、重原則、行動力強;木弱者易優柔寡斷、缺乏衝勁。',
      seasonEn: 'Spring', dirEn: 'East', organEn: 'Liver/Gallbladder', traitEn: 'Benevolence, growth, initiative', descEn: 'Wood governs growth and expansion. A Wood-dominant person is principled and action-oriented; weak Wood may mean indecision.' },
    '火': { color: '#fb7185', season: '夏', dir: '南', organ: '心與小腸', trait: '禮、熱情、光明、表達', desc: '火主升騰,象徵熱情與表達。火旺者外向積極、感染力強;火弱者易情緒低沉、動力不足。',
      seasonEn: 'Summer', dirEn: 'South', organEn: 'Heart/Small Intestine', traitEn: 'Propriety, passion, expression', descEn: 'Fire governs rising energy and expression. A Fire-dominant person is outgoing and charismatic; weak Fire may mean low mood and drive.' },
    '土': { color: '#fbbf24', season: '四季末', dir: '中', organ: '脾胃', trait: '信、穩重、包容、承載', desc: '土主承載,象徵穩定與信任。土旺者踏實可靠、重承諾;土弱者易根基不穩、缺乏安全感。',
      seasonEn: 'Late seasons', dirEn: 'Center', organEn: 'Spleen/Stomach', traitEn: 'Trust, stability, grounding', descEn: 'Earth governs nurturing and grounding. An Earth-dominant person is reliable and committed; weak Earth may mean insecurity.' },
    '金': { color: '#d4d9e6', season: '秋', dir: '西', organ: '肺與大腸', trait: '義、果決、肅殺、規範', desc: '金主收斂,象徵決斷與規範。金旺者原則分明、執行力佳;金弱者易猶豫、難下決心。',
      seasonEn: 'Autumn', dirEn: 'West', organEn: 'Lungs/Large Intestine', traitEn: 'Righteousness, decisiveness', descEn: 'Metal governs contraction and order. A Metal-dominant person is decisive and disciplined; weak Metal may mean hesitation.' },
    '水': { color: '#60a5fa', season: '冬', dir: '北', organ: '腎與膀胱', trait: '智、靈活、智慧、流動', desc: '水主潤下,象徵智慧與應變。水旺者思維敏捷、善於溝通;水弱者易思路閉塞、應變不足。',
      seasonEn: 'Winter', dirEn: 'North', organEn: 'Kidney/Bladder', traitEn: 'Wisdom, flexibility', descEn: 'Water governs flow and adaptability. A Water-dominant person is quick-thinking and communicative; weak Water may mean rigidity.' }
  };

  /* ---------- 匯出 ---------- */
  global.BaZi = {
    calculate,
    solarTerms,
    sunLongitude,
    lichunJD,
    tenGod,
    toJD, fromJD,
    GAN, ZHI, GAN_EL, ZHI_EL, ELEMENTS, ZODIAC, HIDDEN, JIE,
    SHENG, KE, SHENG_BY, KE_BY,
    EL_INFO,
    ELEMENT_EN, GAN_PINYIN, ZHI_PINYIN, ZODIAC_EN, JIE_EN,
    STRENGTH_EN, SHISHEN_EN, RELATION_EN, ROLE_EN, PILLAR_EN, YY_EN
  };

})(typeof window !== 'undefined' ? window : globalThis);
