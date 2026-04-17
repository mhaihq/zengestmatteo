import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { PDFDocument, StandardFonts, rgb, PageSizes } from "npm:pdf-lib@1.17.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const COLOR_TEAL = rgb(0.035, 0.569, 0.698);
const COLOR_DARK = rgb(0.1, 0.1, 0.1);
const COLOR_GRAY = rgb(0.45, 0.45, 0.45);
const COLOR_LIGHT_GRAY = rgb(0.85, 0.85, 0.85);
const COLOR_BG_ROW = rgb(0.97, 0.97, 0.97);
const COLOR_WHITE = rgb(1, 1, 1);

function toISODate(s: string): string {
  const d = new Date(s);
  return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
}

function eur(n: number): string {
  return `EUR ${n.toFixed(2)}`;
}

function sanitize(text: string): string {
  return text
    .replace(/\u2019/g, "'")
    .replace(/\u2018/g, "'")
    .replace(/\u201C/g, '"')
    .replace(/\u201D/g, '"')
    .replace(/\u2013/g, "-")
    .replace(/\u2014/g, "-")
    .replace(/[^\x00-\xFF]/g, "?");
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { invoice_id } = await req.json();
    if (!invoice_id) {
      return new Response(JSON.stringify({ error: "invoice_id is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: invoice, error: invErr } = await supabase
      .from("invoices")
      .select("*, professionista:professionista_fiscal_profile(*), patient:clients(*)")
      .eq("id", invoice_id)
      .maybeSingle();

    if (invErr || !invoice) {
      return new Response(JSON.stringify({ error: "Invoice not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const prof = invoice.professionista;
    const patient = invoice.patient;

    const pdf = await PDFDocument.create();
    const font = await pdf.embedFont(StandardFonts.Helvetica);
    const fontBold = await pdf.embedFont(StandardFonts.HelveticaBold);
    const fontOblique = await pdf.embedFont(StandardFonts.HelveticaOblique);

    const [W, H] = PageSizes.A4;
    const page = pdf.addPage([W, H]);
    const ML = 50;
    const MR = W - 50;
    const MT = H - 40;
    let y = MT;

    const draw = (text: string, x: number, cy: number, sz: number, f = font, color = COLOR_DARK) => {
      page.drawText(sanitize(text), { x, y: cy, size: sz, font: f, color });
    };

    const hline = (cy: number, x1 = ML, x2 = MR, thickness = 0.5, color = COLOR_LIGHT_GRAY) => {
      page.drawLine({ start: { x: x1, y: cy }, end: { x: x2, y: cy }, thickness, color });
    };

    const rect = (x: number, cy: number, w: number, h: number, color = COLOR_BG_ROW) => {
      page.drawRectangle({ x, y: cy - h, width: w, height: h, color });
    };

    const typeLabel: Record<string, string> = {
      fattura: "FATTURA",
      proforma: "NOTA PROFORMA",
      nota_di_credito: "NOTA DI CREDITO",
    };

    rect(ML, y, MR - ML, 56, COLOR_TEAL);
    draw(sanitize(prof?.nome_cognome ?? "Psicologo"), ML + 12, y - 18, 18, fontBold, COLOR_WHITE);
    draw("Psicologo - Psicoterapeuta", ML + 12, y - 33, 9, font, rgb(0.8, 0.95, 0.98));
    draw(`P.IVA ${prof?.partita_iva ?? ""}  |  CF ${prof?.codice_fiscale ?? ""}`, ML + 12, y - 46, 8, font, rgb(0.85, 0.96, 0.99));

    const docTypeStr = typeLabel[invoice.type] ?? "FATTURA";
    const docTypeWidth = fontBold.widthOfTextAtSize(docTypeStr, 14);
    draw(docTypeStr, MR - docTypeWidth - 12, y - 20, 14, fontBold, COLOR_WHITE);

    y -= 72;

    draw(sanitize(prof?.indirizzo_studio ?? ""), ML, y, 8, font, COLOR_GRAY);
    if (prof?.pec) {
      draw(`PEC: ${prof.pec}`, ML, y - 12, 8, font, COLOR_GRAY);
    }

    const rightX = MR - 140;
    const numLabel = invoice.numero ? `N. ${invoice.numero}` : "BOZZA";
    draw(numLabel, rightX, y, 11, fontBold, COLOR_DARK);
    draw(`Data: ${toISODate(invoice.data_emissione)}`, rightX, y - 16, 9, font, COLOR_GRAY);

    y -= 50;
    hline(y);
    y -= 16;

    draw("PAZIENTE", ML, y, 7, fontBold, COLOR_TEAL);
    draw("CODICE ATECO: 86.93.00", rightX, y, 7, font, COLOR_GRAY);
    y -= 12;
    draw(sanitize(patient?.name ?? ""), ML, y, 11, fontBold, COLOR_DARK);
    if (patient?.codice_fiscale) {
      draw(`CF: ${patient.codice_fiscale}`, ML, y - 14, 9, font, COLOR_GRAY);
    }
    if (patient?.email) {
      draw(sanitize(patient.email), ML, y - (patient?.codice_fiscale ? 26 : 14), 8, font, COLOR_GRAY);
    }

    y -= 60;
    hline(y);
    y -= 6;

    const colDesc = ML;
    const colQty = MR - 230;
    const colRate = MR - 160;
    const colAmt = MR - 80;

    rect(ML, y + 6, MR - ML, 20, rgb(0.22, 0.22, 0.22));
    draw("DESCRIZIONE", colDesc + 6, y - 7, 8, fontBold, COLOR_WHITE);
    draw("IMPORTO", colAmt + 6, y - 7, 8, fontBold, COLOR_WHITE);

    y -= 24;

    rect(ML, y + 6, MR - ML, 20, COLOR_BG_ROW);
    draw(sanitize(invoice.descrizione), colDesc + 6, y - 7, 9, font, COLOR_DARK);
    const amtStr = eur(invoice.importo);
    draw(amtStr, colAmt + 6, y - 7, 9, font, COLOR_DARK);

    y -= 26;
    hline(y);
    y -= 16;

    const drawSummaryRow = (label: string, value: string, bold = false, color = COLOR_DARK) => {
      draw(label, colRate, y, 9, bold ? fontBold : font, COLOR_GRAY);
      draw(value, colAmt + 6, y, 9, bold ? fontBold : font, color);
      y -= 16;
    };

    draw("Regime Fiscale: " + (prof?.regime_fiscale === "forfettario" ? "Forfettario (L. 190/2014)" : "Ordinario"), ML, y + 2, 8, fontOblique, COLOR_GRAY);

    drawSummaryRow("Imponibile:", eur(invoice.importo));
    drawSummaryRow("Contributo integrativo ENPAP (2%):", eur(invoice.contributo_enpap));
    if (invoice.marca_bollo > 0) {
      drawSummaryRow(`Marca da bollo (>77,47):`, eur(invoice.marca_bollo));
    }

    drawSummaryRow("IVA:", "Esente art. 10, DPR 633/72");

    hline(y + 6, colRate, MR);
    y -= 6;

    rect(colRate, y + 6, MR - colRate, 22, COLOR_TEAL);
    draw("TOTALE:", colRate + 8, y - 8, 11, fontBold, COLOR_WHITE);
    const totalStr = eur(invoice.totale);
    draw(totalStr, colAmt + 6, y - 8, 11, fontBold, COLOR_WHITE);

    y -= 34;

    if (invoice.pagato && invoice.data_pagamento) {
      hline(y, ML, MR, 0.5, COLOR_LIGHT_GRAY);
      y -= 16;
      draw("PAGAMENTO", ML, y, 7, fontBold, COLOR_TEAL);
      y -= 12;
      const metodoMap: Record<string, string> = {
        bonifico: "Bonifico bancario",
        carta: "Carta di credito/debito",
        contanti: "Contanti",
      };
      draw(`Metodo: ${metodoMap[invoice.metodo_pagamento ?? ""] ?? "—"}  |  Data: ${toISODate(invoice.data_pagamento)}`, ML, y, 9, font, COLOR_DARK);
      if (prof?.iban) {
        y -= 14;
        draw(`IBAN: ${prof.iban}`, ML, y, 9, font, COLOR_DARK);
      }
      y -= 10;
    } else if (prof?.iban) {
      hline(y, ML, MR, 0.5, COLOR_LIGHT_GRAY);
      y -= 16;
      draw("Pagamento tramite bonifico bancario", ML, y, 9, font, COLOR_DARK);
      y -= 14;
      draw(`IBAN: ${prof.iban}`, ML, y, 9, font, COLOR_DARK);
      y -= 10;
    }

    if (prof?.regime_fiscale === "forfettario") {
      y -= 10;
      hline(y, ML, MR, 0.5, COLOR_LIGHT_GRAY);
      y -= 16;
      draw("NOTE LEGALI", ML, y, 7, fontBold, COLOR_TEAL);
      y -= 12;

      const boilerplate = [
        "Operazione effettuata ai sensi dell'articolo 1, commi da 54 a 89, della Legge n. 190/2014 - Regime Forfettario.",
        "Operazione non soggetta a ritenuta alla fonte a titolo di acconto ai sensi dell'articolo 1, comma 67, L. n. 190/2014.",
        "Imposta di bollo da 2 euro assolta sull'originale per importi maggiori di 77,47 euro.",
      ];

      for (const line of boilerplate) {
        const words = sanitize(line).split(" ");
        let currentLine = "";
        const lineH = 12;
        const maxWidth = MR - ML - 10;

        for (const word of words) {
          const test = currentLine ? currentLine + " " + word : word;
          if (fontOblique.widthOfTextAtSize(test, 7.5) > maxWidth) {
            draw(currentLine, ML, y, 7.5, fontOblique, COLOR_GRAY);
            y -= lineH;
            currentLine = word;
          } else {
            currentLine = test;
          }
        }
        if (currentLine) {
          draw(currentLine, ML, y, 7.5, fontOblique, COLOR_GRAY);
          y -= lineH;
        }
      }
    }

    y = 70;
    hline(y, ML, MR, 0.5, COLOR_LIGHT_GRAY);
    y -= 14;
    draw(`${sanitize(prof?.nome_cognome ?? "")}  |  P.IVA ${prof?.partita_iva ?? ""}  |  ATECO 86.93.00`, ML, y, 7, font, COLOR_GRAY);
    if (prof?.pec) {
      draw(`PEC: ${prof.pec}`, ML, y - 11, 7, font, COLOR_GRAY);
    }

    if (invoice.status === "draft") {
      const watermarkFont = await pdf.embedFont(StandardFonts.HelveticaBold);
      page.drawText("BOZZA", {
        x: W / 2 - 60,
        y: H / 2 - 20,
        size: 80,
        font: watermarkFont,
        color: rgb(0.9, 0.9, 0.9),
        opacity: 0.35,
        rotate: { type: "degrees" as const, angle: 45 },
      });
    }

    const pdfBytes = await pdf.save();

    await supabase.storage.createBucket("invoice-pdfs", { public: false }).catch(() => {});

    const fileName = `${invoice_id}.pdf`;
    const { error: uploadError } = await supabase.storage
      .from("invoice-pdfs")
      .upload(fileName, pdfBytes, {
        contentType: "application/pdf",
        upsert: true,
      });

    if (uploadError) {
      return new Response(JSON.stringify({ error: `Storage upload failed: ${uploadError.message}` }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: urlData } = supabase.storage.from("invoice-pdfs").getPublicUrl(fileName);

    await supabase
      .from("invoices")
      .update({ pdf_url: urlData.publicUrl, updated_at: new Date().toISOString() })
      .eq("id", invoice_id);

    return new Response(
      JSON.stringify({ success: true, pdf_url: urlData.publicUrl }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
