import { jsPDF } from "jspdf";
import { MaterialItem, ServiceItem, CostEstimateInfo } from "../types";

// Helper to sanitize Polish diacritics for standard PDF Helvetica font, avoiding missing character boxes while maintaining high professional layout quality.
export function sanitizePolishChars(text: string): string {
  if (!text) return "";
  const map: { [key: string]: string } = {
    'ą': 'a', 'Ą': 'A',
    'ć': 'c', 'Ć': 'C',
    'ę': 'e', 'Ę': 'E',
    'ł': 'l', 'Ł': 'L',
    'ń': 'n', 'Ń': 'N',
    'ó': 'o', 'Ó': 'O',
    'ś': 's', 'Ś': 'S',
    'ź': 'z', 'Ź': 'Z',
    'ż': 'z', 'Ż': 'Z'
  };
  return text.split('').map(char => map[char] || char).join('');
}

export function generatePlumbingPDF(
  info: CostEstimateInfo,
  materials: MaterialItem[],
  services: ServiceItem[],
  globalMarkup: number
) {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const cleanedInfo = {
    numerKosztorysu: sanitizePolishChars(info.numerKosztorysu || "K-01/" + new Date().getFullYear()),
    dataWystawienia: sanitizePolishChars(info.dataWystawienia),
    dataWaznosci: sanitizePolishChars(info.dataWaznosci),
    hydraulikNazwa: sanitizePolishChars(info.hydraulikNazwa || "Fachowiec Hydraulik"),
    hydraulikTelefon: sanitizePolishChars(info.hydraulikTelefon || "Brak"),
    hydraulikEmail: sanitizePolishChars(info.hydraulikEmail || "Brak"),
    hydraulikFirma: sanitizePolishChars(info.hydraulikFirma || "Uslugi Hydrauliczne"),
    hydraulikNip: sanitizePolishChars(info.hydraulikNip || "Brak NIP"),
    klientNazwa: sanitizePolishChars(info.klientNazwa || "Inwestor Prywatny"),
    klientAdres: sanitizePolishChars(info.klientAdres || "Brak adresu inwestycji"),
    klientTelefon: sanitizePolishChars(info.klientTelefon || "Brak"),
    tytulProjektu: sanitizePolishChars(info.tytulProjektu || "Kosztorys prac hydraulicznych")
  };

  // Modern Indigo / Slate Blue Color Palette
  const primaryColor = [15, 32, 67]; // Navy
  const secondaryColor = [30, 41, 59]; // Slate Gray
  const accentColor = [59, 130, 246]; // Vibrant Blue
  const lightBg = [241, 151, 180]; // unused, wait, lighter is better
  const tableHeaderBg = [226, 232, 240];

  // Helper properties
  const pageWidth = 210;
  const pageHeight = 297;
  const margin = 15;
  let currentY = 15;

  // Draw Header Accents
  doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.rect(0, 0, pageWidth, 6, "F"); // top bar

  currentY += 10;

  // Title
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text("OFERTA I KOSZTORYS INSTALACJI", margin, currentY);
  
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.setTextColor(120, 120, 120);
  doc.text(`Numer: ${cleanedInfo.numerKosztorysu}`, margin, currentY + 6);
  doc.text(`Tytul: ${cleanedInfo.tytulProjektu}`, margin, currentY + 11);

  // Logo / Placeholder Brand right aligned
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(accentColor[0], accentColor[1], accentColor[2]);
  doc.text("ASYSTENT HYDRAULIKA", pageWidth - margin - 60, currentY, { align: "left" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(120, 120, 120);
  doc.text("Profesjonalne systemy sanitarno-grzewcze", pageWidth - margin - 60, currentY + 4);

  // Draw line separator
  currentY += 18;
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.5);
  doc.line(margin, currentY, pageWidth - margin, currentY);

  currentY += 8;

  // Metadata Block (Date / Validity)
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
  doc.text("INFORMACJE O KOSZTORYSIE:", margin, currentY);
  
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text(`Data wystawienia: ${cleanedInfo.dataWystawienia}`, margin, currentY + 5);
  doc.text(`Waznosc oferty: ${cleanedInfo.dataWaznosci}`, margin, currentY + 10);

  doc.text(`Waluta: PLN (Zloty Polski)`, pageWidth / 2, currentY + 5);
  doc.text(`Inwestycja: ${cleanedInfo.tytulProjektu}`, pageWidth / 2, currentY + 10);

  currentY += 18;

  // Contractor & Client boxes side-by-side
  const colWidth = (pageWidth - (margin * 2) - 10) / 2;

  // Contractor Card
  doc.setFillColor(248, 250, 252);
  doc.rect(margin, currentY, colWidth, 38, "F");
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.2);
  doc.rect(margin, currentY, colWidth, 38, "D");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text("WYKONAWCA (FIRMA INSTALACYJNA):", margin + 4, currentY + 5);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
  doc.text(cleanedInfo.hydraulikFirma, margin + 4, currentY + 12);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(71, 85, 105);
  doc.text(`Instalator: ${cleanedInfo.hydraulikNazwa}`, margin + 4, currentY + 18);
  doc.text(`NIP: ${cleanedInfo.hydraulikNip}`, margin + 4, currentY + 23);
  doc.text(`Tel: ${cleanedInfo.hydraulikTelefon}`, margin + 4, currentY + 28);
  doc.text(`E-mail: ${cleanedInfo.hydraulikEmail}`, margin + 4, currentY + 33);

  // Client Card
  const clientX = margin + colWidth + 10;
  doc.setFillColor(248, 250, 252);
  doc.rect(clientX, currentY, colWidth, 38, "F");
  doc.rect(clientX, currentY, colWidth, 38, "D");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text("ZLECENIODAWCA (INWESTOR):", clientX + 4, currentY + 5);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
  doc.text(cleanedInfo.klientNazwa, clientX + 4, currentY + 12);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(71, 85, 105);
  doc.text(`Adres inwestora / budowy:`, clientX + 4, currentY + 18);
  doc.setFont("helvetica", "normal");
  doc.text(cleanedInfo.klientAdres, clientX + 4, currentY + 23);
  doc.text(`Tel: ${cleanedInfo.klientTelefon}`, clientX + 4, currentY + 28);

  currentY += 46;

  // Let's summarize pricing numbers
  let totalMaterialsNet = 0;
  let totalMaterialsGross = 0;
  let totalServicesNet = 0;
  let totalServicesGross = 0;

  materials.forEach(m => {
    // Apply item level or global markup if applicable
    const unitPriceWithMarkup = m.cenaBazowaNetto * (1 + m.marzaProcent / 100);
    const lineNet = unitPriceWithMarkup * m.ilosc;
    const lineGross = lineNet * (1 + m.vat / 100);
    totalMaterialsNet += lineNet;
    totalMaterialsGross += lineGross;
  });

  services.forEach(s => {
    const lineNet = s.cenaNetto * s.ilosc;
    const lineGross = lineNet * (1 + s.vat / 100);
    totalServicesNet += lineNet;
    totalServicesGross += lineGross;
  });

  const grandTotalNet = totalMaterialsNet + totalServicesNet;
  const grandTotalGross = totalMaterialsGross + totalServicesGross;
  const grandTotalVat = grandTotalGross - grandTotalNet;

  // Render Section 1: Materials (Materiały)
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text(`1. WYKAZ MATERIALOW INSTALACYJNYCH (Razem: ${totalMaterialsGross.toFixed(2)} PLN)`, margin, currentY);

  currentY += 4;

  // Draw Materials Table Header
  doc.setFillColor(tableHeaderBg[0], tableHeaderBg[1], tableHeaderBg[2]);
  doc.rect(margin, currentY, pageWidth - (margin * 2), 7, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(15, 23, 42);
  doc.text("Lp.", margin + 2, currentY + 5);
  doc.text("Nazwa materialu", margin + 10, currentY + 5);
  doc.text("Ilosc", margin + 98, currentY + 5, { align: "right" });
  doc.text("JM", margin + 107, currentY + 5, { align: "center" });
  doc.text("Cena Netto (+marza)", margin + 140, currentY + 5, { align: "right" });
  doc.text("VAT", margin + 152, currentY + 5, { align: "center" });
  doc.text("Wartosc Brutto", margin + 178, currentY + 5, { align: "right" });

  currentY += 7;

  // List materials
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(51, 65, 85);

  if (materials.length === 0) {
    doc.text("Brak wpisanych materialow.", margin + 10, currentY + 5);
    currentY += 8;
  } else {
    materials.forEach((m, index) => {
      // Check page break
      if (currentY > pageHeight - 35) {
        doc.addPage();
        currentY = 20;
        // redraw tiny header or similar
        doc.setFillColor(tableHeaderBg[0], tableHeaderBg[1], tableHeaderBg[2]);
        doc.rect(margin, currentY, pageWidth - (margin * 2), 7, "F");
        doc.setFont("helvetica", "bold");
        doc.text("Materialy (cd.)", margin + 10, currentY + 5);
        currentY += 7;
        doc.setFont("helvetica", "normal");
      }

      const unitPriceWithMarkup = m.cenaBazowaNetto * (1 + m.marzaProcent / 100);
      const lineNet = unitPriceWithMarkup * m.ilosc;
      const lineGross = lineNet * (1 + m.vat / 100);

      // Alternating row background
      if (index % 2 === 1) {
        doc.setFillColor(248, 250, 252);
        doc.rect(margin, currentY, pageWidth - (margin * 2), 6, "F");
      }

      doc.text(`${index + 1}`, margin + 2, currentY + 4.5);
      
      const matName = sanitizePolishChars(m.nazwa);
      const truncatedName = matName.length > 50 ? matName.substring(0, 48) + "..." : matName;
      doc.text(truncatedName, margin + 10, currentY + 4.5);
      
      doc.text(`${m.ilosc.toFixed(1).replace(".0", "")}`, margin + 98, currentY + 4.5, { align: "right" });
      doc.text(sanitizePolishChars(m.jednostka), margin + 107, currentY + 4.5, { align: "center" });
      doc.text(`${unitPriceWithMarkup.toFixed(2)}`, margin + 140, currentY + 4.5, { align: "right" });
      doc.text(`${m.vat}%`, margin + 152, currentY + 4.5, { align: "center" });
      doc.text(`${lineGross.toFixed(2)}`, margin + 178, currentY + 4.5, { align: "right" });

      currentY += 6;
    });
  }

  currentY += 8;

  // Render Section 2: Services/Labor (Usługi i robocizna)
  if (currentY > pageHeight - 35) {
    doc.addPage();
    currentY = 20;
  }

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text(`2. KOSZTY MONTAZU I USLUG (Razem: ${totalServicesGross.toFixed(2)} PLN)`, margin, currentY);

  currentY += 4;

  // Draw Services Table Header
  doc.setFillColor(tableHeaderBg[0], tableHeaderBg[1], tableHeaderBg[2]);
  doc.rect(margin, currentY, pageWidth - (margin * 2), 7, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(15, 23, 42);
  doc.text("Lp.", margin + 2, currentY + 5);
  doc.text("Opis prac / uslugi", margin + 10, currentY + 5);
  doc.text("Ilosc", margin + 98, currentY + 5, { align: "right" });
  doc.text("JM", margin + 107, currentY + 5, { align: "center" });
  doc.text("Stawka Netto", margin + 140, currentY + 5, { align: "right" });
  doc.text("VAT", margin + 152, currentY + 5, { align: "center" });
  doc.text("Wartosc Brutto", margin + 178, currentY + 5, { align: "right" });

  currentY += 7;

  // List services
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(51, 65, 85);

  if (services.length === 0) {
    doc.text("Brak wpisanych prac montazowych.", margin + 10, currentY + 5);
    currentY += 8;
  } else {
    services.forEach((s, index) => {
      // Check page break
      if (currentY > pageHeight - 35) {
        doc.addPage();
        currentY = 20;
        // redraw tiny header or similar
        doc.setFillColor(tableHeaderBg[0], tableHeaderBg[1], tableHeaderBg[2]);
        doc.rect(margin, currentY, pageWidth - (margin * 2), 7, "F");
        doc.setFont("helvetica", "bold");
        doc.text("Prace instalacyjne (cd.)", margin + 10, currentY + 5);
        currentY += 7;
        doc.setFont("helvetica", "normal");
      }

      const lineNet = s.cenaNetto * s.ilosc;
      const lineGross = lineNet * (1 + s.vat / 100);

      // Alternating row background
      if (index % 2 === 1) {
        doc.setFillColor(248, 250, 252);
        doc.rect(margin, currentY, pageWidth - (margin * 2), 6, "F");
      }

      doc.text(`${index + 1}`, margin + 2, currentY + 4.5);
      
      const sName = sanitizePolishChars(s.nazwa);
      const truncatedSName = sName.length > 50 ? sName.substring(0, 48) + "..." : sName;
      doc.text(truncatedSName, margin + 10, currentY + 4.5);
      
      doc.text(`${s.ilosc}`, margin + 98, currentY + 4.5, { align: "right" });
      doc.text(sanitizePolishChars(s.jednostka), margin + 107, currentY + 4.5, { align: "center" });
      doc.text(`${s.cenaNetto.toFixed(2)}`, margin + 140, currentY + 4.5, { align: "right" });
      doc.text(`${s.vat}%`, margin + 152, currentY + 4.5, { align: "center" });
      doc.text(`${lineGross.toFixed(2)}`, margin + 178, currentY + 4.5, { align: "right" });

      currentY += 6;
    });
  }

  currentY += 10;

  // Let's print Summary Info
  if (currentY > pageHeight - 50) {
    doc.addPage();
    currentY = 20;
  }

  // Draw Summary block box aligned right
  const summaryBoxWidth = 85;
  const summaryBoxX = pageWidth - margin - summaryBoxWidth;

  doc.setFillColor(248, 250, 252);
  doc.rect(summaryBoxX, currentY, summaryBoxWidth, 32, "F");
  
  doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.setLineWidth(0.4);
  doc.rect(summaryBoxX, currentY, summaryBoxWidth, 32, "D");

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(71, 85, 105);
  doc.text("Suma Materialy:", summaryBoxX + 4, currentY + 6);
  doc.text(`${totalMaterialsGross.toFixed(2)} PLN`, pageWidth - margin - 4, currentY + 6, { align: "right" });

  doc.text("Suma Robocizna:", summaryBoxX + 4, currentY + 12);
  doc.text(`${totalServicesGross.toFixed(2)} PLN`, pageWidth - margin - 4, currentY + 12, { align: "right" });

  doc.text("Lacznie Netto:", summaryBoxX + 4, currentY + 18);
  doc.text(`${grandTotalNet.toFixed(2)} PLN`, pageWidth - margin - 4, currentY + 18, { align: "right" });

  // Divider
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.2);
  doc.line(summaryBoxX + 4, currentY + 21, pageWidth - margin - 4, currentY + 21);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text("RAZEM (BRUTTO):", summaryBoxX + 4, currentY + 27);
  doc.text(`${grandTotalGross.toFixed(2)} PLN`, pageWidth - margin - 4, currentY + 27, { align: "right" });

  // Information footer
  // Technical Notes & Remarks if available
  if (info.notatki && info.notatki.trim()) {
    currentY += 15;
    const cleanNotes = sanitizePolishChars(info.notatki);
    const splitNotes = doc.splitTextToSize(cleanNotes, pageWidth - (margin * 2));
    const requiredHeight = 10 + (splitNotes.length * 4.5);

    if (currentY > pageHeight - requiredHeight - 15) {
      doc.addPage();
      currentY = 20;
    }

    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text("NOTATKI TECHNICZNE I UWAGI DO ZLECENIA:", margin, currentY);
    currentY += 5.5;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(51, 65, 85);
    
    splitNotes.forEach((line: string) => {
      doc.text(line, margin, currentY);
      currentY += 4.5;
    });
  }

  // Information footer terms
  currentY += 14;
  
  if (currentY > pageHeight - 30) {
    doc.addPage();
    currentY = 20;
  }

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
  doc.text("Warunki wykonania i uwagi:", margin, currentY);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(110, 115, 125);
  doc.text("1. Wykonawca gwarantuje najwyzsza jakosc materialow i wykonawstwa zgodnie z normami budowlanymi.", margin, currentY + 4);
  doc.text("2. Podane ceny materialow moga ulec nieznacznej zmianie zaleznie od cen hurtowych w dniu zakupu.", margin, currentY + 8);
  doc.text("3. Okres waznosci niniejszego kosztorysu wynosi 14 dni od daty wystawienia.", margin, currentY + 12);

  // Signatures
  currentY += 30;
  if (currentY > pageHeight - 15) {
    doc.addPage();
    currentY = 20;
  }
  
  doc.setFont("helvetica", "normal");
  doc.setLineWidth(0.2);
  doc.setDrawColor(180, 180, 180);
  
  doc.line(margin, currentY, margin + 45, currentY);
  doc.text("Podpis Wykonawcy", margin + 22.5, currentY + 4, { align: "center" });

  doc.line(pageWidth - margin - 45, currentY, pageWidth - margin, currentY);
  doc.text("Podpis Inwestora", pageWidth - margin - 22.5, currentY + 4, { align: "center" });

  // Save PDF
  const filename = `Kosztorys_${cleanedInfo.numerKosztorysu.replace(/\//g, "-")}.pdf`;
  doc.save(filename);
}
