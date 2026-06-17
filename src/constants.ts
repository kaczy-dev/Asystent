import { MaterialItem, ServiceItem } from "./types";

export const INITIAL_MATERIALS: MaterialItem[] = [
  { id: "m1", nazwa: "Rura wielowarstwowa PEX-Al-PEX 16x2.0 (m)", ilosc: 100, jednostka: "m", cenaBazowaNetto: 3.90, marzaProcent: 15, vat: 23 },
  { id: "m2", nazwa: "Rura miedziana sztanga Fi 15mm (m)", ilosc: 12, jednostka: "m", cenaBazowaNetto: 29.50, marzaProcent: 15, vat: 23 },
  { id: "m3", nazwa: "Zawór kulowy wodny Calido 1/2'' (szt)", ilosc: 10, jednostka: "szt", cenaBazowaNetto: 19.80, marzaProcent: 15, vat: 23 },
  { id: "m4", nazwa: "Zawór kulowy wodny Calido 3/4'' (szt)", ilosc: 6, jednostka: "szt", cenaBazowaNetto: 28.50, marzaProcent: 15, vat: 23 },
  { id: "m5", nazwa: "Rozdzielacz do podłogówki mosiężny 8 sekcji (szt)", ilosc: 1, jednostka: "szt", cenaBazowaNetto: 650.00, marzaProcent: 10, vat: 23 },
  { id: "m6", nazwa: "Złączka zaciskowa PEX Eurokonus 16x3/4'' (szt)", ilosc: 16, jednostka: "szt", cenaBazowaNetto: 9.80, marzaProcent: 15, vat: 23 },
  { id: "m7", nazwa: "Kolebka / łuk prowadzący do rury PEX 16 (szt)", ilosc: 20, jednostka: "szt", cenaBazowaNetto: 2.50, marzaProcent: 15, vat: 23 },
  { id: "m8", nazwa: "Pompa obiegowa elektroniczna LFP 25/60 (szt)", ilosc: 1, jednostka: "szt", cenaBazowaNetto: 340.00, marzaProcent: 10, vat: 23 },
  { id: "m9", nazwa: "Kolektor / filtr magnetyczny do instalacji C.O. (szt)", ilosc: 1, jednostka: "szt", cenaBazowaNetto: 260.00, marzaProcent: 10, vat: 23 },
  { id: "m10", nazwa: "Rura PVC kanalizacyjna Fi 110 L=1000 (szt)", ilosc: 5, jednostka: "szt", cenaBazowaNetto: 24.50, marzaProcent: 15, vat: 23 },
  { id: "m11", nazwa: "Rura PVC kanalizacyjna Fi 50 L=1000 (szt)", ilosc: 8, jednostka: "szt", cenaBazowaNetto: 11.20, marzaProcent: 15, vat: 23 },
  { id: "m12", nazwa: "Taśma teflonowa profesjonalna uszczelniająca (szt)", ilosc: 4, jednostka: "szt", cenaBazowaNetto: 3.80, marzaProcent: 15, vat: 23 },
  { id: "m13", nazwa: "Pianka dylatacyjna przyścienna EPS (m)", ilosc: 50, jednostka: "m", cenaBazowaNetto: 1.20, marzaProcent: 15, vat: 23 },
  { id: "m14", nazwa: "Stelaż podtynkowy WC Geberit Duofix (szt)", ilosc: 1, jednostka: "szt", cenaBazowaNetto: 720.00, marzaProcent: 8, vat: 23 }
];

export const INITIAL_SERVICES: ServiceItem[] = [
  { id: "s1", nazwa: "Montaż punktu wodno-kanalizacyjnego (podejście)", ilosc: 6, jednostka: "pkt", cenaNetto: 250.00, vat: 8 },
  { id: "s2", nazwa: "Montaż stelaża podtynkowego WC wraz z obudową", ilosc: 1, jednostka: "szt", cenaNetto: 320.00, vat: 8 },
  { id: "s3", nazwa: "Układanie izolacji i rur ogrzewania podłogowego", ilosc: 60, jednostka: "m²", cenaNetto: 50.00, vat: 8 },
  { id: "s4", nazwa: "Montaż szafki i rozdzielacza z uzbrojeniem", ilosc: 1, jednostka: "kpl", cenaNetto: 380.00, vat: 8 },
  { id: "s5", nazwa: "Próba szczelności instalacji (powietrze/woda)", ilosc: 1, jednostka: "kpl", cenaNetto: 200.00, vat: 8 },
  { id: "s6", nazwa: "Montaż grzejnika płytowego lub drabinkowego", ilosc: 4, jednostka: "szt", cenaNetto: 180.00, vat: 8 },
  { id: "s7", nazwa: "Montaż kotła gazowego wraz z osprzętem i próbą", ilosc: 1, jednostka: "szt", cenaNetto: 1400.00, vat: 8 }
];

export const PLUMBER_WISDOM = [
  "„Woda płynie tam, gdzie ma łatwiej. Pilnuj spadków!”",
  "„Nigdy nie oszczędzaj na zaworach odcinających.”",
  "„Pół cala to nie cztery dziesiąte. Mierz dwa razy, gwintuj raz!”",
  "„Cieknący pakuł uszczelni się sam, ale klej anaerobowy da Ci święty spokój.”",
  "„Ciśnienie w naczyniu wzbiorczym mierzymy zawsze bez wody w instalacji!”",
  "„Najlepsze uszczelnienie to stare, dobre pakuły z pastą.”",
  "„Dobra wentylacja pionu kanalizacyjnego chroni przed smrodem i wysysaniem wody.”",
  "„Ciepła woda zawsze po lewej stronie baterii. Trzymaj standardy!”",
  "„Teoria to gdy wszystko wiesz, a nic nie działa. Praktyka to gdy rury nie przeciekają, choć nikt nie wie dlaczego.”",
  "„Kto pije z kranu, ten wspiera kunszt hydraulika.”"
];
