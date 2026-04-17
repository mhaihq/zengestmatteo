import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

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
      return new Response(
        JSON.stringify({ error: "invoice_id is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { data: invoice, error: invErr } = await supabase
      .from("invoices")
      .select("*, professionista:professionista_fiscal_profile(*), patient:clients(*)")
      .eq("id", invoice_id)
      .maybeSingle();

    if (invErr || !invoice) {
      return new Response(
        JSON.stringify({ error: "Invoice not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const professionista = invoice.professionista;
    const patient = invoice.patient;

    if (!professionista?.ts_password || !professionista?.ts_pincode) {
      return new Response(
        JSON.stringify({ error: "TS credentials not configured" }),
        { status: 422, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const shouldOmitCF = patient?.ts_opposizione || patient?.is_foreign;
    const payload = {
      cfCittadino: shouldOmitCF ? "" : (patient?.codice_fiscale ?? ""),
      dataDoc: invoice.data_emissione,
      numDoc: invoice.numero ?? "",
      tipoDoc: "F",
      tipoSpesa: "SP",
      importo: invoice.totale,
      flagPagamento: invoice.metodo_pagamento === "contanti" ? "SI" : "MP",
      flagOpposizione: shouldOmitCF ? "1" : "0",
    };

    // TODO: POST to https://api.acubeapi.com/expenses with TS credentials
    // const acubeResponse = await fetch("https://api.acubeapi.com/expenses", {
    //   method: "POST",
    //   headers: {
    //     "Content-Type": "application/json",
    //     "X-TS-Password": professionista.ts_password,
    //     "X-TS-Pincode": professionista.ts_pincode,
    //     "X-CF-Professionista": professionista.codice_fiscale,
    //   },
    //   body: JSON.stringify(payload),
    // });

    // Placeholder: mark as sent
    await supabase
      .from("invoices")
      .update({
        ts_status: "sent",
        ts_sent_at: new Date().toISOString(),
        ts_error_message: null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", invoice_id);

    return new Response(
      JSON.stringify({ success: true, payload }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
