const SHUFFLE_CARDS = [
  '/splash_cards_kenta/card01_convenience.png',
  '/splash_cards_kenta/card02_warehouse.png',
  '/splash_cards_kenta/card03_youtuber.png',
  '/splash_cards_kenta/card04_civil_servant.png',
  '/splash_cards_kenta/card05_ramen.png',
  '/splash_cards_kenta/card06_boxer.png',
  '/splash_cards_kenta/card07_surgeon.png',
  '/splash_cards_kenta/card08_business_owner.png',
  '/splash_cards_kenta/card09_mercenary.png',
  '/splash_cards_kenta/card10_rockstar.png',
  '/splash_cards_kenta/card11_demon_king.png',
  '/splash_cards_kenta/card12_hero.png',
  '/splash_cards_shoichi/shoichi_card01_fish.png',
  '/splash_cards_shoichi/shoichi_card02_train.png',
  '/splash_cards_shoichi/shoichi_card03_host.png',
  '/splash_cards_shoichi/shoichi_card04_rehire.png',
  '/splash_cards_shoichi/shoichi_card05_bear.png',
  '/splash_cards_shoichi/shoichi_card06_ikemen.png',
  '/splash_cards_shoichi/shoichi_card07_beach_bar.png',
  '/splash_cards_shoichi/shoichi_card08_revenge_boss.png',
  '/splash_cards_shoichi/shoichi_card09_youth_love.png',
  '/splash_cards_shoichi/shoichi_card10_happy_family.png',
  '/splash_cards_shoichi/shoichi_card11_pilot.png',
  '/splash_cards_shoichi/shoichi_card12_investor.png',
  '/splash_cards_tatumi/tatumi_card01.png',
  '/splash_cards_tatumi/tatumi_card02.png',
  '/splash_cards_tatumi/tatumi_card03.png',
  '/splash_cards_tatumi/tatumi_card04.png',
  '/splash_cards_tatumi/tatumi_card05.png',
  '/splash_cards_tatumi/tatumi_card06.png',
  '/splash_cards_tatumi/tatumi_card07.png',
  '/splash_cards_tatumi/tatumi_card08.png',
  '/splash_cards_tatumi/tatumi_card09.png',
  '/splash_cards_tatumi/tatumi_card10.png',
  '/splash_cards_tatumi/tatumi_card11.png',
  '/splash_cards_tatumi/tatumi_card12.png',
  '/splash_cards_yahei/yahei_card01.png',
  '/splash_cards_yahei/yahei_card02.png',
  '/splash_cards_yahei/yahei_card03.png',
  '/splash_cards_yahei/yahei_card04.png',
  '/splash_cards_yahei/yahei_card05.png',
  '/splash_cards_yahei/yahei_card06.png',
  '/splash_cards_yahei/yahei_card07.png',
  '/splash_cards_yahei/yahei_card08.png',
  '/splash_cards_yahei/yahei_card09.png',
  '/splash_cards_yahei/yahei_card10.png',
  '/splash_cards_yahei/yahei_card11.png',
  '/splash_cards_yahei/yahei_card12.png',
];

export function getRandomShuffleCards(count = 12) {
  const shuffled = [...SHUFFLE_CARDS];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled.slice(0, count);
}

export { SHUFFLE_CARDS };
