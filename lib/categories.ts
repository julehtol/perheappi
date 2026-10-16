export type Category = { key: string; label: string; emoji: string };

/** Järjestys vastaa suunnilleen kaupan kulkureittiä. */
export const CATEGORIES: Category[] = [
  { key: "hevi", label: "Hedelmät ja vihannekset", emoji: "🥦" },
  { key: "leipa", label: "Leivät", emoji: "🍞" },
  { key: "liha", label: "Liha ja kala", emoji: "🥩" },
  { key: "maito", label: "Maito ja juusto", emoji: "🧀" },
  { key: "kuiva", label: "Kuivatuotteet", emoji: "🍝" },
  { key: "pakaste", label: "Pakasteet", emoji: "🧊" },
  { key: "herkut", label: "Herkut ja juomat", emoji: "🍫" },
  { key: "koti", label: "Koti ja hygienia", emoji: "🧻" },
  { key: "muut", label: "Muut", emoji: "🛒" },
];

const WORDS: Record<string, string[]> = {
  hevi: [
    "omena", "banaani", "appelsiini", "mandariini", "klementiini", "päärynä", "viinirypäle", "rypäle", "mansikka",
    "mustikka", "vadelma", "sitruuna", "lime", "avokado", "kurkku", "tomaatti", "salaatti", "jäävuori", "paprika",
    "sipuli", "valkosipuli", "porkkana", "peruna", "parsakaali", "kukkakaali", "kesäkurpitsa", "sieni", "herkkusieni",
    "kaali", "lanttu", "punajuuri", "inkivääri", "persilja", "tilli", "basilika", "korianteri", "pinaatti", "retiisi",
    "melooni", "vesimeloni", "ananas", "mango", "kiivi", "nektariini", "persikka", "luumu", "bataatti", "purjo",
    "selleri", "maissintähkä", "rucola", "yrtti", "hedelm", "vihann", "marja",
  ],
  leipa: ["leipä", "leivä", "ruisleipä", "paahtoleipä", "sämpylä", "patonki", "näkkileipä", "tortilla", "pita", "karjalanpiira", "pulla", "korvapuusti", "croissant", "hampurilaissämpylä", "hodarisämpylä"],
  liha: [
    "jauheliha", "kana", "broileri", "possu", "sika", "nauta", "liha", "makkara", "nakki", "pekoni", "kinkku",
    "lohi", "kala", "tonnikala", "katkarapu", "silakka", "kirjolohi", "seiti", "fileesuikale", "kebab", "salami",
    "leikkele", "kalkkuna", "jauhis", "lihapulla", "pihvi", "härkis", "nyhtökaura", "tofu", "kalapuikko",
  ],
  maito: [
    "maito", "piimä", "jogurtti", "jugurtti", "rahka", "viili", "kerma", "smetana", "ranskankerma", "creme fraiche",
    "voi", "levite", "margariini", "juusto", "mozzarella", "fetajuusto", "feta", "parmesaani", "raejuusto",
    "tuorejuusto", "kananmuna", "muna", "kaurajuoma", "kauramaito", "vanukas", "rahka", "skyr", "ruokakerma",
  ],
  kuiva: [
    "pasta", "spagetti", "makaroni", "riisi", "jauho", "vehnäjauho", "sokeri", "suola", "pippuri", "mauste",
    "kaurahiutale", "puuro", "mysli", "murot", "muro", "öljy", "rypsiöljy", "oliiviöljy", "etikka", "ketsuppi",
    "sinappi", "majoneesi", "tomaattimurska", "säilyke", "papu", "kikherne", "linssi", "liemi", "liemikuutio",
    "fond", "kahvi", "tee", "kaakao", "hunaja", "hillo", "maapähkinävoi", "nuudeli", "couscous", "bulgur",
    "leivinjauhe", "hiiva", "vaniljasokeri", "kaneli", "soija", "tacokastike", "tacokuori", "kookosmaito",
    "pähkinä", "siemen", "rusina", "korppu", "lasagnelevy", "tortillalastu",
  ],
  pakaste: ["pakaste", "jäätelö", "pizza", "herne", "maissi", "pyttipannu", "ranskalai", "jäätelötötterö", "kalapuikot", "pakastemarja", "wokkivihannes"],
  herkut: ["karkki", "suklaa", "sipsi", "keksi", "limu", "limsa", "mehu", "kivennäisvesi", "vichy", "olut", "siideri", "viini", "popcorn", "pähkinäsekoitus", "jäätelö", "pulla", "leivos", "kakku", "nachot", "energiajuoma"],
  koti: [
    "vessapaperi", "wc-paperi", "talouspaperi", "pesuaine", "pyykinpesuaine", "astianpesuaine", "konetiskiaine",
    "tiskiaine", "saippua", "shampoo", "hoitoaine", "hammastahna", "hammasharja", "deodorantti", "vaippa",
    "roskapussi", "pakastepussi", "folio", "leivinpaperi", "kertakäyttö", "nenäliina", "pumpuli", "laastari",
    "akku", "paristo", "lamppu", "huuhteluaine", "kynttilä", "tiskirätti", "sieni-tiskiharja", "kosteuspyyhe",
  ],
};

export function guessCategory(name: string): string {
  const n = name.toLowerCase().trim();
  if (!n) return "muut";
  // Pidempi osuma voittaa, ettei "maitosuklaa" mene maitoihin.
  let best = { key: "muut", len: 0 };
  for (const [key, words] of Object.entries(WORDS)) {
    for (const w of words) {
      if (n.includes(w) && w.length > best.len) best = { key, len: w.length };
    }
  }
  return best.key;
}

export function categoryInfo(key: string): Category {
  return CATEGORIES.find((c) => c.key === key) ?? CATEGORIES[CATEGORIES.length - 1];
}
