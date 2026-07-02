/** Flower library — assets live in /public */
export const FLOWER_LIBRARY = [
  {
    id: 'rose',
    name: 'Rose',
    image: '/Bouquet_Rose.png',
    width: 140,
    height: 180,
  },
  {
    id: 'peonies',
    name: 'Peonies',
    image: '/Bouquet_Peonies.png',
    width: 130,
    height: 170,
  },
  {
    id: 'tulip',
    name: 'Tulip',
    image: '/Bouquet_tulip.png',
    width: 120,
    height: 200,
  },
];

export const FLOWER_BY_ID = Object.fromEntries(
  FLOWER_LIBRARY.map(f => [f.id, f]),
);

export const EMPTY_QUANTITIES = Object.fromEntries(
  FLOWER_LIBRARY.map(f => [f.id, 0]),
);
