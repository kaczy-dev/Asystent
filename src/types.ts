export interface MaterialItem {
  id: string;
  nazwa: string;
  ilosc: number;
  jednostka: string;
  cenaBazowaNetto: number; // Purchase price from wholesale/receipt
  marzaProcent: number;    // Plumber's markup percent (e.g. 15%)
  vat: number;             // VAT percentage (default e.g. 23 or 8)
}

export interface ServiceItem {
  id: string;
  nazwa: string;
  ilosc: number;
  jednostka: string;
  cenaNetto: number;
  vat: number; // default usually 8% for residential services, 23% for commercial
}

export interface ScannedInvoiceItem {
  nazwa: string;
  ilosc: number;
  jednostka: string;
  cenaJednostkowaNetto: number;
  vat: number;
  brutto: number;
  wybrana?: boolean;
}

export interface CostEstimateInfo {
  numerKosztorysu: string;
  dataWystawienia: string;
  dataWaznosci: string;
  hydraulikNazwa: string;
  hydraulikTelefon: string;
  hydraulikEmail: string;
  hydraulikFirma: string;
  hydraulikNip: string;
  klientNazwa: string;
  klientAdres: string;
  klientTelefon: string;
  tytulProjektu: string;
  notatki?: string;
}
