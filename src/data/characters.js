// WealthWise Kids character definitions
// Placeholder colors until Pixar-style assets arrive from Jhomark/Saleem

export const CHARACTERS = {
  miller: {
    id: 'miller',
    name: 'Miller',
    role: 'Leader',
    bodyColor: 0x4488cc,
    shirtColor: 0x3366aa,
    shoeColor: 0xf5c542,  // Signature glowing shoes
    hairColor: 0x2c1810,
    skinColor: 0x8d5524,
    description: 'Confident leader who sees the patterns',
    unlocked: true,
  },
  ava: {
    id: 'ava',
    name: 'Ava',
    role: 'Strategist',
    bodyColor: 0xe88cc0,
    shirtColor: 0xd070a0,
    shoeColor: 0xf5c542,
    hairColor: 0x1a0a00,
    skinColor: 0xa0764e,
    description: 'Smart strategist with a plan',
    unlocked: true,
  },
  macon: {
    id: 'macon',
    name: 'Macon',
    role: 'Builder',
    bodyColor: 0x4ecdc4,
    shirtColor: 0x3eb8b0,
    shoeColor: 0xf5c542,
    hairColor: 0x2c1810,
    skinColor: 0x6b4226,
    description: 'Creative builder who fixes things',
    unlocked: true,
  },
  brooklyn: {
    id: 'brooklyn',
    name: 'Brooklyn',
    role: 'Explorer',
    bodyColor: 0xf5a623,
    shirtColor: 0xd48c10,
    shoeColor: 0xf5c542,
    hairColor: 0x1a0a00,
    skinColor: 0xc68642,
    description: 'Brave explorer who finds hidden paths',
    unlocked: true,
  },
  naya: {
    id: 'naya',
    name: 'Naya',
    role: 'Connector',
    bodyColor: 0x9b59b6,
    shirtColor: 0x8e44ad,
    shoeColor: 0xf5c542,
    hairColor: 0x1a0a00,
    skinColor: 0x7b4b2a,
    description: 'Kind connector who brings people together',
    unlocked: true,
  },
};

export function getCharacter(id) {
  return CHARACTERS[id] || CHARACTERS.miller;
}

export function getAllCharacters() {
  return Object.values(CHARACTERS);
}
