# Visual Debug v13 – automatické odstranění duplicit

Při použití tlačítka **Kopírovat aktualizovaný CSS** Visual Debug nyní:

1. načte skutečný `debugMobile.css` z localhostu,
2. projde zvolenou sekci,
3. najde stejné CSS selektory,
4. ponechá pouze poslední platnou verzi každého prvku,
5. aktuálně upravovaný prvek přepíše nebo přidá,
6. vloží celý vyčištěný `debugMobile.css` do schránky.

Duplicitní pravidla se tedy již nemají hromadit ani při opakované úpravě stejného prvku.
