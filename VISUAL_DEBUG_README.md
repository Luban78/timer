# Cube Trainer – Visual Debug Panel

## Ovládání
- Panel otevře zelené tlačítko nářadí vlevo dole.
- Na PC lze použít `Ctrl + Shift + D`.
- Prvek vybereš tlačítkem **Vybrat prvek** a následným klepnutím na prvek aplikace.

## Přesouvání panelu
- Panel chyť za jeho horní zelenou hlavičku a táhni myší nebo prstem.
- Přesouvání funguje na mobilu i desktopu.
- Tlačítko `—` panel sbalí jen na hlavičku, takže vidíš upravovaný objekt.
- Tlačítko `▢` panel znovu rozbalí.
- Poloha a sbalení panelu se ukládají do localStorage.

## Export celého nastavení
Tlačítka **Kopírovat celé CSS** a **Stáhnout celé CSS** exportují všechny dosud upravené prvky najednou:
- pravidla pro všechny velikosti,
- mobilní pravidla do `@media (max-width: 899px)`,
- desktopová pravidla do `@media (min-width: 900px)`.

Stažený soubor se jmenuje `cube-trainer-debug-complete.css`.
Nevyměňuj jím automaticky celý původní `style.css`. Bezpečnější je připojit ho v `index.html` jako poslední CSS soubor, například:

```html
<link rel="stylesheet" href="debugFinal.css?v=1">
```

Pak obsah staženého souboru vlož do `debugFinal.css`, commitni a pushni.

## Preset
- **Export preset** uloží všechna nastavení do JSON.
- **Import preset** je obnoví na jiném zařízení.
- Preset je vhodný pro přenos rozpracovaného ladění mezi PC a mobilem.
