/**
 * Słownik fraz kluczowych do inteligentnego sugerowania stawki VAT (8% vs 23%)
 * w instalacjach hydraulicznych i sanitarnych w Polsce.
 */

// Frazy wskazujące na usługę (standardowo preferencyjna stawka 8% w budownictwie mieszkaniowym)
const SERVICE_KEYWORDS = [
  "montaż",
  "instalacja",
  "robocizna",
  "usługa",
  "demontaż",
  "wymiana",
  "naprawa",
  "serwis",
  "przyłącze",
  "wykonanie",
  "podłączenie",
  "czyszczenie",
  "uruchomienie",
  "przebudowa",
  "modernizacja",
  "pomiary",
  "próba",
  "szczelności",
  "konserwacja",
  "regulacja",
  "projekt",
  "bruzdowanie",
  "układanie",
  "izolowanie",
  "odpowietrzenie",
  "pętla",
  "ogrzewanie podłogowe",
  "wiercenie",
  "cięcie"
];

// Frazy wskazujące na sprzedaż samego materiału / towaru handlowego (standardowo stawka 23%)
const MATERIAL_KEYWORDS = [
  "rura",
  "rury",
  "złączka",
  "kolanko",
  "kolano",
  "trójnik",
  "mufa",
  "nypel",
  "zawór",
  "filtr",
  "otulina",
  "rozdzielacz",
  "pasta",
  "pakuły",
  "klej",
  "taśma",
  "śrubunek",
  "kołek",
  "wkręt",
  "uszczelka",
  "redukcja",
  "syfon",
  "wąż",
  "peszel",
  "uchwyt",
  "glikol",
  "manometr",
  "odpowietrznik",
  "profil",
  "szafka",
  "pianka",
  "silikon"
];

/**
 * Sugeruje stawkę VAT (8 lub 23) na podstawie nazwy rury, złączki lub usługi robocizny.
 * 
 * @param name Nazwa pozycji (np. "Montaż pompy ciepła" lub "Rura PEX 16x2.0")
 * @param isServiceSection Czy pozycja znajduje się w sekcji usług/robocizny
 * @returns 8 lub 23 (reprezentujące stawki % VAT)
 */
export function suggestVatRate(name: string, isServiceSection = false): 8 | 23 {
  const normalized = name.toLowerCase().trim();
  
  if (!normalized) {
    return isServiceSection ? 8 : 23;
  }

  // 1. Sprawdź, czy są silne frazy usługowe
  const hasServiceKeyword = SERVICE_KEYWORDS.some(kw => normalized.includes(kw));
  
  // 2. Sprawdź, czy są silne frazy materiałowe
  const hasMaterialKeyword = MATERIAL_KEYWORDS.some(kw => normalized.includes(kw));

  // Priorytetyzacja:
  // Jeśli nazwa zawiera frazę usługową (np. "Montaż rur miedzianych"), traktujemy to jako usługę kompleksową -> 8%
  if (hasServiceKeyword) {
    return 8;
  }

  // Jeśli zawiera jawnie słowa materiałowe -> 23%
  if (hasMaterialKeyword) {
    return 23;
  }

  // Jeśli jesteśmy w sekcji robocizny/usług -> sugeruj 8%
  if (isServiceSection) {
    return 8;
  }

  // W pozostałych przypadkach materiałów / towarów -> 23%
  return 23;
}

/**
 * Objaśnia powód zasugerowania danej stawki VAT
 */
export function getVatReason(name: string, isServiceSection = false): string {
  const rate = suggestVatRate(name, isServiceSection);
  const normalized = name.toLowerCase().trim();

  if (rate === 8) {
    if (SERVICE_KEYWORDS.some(kw => normalized.includes(kw))) {
      return "Wykryto słowo kluczowe usługi budowlano-montażowej (preferencyjna stawka 8% dla budownictwa mieszkaniowego).";
    }
    return "Sugerowana preferencyjna stawka 8% dla robocizny usługowej w lokalach mieszkalnych.";
  } else {
    if (MATERIAL_KEYWORDS.some(kw => normalized.includes(kw))) {
      return "Wykryto asortyment materiałowy (standardowa stawka 23% dla sprzedaży towarów).";
    }
    return "Domyślna stawka 23% dla materiałów instalacyjnych i urządzeń bez usługi montażu.";
  }
}
