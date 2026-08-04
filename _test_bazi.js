const fs = require('fs');
const path = require('path');
const code = fs.readFileSync(path.join(__dirname, 'assets/js/bazi.js'), 'utf8');
eval(code);
const B = globalThis.BaZi;

console.log('=== 節氣時刻驗證 (2024年, 香港時間) ===');
const terms = B.solarTerms(2024);
['立春', '春分', '夏至', '秋分', '冬至'].forEach(n => {
  const t = terms.find(x => x.name === n);
  const hk = new Date(t.date.getTime() + 8 * 3600000);
  console.log('  ' + n + ': ' + hk.toISOString().slice(0, 16).replace('T', ' '));
});

console.log('\n=== 已知命例驗證 (關閉真太陽時, 純鐘錶時間) ===');
const cases = [
  { name: '1949-10-01 15:00 北京', o: { y: 1949, m: 10, d: 1, h: 15, mi: 0, tz: 8, lng: 116.40, trueSolar: false }, expect: '己丑 癸酉 甲子 壬申' },
  { name: '2000-01-01 12:00 香港', o: { y: 2000, m: 1, d: 1, h: 12, mi: 0, tz: 8, lng: 114.17, trueSolar: false }, expect: '己卯 丙子 戊午 戊午' },
  { name: '1984-02-04 12:00 香港', o: { y: 1984, m: 2, d: 4, h: 12, mi: 0, tz: 8, lng: 114.17, trueSolar: false }, expect: '甲子年開端(立春 1984-02-04 22:19 前→癸亥)' },
  { name: '2024-02-04 18:00 香港', o: { y: 2024, m: 2, d: 4, h: 18, mi: 0, tz: 8, lng: 114.17, trueSolar: false }, expect: '立春16:27後 → 甲辰年' },
  { name: '2024-02-04 10:00 香港', o: { y: 2024, m: 2, d: 4, h: 10, mi: 0, tz: 8, lng: 114.17, trueSolar: false }, expect: '立春前 → 癸卯年 乙丑月' }
];
cases.forEach(c => {
  const r = B.calculate(c.o);
  const got = r.pillars.map(p => p.gz).join(' ');
  console.log('  ' + c.name);
  console.log('    得到: ' + got + '   生肖:' + r.zodiac + '  節令:' + r.jieName + '  八字年:' + r.baziYear);
  console.log('    預期: ' + c.expect);
});

console.log('\n=== 日柱連續性檢查 (應為連續甲子循環) ===');
let prev = null, ok = true;
for (let d = 1; d <= 40; d++) {
  const r = B.calculate({ y: 2026, m: 1, d: d, h: 12, mi: 0, tz: 8, trueSolar: false });
  const idx = r.pillars[2].sixtyIndex;
  if (prev !== null && idx !== (prev + 1) % 60) { ok = false; console.log('  ✗ 斷裂於第 ' + d + ' 天'); }
  prev = idx;
}
console.log('  ' + (ok ? '✓ 40 天日柱連續無誤' : '✗ 有斷裂'));

console.log('\n=== 完整分析輸出範例 (1990-06-15 08:30 香港) ===');
const r = B.calculate({ y: 1990, m: 6, d: 15, h: 8, mi: 30, tz: 8 });
console.log('  四柱: ' + r.pillars.map(p => p.label + p.gz + '(' + p.shishen + ')').join('  '));
console.log('  輸入時間(當地): ' + r.correction.adjustedTime);
console.log('  日主: ' + r.dayMaster.yy + r.dayMaster.el + ' (' + r.dayMaster.gan + ')');
console.log('  五行分數: ' + JSON.stringify(r.score));
console.log('  五行占比: ' + JSON.stringify(r.pct));
console.log('  強弱: ' + r.strength + ' (指數 ' + r.strengthIdx + ', 同黨占比 ' + r.supportPct + '%)');
console.log('  喜用神: ' + r.favor.join('、') + '   忌神: ' + r.avoid.join('、'));
console.log('  納音: ' + r.pillars.map(p => p.nayin).join(' / '));
console.log('  調候: ' + (r.tiaohou ? r.tiaohou.el + ' — ' + r.tiaohou.why : '無需特別調候'));
console.log('  藏干數: ' + r.detail.length + ' 項, 總分 ' + r.total);
console.log('  摘要: ' + r.summary);
console.log('  論證: ' + r.logic);

console.log('\n=== 五行占比總和檢查 ===');
const sum = Object.values(r.pct).reduce((a, b) => a + b, 0);
console.log('  總和 = ' + sum.toFixed(1) + '% ' + (Math.abs(sum - 100) < 0.5 ? '✓' : '✗'));

console.log('\n=== 隨機 200 例穩定性測試 ===');
let err = 0;
for (let i = 0; i < 200; i++) {
  const y = 1930 + Math.floor(Math.random() * 96);
  const m = 1 + Math.floor(Math.random() * 12);
  const d = 1 + Math.floor(Math.random() * 28);
  const h = Math.floor(Math.random() * 24);
  try {
    const rr = B.calculate({ y, m, d, h, mi: 0, tz: 8, lng: 114.17, trueSolar: true });
    if (!rr.favor.length || rr.pillars.some(p => !p.gz || p.gz.length !== 2) || !rr.pillars[0].nayin) err++;
  } catch (e) { err++; console.log('  例外: ' + y + '-' + m + '-' + d + ' ' + e.message); }
}
console.log('  ' + (err === 0 ? '✓ 200 例全部正常' : '✗ ' + err + ' 例異常'));
