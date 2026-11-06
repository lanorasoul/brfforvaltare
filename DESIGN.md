# Designplan: brfforvaltare.se

Arbetsnamn på sajten: brfförvaltare. Byts på ett ställe (`lib/site.ts`).

## Uppdrag och förlaga

- Ämne: oberoende jämförelse av förvaltare för bostadsrättsföreningar i Sverige, för både ekonomisk och teknisk förvaltning.
- Läsare: styrelseledamöter (ordförande, kassör) som undrar vilka förvaltare som finns, vad de betalar, vad som ingår och hur de byter. De är inte experter och har lite tid.
- Huvuduppgift: låta dem jämföra alla förvaltare på det förvaltarna själva skriver (pris, uppsägningstid, tjänster, var de verkar, vad de berättar öppet). Därefter ett prisläge för just deras storlek och hjälp att byta i rätt tid.
- Omtaget: första versionen gick direkt på kalkylatorn och bara ekonomisk förvaltning. Jämförelsen kommer nu först, kalkylatorn är en del längre ned, och teknisk förvaltning är lika viktig som ekonomisk.
- Tillägget: en guide i stället för bara en jämförelse. Styrelsen svarar på några frågor, ser alla förvaltare som passar och kan be om offert från högst tre. Affärsidén är den som offertförmedlare använder, men för ett enda segment: gratis för styrelser, och på sikt betalt av förvaltare för varje förfrågan de svarar på. Det är en plan och är inte infört.
- Förlaga från Lano: usefastlane.ai. Det som tas därifrån är sättet det ser ut och fungerar på, inte text, bild eller logotyp: flytande pill-meny, jättestor tät rubrik, en enda signalfärg med mjuk glöd, prickmatris som textur, ljusgrå UI-paneler, sticky visualisering som fylls när man scrollar, mörk jämförelsetabell med ja/delvis/nej, dragspels-FAQ.

## Färg

| Namn | Värde | Används till |
|---|---|---|
| Papper | #ffffff | grundyta |
| Bläck | #12151c | text, staplar (kontrast 18:1 mot papper) |
| Bläck 2 | #5d6068 | brödtext sekundär (6,3:1) |
| Bläck 3 | #6b6e76 | småtext, fotnoter (5,1:1) |
| Panel | #f4f5f6 | UI-paneler, linje #e4e6e9 |
| Falu | #d92d20 | enda accent: primär knapp, "er förening", markör, fokus (vit text 4,8:1) |
| Natt | #0d0f14 | den mörka jämförelsesektionen, panel #151821, linje #262b38 |

Accenten betyder alltid "ni" eller "gör detta". Den används aldrig som status (bra eller dåligt) och aldrig för en dataserie.

## Typ

- Geist (variabel) för allt. Rubriker vikt 600, tracking -0.035em till -0.05em. Brödtext vikt 400.
- Geist Mono bara för små etiketter i versaler (`.mono-label`) och tabellhuvuden.
- Stora fristående siffror (`.bignum`): Geist vikt 600, tracking -0.045em. Inga prick- eller pixeltypsnitt för siffror: de blir svåra att läsa.
- Siffror i tabeller och axlar: tabulära. Stora fristående siffror: proportionella.

## Form

- Tre behållare: panel (radie 24), ruta (radie 16), pill (999). Knappar radie 12.
- Skugga på tre ställen: menyn, hjälte-panelen, den röda knappens glöd. Allt annat är platt med 1 px linje.
- Container 1200 px, sektionsavstånd 140 px (88 px mobil). Centrerat för hjälte och sektionsrubriker, vänsterställt för brödtext och tabeller.

## Det minnesvärda: en prick är en enhet

Prickmatrisen från förlagan får en egen betydelse. En prick är en lägenhet eller ett steg. Samma enhet återkommer i hjälten (prickar som bygger ett hus, en prick per lägenhet), spårbanan (stegen i ett byte) och datatäckningen. Allt annat hålls tyst.

## Layout

```
 [ pill: märke   Ekonomisk Teknisk Förvaltare Prisguide Byta Metod   (Hitta förvaltare) ]   fast, centrerad

                 Jämför förvaltare
                     för er brf                      H1 centrerad, 2 rader
        17 förvaltare ..., varje uppgift har källa    ingress

 +------------------------------------------------------------------+  filterfält (klistrar under menyn)
 | Förvaltning [Ekonomisk|Teknisk]  Ort [____________]  Lägenheter [50]   Visar alla 17 |
 +------------------------------------------------------------------+

  Nyckeluppgifter                                     en rad per förvaltare, namnordning
  Förvaltare | Pris | Uppsägningstid | Paket | Verkar i | Källa
  (tom ruta = "Pris på förfrågan", "Ej funnet", aldrig dold)

  Tjänster                                            matris: 12 tjänster x förvaltare
  Löpande bokföring ... IMD   (bock, halv, plus, prick, streckad ring)   "Nämns av n av N"

  17 förvaltare     3 anger pris          47/192 publicerat     stora siffror, tre rutor (läses ur datan)

 ================= MÖRK SEKTION (natt) ===============================
  Vad förvaltarna berättar öppet.
  matris (en rad per förvaltare) x 6 kolumner: publicerat / delvis / ej funnet, förklaring under

  Vad kostar ekonomisk förvaltning för er storlek?    kalkylatorn: bara de som anger pris, resten i en rad
  Byta förvaltare i fem steg                          spårbana, citat, offertmall
  Verktyg (rutor, olika bredd)
  Vanliga frågor (dragspel)

  Sidfot: kategorier, metod, rättelser, "Annons"-policy, datum för senaste kontroll
```

Kategorisidorna (`/ekonomisk-forvaltning`, `/teknisk-forvaltning`) har samma tre block utan kategorival, följda av frågor att ställa till alla förvaltare. Menyraden visar korta namn (Ekonomisk, Teknisk) och läser upp hela namnet för skärmläsare.

## Principer

1. En prick är en enhet. En enda signaturidé, resten tyst.
2. Tomt är information. Priser som inte publicerats syns som tomma rader, de döljs aldrig.
3. Tyst gränssnitt, högljudd data. Neutrala paneler, svarta staplar, accent bara för "ni" och handling.
4. Varje siffra bär källa och datum. Tre nivåer: Verifierat (läst på förvaltarens sida), Uppskattning (beräknad av oss från verifierade uppgifter), Antagande (vår tolkning där uppgiften är oklar).
5. Ingen ranking-teater. Listan sorteras neutralt. Betald synlighet hör hemma i en separat ruta märkt "Annons" och kan aldrig påverka ordningen.
6. Rörelse bara som svar på handling eller scroll. En orkestrerad stund vid laddning (huset tänds), ingen fade-in per sektion.
7. Inga tankstreck. Intervall skrivs med ord: "37 375 till 55 000 kr".
8. Jämförelsen först. Allt som går att jämföra mellan förvaltare ligger före kalkylatorn. Ett filter döljer aldrig en förvaltare som sidan inte nämner något om: hela landet och okända orter visas alltid, märkta.
9. En tom ruta är inte en brist hos förvaltaren, bara något vi inte hittade på sidan. Därför ingen färg, ingen poäng och ingen sortering efter rutorna.
10. Guiden rangordnar aldrig. Den visar alla förvaltare som har rätt förvaltning, i namnordning. Orten döljer bara förvaltare vars sidor nämner andra orter. Önskemål om tjänster döljer ingen, de visas som märken i en egen tabell.
11. Fel och varningar är inte röda. Röd är reserverad för "ni" och handling, så fel visas med fet text, ikon och kraftigare kant, aldrig med färg ensam.
12. Pengar styr inte innehållet. Betalning (planerad, per förfrågan som förvaltaren svarar på) påverkar aldrig vilka som visas, ordningen, märkena eller uppgifterna. Intressen redovisas öppet (`SITE.conflicts`) och förfrågningar går bara till dem styrelsen själv valt.
13. Ingenting om besökaren sparas. Formuläret skickar ett mejl och slutar där. Sidan säger det och är stängd tills avsändaren är angiven.

## Granskning mot briefen och mot färdigmönstren

Det som liknar förlagan med flit: pill-meny, stor rubrik, röd knapp, gråa paneler, spårbana, mörk jämförelse. Det beställdes.

Det som var färdigmönster och ändrades:

- Typsnitt: Geist är förlagans. Bytt till Schibsted Grotesk så att sajten inte läses som en kopia.
- Accent: förlagans #ff2e2e klarar inte 4,5:1 med vit text. Falu #d92d20 gör det och ligger närmare svensk rödfärg.
- Logotypremsan och reklamsiffrorna ("70 000+ företag") togs bort. Ersatta av en datatäckning med verkliga antal. Vittnesmål och prisplaner utelämnas helt: vi har inga och får inte hitta på dem.
- Färdig-SaaS-paketet (identiska kort, lika skuggor, gradienter): begränsat till tre behållare, tre skuggor, en gradient (knappglöden).
- Versala etiketter, mono-småtext, pilar efter knapptext: borttagna. Pil finns bara som SVG i menyknappen och hjälteknappen.
- Skraffering för "uppskattning": ersatt av ljusare ton och tomt märke. Textur är bara för tillgänglighetsläge.
- Dataviz: staplar tunna (12 px), enhet i klartext, tabellvy för varje diagram, hover och fokus visar samma sak, ingen dual axis, ingen färg som enda kodning.
- Rangordning med poäng finns inte. Det finns inga verifierade omdömen att räkna på, och en poäng skulle kräva en påhittad viktning. Metodsidan beskriver bara det sajten faktiskt gör: vad vi läser, vad märkena betyder, hur priser räknas (med ett räkneexempel som stämmer mot ERF:s egen siffra), ordning och annonser, rättelser och begränsningar.

## Så som det byggdes

Märken på siffror (aldrig färg som enda kodning, alltid ord bredvid):

| Märke | Betyder | Exempel |
|---|---|---|
| Fylld prick | Verifierat: står på förvaltarens sida | ERF:s prislista för exakt 50 lägenheter |
| Halv prick | Uppskattning: räknad av oss mellan publicerade punkter | ERF för 35 lägenheter |
| Tom ring | Antagande: vår tolkning av en oklar uppgift | Fastums tumregel, period anges inte |
| Streckad ring | Inget pris angivet | Förvaltare som bara säger "på förfrågan" |

Öppenhetsmatrisen har tre lägen: publicerat (bock), delvis (halv), ej funnet (streckad ring). Ej funnet betyder inte att uppgiften saknas, bara att den inte stod på sidorna vi läste.

Tjänstematrisen har fem lägen, alltid med ord bredvid:

| Märke | Betyder |
|---|---|
| Fylld cirkel med bock | Ingår: sidan säger att det ingår |
| Halv cirkel | Ingår i vissa nivåer eller paket |
| Ring med plus | Tillval eller tilläggstjänst |
| Ring med punkt | Nämns: sidan listar tjänsten men säger inte om den ingår eller kostar extra |
| Streckad ring | Inte listad: tjänsten står inte på sidan vi läste |

Filtret för ort (Ort) matchar bara orter som förvaltarens egen sida nämner. Förvaltare vars sidor nämner andra orter döljs, med en rad under tabellen som säger hur många och en knapp för att visa alla. Hela landet och förvaltare utan angivna orter visas alltid.

Mobil: breda tabeller ligger i en rullande ruta med fast första kolumn och en rad under som säger att tabellen går att rulla. Filterfältet klistrar bara från 720 px bredd, på smalare skärmar ligger det statiskt över tabellen så att det inte täcker innehållet.

Guiden och förfrågan: `/hitta-forvaltare` är ett vanligt GET-formulär, så svaren ligger i adressen och sidan fungerar utan JavaScript. Valet av förvaltare (högst tre) görs med kryssrutor i samma tabell som visar nyckeluppgifterna, med en rad längst ned som visar hur många som är valda och låser fler rutor vid tre. Raden klistrar vid nederkanten, och fokuserade fält rullas upp ovanför den (`scroll-padding`). `/be-om-offert` visar vilka som är valda, ett formulär med tre delar (om föreningen, kontakt, meddelande), ett samtycke och en knapp. Fel samlas i en ruta överst med länkar till fälten, och varje fält har sitt eget fel. Läget `off` stänger formuläret, `preview` visar mejlet som skulle ha skickats och `live` skickar det. Ortssidorna `/forvaltare-i/<ort>` finns bara för orter som minst två förvaltare nämner.

Sidor: start (jämförelse, kalkylator, steg, verktyg, vanliga frågor), hitta förvaltare, be om offert, förvaltare i en ort, för förvaltare, integritet, ekonomisk förvaltning, teknisk förvaltning, förvaltare (lista i två grupper: egna organisationer och HSB:s regionala föreningar), förvaltarprofil (en per förvaltare, ett avsnitt per kategori, statisk), prisguide (ekonomisk, med ett eget avsnitt om teknisk), byta förvaltare (checklistor, uppsägningskalender, offertmall med flik per kategori), jämför (upp till tre förvaltare per kategori, delbar länk), metod, 404.

HSB visas som en förvaltare per regional förening, eftersom de är fristående med egna tjänster, avtal och webbplatser. Gruppen har en förklaring och en källa, så att namnet HSB inte ser ut som en dubblering.

Tillgänglighet: hoppa-till-innehåll, synlig fokusring, textalternativ (tabell eller lista) för varje diagram, aria-pressed på växlare, rullbara tabeller som går att nå med tangentbord när de faktiskt rullar, rörelse bara som svar på handling (och en intro som stängs av med prefers-reduced-motion). Kontrollerat med axe (WCAG 2.2 AA och best practice): 0 överträdelser på alla sidor på 1440 och 390 px. Fungerar utan JavaScript för allt utom de interaktiva verktygen.

Aktiva begränsningar i koden: priser räknas bara ur datafilerna (`lib/price.ts`, testad), ingen extrapolering, moms visas vid varje pris, sidan är stängd för sökmotorer tills `NEXT_PUBLIC_INDEXABLE=true`.

