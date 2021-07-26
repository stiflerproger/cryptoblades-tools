$(document).ready(init);

const TRAITS = {
  'fire-icon': 'fire',
  'earth-icon': 'earth',
  'lightning-icon': 'lightning',
  'water-icon': 'water',
}

const WEAPON_TRAITS = {
  'str-icon': TRAITS['fire-icon'],
  'dex-icon': TRAITS['earth-icon'],
  'cha-icon': TRAITS['lightning-icon'],
  'water-icon': TRAITS['water-icon'],
  'pwr-icon': 'power',
}

const BEATS = {
  'fire': 'earth',
  'earth': 'lightning',
  'lightning': 'water',
  'water': 'fire',
}

function init() {
  initFightTools();
}

async function waitForElement(selector) {
  if ($(selector).length) return $(selector);

  await sleep(500);

  return waitForElement(selector);
}

function sleep(ms) {
  return new Promise(res => setTimeout(res, ms))
}