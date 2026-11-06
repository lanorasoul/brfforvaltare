# brfförvaltare (arbetsnamn)

Jämförelsesajt för förvaltare av bostadsrättsföreningar i Sverige, för både ekonomisk och teknisk förvaltning. Sajten visar vad förvaltarna själva skriver på sina webbplatser, med källa och läsdatum vid varje uppgift. Jämförelsen kommer först: nyckeluppgifter, tjänstematris, var förvaltarna verkar och vad de berättar öppet. Priskalkylatorn är en del längre ned. Därtill finns en guide där en styrelse svarar på några frågor, ser alla förvaltare som passar och kan be om offert från högst tre. Arbetsnamn och domän ändras på ett ställe: `lib/site.ts`.

Next.js 16 (App Router), React 19, TypeScript och vanlig CSS. Ingen databas: all data ligger som JSON i `data/` och versionshanteras med git, så varje ändring har ett datum och en författare.

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
| `/` | Ett kort per förvaltare: pris för föreningens storlek, kundnöjdhet (NKI), omdömen, antal kunder, grundår, kontor och avtalsvillkor. Filter för ekonomisk eller teknisk förvaltning och sortering som besökaren väljer. Därefter vad förvaltning brukar kosta, byta-steg och vanliga frågor. |
| `/ekonomisk-forvaltning`, `/teknisk-forvaltning` | Samma jämförelse låst till en kategori, med frågor att ställa till alla förvaltare. |
| `/jamfor` | Upp till tre förvaltare sida vid sida, per kategori. Delbar länk: `?kategori=teknisk&forvaltare=fastum,sbc&lgh=50`. |
| `/forvaltare`, `/forvaltare/<slug>` | Alla förvaltare och en profil per förvaltare med storlek, kundnöjdhet, avtal och ett avsnitt per kategori. |
| `/prisguide` | Pris för 20, 50 och 100 lägenheter (bara ekonomisk förvaltning), hur man läser priset och vad som gäller för teknisk förvaltning. |
| `/byta-forvaltare` | Fem steg, uppsägningskalender och offertmallar för båda kategorierna (`?mall=teknisk` väljer mall). |
| `/hitta-forvaltare` | Guiden. Tre frågor (förvaltning, ort, antal lägenheter) och valfria önskemål om tjänster. Visar alla förvaltare som har rätt förvaltning, i namnordning och utan poäng. Svaren ligger i adressen. |
| `/be-om-offert` | Formuläret för förfrågan till de valda förvaltarna (högst tre). Stängt tills `REQUESTS_MODE` tillåter det. Indexeras aldrig. |
| `/api/forfragan` | Tar emot formuläret, validerar och skickar ett mejl. Sparar ingenting. |
| `/forvaltare-i/<ort>` | En sida per ort som minst två förvaltare nämner på sina egna sidor. Andra adresser ger 404. |
| `/for-forvaltare` | Hur förvaltare visas, hur förfrågningar fungerar, vad som gäller för pengar och oberoende. |
| `/integritet` | Vad som händer med uppgifterna i en förfrågan. |
| `/metod` | Vad vi läser, vad märkena betyder, hur priser räknas, hur filtret för ort fungerar, ordning och annonser, hur sajten finansieras, rättelser. |

## Guiden och offertförfrågan

- `/hitta-forvaltare` visar alla förvaltare som har rätt förvaltning på sina egna sidor, i namnordning. Orten döljer bara förvaltare vars sidor nämner andra orter (samma regel som jämförelsen). Önskemål om tjänster döljer ingen, de visas som märken i en egen tabell. Ingen poäng, ingen rangordning. Logiken ligger i `lib/guide.ts` och testas i `scripts/guide.test.mjs`.
- Styrelsen kryssar i högst tre förvaltare och går vidare till `/be-om-offert`. Formuläret skickas till `/api/forfragan` (`app/api/forfragan/route.ts`), som validerar (`lib/requests.ts`) och skickar ett mejl till `REQUEST_TO_EMAIL` via Resend (`lib/mail.ts`). Ingenting sparas på sajten: ingen databas och inga loggar med personuppgifter.
- I början skickar den som driver sajten förfrågan vidare till de valda förvaltarna för hand. Mejlet har styrelsens adress som reply-to, så förvaltaren svarar styrelsen direkt.
- Läget styrs av `REQUESTS_MODE`:
  - `off` (standard): formuläret är stängt. Guiden visar förvaltarna utan valrutor och `/api/forfragan` svarar 403.
  - `preview`: formuläret fungerar och svaret visar mejlet som skulle ha skickats. Ingenting skickas. Bara för test. `starta.cmd` använder det lokalt och `npm run check:launch` stoppar det i produktion.
  - `live`: mejlet skickas. Kräver `operator` i `lib/site.ts`. Saknas den behandlas läget som `off`.
- Skydd mot skräp utan lagring: ett dolt fält (`webbplats`), en tid från serverns klocka (formuläret måste ha legat framme minst 2,5 sekunder), kontroll att anropet kommer från sajten själv, storleksgräns och gränser per fält. En riktig gräns per avsändare kräver lagring. Sätt i stället en regel under Rate Limiting i Vercel Firewall på `/api/forfragan`, till exempel fem anrop per minut och IP-adress.
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

## Prislogik

`lib/price.ts` räknar alla priser. Ett värde som står i förvaltarens prislista är verifierat, ett värde mellan två publicerade storlekar är en uppskattning (rakt mellan punkterna), och en tumregel utan angiven period är ett antagande. Räkneexemplet på `/metod` (ERF, 35 lägenheter = 28 469 kr) stämmer mot ERF:s egen siffra och ligger som test i `scripts/price.test.mjs`. Bara ekonomisk förvaltning har priser som kan räknas.

## Filter för ort

`lib/coverage.ts` (testad i `scripts/coverage.test.mjs`). Orterna är de som förvaltarens egen sida nämner. Filtret döljer bara förvaltare vars sidor nämner andra orter. De som anger hela landet eller inga orter visas alltid, märkta. Matchningen ignorerar versaler och å, ä, ö och tar början av ett ortnamn från tre bokstäver. Valen ligger i adressen (`?kategori=&ort=&lgh=`) så att en länk visar samma vy.

## Miljövariabler

| Variabel | Standard | Betydelse |
|---|---|---|
| `NEXT_PUBLIC_INDEXABLE` | tom (stängd) | `true` släpper in sökmotorer. Annars `noindex`, `Disallow: /` och tom sitemap. |
| `NEXT_PUBLIC_SITE_URL` | `https://brfforvaltare.se` | Grundadress för canonical och sitemap. |
| `REQUESTS_MODE` | `off` | `off`, `preview` eller `live`. Se Guiden och offertförfrågan. Läses vid varje anrop (guiden, formuläret och API:t ritas per besök). Ändringar av miljövariabler på Vercel gäller först efter en ny driftsättning. |
| `RESEND_API_KEY` | tom | Nyckel till Resend. Krävs för `live`. Läggs bara i Vercel, aldrig i koden. |
| `REQUEST_TO_EMAIL` | tom | Dit förfrågningarna skickas. Krävs för `live`. |
| `REQUEST_FROM_EMAIL` | tom | Avsändaradress. Krävs för `live`. Avsändaren `onboarding@resend.dev` når bara Resend-kontots egen adress, så verifiera en domän för att skicka från egen adress. |
| `CHECK_LAUNCH` | tom | `1` gör launch-kontrollen strikt även utanför Vercels produktion. |

`.env.example` visar alla variabler. Kopiera den till `.env.local` lokalt. `.env.local` ligger i `.gitignore`.

## Före öppning

Sajten är medvetet stängd för sökmotorer, och offertförfrågningar är stängda. `npm run check:launch` listar vad som hindrar. På Vercel i produktion stoppar den bygget. Det här ska vara klart först:

1. Avsändare: sätt `SITE.operator` i `lib/site.ts` (namn, och organisationsnummer och adress om det finns). Utan den är förfrågningar stängda och sajten får inte släppas in i sökmotorer. Kontrollera först i anställningsavtalet om bisyssla kräver tillstånd.
2. Kontaktadress på sajtens egen domän i `SITE.contactEmail` (visas först när den är satt).
3. Jävsinformation i `SITE.conflicts`, en mening per post: att den som driver sajten är ordförande i en bostadsrättsförening och vilken förvaltare den föreningen har. Ta ingen betalning av förvaltaren för den egna föreningen.
4. Mejltjänst: skapa ett Resend-konto och lägg `RESEND_API_KEY`, `REQUEST_TO_EMAIL` och `REQUEST_FROM_EMAIL` i Vercel. Verifiera en domän om mejlen ska gå från egen adress. Skriv in tjänstens namn i `app/integritet/page.tsx`.
5. Bekräfta lagringstiden på tolv månader i `app/integritet/page.tsx`, eller ändra den.
6. Regel för Rate Limiting i Vercel Firewall på `/api/forfragan`.
7. Beslut om de offentliga påståendena: ingen förvaltare har betalat för att synas, sajten är gratis för styrelser, betalning påverkar aldrig ordning, märken eller uppgifter, och framtida annonser märks Annons. Samma sak står i vanliga frågor, på metodsidan och på sidan för förvaltare.
8. Fler förvaltare och fler HSB-föreningar, var och en med källa och datum.
9. Domän kopplad i Vercel. Sätt sedan `REQUESTS_MODE=live` och `NEXT_PUBLIC_INDEXABLE=true`, och driftsätt om.

## När en databas behövs

Inte för offertförfrågningar, som skickas som mejl och inte sparas. Först när sajten behöver spara data från besökare eller förvaltare: förvaltare som gör anspråk på sin profil, automatisk fakturering per förfrågan, omdömen, betald synlighet eller en riktig gräns per avsändare. Då läggs Postgres (till exempel Neon via Vercel) bakom samma typade gränssnitt som `lib/data.ts` har i dag.
