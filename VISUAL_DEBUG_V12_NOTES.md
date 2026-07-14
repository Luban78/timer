# Visual Debug v12

Oprava odstraňuje nepravdivé CSS zrcadlo v localStorage. Po načtení v12 se staré zrcadlo automaticky smaže.

Nové bezpečné akce:
- Kopírovat aktualizovaný CSS
- Stáhnout aktualizovaný CSS
- Kopírovat jen prvek

Aktualizovaný celý CSS se vždy skládá ze skutečného `debugMobile.css`, který právě servíruje localhost, a z aktuální úpravy vybraného prvku.
