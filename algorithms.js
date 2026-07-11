/* ================================================================
   CUBE TRAINER – DATABÁZE PLL A OLL

   OBRÁZKY ALGORITMŮ
   ------------------
   1. V projektu jsou připravené složky:
        alg-images/pll/
        alg-images/oll/

   2. Doporučené názvy souborů:
        alg-images/pll/f-perm.webp
        alg-images/oll/oll21.webp

   3. Cestu zapiš do položky `image`. Příklad:
        image: "alg-images/oll/oll21.webp"

   4. Doporučení pro rychlou aplikaci:
      - WebP nebo PNG, ideálně 300 × 300 až 400 × 400 px
      - přibližně 30–80 kB na jeden obrázek
      - stejná orientace všech schémat: žlutá nahoře, zelená vpředu
      - obrázek se načítá pouze pro právě zvolený algoritmus

   DŮLEŽITÉ:
   `pllAlgs` a `ollAlgs` zůstávají jednoduché objekty kvůli kompatibilitě
   se současnou aplikací. Podrobné informace jsou v `pllCases` a `ollCases`.
   ================================================================ */

export const pllAlgs = {
  'Z-rot test': "z R U R' U' z'",
  'test-Fperm': "y R' U' F' R U R' U' R' F R2 U' R' U' R U R' U R",
  'Ua-perm': "M2 U M U2 M' U M2",
  'Ub-perm': "M2 U' M U2 M' U' M2",
  'Z-perm': "M2 U M2 U M' U2 M2 U2 M' U2",
  'H-perm': 'M2 U M2 U2 M2 U M2',
  'Aa-perm': "x R' U R' D2 R U' R' D2 R2 x'",
  'Ab-perm': "x R2 D2 R U R' D2 R U' R x'",
  'E-perm': "x' R U' R' D R U R' D' R U R' D R U' R' D' x",
  'T-perm': "R U R' U' R' F R2 U' R' U' R U R' F'",
  'F-perm': "R' U' F' R U R' U' R' F R2 U' R' U' R U R' U R",
  'Ja-perm': "y R' U L' U2 R U' R' U2 R L",
  'Jb-perm': "R U R' F' R U R' U' R' F R2 U' R'",
  'Ra-perm': "R U' R' U' R U R D R' U' R D' R' U2 R'",
  'Rb-perm': "R' U2 R U2 R' F R U R' U' R' F' R2",
  'V-perm': "R' U R' U' y R' F' R2 U' R' U R' F R F",
  'Y-perm': "F R U' R' U' R U R' F' R U R' U' R' F R F'",
  'Na-perm': "R U R' U R U R' F' R U R' U' R' F R2 U' R'",
  'Nb-perm': "R' U R U' R' F' U' F R U R' F R' F' R U'",
  'Ga-perm': "R2 U R' U R' U' R U' R2 D U' R' U R D'",
  'Gb-perm': "R' U' R U D' R2 U R' U R U' R U' R2 D",
  'Gc-perm': "R2 U' R U' R U R' U R2 D' U R U' R' D",
  'Gd-perm': "R U R' U' D R2 U' R U' R' U R' U R2 D'",
};

function makeFourVariants(defaultAlg, customVariants = []) {
  const result = [];
  const seen = new Set();

  function add(name, alg) {
    const normalized = String(alg || "").trim();
    if (!normalized || seen.has(normalized)) return;
    seen.add(normalized);
    result.push({ name, alg: normalized });
  }

  customVariants.forEach((variant) => add(variant.name, variant.alg));
  add("Default", defaultAlg);
  add("Rotace y", `y ${defaultAlg} y'`);
  add("Rotace y2", `y2 ${defaultAlg} y2`);
  add("Rotace y'", `y' ${defaultAlg} y`);

  return result.slice(0, 4);
}

const customPllVariants = {
  "Jb-perm": [
    { name: "Default", alg: "R U R' F' R U R' U' R' F R2 U' R'" },
    { name: "Alt 1", alg: "R U2 R' U' R U2 L' U R' U' L" },
    { name: "Alt 2", alg: "r' F R F' r U2 R' U R U2 R'" },
    { name: "Alt 3", alg: "L' U R U' L U2 R' U R U2 R'" }
  ],
  "Ja-perm": [
    { name: "Default", alg: "y R' U L' U2 R U' R' U2 R L" },
    { name: "Alt 1", alg: "R' U L' U2 R U' R' U2 R L U" }
  ],
  "F-perm": [
    { name: "Default", alg: "R' U' F' R U R' U' R' F R2 U' R' U' R U R' U R" },
    { name: "Alt with y", alg: "y R' U' F' R U R' U' R' F R2 U' R' U' R U R' U R" }
  ]
};

export const pllAlgVariants = Object.fromEntries(
  Object.entries(pllAlgs).map(([name, alg]) => [
    name,
    makeFourVariants(alg, customPllVariants[name] || [])
  ])
);

export const pllCases = Object.entries(pllAlgs).map(([name, algorithm]) => ({
  id: name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""),
  name,
  algorithm,
  algorithms: pllAlgVariants[name],
  image: `alg-images/pll/${name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.webp`
}));

export function getActivePllAlg(name) {
  const variants = pllAlgVariants[name];
  if (!variants || variants.length === 0) return pllAlgs[name];

  const savedIndex = Number(localStorage.getItem("pllVariant:" + name));
  if (Number.isInteger(savedIndex) && variants[savedIndex]?.alg) {
    return variants[savedIndex].alg;
  }

  return variants[0]?.alg || pllAlgs[name];
}

export const ollCases = [
  {
    id: 1,
    name: 'OLL 1',
    group: 'Dot',
    algorithm: "R U2 R2 F R F' U2 R' F R F'",
    algorithms: makeFourVariants("R U2 R2 F R F' U2 R' F R F'"),
    image: "alg-images/oll/oll1.webp"
  },
  {
    id: 2,
    name: 'OLL 2',
    group: 'Dot',
    algorithm: "F R U R' U' F' f R U R' U' f'",
    algorithms: makeFourVariants("F R U R' U' F' f R U R' U' f'"),
    image: "alg-images/oll/oll2.webp"
  },
  {
    id: 3,
    name: 'OLL 3',
    group: 'Dot',
    algorithm: "f R U R' U' f' U' F R U R' U' F'",
    algorithms: makeFourVariants("f R U R' U' f' U' F R U R' U' F'"),
    image: "alg-images/oll/oll3.webp"
  },
  {
    id: 4,
    name: 'OLL 4',
    group: 'Dot',
    algorithm: "f R U R' U' f' U F R U R' U' F'",
    algorithms: makeFourVariants("f R U R' U' f' U F R U R' U' F'"),
    image: "alg-images/oll/oll4.webp"
  },
  {
    id: 5,
    name: 'OLL 5',
    group: 'Square',
    algorithm: "r' U2 R U R' U r",
    algorithms: makeFourVariants("r' U2 R U R' U r"),
    image: "alg-images/oll/oll5.webp"
  },
  {
    id: 6,
    name: 'OLL 6',
    group: 'Square',
    algorithm: "r U2 R' U' R U' r'",
    algorithms: makeFourVariants("r U2 R' U' R U' r'"),
    image: "alg-images/oll/oll6.webp"
  },
  {
    id: 7,
    name: 'OLL 7',
    group: 'Small Lightning',
    algorithm: "r U R' U R U2 r'",
    algorithms: makeFourVariants("r U R' U R U2 r'"),
    image: "alg-images/oll/oll7.webp"
  },
  {
    id: 8,
    name: 'OLL 8',
    group: 'Small Lightning',
    algorithm: "r' U' R U' R' U2 r",
    algorithms: makeFourVariants("r' U' R U' R' U2 r"),
    image: "alg-images/oll/oll8.webp"
  },
  {
    id: 9,
    name: 'OLL 9',
    group: 'Fish',
    algorithm: "R U R' U' R' F R2 U R' U' F'",
    algorithms: makeFourVariants("R U R' U' R' F R2 U R' U' F'"),
    image: "alg-images/oll/oll9.webp"
  },
  {
    id: 10,
    name: 'OLL 10',
    group: 'Fish',
    algorithm: "R U R' U R' F R F' R U2 R'",
    algorithms: makeFourVariants("R U R' U R' F R F' R U2 R'"),
    image: "alg-images/oll/oll10.webp"
  },
  {
    id: 11,
    name: 'OLL 11',
    group: 'Small Lightning',
    algorithm: "r' R2 U R' U R U2 R' U M'",
    algorithms: makeFourVariants("r' R2 U R' U R U2 R' U M'"),
    image: "alg-images/oll/oll11.webp"
  },
  {
    id: 12,
    name: 'OLL 12',
    group: 'Small Lightning',
    algorithm: "M' R' U' R U' R' U2 R U' M",
    algorithms: makeFourVariants("M' R' U' R U' R' U2 R U' M"),
    image: "alg-images/oll/oll12.webp"
  },
  {
    id: 13,
    name: 'OLL 13',
    group: 'Knight Move',
    algorithm: "F U R U' R2 F' R U R U' R'",
    algorithms: makeFourVariants("F U R U' R2 F' R U R U' R'"),
    image: "alg-images/oll/oll13.webp"
  },
  {
    id: 14,
    name: 'OLL 14',
    group: 'Knight Move',
    algorithm: "R' F R U R' F' R F U' F'",
    algorithms: makeFourVariants("R' F R U R' F' R F U' F'"),
    image: "alg-images/oll/oll14.webp"
  },
  {
    id: 15,
    name: 'OLL 15',
    group: 'Knight Move',
    algorithm: "r' U' r R' U' R U r' U r",
    algorithms: makeFourVariants("r' U' r R' U' R U r' U r"),
    image: "alg-images/oll/oll15.webp"
  },
  {
    id: 16,
    name: 'OLL 16',
    group: 'Knight Move',
    algorithm: "r U r' R U R' U' r U' r'",
    algorithms: makeFourVariants("r U r' R U R' U' r U' r'"),
    image: "alg-images/oll/oll16.webp"
  },
  {
    id: 17,
    name: 'OLL 17',
    group: 'Dot',
    algorithm: "R U R' U R' F R F' U2 R' F R F'",
    algorithms: makeFourVariants("R U R' U R' F R F' U2 R' F R F'"),
    image: "alg-images/oll/oll17.webp"
  },
  {
    id: 18,
    name: 'OLL 18',
    group: 'Dot',
    algorithm: "F R U R' U' F' U R U2 R' U' R U R'",
    algorithms: makeFourVariants("F R U R' U' F' U R U2 R' U' R U R'"),
    image: "alg-images/oll/oll18.webp"
  },
  {
    id: 19,
    name: 'OLL 19',
    group: 'Dot',
    algorithm: "R' U2 F R U R' U' F2 U2 F R",
    algorithms: makeFourVariants("R' U2 F R U R' U' F2 U2 F R"),
    image: "alg-images/oll/oll19.webp"
  },
  {
    id: 20,
    name: 'OLL 20',
    group: 'Dot',
    algorithm: "M' U2 M U2 M' U M U2 M' U2 M",
    algorithms: makeFourVariants("M' U2 M U2 M' U M U2 M' U2 M"),
    image: "alg-images/oll/oll20.webp"
  },
  {
    id: 21,
    name: 'OLL 21 (H / Cross)',
    group: 'OCLL',
    algorithm: "R U2 R' U' R U R' U' R U' R'",
    algorithms: makeFourVariants("R U2 R' U' R U R' U' R U' R'"),
    image: "alg-images/oll/oll21.webp"
  },
  {
    id: 22,
    name: 'OLL 22 (Pi)',
    group: 'OCLL',
    algorithm: "R U2 R2 U' R2 U' R2 U2 R",
    algorithms: makeFourVariants("R U2 R2 U' R2 U' R2 U2 R"),
    image: "alg-images/oll/oll22.webp"
  },
  {
    id: 23,
    name: 'OLL 23 (Headlights)',
    group: 'OCLL',
    algorithm: "R2 D' R U2 R' D R U2 R",
    algorithms: makeFourVariants("R2 D' R U2 R' D R U2 R"),
    image: "alg-images/oll/oll23.webp"
  },
  {
    id: 24,
    name: 'OLL 24 (Chameleon)',
    group: 'OCLL',
    algorithm: "r U R' U' r' F R F'",
    algorithms: makeFourVariants("r U R' U' r' F R F'"),
    image: "alg-images/oll/oll24.webp"
  },
  {
    id: 25,
    name: 'OLL 25 (Bowtie)',
    group: 'OCLL',
    algorithm: "F' r U R' U' r' F R",
    algorithms: makeFourVariants("F' r U R' U' r' F R"),
    image: "alg-images/oll/oll25.webp"
  },
  {
    id: 26,
    name: 'OLL 26 (Anti-Sune)',
    group: 'OCLL',
    algorithm: "R' U' R U' R' U2 R",
    algorithms: makeFourVariants("R' U' R U' R' U2 R"),
    image: "alg-images/oll/oll26.webp"
  },
  {
    id: 27,
    name: 'OLL 27 (Sune)',
    group: 'OCLL',
    algorithm: "R U R' U R U2 R'",
    algorithms: makeFourVariants("R U R' U R U2 R'"),
    image: "alg-images/oll/oll27.webp"
  },
  {
    id: 28,
    name: 'OLL 28',
    group: 'L-Shape',
    algorithm: "r U R' U' M U R U' R'",
    algorithms: makeFourVariants("r U R' U' M U R U' R'"),
    image: "alg-images/oll/oll28.webp"
  },
  {
    id: 29,
    name: 'OLL 29',
    group: 'Awkward',
    algorithm: "R U R' U' R U' R' F' U' F R U R'",
    algorithms: makeFourVariants("R U R' U' R U' R' F' U' F R U R'"),
    image: "alg-images/oll/oll29.webp"
  },
  {
    id: 30,
    name: 'OLL 30',
    group: 'Awkward',
    algorithm: "F R' F R2 U' R' U' R U R' F2",
    algorithms: makeFourVariants("F R' F R2 U' R' U' R U R' F2"),
    image: "alg-images/oll/oll30.webp"
  },
  {
    id: 31,
    name: 'OLL 31',
    group: 'P-Shape',
    algorithm: "R' U' F U R U' R' F' R",
    algorithms: makeFourVariants("R' U' F U R U' R' F' R"),
    image: "alg-images/oll/oll31.webp"
  },
  {
    id: 32,
    name: 'OLL 32',
    group: 'P-Shape',
    algorithm: "R U B' U' R' U R B R'",
    algorithms: makeFourVariants("R U B' U' R' U R B R'"),
    image: "alg-images/oll/oll32.webp"
  },
  {
    id: 33,
    name: 'OLL 33',
    group: 'T-Shape',
    algorithm: "R U R' U' R' F R F'",
    algorithms: makeFourVariants("R U R' U' R' F R F'"),
    image: "alg-images/oll/oll33.webp"
  },
  {
    id: 34,
    name: 'OLL 34',
    group: 'C-Shape',
    algorithm: "R U R' U' B' R' F R F' B",
    algorithms: makeFourVariants("R U R' U' B' R' F R F' B"),
    image: "alg-images/oll/oll34.webp"
  },
  {
    id: 35,
    name: 'OLL 35',
    group: 'Fish',
    algorithm: "R U2 R2 F R F' R U2 R'",
    algorithms: makeFourVariants("R U2 R2 F R F' R U2 R'"),
    image: "alg-images/oll/oll35.webp"
  },
  {
    id: 36,
    name: 'OLL 36',
    group: 'W-Shape',
    algorithm: "R U2 R' U' R U' R' U' R' F R F'",
    algorithms: makeFourVariants("R U2 R' U' R U' R' U' R' F R F'"),
    image: "alg-images/oll/oll36.webp"
  },
  {
    id: 37,
    name: 'OLL 37',
    group: 'Fish',
    algorithm: "F R' F' R U R U' R'",
    algorithms: makeFourVariants("F R' F' R U R U' R'"),
    image: "alg-images/oll/oll37.webp"
  },
  {
    id: 38,
    name: 'OLL 38',
    group: 'W-Shape',
    algorithm: "R U R' U R U' R' U' R' F R F'",
    algorithms: makeFourVariants("R U R' U R U' R' U' R' F R F'"),
    image: "alg-images/oll/oll38.webp"
  },
  {
    id: 39,
    name: 'OLL 39',
    group: 'Big Lightning',
    algorithm: "R U R' F' U' F U R U2 R'",
    algorithms: makeFourVariants("R U R' F' U' F U R U2 R'"),
    image: "alg-images/oll/oll39.webp"
  },
  {
    id: 40,
    name: 'OLL 40',
    group: 'Big Lightning',
    algorithm: "R' F R F' U' R' U' R U R' U R",
    algorithms: makeFourVariants("R' F R F' U' R' U' R U R' U R"),
    image: "alg-images/oll/oll40.webp"
  },
  {
    id: 41,
    name: 'OLL 41',
    group: 'Awkward',
    algorithm: "R U R' U R U2 R' F R U R' U' F'",
    algorithms: makeFourVariants("R U R' U R U2 R' F R U R' U' F'"),
    image: "alg-images/oll/oll41.webp"
  },
  {
    id: 42,
    name: 'OLL 42',
    group: 'Awkward',
    algorithm: "R' U' R U' R' U2 R F R U R' U' F'",
    algorithms: makeFourVariants("R' U' R U' R' U2 R F R U R' U' F'"),
    image: "alg-images/oll/oll42.webp"
  },
  {
    id: 43,
    name: 'OLL 43',
    group: 'P-Shape',
    algorithm: "R' U' F' U F R",
    algorithms: makeFourVariants("R' U' F' U F R"),
    image: "alg-images/oll/oll43.webp"
  },
  {
    id: 44,
    name: 'OLL 44',
    group: 'P-Shape',
    algorithm: "R U F U' F' R'",
    algorithms: makeFourVariants("R U F U' F' R'"),
    image: "alg-images/oll/oll44.webp"
  },
  {
    id: 45,
    name: 'OLL 45',
    group: 'T-Shape',
    algorithm: "F R U R' U' F'",
    algorithms: makeFourVariants("F R U R' U' F'"),
    image: "alg-images/oll/oll45.webp"
  },
  {
    id: 46,
    name: 'OLL 46',
    group: 'C-Shape',
    algorithm: "R' U' R' F R F' U R",
    algorithms: makeFourVariants("R' U' R' F R F' U R"),
    image: "alg-images/oll/oll46.webp"
  },
  {
    id: 47,
    name: 'OLL 47',
    group: 'L-Shape',
    algorithm: "F' L' U' L U L' U' L U F",
    algorithms: makeFourVariants("F' L' U' L U L' U' L U F"),
    image: "alg-images/oll/oll47.webp"
  },
  {
    id: 48,
    name: 'OLL 48',
    group: 'L-Shape',
    algorithm: "F R U R' U' R U R' U' F'",
    algorithms: makeFourVariants("F R U R' U' R U R' U' F'"),
    image: "alg-images/oll/oll48.webp"
  },
  {
    id: 49,
    name: 'OLL 49',
    group: 'Big Lightning',
    algorithm: "r U' r2 U r2 U r2 U' r",
    algorithms: makeFourVariants("r U' r2 U r2 U r2 U' r"),
    image: "alg-images/oll/oll49.webp"
  },
  {
    id: 50,
    name: 'OLL 50',
    group: 'Big Lightning',
    algorithm: "r' U r2 U' r2 U' r2 U r'",
    algorithms: makeFourVariants("r' U r2 U' r2 U' r2 U r'"),
    image: "alg-images/oll/oll50.webp"
  },
  {
    id: 51,
    name: 'OLL 51',
    group: 'I-Shape',
    algorithm: "f R U R' U' R U R' U' f'",
    algorithms: makeFourVariants("f R U R' U' R U R' U' f'"),
    image: "alg-images/oll/oll51.webp"
  },
  {
    id: 52,
    name: 'OLL 52',
    group: 'I-Shape',
    algorithm: "R U R' U R U' B U' B' R'",
    algorithms: makeFourVariants("R U R' U R U' B U' B' R'"),
    image: "alg-images/oll/oll52.webp"
  },
  {
    id: 53,
    name: 'OLL 53',
    group: 'L-Shape',
    algorithm: "l' U2 L U L' U l",
    algorithms: makeFourVariants("l' U2 L U L' U l"),
    image: "alg-images/oll/oll53.webp"
  },
  {
    id: 54,
    name: 'OLL 54',
    group: 'L-Shape',
    algorithm: "r U2 R' U' R U' r'",
    algorithms: makeFourVariants("r U2 R' U' R U' r'"),
    image: "alg-images/oll/oll54.webp"
  },
  {
    id: 55,
    name: 'OLL 55',
    group: 'I-Shape',
    algorithm: "R' F R U R U' R2 F' R2 U' R' U R U R'",
    algorithms: makeFourVariants("R' F R U R U' R2 F' R2 U' R' U R U R'"),
    image: "alg-images/oll/oll55.webp"
  },
  {
    id: 56,
    name: 'OLL 56',
    group: 'I-Shape',
    algorithm: "r' U' r U' R' U R U' R' U R r' U r",
    algorithms: makeFourVariants("r' U' r U' R' U R U' R' U R r' U r"),
    image: "alg-images/oll/oll56.webp"
  },
  {
    id: 57,
    name: 'OLL 57',
    group: 'L-Shape',
    algorithm: "R U R' U' M' U R U' r'",
    algorithms: makeFourVariants("R U R' U' M' U R U' r'"),
    image: "alg-images/oll/oll57.webp"
  },
];

export const ollAlgs = Object.fromEntries(
  ollCases.map((item) => [item.name, item.algorithm])
);

export const ollAlgVariants = Object.fromEntries(
  ollCases.map((item) => [item.name, item.algorithms])
);

export function getActiveOllAlg(name) {
  const variants = ollAlgVariants[name];
  if (!variants || variants.length === 0) return ollAlgs[name];

  const savedIndex = Number(localStorage.getItem("ollVariant:" + name));
  if (Number.isInteger(savedIndex) && variants[savedIndex]?.alg) {
    return variants[savedIndex].alg;
  }

  return variants[0]?.alg || ollAlgs[name];
}

export function getAlgorithmCase(type, name) {
  const source = type === "oll" ? ollCases : pllCases;
  return source.find((item) => item.name === name) || null;
}
