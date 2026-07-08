'use strict';

/**
 * PWA install controller — proves the beforeinstallprompt/appinstalled state machine with an injected
 * fake window: install becomes available on the deferred event, the prompt resolves accepted/dismissed
 * and is single-use, installed/standalone detection works (display-mode + iOS navigator.standalone),
 * and a no-DOM environment is safe.
 */

const test = require('node:test');
const assert = require('node:assert/strict');

const CTRL = new URL('../src/pwa/install-controller.js', `file://${__filename}`).href;

function makeWin({ standaloneMedia = false, navStandalone = undefined } = {}) {
  const handlers = {};
  return {
    addEventListener(type, fn) {
      (handlers[type] ||= []).push(fn);
    },
    _emit(type, event) {
      (handlers[type] || []).forEach((fn) => fn(event));
    },
    matchMedia() {
      return { matches: standaloneMedia };
    },
    navigator: { standalone: navStandalone },
  };
}

function bipEvent(outcome = 'accepted') {
  let prompted = false;
  return {
    preventDefault() {
      this._prevented = true;
    },
    prompt() {
      prompted = true;
    },
    get _wasPrompted() {
      return prompted;
    },
    userChoice: Promise.resolve({ outcome }),
  };
}

test('install: beforeinstallprompt makes install available and notifies subscribers', async () => {
  const { createInstallController } = await import(CTRL);
  const win = makeWin();
  const ctrl = createInstallController({ win });
  const states = [];
  ctrl.subscribe((s) => states.push(s));
  ctrl.init();
  assert.equal(ctrl.canInstall(), false);

  const ev = bipEvent();
  win._emit('beforeinstallprompt', ev);
  assert.equal(ev._prevented, true); // mini-infobar suppressed
  assert.equal(ctrl.canInstall(), true);
  assert.deepEqual(states.at(-1), { canInstall: true, installed: false });
});

test('install: promptInstall accepts, is single-use, and reports outcome', async () => {
  const { createInstallController } = await import(CTRL);
  const win = makeWin();
  const ctrl = createInstallController({ win });
  ctrl.init();
  win._emit('beforeinstallprompt', bipEvent('accepted'));

  const res = await ctrl.promptInstall();
  assert.deepEqual(res, { outcome: 'accepted' });
  // Deferred prompt is consumed → no longer installable, second prompt unavailable.
  assert.equal(ctrl.canInstall(), false);
  assert.deepEqual(await ctrl.promptInstall(), { outcome: 'unavailable' });
});

test('install: a dismissed choice is reported as dismissed', async () => {
  const { createInstallController } = await import(CTRL);
  const win = makeWin();
  const ctrl = createInstallController({ win });
  ctrl.init();
  win._emit('beforeinstallprompt', bipEvent('dismissed'));
  assert.deepEqual(await ctrl.promptInstall(), { outcome: 'dismissed' });
});

test('install: promptInstall with no deferred event is unavailable', async () => {
  const { createInstallController } = await import(CTRL);
  const ctrl = createInstallController({ win: makeWin() });
  ctrl.init();
  assert.deepEqual(await ctrl.promptInstall(), { outcome: 'unavailable' });
});

test('install: appinstalled marks installed and disables install', async () => {
  const { createInstallController } = await import(CTRL);
  const win = makeWin();
  const ctrl = createInstallController({ win });
  ctrl.init();
  win._emit('beforeinstallprompt', bipEvent());
  assert.equal(ctrl.canInstall(), true);
  win._emit('appinstalled', {});
  assert.equal(ctrl.isInstalled(), true);
  assert.equal(ctrl.canInstall(), false);
});

test('install: standalone display-mode and iOS navigator.standalone count as installed', async () => {
  const { createInstallController } = await import(CTRL);
  const byMedia = createInstallController({ win: makeWin({ standaloneMedia: true }) });
  assert.equal(byMedia.isInstalled(), true);
  const byIos = createInstallController({ win: makeWin({ navStandalone: true }) });
  assert.equal(byIos.isInstalled(), true);
  // Even with a deferred prompt, an already-installed app should not offer install.
  const win = makeWin({ standaloneMedia: true });
  const ctrl = createInstallController({ win });
  ctrl.init();
  win._emit('beforeinstallprompt', bipEvent());
  assert.equal(ctrl.canInstall(), false);
});

test('install: no-DOM environment is safe', async () => {
  const { createInstallController } = await import(CTRL);
  const ctrl = createInstallController({ win: undefined });
  ctrl.init(); // no throw
  assert.equal(ctrl.isInstalled(), false);
  assert.equal(ctrl.canInstall(), false);
  assert.deepEqual(await ctrl.promptInstall(), { outcome: 'unavailable' });
});
