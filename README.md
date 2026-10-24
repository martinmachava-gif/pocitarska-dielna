# Počtárska dielňa

Motivačná hra pre druhákov na mobil. Do dielne prichádzajú pokazené autá a vlaky.
Každá správne vyriešená úloha opraví jednu vec na vozidle a prinesie skrutky 🔩,
za ktoré si dieťa vozidlá vylepšuje (farby, pruhy, svetlá, klaksón, vagóny…).

Je to statická stránka v čistom HTML, CSS a JavaScripte, bez knižníc a bez servera.
Postup sa ukladá v telefóne (localStorage).

## Úlohy

Počty do 20: sčítanie, odčítanie (aj s prechodom cez desiatku), príklady s tromi číslami
(aj so zátvorkou), chýbajúce číslo, porovnávanie a slovné úlohy.

Geometria: rovinné útvary, telesá, čiary, meranie úsečky pravítkom, rysovanie úsečky
a počítanie útvarov na obrázku.

Každý typ má 3 úrovne. Po štyroch správnych odpovediach za sebou ide úroveň hore,
po dvoch chybách zo štyroch dole. Typy, v ktorých dieťa chybuje, prichádzajú častejšie.
Pri prvej chybe hra povie „skús ešte raz“, pri druhej ukáže postup.

## Pre rodičov

Na spodku dielne je odkaz **Pre rodičov** (vstup cez príklad na násobenie).
Dajú sa tam vypnúť typy úloh, zmeniť počet úloh na jednu opravu, pozrieť štatistika,
darovať skrutky a zálohovať postup kódom.

## Spustenie

Stačí otvoriť `index.html` cez ľubovoľný statický server, napr.:

```bash
python -m http.server 8000
```

a v prehliadači `http://localhost:8000`.

Offline režim a inštalácia na plochu (PWA) fungujú len cez HTTPS, napr. na GitHub Pages.
Pri zmene súborov hry zvýš `VERZIA` v `sw.js`, aby si telefóny stiahli novú verziu.

## Súbory

| Súbor | Čo obsahuje |
| --- | --- |
| `js/tasks.js` | generátory úloh a prispôsobovanie náročnosti |
| `js/geo.js` | geometria v SVG: útvary, telesá, čiary, pravítko, číselná os |
| `js/art.js` | vozidlá v SVG, poškodenia a vylepšenia |
| `js/app.js` | obrazovky a herná slučka |
| `js/sound.js` | zvuky a čítanie zadaní nahlas |
| `js/store.js` | ukladanie postupu a záloha |
| `dev/galeria.html` | všetky typy úloh a vozidlá na jednej stránke na kontrolu (`?typ=count&l=3`, `?vozidla=1`) |
| `dev/build_artifact.py` | zloží hru do jedného HTML súboru |
| `dev/ikony.ps1` | vygeneruje PNG ikony |
