const { chromium } = require('C:/Users/louisalau/.workbuddy/binaries/node/workspace/node_modules/playwright');
const URL = 'file:///C:/Users/louisalau/WorkBuddy/2026-08-04-16-14-06/crystal-website/admin.html';

(async () => {
  const browser = await chromium.launch();
  // fresh context => clean localStorage
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  const logs = [];
  page.on('console', m => logs.push('[console.' + m.type() + '] ' + m.text()));
  page.on('pageerror', e => logs.push('[PAGEERROR] ' + e.message));
  page.on('requestfailed', r => logs.push('[REQFAIL] ' + r.url() + ' ' + (r.failure() && r.failure().errorText)));

  await page.goto(URL, { waitUntil: 'networkidle' });
  await page.waitForTimeout(500);

  // Is gate visible?
  const gateVisible = await page.evaluate(() => {
    const g = document.getElementById('gate');
    return !!g && getComputedStyle(g).display !== 'none';
  });
  const loginVal = await page.evaluate(() => (document.getElementById('loginInput') || {}).value);
  console.log('gateVisible:', gateVisible);
  console.log('loginInput prefilled:', JSON.stringify(loginVal));

  // Try default login
  await page.fill('#passInput', 'crystal2026');
  await page.click('#btnUnlock');
  await page.waitForTimeout(400);

  const afterLogin = await page.evaluate(() => {
    const gate = document.getElementById('gate');
    const admin = document.getElementById('admin');
    return {
      gateDisplay: gate ? getComputedStyle(gate).display : 'no-gate',
      adminDisplay: admin ? getComputedStyle(admin).display : 'no-admin',
      gateErr: (document.getElementById('gateErr') || {}).textContent || '',
      gateErrShown: document.getElementById('gateErr') ? getComputedStyle(document.getElementById('gateErr')).display !== 'none' : false
    };
  });
  console.log('after default login:', JSON.stringify(afterLogin));

  // Also dump getSettings adminPass/adminLogin from localStorage
  const settings = await page.evaluate(() => {
    try { return JSON.parse(localStorage.getItem('cw_settings') || 'null'); } catch(e){ return {err:e.message}; }
  });
  console.log('cw_settings.adminLogin:', settings && settings.adminLogin);
  console.log('cw_settings.adminPass:', settings && settings.adminPass);

  console.log('--- console/page logs ---');
  logs.forEach(l => console.log(l));

  await browser.close();
})();
