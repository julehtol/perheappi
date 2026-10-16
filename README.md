# Perheappi 🏡

Perheen yhteinen verkkosovellus (PWA): ostoslista, ruokalista, ruokatoiveet, reseptit ja kalenteri – push-ilmoituksilla.

## Ominaisuudet

- **Ostoslista** – kaikki voivat lisätä, tuotteet ryhmitellään kaupan osastoittain automaattisesti, usein ostetut ehdotetaan.
- **Ruokalista** – viikkonäkymä, vanhemmat suunnittelevat.
- **Ruokatoiveet** – kuka tahansa toivoo, muut peukuttavat, vanhempi hyväksyy päivälle tai hylkää.
- **Reseptit** – perheen reseptikirja, ainekset ostoslistalle yhdellä napautuksella.
- **Kalenteri** – yhteiset menot ja keitä ne koskevat.
- **Push-ilmoitukset** – uudet ostokset, toiveet, päätökset, tapahtumat ja reseptit. Jokainen valitsee itse, mistä haluaa ilmoituksen.

## Kirjautuminen

Ensimmäinen käyttäjä luo perheen ja hänestä tulee vanhempi (PIN-koodi). Muut liittyvät kutsulinkillä
(Asetukset → Jaa kutsulinkki) ja valitsevat tai luovat profiilinsa. Vanhempien profiileissa on PIN.

## Tekniikka

- Next.js (App Router, Server Actions), Tailwind CSS
- Postgres (esim. Neon Vercelin kautta). Taulut luodaan automaattisesti ensimmäisellä käynnistyksellä.
- Web Push (VAPID-avaimet luodaan automaattisesti ja tallennetaan tietokantaan)

### Ympäristömuuttujat

| Muuttuja | Pakollinen | Kuvaus |
| --- | --- | --- |
| `DATABASE_URL` | ✅ | Postgres-yhteys (Vercelin Neon-integraatio asettaa tämän) |
| `SESSION_SECRET` | – | Evästeiden allekirjoitusavain (muuten luodaan tietokantaan) |
| `VAPID_PUBLIC_KEY` / `VAPID_PRIVATE_KEY` / `VAPID_SUBJECT` | – | Push-avaimet (muuten luodaan tietokantaan) |

### Kehitys

```bash
npm install
echo 'DATABASE_URL=postgres://...' > .env.local
npm run dev
```

Kuvakkeet luodaan uudelleen komennolla `node scripts/icons.mjs`.
