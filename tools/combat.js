let lastEnemies = [{}, {}, {}, {}];

async function initFightTools() {

  while (true) {
    await waitForElement('.enemy-list');

    if (
      !$('.enemy-list > div').first()
      || !isEnemiesChanged()
    ) {
      await sleep(1000);
      continue;
    }

    await fight();
  }

}

function isEnemiesChanged() {
  const enemies = getEnemies();

  for (let i = 0; i < enemies.length; i++) {
    if (enemies[i].power !== lastEnemies[i].power) return true;
  }

  return false;
}

async function fight() {
  const hero = getHero();
  const weapon = await getWeapon();
  const enemies = getEnemies();

  lastEnemies = enemies;

  console.log(hero, weapon, enemies);

  const heroAlignedPower = getAlignedPower(hero, weapon);

  for (let i = 0; i < enemies.length; i++) {

    const enemy = enemies[i];

    let traitBonus = 1;
    if (hero.trait === weapon.trait) traitBonus += 0.075;
    if (BEATS[hero.trait] === enemy.trait) traitBonus += 0.075;
    if (BEATS[enemy.trait] === hero.trait) traitBonus -= 0.075;

    const chance = getChance([
      (heroAlignedPower * traitBonus) * 0.9,
      (heroAlignedPower * traitBonus) * 1.1,
    ], [
      enemy.power * 0.9,
      enemy.power * 1.1,
    ]);

    $($('.enemy-list > div')[i]).find('button > h1').text(chance + '%');

  }

}

function getAlignedPower(hero, weapon) {
  let weaponAligned = 0;

  // 3 is amount of maximum weapon stats
  for (let i = 1; i <= 3; i++) {
    if (!Object(weapon).hasOwnProperty(`stat${i}`)) break;

    if (weapon[`stat${i}`].trait !== hero.trait) weaponAligned += (weapon[`stat${i}`].power * 0.0025);
    if (weapon[`stat${i}`].trait === hero.trait) weaponAligned += (weapon[`stat${i}`].power * 0.002675);
    if (weapon[`stat${i}`].trait === WEAPON_TRAITS["pwr-icon"]) weaponAligned += (weapon[`stat${i}`].power * 0.002575);
  }

  return ((weaponAligned + 1) * hero.power) + weapon.bonusPower;
}

function getChance(rollHero, rollEnemy) {

  rollHero = [Math.floor(rollHero[0]), Math.floor(rollHero[1])];
  rollEnemy = [Math.floor(rollEnemy[0]), Math.floor(rollEnemy[1])];

  const tries = 500, result = [0, 0]; // [win, loss]

  for (let i = 0; i < tries; i++) {

    if (
      Math.floor(Math.random() * (rollHero[1] - rollHero[0]) + rollHero[0]) > Math.floor(Math.random() * (rollEnemy[1] - rollEnemy[0]) + rollEnemy[0])
    ) {
      result[0]++;
    } else {
      result[1]++;
    }

  }

  return Number((result[0] * 100 / tries).toFixed(2));

}

function getEnemies() {

  const $enemies = $('.encounter-container');

  if (!$enemies.length) throw new Error('Enemies not exists. It\'s bad =)');

  const result = [];

  $enemies.each(function () {
    const $enemy = $(this);

    result.push({
      trait: TRAITS[$enemy.find('.encounter-element  > span').attr("class").trim()],
      power: Number($enemy.find('.encounter-power').text().match(/\d/g).join("")),
      xp: Number($enemy.find('.xp-gain').text().match(/\d/g).join("")),
    })
  });

  return result;
}

async function getWeapon() {

  const $weapon = $('.weapon-icon-wrapper').first();

  if (!$weapon) throw new Error('Weapon not exists. It\'s bad =)');

  const tooltip = await getWeaponTooltip();

  async function getWeaponTooltip() {
    // сделать инъекцию скрипта, чтобы получить доступ к атрибутам DOM элемента

    const head = document.getElementsByTagName('head')[0];
    const script = document.createElement('script');

    script.type = 'text/javascript';

    const prefix = Date.now();

    script.id = 'script' + prefix;
    script.innerHTML = inject.toString().replace('function inject', `function inject${prefix}`) + `inject${prefix}(${prefix});`;

    head.appendChild(script);

    // ожидаем записи в скрипт
    while (true) {
      if ($(`#weapon-tooltip${prefix}`) && $(`#weapon-tooltip${prefix}`).text()) {
        const res = $(`#weapon-tooltip${prefix}`).text();
        $(`#weapon-tooltip${prefix}`).remove()
        $(`#script${prefix}`).remove()
        return res;
      }

      await sleep(100);
    }

    function inject(prefix) {
      const elem = document.querySelector('.weapon-icon-wrapper > .has-tooltip');

      let div = document.querySelector(`#weapon-tooltip${prefix}`);

      if (!div) {
        div = document.createElement('div');
        div.id = 'weapon-tooltip' + prefix;

        (document.getElementsByTagName('body')[0]).appendChild(div);

        div = document.querySelector('#weapon-tooltip' + prefix);
      }

      div.innerHTML = elem._tooltip.options.title;
    }

  }

  return {
    name: $weapon.find('.name').text().trim(),
    bonusPower: tooltip.indexOf('Bonus power:') > -1 ? Number(tooltip.split('Bonus power:')[1].match(/\d/g).join("")) : 0,
    trait: TRAITS[$weapon.find('.trait > span').attr("class").trim()],
    ...(
      $weapon.find('.stats > div').length > 0 && {
        stat1: {
          power: Number($($weapon.find('.stats > div')[0]).text().match(/\d/g).join("")),
          trait: WEAPON_TRAITS[(' ' + $($weapon.find('.stats > div')[0]).find('span').first().attr('class')).replace('mr-1', '').replace(' icon', '').trim()],
        }
      }
    ),
    ...(
      $weapon.find('.stats > div').length > 1 && {
        stat2: {
          power: Number($($weapon.find('.stats > div')[1]).text().match(/\d/g).join("")),
          trait: WEAPON_TRAITS[(' ' + $($weapon.find('.stats > div')[1]).find('span').first().attr('class')).replace('mr-1', '').replace(' icon', '').trim()],
        }
      }
    ),
    ...(
      $weapon.find('.stats > div').length > 2 && {
        stat3: {
          power: Number($($weapon.find('.stats > div')[2]).text().match(/\d/g).join("")),
          trait: WEAPON_TRAITS[(' ' + $($weapon.find('.stats > div')[2]).find('span').first().attr('class')).replace('mr-1', '').replace(' icon', '').trim()],
        }
      }
    ),
  }
}

function getHero() {
  const $hero = $('.character-data-column').first();

  if (!$hero) throw new Error('Hero not exists. Be sure that hero description is not collapsed');

  return {
    name: $hero.find('.character-name').text().trim(),
    power: Number(($hero.find('.subtext-stats').text().split('Power:')[1]).match(/\d/g).join("")),
    trait: TRAITS[$hero.find('.trait-icon').attr("class").replace('trait-icon', '').trim()],
  }
}