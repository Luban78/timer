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

## Verze 3 – přesouvání a průhlednost panelu

- Panel chyť za horní zelenou hlavičku a táhni prstem nebo myší.
- Poloha se uloží do `localStorage` zvlášť v daném prohlížeči.
- V sekci **Panel** nastavíš průhlednost od 35 % do 100 %.
- Tlačítko **Vycentrovat panel** ho přesune doprostřed obrazovky.
- Tlačítko **Vrátit doprava** obnoví výchozí polohu vpravo nahoře.
- Průhlednost panelu se neexportuje do výsledného CSS aplikace; je to pouze nastavení vývojářského nástroje.


## Verze 4 – oprava priorit CSS

Visual Debug nyní používá zesílenou specificitu pravidel. Díky tomu funguje i změna velikosti písma u prvků, které mají v aplikaci vlastní `!important` pravidla, například `#selectedAlg .alg-title`. Nově také preferuje čitelné selektory ukotvené k ID, například `#selectedAlg .alg-title`, místo křehkého `nth-of-type`.

## Oprava v5 – ovládání prstem

- Panel se přesouvá tažením za horní hlavičku na mobilu i desktopu.
- Scrollování uvnitř panelu už nikdy nevybere ani neupraví prvek pod prstem.
- V režimu „Vybrat prvek“ se prvek vybere pouze krátkým klepnutím bez pohybu.
- Tah, scroll a dlouhé podržení jsou ignorovány.
