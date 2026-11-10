# brfförvaltare (arbetsnamn)

Jämförelsesajt för förvaltare av bostadsrättsföreningar i Sverige, för både ekonomisk och teknisk förvaltning. Sajten visar vad förvaltarna själva skriver på sina webbplatser, med källa och läsdatum vid varje uppgift. Jämförelsen kommer först: nyckeluppgifter, tjänstematris, var förvaltarna verkar och vad de berättar öppet. Priskalkylatorn är en del längre ned. Därtill finns en guide där en styrelse svarar på några frågor, ser alla förvaltare som passar och kan be om offert från högst tre. Arbetsnamn och domän ändras på ett ställe: `lib/site.ts`.

Next.js 16 (App Router), React 19, TypeScript och vanlig CSS. Typsnitten Geist och Geist Mono ligger på sajten själv (fontsource), så inga anrop går till Google. Färger och byggstenar finns som variabler i `styles/base.css`. Ingen databas: all data ligger som JSON i `data/` och versionshanteras med git, så varje ändring har ett datum och en författare.

## Kom igång

Kräver Node 22.18 eller nyare (testerna läser TypeScript direkt).

På Windows: packa först upp zippen helt (högerklicka, Extrahera alla) och dubbelklicka sedan på `starta.cmd`, som installerar paketen och startar sajten. Offertformuläret körs då i förhandsläge: allt fungerar men ingenting skickas eller sparas. Filen är inte testad på Windows. Går det inte, öppna cmd i den uppackade mappen (`cd /d` och sökvägen till mappen som innehåller `package.json`) och kör kommandona nedan. `npm` måste köras i just den mappen, annars svarar den med ENOENT.

```bash
npm install
npm run dev          # http://localhost:3000
npm test             # prislogik, uppsägningsdatum, linjepassning, ortfilter, guide, förfrågningar, format
npm run typecheck
npm run validate     # datakontroll, körs också före varje bygge
npm run check:launch # vad som hindrar en publik lansering, körs också före varje bygge
npm run build && npm start
```

## Sidor

| Adress | Innehåll |
|---|---|
| `/` | Topp med förhandsbild av jämförelsen och rullande loggor. Därefter Lönar det sig att byta förvaltare (siffror med källa, diagram, tecken på att det är dags och hur lång tid ett byte tar), sedan ett kort per förvaltare med pris för föreningens storlek, kundnöjdhet, kunder och grundår (omdömen, kontor och avtalsvillkor fälls ut), filter och sortering. Sist vad förvaltning brukar kosta och vanliga frågor. Siffrorna om att byta, med källor, ligger i `lib/insights.ts`. |
| `/ekonomisk-forvaltning`, `/teknisk-forvaltning` | Samma jämförelse låst till en kategori, med frågor att ställa till alla förvaltare. |
| `/jamfor` | Upp till tre förvaltare sida vid sida, per kategori. Delbar länk: `?kategori=teknisk&forvaltare=fastum,sbc&lgh=50`. |
| `/forvaltare`, `/forvaltare/<slug>` | Alla förvaltare och en profil per förvaltare med storlek, kundnöjdhet, avtal och ett avsnitt per kategori. |
| `/prisguide` | Pris för 20, 50 och 100 lägenheter (bara ekonomisk förvaltning), hur man läser priset och vad som gäller för teknisk förvaltning. |
| `/byta-forvaltare` | Fem steg, uppsägningskalender och offertmallar för båda kategorierna (`?mall=teknisk` väljer mall). |
| `/hitta-forvaltare` | Matchningen i tre steg: behov (ekonomisk, teknisk eller båda, och antingen valda tjänster eller kontakt först), föreningen (namn, ort, storlek, vad som är viktigast) och kontakt. Sist ett tack. Förfrågan går som mejl till den som driver sajten, som väljer högst tre förvaltare. |
| `/be-om-offert` | Formuläret för förfrågan till de valda förvaltarna (högst tre). Stängt tills `REQUESTS_MODE` tillåter det. Indexeras aldrig. |
| `/api/forfragan` | Tar emot formuläret, validerar och skickar ett mejl. Sparar ingenting. |
| `/forvaltare-i/<ort>` | En sida per ort som minst två förvaltare nämner på sina egna sidor. Andra adresser ger 404. |
| `/for-forvaltare` | Hur förvaltare visas, hur förfrågningar fungerar, vad som gäller för pengar och oberoende. |
| `/integritet` | Vad som händer med uppgifterna i en förfrågan. |
| `/kunskap`, `/kunskap/<slug>` | Kunskapsartiklar för styrelser. Svaret står överst, sedan brödtext, vanliga frågor och källor. Se Kunskapsartiklar nedan. |
| `/metod` | Vad vi läser, vad märkena betyder, hur priser räknas, hur filtret för ort fungerar, ordning och annonser, hur sajten finansieras, rättelser. |

## Guiden och offertförfrågan

- `/hitta-forvaltare` (`components/MatchWizard.tsx`) skickar en förfrågan märkt som matchning (`matcha: true`), med valda tjänster (`tjanster`, nycklar ur `data/schema.json`) eller upplägget kontakt först, och det som är viktigast (`viktigt`). Den som driver sajten väljer högst tre förvaltare och skickar vidare för hand.
- `/be-om-offert` tar emot en förfrågan till förvaltare som styrelsen själv har valt, högst tre (adressen `?f=<slug>`). Logiken för att läsa svaren ligger i `lib/guide.ts` och testas i `scripts/guide.test.mjs`.
- Båda formulären skickas till `/api/forfragan` (`app/api/forfragan/route.ts`), som validerar (`lib/requests.ts`) och skickar ett mejl till `REQUEST_TO_EMAIL` via Resend (`lib/mail.ts`). Ingenting sparas på sajten: ingen databas och inga loggar med personuppgifter.
- I början skickar den som driver sajten förfrågan vidare för hand. Mejlet har styrelsens adress som reply-to, så ett svar går direkt till styrelsen.
- Läget styrs av `REQUESTS_MODE`:
  - `off` (standard): formulären är stängda. Matchningen går att fylla i men skicka-knappen är avstängd, `/be-om-offert` säger att förfrågningar öppnar senare och `/api/forfragan` svarar 403.
  - `preview`: formuläret fungerar och svaret visar mejlet som skulle ha skickats. Ingenting skickas. Bara för test. `starta.cmd` använder det lokalt och `npm run check:launch` stoppar det i produktion.
  - `live`: mejlet skickas. Kräver `operator` i `lib/site.ts`. Saknas den behandlas läget som `off`.
- Skydd mot skräp utan lagring: ett dolt fält (`webbplats`), en signerad tid från serverns klocka (formuläret måste ha legat framme minst 2,5 sekunder och högst ett dygn), kontroll att anropet kommer från sajten själv och är JSON, storleksgräns och gränser per fält. En gräns per avsändare kräver lagring, så den sätts i Vercel Firewall (se Före öppning).
- Modellen: gratis för styrelser, betalt av förvaltare per förfrågan de svarar på. Det är en plan, inte något som är infört. Pris och villkor är inte bestämda och inget faktureras före skriftligt godkännande. Betalning får aldrig påverka vilka som visas, ordningen, märkena eller uppgifterna, och ta ingen betalning av förvaltaren för den egna föreningen.

## Data

- `data/providers/<slug>.json`: en fil per förvaltare. Typerna står i `lib/types.ts`.
- Varje förvaltare har ett block per kategori, `ekonomisk` och `teknisk`. Erbjuder förvaltaren inte kategorin är blocket `null` och `services.<kategori>` är `no` (förvaltaren säger det själv) eller `unknown` (vi hittade ingen sida).
- Varje uppgift pekar på en källa (`source`) i samma fil. Varje källa har `url`, `checked` (datum då sidan lästes) och `scope` (`ekonomisk`, `teknisk` eller `general`).
- `data/schema.json`: kategorierna, de tolv tjänsterna per kategori (`features`), de sex öppenhetsfrågorna per kategori (`disclosure`) och de fyra lägena för en tjänst. Både sajten och datakontrollen läser den.
- `data/reference.json`: allmän vägledning från någon som inte är förvaltare (en offertförmedlare). Visas märkt med avsändare och används aldrig som underlag för en förvaltares pris.
- `facts` i varje förvaltare: grundår, antal kunder, kontor, anställda, avtalsvillkor (`terms`) och betyg (`ratings`). Varje uppgift har en källa. Betyg är NKI från Prognoscentret (med mätår och branschsnitt samma år), Reco (med antal omdömen) eller betyg som bara förvaltaren själv anger (`by: "förvaltaren"`).
- `npm run validate` stoppar bygget om en uppgift saknar källa eller datum, om en källa saknas, om en källa har fel kategori, om ett tecken är otillåtet (tankstreck, minustecken), om ett betyg saknar skala, år eller antal, eller om HSB-posten inte nämner antalet regionala HSB-föreningar.

### Lägga till en förvaltare

1. Kopiera en befintlig fil i `data/providers/` och byt slug, namn och webbadress.
2. Läs förvaltarens egna sidor, en kategori i taget. Skriv bara det som står där.
3. Fyll i pris enligt det som publicerats: `list` (prislista), `examples` (exempel), `rule_of_thumb` (tumregel) eller `on_request`. Anges ingen moms eller period, sätt `unknown` och `periodStated: false`. Teknisk förvaltning måste vara `on_request` tills någon publicerar ett pris (kontrolleras).
4. Tjänster (`features`): ta bara med de som sidan listar. `included` ingår, `level` ingår i vissa nivåer, `optional` är tillval, `listed` nämns utan att sidan säger om det ingår. En tjänst som inte står på sidan får ingen nyckel alls, och visas som Inte listad.
5. Verksamhetsområde (`coverage`): `national` om sidan säger hela landet, `regional` med de orter sidan själv nämner, annars `unknown`. Lägg inte till orter som sidan inte nämner.
6. Sätt de sex öppenhetsfrågorna (`disclosure`) till `published`, `partial` eller `notfound`. Ej funnet betyder bara att uppgiften inte stod på sidorna som lästes.
7. Ett tillägg med pris som står på en annan sida än avtalets prissida får `source` med den källans id.
8. Kör `npm run validate` och `npm test`.

HSB är 21 fristående regionala föreningar. HSB visas som en förvaltare (`data/providers/hsb.json`). Uppgifter som bara gäller en region skrivs ut med regionens namn, till exempel avtalstiden hos HSB Mälardalarna. Antalet och källan står i `lib/site.ts`.

### Regler för innehållet

- Inga påhittade priser, omdömen, kunder eller vittnesmål.
- Ingen extrapolering utanför det förvaltaren publicerat.
- Ingen rangordning och inget "bäst". Sajten jämför. Listor och matriser står i namnordning.
- En tom ruta i en matris betyder inte att förvaltaren saknar tjänsten, bara att sidan vi läste inte listar den.
- Inga tankstreck i texter (kontrolleras av `validate`).

## Kunskapsartiklar

Artiklarna ligger som en JSON-fil per artikel i `data/posts/`. Filnamnet är adressen: `data/posts/k3-brf.json` blir `/kunskap/k3-brf`. Sidan, listan på `/kunskap`, sitemap och strukturerad data (Article, FAQPage, BreadcrumbList) byggs ur filen.

Varje artikel har:

- `title` (sidans rubrik), `metaTitle` (titeln i sökresultatet, högst 60 tecken) och `description` (110 till 160 tecken).
- `keyword`, sökfrasen artikeln svarar på. Den ska synas i rubriken. Två artiklar får inte ha samma sökfras, så att de inte konkurrerar med varandra.
- `answer`, svaret på frågan i 25 till 70 ord. Det står överst på sidan, före allt annat, och `points` är det viktigaste i punktform.
- `body`, brödtexten som en lista av block: `h2` (med `id`), `h3`, `p`, `ul`, `ol`, `table`, `note` och `data`.
- `faq`, `sources`, `related` (två eller tre andra artiklar) och `next` (knappen bredvid Hitta förvaltare).

Text får innehålla `[länktext](adress)` och `**fetstil**`. En länk ut från sajten måste gå till en adress som finns i artikelns `sources`, och varje källa måste länkas från texten. En länk inom sajten måste gå till en sida som finns.

Tal som räknas ur förvaltardatan skrivs som `{{nyckel}}`, till exempel `{{tek.priced}} av {{tek.total}}`, och fylls i när sidan byggs. Nycklarna står i `lib/post-text.ts`. Ett block `{ "type": "data", "key": "nki" }` ritar en tabell direkt ur förvaltardatan (kundnöjdhet, tjänster, uppsägningstider och publicerade priser). På så vis säger en artikel aldrig något annat än jämförelsen.

`npm run validate` kontrollerar allt ovan och stoppar bygget om något saknas. Lägg till en artikel genom att kopiera en befintlig fil, byta innehållet och läsa varje källa innan `checked` får dagens datum.

## Prislogik

`lib/price.ts` räknar alla priser. Ett värde som står i förvaltarens prislista är verifierat, ett värde mellan två publicerade storlekar är en uppskattning (rakt mellan punkterna), och en tumregel utan angiven period är ett antagande. Räkneexemplet på `/metod` (ERF, 35 lägenheter = 28 469 kr) stämmer mot ERF:s egen siffra och ligger som test i `scripts/price.test.mjs`. Bara ekonomisk förvaltning har priser som kan räknas.

## Filter för ort

`lib/coverage.ts` (testad i `scripts/coverage.test.mjs`). Orterna är de som förvaltarens egen sida nämner. Filtret döljer bara förvaltare vars sidor nämner andra orter. De som anger hela landet eller inga orter visas alltid, märkta. Matchningen ignorerar versaler och å, ä, ö och tar början av ett ortnamn från tre bokstäver. Valen ligger i adressen (`?kategori=&ort=&lgh=`) så att en länk visar samma vy.

## Miljövariabler

| Variabel | Standard | Betydelse |
|---|---|---|
| `NEXT_PUBLIC_INDEXABLE` | tom (stängd) | `true` släpper in sökmotorer. Annars `noindex`, `Disallow: /` och tom sitemap. |
| `NEXT_PUBLIC_SITE_URL` | `https://brfforvaltare.se` | Grundadress för canonical, sitemap och delningsbild. Måste vara den riktiga adressen innan sökmotorer släpps in (kontrolleras). |
| `REQUESTS_MODE` | `off` | `off`, `preview` eller `live`. Se Guiden och offertförfrågan. Läses vid varje anrop (guiden, formuläret och API:t ritas per besök). Ändringar av miljövariabler på Vercel gäller först efter en ny driftsättning. |
| `RESEND_API_KEY` | tom | Nyckel till Resend. Krävs för `live`. Läggs bara i Vercel, aldrig i koden. |
| `REQUEST_TO_EMAIL` | tom | Dit förfrågningarna skickas. Krävs för `live`. |
| `REQUEST_FROM_EMAIL` | tom | Avsändaradress. Krävs för `live`. Avsändaren `onboarding@resend.dev` når bara Resend-kontots egen adress, så verifiera en domän för att skicka från egen adress. |
| `REQUEST_SIGNING_SECRET` | tom | Valfri. Nyckel för att signera tidsstämpeln i formulären. Saknas den används `RESEND_API_KEY`. En lång slumpmässig sträng, till exempel från `openssl rand -base64 32`. |
| `CHECK_LAUNCH` | tom | `1` gör launch-kontrollen strikt även utanför Vercels produktion. |

`.env.example` visar alla variabler. Kopiera den till `.env.local` lokalt. `.env.local` ligger i `.gitignore`.

## Före öppning

Sajten är medvetet stängd för sökmotorer, och offertförfrågningar är stängda. `npm run check:launch` listar vad som hindrar. På Vercel i produktion stoppar den bygget. Det här ska vara klart först:

1. Avsändare: sätt `SITE.operator` i `lib/site.ts` (namn, och organisationsnummer och adress om det finns). Utan den är förfrågningar stängda och sajten får inte släppas in i sökmotorer. Kontrollera först i anställningsavtalet om bisyssla kräver tillstånd.
2. Kontaktadress på sajtens egen domän i `SITE.contactEmail` (visas först när den är satt).
3. Jävsinformation i `SITE.conflicts`, en mening per post: att den som driver sajten är ordförande i en bostadsrättsförening och vilken förvaltare den föreningen har. Ta ingen betalning av förvaltaren för den egna föreningen.
4. Mejltjänst: skapa ett Resend-konto och lägg `RESEND_API_KEY`, `REQUEST_TO_EMAIL` och `REQUEST_FROM_EMAIL` i Vercel. Verifiera en domän om mejlen ska gå från egen adress. Skriv in tjänstens namn i `app/integritet/page.tsx`.
5. Bekräfta lagringstiden på tolv månader i `app/integritet/page.tsx`, eller ändra den.
6. Regel i Vercel Firewall som begränsar formulärets API: Project, Firewall, Configure, New Rule. Villkor: Request Path equals `/api/forfragan` och Method equals `POST`. Åtgärd: Rate Limit, Fixed Window, 60 sekunder, 5 förfrågningar, nyckel IP Address, därefter Deny. Utan den kan ett skript fylla er inkorg. Det går inte att sätta från koden.
7. Beslut om de offentliga påståendena: ingen förvaltare har betalat för att synas, sajten är gratis för styrelser, betalning påverkar aldrig ordning, märken eller uppgifter, och framtida annonser märks Annons. Samma sak står i vanliga frågor, på metodsidan och på sidan för förvaltare.
8. Fler förvaltare och fler HSB-föreningar, var och en med källa och datum.
9. Domän kopplad i Vercel. Sätt `NEXT_PUBLIC_SITE_URL` till domänen, därefter `REQUESTS_MODE=live` och `NEXT_PUBLIC_INDEXABLE=true`, och driftsätt om.
10. Personuppgiftsbiträdesavtal (DPA) med Vercel och Resend. Båda erbjuder standardavtal på sina webbplatser.
11. Efter lansering: lägg till sajten i Google Search Console och skicka in `https://<domän>/sitemap.xml`.

## Säkerhet

- **Säkerhetshuvuden** sätts i `next.config.ts` för alla sidor: innehållspolicy (CSP) som bara tillåter sajtens egna resurser, skydd mot inbäddning (`frame-ancestors 'none'`, `X-Frame-Options`), `nosniff`, referrer-policy, permissions-policy, HSTS och `Cross-Origin-Opener-Policy`. Sajten laddar inga skript, typsnitt eller bilder från andra värdar. På förhandsversioner släpps Vercels verktygsrad in, i produktion inte.
- **Loggorna** i `public/logos` får en egen strikt policy, så att en SVG som öppnas direkt inte kan köra skript. `npm run validate` stoppar bygget om en SVG innehåller skript, händelser eller externa länkar.
- **Formulärets API** (`/api/forfragan`) tar bara emot JSON från sajtens egen domän, med en storleksgräns. Tidsstämpeln är signerad av servern (`lib/token.ts`), så ett skript kan inte låtsas att sidan legat framme längre än den gjort. Ett dolt fält fångar enkla robotar. Allt som skrivs in kontrolleras i `lib/requests.ts`, styrtecken och osynliga tecken tas bort, och mejlet är ren text.
- **Ingenting sparas.** Ingen databas, inga cookies, ingen besöksstatistik och inga loggar med personuppgifter. Förfrågan finns bara som mejl.
- **Hemligheter** ligger bara i Vercels miljövariabler. `.env*.local` ignoreras av git.
- **Beroenden**: kör `npm audit` före lansering och vid uppdateringar.

## När en databas behövs

Inte för offertförfrågningar, som skickas som mejl och inte sparas. Först när sajten behöver spara data från besökare eller förvaltare: förvaltare som gör anspråk på sin profil, automatisk fakturering per förfrågan, omdömen, betald synlighet eller en riktig gräns per avsändare. Då läggs Postgres (till exempel Neon via Vercel) bakom samma typade gränssnitt som `lib/data.ts` har i dag.
