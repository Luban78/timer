// algorithms.js v1
// Databáze PLL algoritmů. Později sem přidáme i OLL.

export const pllAlgs={
 "Z-rot test": "z R U R' U' z'",
 "test-Fperm":"y R' U' F' R U R' U' R' F R2 U' R' U' R U R' U R",
  
"Ua-perm":"M2 U M U2 M' U M2",

"Ub-perm":"M2 U' M U2 M' U' M2",

"Z-perm":"M2 U M2 U M' U2 M2 U2 M' U2",
"H-perm":"M2 U M2 U2 M2 U M2",
"Aa-perm":"x R' U R' D2 R U' R' D2 R2 x'",
"Ab-perm":"x R2 D2 R U R' D2 R U' R x'",
"E-perm":"x' R U' R' D R U R' D' R U R' D R U' R' D'",
"T-perm":"R U R' U' R' F R2 U' R' U' R U R' F'",
"F-perm":"R' U' F' R U R' U' R' F R2 U' R' U' R U R' U R",
"Ja-perm":"y R' U L' U2 R U' R' U2 R L",
"Jb-perm":"R U R' F' R U R' U' R' F R2 U' R'",
"Ra-perm":"R U' R' U' R U R D R' U' R D' R' U2 R'",
"Rb-perm":"R' U2 R U2 R' F R U R' U' R' F' R2",
"V-perm":"R' U R' U' y R' F' R2 U' R' U R' F R F",
"Y-perm":"F R U' R' U' R U R' F' R U R' U' R' F R F'",
"Na-perm":"R U R' U R U R' F' R U R' U' R' F R2 U' R'",
"Nb-perm":"R' U R U' R' F' U' F R U R' F R' F' R U'",
"Ga-perm":"R2 U R' U R' U' R U' R2 D U' R' U R D'",
"Gb-perm":"R' U' R U D' R2 U R' U R U' R U' R2 D",
"Gc-perm":"R2 U' R U' R U R' U R2 D' U R U' R' D",
"Gd-perm":"R U R' U' D R2 U' R U' R' U R' U R2 D'"
};

export const pllAlgVariants = {
    "Aa-perm": [
    {
      name: "Default",
      alg: "x L2 D2 L' U' L D2 L' U L'"
    },
    {
      name: "Alt 1",
      alg: "y' x' L' U L' D2 L U' L' D2 L2"
    },
    {
      name: "Alt 2",
      alg: "y x R' U R' D2 R U' R' D2 R2"
    },
    {
      name: "Alt 3",
      alg: "y2 x' R2 D2 R' U' R D2 R' U R'"
    }
  ],
  "Ab-perm": [
    {
      name: "Default",
      alg: "x' L2 D2 L U L' D2 L U' L"
    },
    {
      name: "Alt 1",
      alg: "y x L U' L D2 L' U L D2 L2"
    },
    {
      name: "Alt 2",
      alg: "y2 x R2 D2 R U R' D2 R U' R"
    },
    {
      name: "Alt 3",
      alg: "y' x' R U' R D2 R' U R D2 R2"
    }
  ],
  "F-perm": [
    {
      name: "Default",
      alg: "R' U' F' R U R' U' R' F R2 U' R' U' R U R' U R"
    },
    {
      name: "Alt with y",
      alg: "y R' U' F' R U R' U' R' F R2 U' R' U' R U R' U R"
    }
  ],
  
  

  "Ja-perm": [
    {
      name: "Default",
      alg: "y R' U L' U2 R U' R' U2 R L"
    },
    {
      name: "Alt 1",
      alg: "R' U L' U2 R U' R' U2 R L U"
    }
  ],
  "Jb-perm": [
    {
      name: "Default",
      alg: "R U R' F' R U R' U' R' F R2 U' R'"
    },
    {
      name: "Alt 1",
      alg: "R U2 R' U' R U2 L' U R' U' L"
    },
    {
      name: "Alt 2",
      alg: "r' F R F' r U2 R' U R U2 R'"
    },
    {
      name: "Alt 3",
      alg: "L' U R U' L U2 R' U R U2 R'"
    }
  ],
  "T-perm": [
    {
      name: "Default",
      alg: "R U R' U' R' F R2 U' R' U' R U R' F'"
    },
    {
      name: "Alt 1",
      alg: "R U R' U' R' F R2 U' R' U' R U R' F'"
    }
  ]
};

export function getActivePllAlg(name) {
  const variants = pllAlgVariants[name];

  if (!variants || variants.length === 0) {
    return pllAlgs[name];
  }

  const savedIndex = Number(localStorage.getItem("pllVariant:" + name));

  if (
    Number.isInteger(savedIndex) &&
    variants[savedIndex] &&
    variants[savedIndex].alg
  ) {
    return variants[savedIndex].alg;
  }

  return pllAlgs[name];
}
export const ollAlgs = {};
