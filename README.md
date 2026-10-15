# Iversen Solutions

Norsk, statisk nettside med telefon, e-post og Facebook i et klebrig toppfelt.
Kontaktpanelet er reservert for et kommende kontaktskjema. Tailwind CSS er den eneste
pakkeavhengigheten og brukes bare under bygging. Ingen CDN, eksterne skrifttyper,
sporing eller Facebook-innbygging lastes av nettsiden.

## Lokal utvikling

Krever Node.js 22 eller nyere og npm.

```powershell
npm ci
npm run build
npm test
npm start
```

Forhåndsvisningen åpnes på <http://127.0.0.1:4173>. Bygg på nytt etter endringer i
HTML eller CSS. Rediger `index.html`, `styles.css` og `app.js`, ikke filene i `dist`.
`app.css` er ferdig bygget CSS og lagres også i roten, slik at siden kan vises uten en byggeserver. GitHub Actions bygger og publiserer bare `dist` til GitHub Pages ved push til `main`.

## Innhold og publisering

- Telefon, e-post, adresse og organisasjonsnummer ligger i `index.html`.
  Oppdater også strukturerte data i samme fil ved endringer.
- `https://iversensolutions.no/` er lagt til grunn som produksjonsadresse.
  Bekreft domenet før lansering. Ved et annet domene må canonical, Open Graph,
  strukturerte data, `robots.txt` og `sitemap.xml` oppdateres samlet.
  DNS og eventuelt egendefinert Pages-domene konfigureres hos domeneleverandør/GitHub.
- Logoen er behandlet fra de leverte bildene: sort bakgrunn er fjernet i
  `assets/logo.png`. Favicon og delingsbilde er også lagret lokalt.
- Facebook-sidens offentlige metadata bekrefter service, reparasjon og
  vaktmestertjenester. Innlegg og prosjektbilder var ikke offentlig tilgjengelige
  ved innhenting. Derfor brukes ingen ubekreftede referanser eller prosjektbilder.
- Kontaktskjemaet er en synlig plassholder, ikke et aktivt skjema. Ingen opplysninger
  samles inn. Et kommende skjema trenger serverbasert innsending, validering,
  tilgjengelige statusmeldinger og vurdering av personvern før aktivering.

## Tilgjengelighet

Siden er utformet med WCAG 2.2 AA som mål: semantiske landemerker, norsk språk,
hopp-lenke, synlig tastaturfokus, kontraster, store kontaktlenker, responsiv layout,
redusert bevegelse og ingen JavaScript-avhengig hovedfunksjonalitet. Høyden på
toppfeltet måles automatisk slik at ankerlenker og tastaturfokus ikke skjules bak det.
Uten JavaScript brukes en romslig standardavstand.

`npm test` kontrollerer kontaktdata, navigasjonsmål, metadata, plassholderen og
byggede ressurser. Før publisering bør siden også gjennomgås med skjermleser og
tastatur, ved 200/400 % zoom, og med axe eller tilsvarende i en nettleser.
Automatiske kontroller alene er ikke en garanti for full WCAG-samsvar.
