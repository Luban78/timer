# Cube Trainer

Smart-cube training PWA for WCA, OLL and PLL practice.

## Obrázky algoritmů

Obrázky jsou ve složce `alg-images/`.

Aktuální příklad:

```text
alg-images/f-perm.png
```

Mapování je v `moveTrainer.js`:

```js
const ALGORITHM_IMAGE_MAP = {
  "F-perm": "alg-images/f-perm.png"
};
```

Pro další algoritmus:

1. vlož obrázek do `alg-images/`,
2. přidej nový řádek do `ALGORITHM_IMAGE_MAP`,
3. název vlevo musí přesně odpovídat názvu algoritmu v aplikaci.

Mobilní zobrazení zůstává po 6 tazích na řádek. Desktop dělí algoritmus do dvou širokých řádků.
