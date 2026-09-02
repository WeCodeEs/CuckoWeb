import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "OPTIONS, POST",
};

const notificationOptions = [
  { type: "PedidoRecibido",      title: "¡Pedido creado!",        body: "Hemos recibido tu pedido. ¡Pronto lo podrás disfrutar!" },
  { type: "PedidoEnPreparacion", title: "¡Ya casi está!",         body: "Tu pedido se está preparando. ¡Casi lo tienes!" },
  { type: "PedidoListo",         title: "¡Hora de disfrutar!",    body: "Tu pedido está listo para recoger. ¡Pásale cuando quieras!" },
  { type: "PedidoEntregado",     title: "¡Todo tuyo!",            body: "Tu pedido ha sido entregado. ¡Que lo disfrutes!" },
] as const;

type StatusType = typeof notificationOptions[number]["type"];
type SpecialType = "NotificacionGeneral" | "NotificacionPersonal" | "NotificacionMasiva";
type KnownType = StatusType | SpecialType;

function sanitizeStr(s?: unknown): string | undefined {
  if (typeof s !== "string") return undefined;
  const v = s.trim();
  return v.length ? v : undefined;
}

function isKnownType(t?: string): t is KnownType {
  return !!t && (
    t === "NotificacionGeneral" ||
    t === "NotificacionPersonal" ||
    t === "NotificacionMasiva" ||
    notificationOptions.some(o => o.type === t)
  );
}

function uniq<T>(arr: T[]): T[] {
  return Array.from(new Set(arr));
}

interface ExpoMessage {
  to: string;
  sound: string;
  title: string;
  body: string;
  data: { screen: string };
}

async function sendExpoBatches(messages: ExpoMessage[]): Promise<{ results: unknown[]; failedCount: number }> {
  const chunkSize = 100;
  const allResults: unknown[] = [];
  let failedCount = 0;

  for (let i = 0; i < messages.length; i += chunkSize) {
    const chunk = messages.slice(i, i + chunkSize);

    const expoResponse = await fetch("https://exp.host/--/api/v2/push/send", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Accept": "application/json" },
      body: JSON.stringify(chunk),
    });

    if (!expoResponse.ok) {
      const text = await expoResponse.text().catch(() => "");
      throw new Error(`Expo HTTP ${expoResponse.status} ${expoResponse.statusText} ${text}`);
    }

    const chunkResult = await expoResponse.json().catch(() => ({} as any));

    if (Array.isArray(chunkResult?.errors) && chunkResult.errors.length > 0) {
      const msg = chunkResult.errors[0]?.message || "Expo returned errors";
      throw new Error(msg);
    }

    const results = Array.isArray(chunkResult)
      ? chunkResult
      : (Array.isArray(chunkResult?.data) ? chunkResult.data : null);

    if (!Array.isArray(results)) {
      throw new Error("Formato de respuesta de Expo no reconocido (sin tickets)");
    }

    for (const r of results) {
      allResults.push(r);
      if ((r as any)?.status !== "ok") failedCount++;
    }
  }

  return { results: allResults, failedCount };
}

Deno.serve(async (req) => {
  console.log("IN::send-notification()");

  const requestId =
    req.headers.get("x-request-id") ||
    req.headers.get("request-id") ||
    req.headers.get("cf-ray") ||
    req.headers.get("x-vercel-id") ||
    req.headers.get("x-amzn-trace-id") ||
    undefined;

  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ success: false, error: { code: "method_not_allowed", message: "No fue posible procesar la solicitud" }, requestId }),
      { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json", "Allow": "OPTIONS, POST" } }
    );
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false, autoRefreshToken: false } }
  );

  try {
    // Auth
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ success: false, error: { code: "unauthorized", message: "No fue posible procesar la solicitud" }, requestId }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const tokenAuth = authHeader.replace("Bearer ", "").trim();
    const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

    if (tokenAuth !== SERVICE_ROLE) {
      const { data: { user }, error: verifyError } = await supabase.auth.getUser(tokenAuth);
      if (verifyError || !user) {
        return new Response(
          JSON.stringify({ success: false, error: { code: "unauthorized", message: "No fue posible procesar la solicitud" }, requestId }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // Parse body
    type Body = {
      user_uuid?: string;
      user_uuids?: string[];
      type?: string;
      title?: string;
      body?: string;
      order_id?: number | null;
      messages?: { user_uuid: string; title: string; body: string }[];
    };
    let body: Body;
    try {
      body = await req.json();
    } catch {
      return new Response(
        JSON.stringify({ success: false, error: { code: "bad_request", message: "No fue posible procesar la solicitud" }, requestId }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const ntype = sanitizeStr(body.type);
    if (!isKnownType(ntype)) {
      return new Response(
        JSON.stringify({ success: false, error: { code: "bad_request", message: "Tipo de notificación inválido" }, requestId }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ── NotificacionMasiva ──
    // Receives an array of { user_uuid, title, body } and sends each user
    // their own personalized message in a single server round-trip.
    if (ntype === "NotificacionMasiva") {
      const msgs = body.messages;
      if (!Array.isArray(msgs) || msgs.length === 0) {
        return new Response(
          JSON.stringify({ success: false, error: { code: "bad_request", message: "Se requiere un arreglo 'messages' con al menos un elemento" }, requestId }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      for (const m of msgs) {
        if (!sanitizeStr(m.user_uuid) || !sanitizeStr(m.title) || !sanitizeStr(m.body)) {
          return new Response(
            JSON.stringify({ success: false, error: { code: "bad_request", message: "Cada mensaje requiere user_uuid, title y body" }, requestId }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
      }

      const allUserIds = uniq(msgs.map(m => m.user_uuid));

      const { data: tokenRows, error: tokensErr } = await supabase
        .from("push_tokens")
        .select("user_uuid, expo_push_token")
        .in("user_uuid", allUserIds)
        .not("expo_push_token", "is", null);

      if (tokensErr) {
        console.error("Error al obtener tokens para masiva:", tokensErr.message, { requestId });
        return new Response(
          JSON.stringify({ success: false, error: { code: "db_read_failed", message: "Error al obtener tokens" }, requestId }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const tokenMap = new Map<string, string[]>();
      for (const row of tokenRows ?? []) {
        if (!row.expo_push_token) continue;
        const arr = tokenMap.get(row.user_uuid) ?? [];
        arr.push(row.expo_push_token);
        tokenMap.set(row.user_uuid, arr);
      }

      const expoMessages: ExpoMessage[] = [];
      for (const m of msgs) {
        const tokens = tokenMap.get(m.user_uuid);
        if (!tokens) continue;
        for (const t of tokens) {
          expoMessages.push({
            to: t,
            sound: "default",
            title: m.title.trim(),
            body: m.body.trim(),
            data: { screen: "notifications" },
          });
        }
      }

      if (expoMessages.length === 0) {
        console.log("NotificacionMasiva: no hay tokens registrados para los usuarios indicados", { requestId });
        return new Response(
          JSON.stringify({ success: true, data: { sentTo: 0, failed: 0, expoResults: [] }, requestId }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
        );
      }

      let expoResults: unknown[];
      let failedCount: number;
      try {
        ({ results: expoResults, failedCount } = await sendExpoBatches(expoMessages));
      } catch (error: any) {
        console.error("Error enviando masiva a Expo:", error?.message, { requestId });
        return new Response(
          JSON.stringify({ success: false, error: { code: "push_send_failed", message: "No se pudieron enviar las notificaciones push." }, requestId }),
          { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const notifRows = msgs.map(m => ({
        user_uuid: m.user_uuid,
        order_id: null,
        title: m.title.trim(),
        message: m.body.trim(),
        type: "NotificacionPersonal" as const,
      }));

      const { error: insertErr } = await supabase.from("notifications").insert(notifRows);
      if (insertErr) {
        console.error("DB insert falló en NotificacionMasiva:", insertErr.message, { requestId });
      }

      const sentOk = expoMessages.length - failedCount;
      console.log(`OUT::NotificacionMasiva - ${sentOk} enviados, ${failedCount} fallidos`, { requestId });

      return new Response(
        JSON.stringify({ success: true, data: { sentTo: sentOk, failed: failedCount, expoResults }, requestId }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    // ── NotificacionGeneral (with optional user_uuids filter) ──
    if (ntype === "NotificacionGeneral") {
      const customTitle = sanitizeStr(body.title);
      const customBody = sanitizeStr(body.body);
      if (!customTitle || !customBody) {
        return new Response(
          JSON.stringify({ success: false, error: { code: "bad_request", message: "Falta title o body." }, requestId }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const filterUuids = Array.isArray(body.user_uuids) && body.user_uuids.length > 0
        ? body.user_uuids.filter((id: unknown) => typeof id === "string" && id.trim().length > 0)
        : null;

      let tokensToSend: string[];

      if (filterUuids && filterUuids.length > 0) {
        const { data: rows, error: tokensErr } = await supabase
          .from("push_tokens")
          .select("expo_push_token")
          .in("user_uuid", filterUuids)
          .not("expo_push_token", "is", null);
        if (tokensErr) {
          console.error("Error al obtener tokens filtrados:", tokensErr.message, { requestId });
          return new Response(
            JSON.stringify({ success: false, error: { code: "db_read_failed", message: "Error al obtener tokens" }, requestId }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        tokensToSend = uniq((rows ?? []).map(r => r.expo_push_token).filter(Boolean));
      } else {
        const { data: allTokens, error: tokensErr } = await supabase
          .from("push_tokens")
          .select("expo_push_token")
          .not("expo_push_token", "is", null);
        if (tokensErr) {
          console.error("Error al obtener tokens para broadcast:", tokensErr.message, { requestId });
          return new Response(
            JSON.stringify({ success: false, error: { code: "db_read_failed", message: "Error al obtener tokens" }, requestId }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        tokensToSend = uniq((allTokens ?? []).map(r => r.expo_push_token).filter(Boolean));
      }

      if (tokensToSend.length === 0) {
        console.log("NotificacionGeneral: no hay tokens", { requestId });
        return new Response(
          JSON.stringify({ success: true, data: { sentTo: 0, failed: 0, expoResults: [] }, requestId }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
        );
      }

      const messages: ExpoMessage[] = tokensToSend.map(t => ({
        to: t,
        sound: "default",
        title: customTitle,
        body: customBody,
        data: { screen: "notifications" },
      }));

      let expoResults: unknown[];
      let failedCount: number;
      try {
        ({ results: expoResults, failedCount } = await sendExpoBatches(messages));
      } catch (error: any) {
        console.error("Error enviando general a Expo:", error?.message, { requestId });
        return new Response(
          JSON.stringify({ success: false, error: { code: "push_send_failed", message: "No se pudieron enviar las notificaciones push." }, requestId }),
          { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (filterUuids && filterUuids.length > 0) {
        const notifRows = filterUuids.map((uuid: string) => ({
          user_uuid: uuid,
          order_id: null,
          title: customTitle,
          message: customBody,
          type: "NotificacionGeneral" as const,
        }));
        const { error: insertErr } = await supabase.from("notifications").insert(notifRows);
        if (insertErr) {
          console.error("DB insert falló (general filtrada):", insertErr.message, { requestId });
        }
      } else {
        const { error: insertErr } = await supabase.from("notifications").insert({
          user_uuid: null,
          order_id: null,
          title: customTitle,
          message: customBody,
          type: "NotificacionGeneral",
        });
        if (insertErr) {
          console.error("DB insert falló (general broadcast):", insertErr.message, { requestId });
        }
      }

      const sentOk = tokensToSend.length - failedCount;
      console.log(`OUT::NotificacionGeneral - ${sentOk} enviados, ${failedCount} fallidos`, { requestId });

      return new Response(
        JSON.stringify({ success: true, data: { sentTo: sentOk, failed: failedCount, expoResults }, requestId }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    // ── NotificacionPersonal & Order types ──
    const incomingUserUuid = sanitizeStr(body.user_uuid);
    const orderId = typeof body.order_id === "number" && Number.isFinite(body.order_id) ? body.order_id : null;

    let titleToSend: string;
    let bodyToSend: string;

    if (ntype === "NotificacionPersonal") {
      const customTitle = sanitizeStr(body.title);
      const customBody = sanitizeStr(body.body);
      if (!customTitle || !customBody) {
        return new Response(
          JSON.stringify({ success: false, error: { code: "bad_request", message: "Falta title o body." }, requestId }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      titleToSend = customTitle;
      bodyToSend = customBody;
    } else {
      const option = notificationOptions.find(o => o.type === ntype)!;
      titleToSend = option.title;
      bodyToSend = option.body;
    }

    if (!incomingUserUuid) {
      return new Response(
        JSON.stringify({ success: false, error: { code: "bad_request", message: "La notificación no tiene destinatario" }, requestId }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { data: rows, error: fetchErr } = await supabase
      .from("push_tokens")
      .select("expo_push_token")
      .eq("user_uuid", incomingUserUuid)
      .not("expo_push_token", "is", null);

    if (fetchErr) {
      console.error("Error al obtener tokens del usuario:", fetchErr.message, { requestId });
      return new Response(
        JSON.stringify({ success: false, error: { code: "db_read_failed", message: "Error al procesar la solicitud" }, requestId }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const tokensToSend = uniq((rows ?? []).map(r => r.expo_push_token).filter(Boolean));

    if (tokensToSend.length === 0) {
      console.log("No hay tokens para el usuario", { requestId, ntype });
      return new Response(
        JSON.stringify({ success: true, data: { sentTo: 0, expoResults: [] }, requestId }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    const messages: ExpoMessage[] = tokensToSend.map(t => ({
      to: t,
      sound: "default",
      title: titleToSend,
      body: bodyToSend,
      data: { screen: "notifications" },
    }));

    let expoResults: unknown[];
    try {
      ({ results: expoResults } = await sendExpoBatches(messages));
    } catch (error: any) {
      console.error("Error enviando a Expo:", error?.message, { requestId });
      return new Response(
        JSON.stringify({ success: false, error: { code: "push_send_failed", message: "No se pudieron enviar las notificaciones push." }, requestId }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { error: insertError } = await supabase.from("notifications").insert({
      user_uuid: incomingUserUuid,
      order_id: orderId,
      title: titleToSend,
      message: bodyToSend,
      type: ntype,
    });
    if (insertError) {
      console.error("DB insert falló:", insertError.message, { requestId });
    }

    console.log("OUT::send-notification() OK", { requestId });
    return new Response(
      JSON.stringify({ success: true, data: { sentTo: tokensToSend.length, expoResults }, requestId }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (error: any) {
    console.error("Error inesperado:", error?.message, { requestId });
    return new Response(
      JSON.stringify({ success: false, error: { code: "internal_error", message: "Error interno" }, requestId }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
