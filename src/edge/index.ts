import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

/**
 * @file Envía una notificación push mediante Expo a un usuario y registra el evento en `notifications`.
 * @returns {Response} JSON `{ success: boolean, 
 *                             data?: { sentTo: number, expoResults: unknown[] }, 
 *                             error?: { code: string, message: string }, 
 *                             requestId?: string }`
 */

// CORS
// NOTA: El siguiente CORS permite peticiones desde cualquier dominio.
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "OPTIONS, POST",
};

// NOTA: Descomentar el CORS endurecido cuandos se cuente con un dominio fijo
// function getAllowedOrigin(req: Request): string | null {
//   const origin = req.headers.get("Origin");
//   const allowList = (Deno.env.get("ALLOWED_ORIGINS") ?? "").split(",").map(s => s.trim()).filter(Boolean);
//   if (!origin) return null;
//   if (allowList.includes("*")) return origin;
//   return allowList.includes(origin) ? origin : null;
// }
// function buildCorsHeaders(origin: string | null, methods: string[]) {
//   const base: Record<string, string> = {
//     "Vary": "Origin",
//     "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
//     "Access-Control-Allow-Methods": methods.join(", "),
//   };
//   if (origin) base["Access-Control-Allow-Origin"] = origin;
//   return base;
// }

const notificationOptions = [
  { type: "PedidoRecibido",      title: "¡Pedido creado!",        body: "Hemos recibido tu pedido. ¡Pronto lo podrás disfrutar!" },
  { type: "PedidoEnPreparacion", title: "¡Ya casi está!",         body: "Tu pedido se está preparando. ¡Casi lo tienes!" },
  { type: "PedidoListo",         title: "¡Hora de disfrutar!",    body: "Tu pedido está listo para recoger. ¡Pásale cuando quieras!" },
  { type: "PedidoEntregado",     title: "¡Todo tuyo!",            body: "Tu pedido ha sido entregado. ¡Que lo disfrutes!" },
] as const;

type StatusType = typeof notificationOptions[number]["type"];
type SpecialType = "NotificacionGeneral" | "NotificacionPersonal";
type KnownType = StatusType | SpecialType;

// Helpers
function sanitizeStr(s?: unknown): string | undefined {
  if (typeof s !== "string") return undefined;
  const v = s.trim();
  return v.length ? v : undefined;
}
function isKnownType(t?: string): t is KnownType {
  return !!t && (
    t === "NotificacionGeneral" ||
    t === "NotificacionPersonal" ||
    notificationOptions.some(o => o.type === t)
  );
}

function uniq<T>(arr: T[]): T[] {
  return Array.from(new Set(arr));
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

  // Preflight CORS
  if (req.method === "OPTIONS") {
    console.log("Preflight CORS recibido", { requestId });
    return new Response("ok", { headers: corsHeaders });
  }
  // Validación de método
  if (req.method !== "POST") {
    console.warn(`Método no permitido [${req.method}]`, { requestId });
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
    // Autenticación
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      console.log("Autenticación fallida: falta cabecera de autorización", { requestId });
      return new Response(
        JSON.stringify({ success: false, error: { code: "unauthorized", message: "No fue posible procesar la solicitud" }, requestId }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const tokenAuth = authHeader.replace("Bearer ", "").trim();
    const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

    // Llamada interna desde Postgres/pg_net usando Service Role
    let isInternal = false;
    if (tokenAuth === SERVICE_ROLE) {
      isInternal = true;
    } else {
      const { data: { user }, error: verifyError } = await supabase.auth.getUser(tokenAuth);
      if (verifyError || !user) {
        console.log("Autenticación fallida: token inválido", { requestId });
        return new Response(
          JSON.stringify({ success: false, error: { code: "unauthorized", message: "No fue posible procesar la solicitud" }, requestId }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // Parseo y validación de input
    type Body = {
      user_uuid?: string; // requerido para NotificacionPersonal y Notificacion de pedido
      type?: string;      // requerido siempre
      title?: string;     // requerido: NotificacionGeneral, NotificacionPersonal
      body?: string;      // requerido: NotificacionGeneral, NotificacionPersonal
      order_id?: number | null; // opcional (para registrar contexto)
    };
    let body: Body;
    try {
      body = await req.json();
    } catch {
      console.log("JSON inválido en solicitud", { requestId });
      return new Response(
        JSON.stringify({ success: false, error: { code: "bad_request", message: "No fue posible procesar la solicitud" }, requestId }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const incomingUserUuid = sanitizeStr(body.user_uuid);
    console.log("Usuario recibido: ", incomingUserUuid);
    const ntype = sanitizeStr(body.type);
    const orderId = typeof body.order_id === "number" && Number.isFinite(body.order_id) ? body.order_id : null;

    if (!isKnownType(ntype)) {
      console.log("Validación fallida: tipo de notificación inválido", { requestId, ntype });
      return new Response(
        JSON.stringify({ success: false, error: { code: "bad_request", message: "Se presentaron problemas enviando la notificación. Tipo de notificación inválido" }, requestId }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Resolver título y cuerpo
    let titleToSend: string;
    let bodyToSend: string;

    if (ntype === "NotificacionGeneral" || ntype === "NotificacionPersonal") {
      const customTitle = sanitizeStr(body.title);
      const customBody = sanitizeStr(body.body);
      if (!customTitle || !customBody) {
        console.log("Validación fallida: falta title o body para notificación personalizada.", { requestId, ntype });
        return new Response(
          JSON.stringify({ success: false, error: { code: "bad_request", message: "Se presentaron problemas enviando la notificación. Falta title o body." }, requestId }),
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

    // Determinar destinatarios (tokens) y user (si aplica)
    let tokensToSend: string[] = [];
    let targetUserId: string | null = null;

    if (ntype === "NotificacionGeneral") {
      // Broadcast: a todos los tokens registrados
      const { data: allTokens, error: tokensErr } = await supabase
        .from("push_tokens")
        .select("expo_push_token")
        .not("expo_push_token", "is", null);

      if (tokensErr) {
        console.error("Error al obtener tokens para broadcast: ", tokensErr.message, { requestId });
        return new Response(
          JSON.stringify({ success: false, error: { code: "db_read_failed", message: "Error al obtener tokens" }, requestId }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      tokensToSend = uniq((allTokens ?? []).map(r => r.expo_push_token).filter(Boolean));
      if (tokensToSend.length === 0) {
        console.log("Broadcast: no hay tokens registrados", { requestId });
        return new Response(
          JSON.stringify({ success: true, data: { sentTo: 0, expoResults: [] }, requestId }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
        );
      }
      // targetUserId permanece null (no registramos por-usuario en broadcast)
    } else if (ntype === "NotificacionPersonal" || notificationOptions.some(o => o.type === ntype)) {
      if (!incomingUserUuid) {
        console.error("Validación fallida: No se proporcionó un user_uuid para Notificación Personal o Notificación de pedido", { requestId, ntype });
        return new Response(
          JSON.stringify({ success: false, error: { code: "bad_request", message: "La notificación no tiene destinatario" }, requestId }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      targetUserId = incomingUserUuid;
      const { data: rows, error: fetchErr } = await supabase
        .from("push_tokens")
        .select("expo_push_token")
        .eq("user_uuid", targetUserId)
        .not("expo_push_token", "is", null);
      if (fetchErr) {
        console.error("Error al obtener tokens del usuario: ", fetchErr.message, { requestId });
        return new Response(
          JSON.stringify({ success: false, error: { code: "db_read_failed", message: "Error al procesar la solicitud" }, requestId }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      tokensToSend = uniq((rows ?? []).map(r => r.expo_push_token).filter(Boolean));
    }

    if (targetUserId) {
      const { data: rows, error: fetchErr } = await supabase
        .from("push_tokens")
        .select("expo_push_token")
        .eq("user_uuid", targetUserId);

      if (fetchErr) {
        console.error("Error al obtener tokens del usuario: ", fetchErr.message, { requestId });
        return new Response(
          JSON.stringify({ success: false, error: { code: "db_read_failed", message: "Error al procesar la solicitud" }, requestId }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      tokensToSend = uniq((rows ?? []).map(r => r.expo_push_token));
    }

    // tokensToSend -  Gral - todos los tokens
    // personal - todos los del userId obtenido
    // pedido - todos los del userID ibtenido
    console.warn("tokensToSend: ", tokensToSend);

    if (tokensToSend.length === 0) {
      console.log("No hay tokens a los cuales enviar", { requestId, ntype });
      return new Response(
        JSON.stringify({ success: true, data: { sentTo: 0, expoResults: [] }, requestId }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    console.log("Validaciones completadas. Iniciando envío de notificaciones", { requestId });

    // Construcción de mensajes
    const messages = tokensToSend.map(t => ({
      to: t,
      sound: "default",
      title: titleToSend,
      body: bodyToSend,
      data: { screen: "notifications" },
    }));

    // Envío a Expo por lotes
    const chunkSize = 100;
    const expoResults: unknown[] = [];
    try {
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

        // Si Expo incluye un arreglo de errores a nivel respuesta
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

        expoResults.push(...results);

        // Si cualquier ticket no es "ok" → falla toda la función
        const failed = results.find((r: any) => r?.status !== "ok");
        if (failed) {
          throw new Error(
            failed?.message ||
            failed?.details?.error ||
            failed?.details?.code ||
            "Expo ticket error"
          );
        }
      }
    } catch (error: any) {
      console.error("Error enviando notificaciones a Expo:", error?.message, { requestId });
      return new Response(
        JSON.stringify({
          success: false,
          error: { code: "push_send_failed", message: "No se pudieron enviar las notificaciones push." },
          requestId
        }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Registrar notificación (solo cuando conocemos el usuario destino)
    // - NotificacionGeneral: broadcast → no registramos por usuario (podrías crear un log global si lo necesitas)
    // - NotificacionPersonal: registramos si resolvimos user_uuid
    // - Tipos de pedido: registramos si resolvimos user_uuid
    if (ntype === "NotificacionGeneral") {
      const { error: insertBroadcastErr } = await supabase.from("notifications").insert({
        user_uuid: null,
        order_id: null,
        title: titleToSend,
        message: bodyToSend,
        type: ntype,
      });
      if (insertBroadcastErr) {
        console.error("DB insert falló en tabla notifications: ", insertBroadcastErr.message, { requestId });
        return new Response(
          JSON.stringify({ success: false, error: { code: "db_insert_failed", message: "Error al registrar notificación. Intenta nuevamente." }, requestId }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    } else if (targetUserId) {
      const { error: insertError } = await supabase.from("notifications").insert({
        user_uuid: targetUserId,
        order_id: orderId,
        title: titleToSend,
        message: bodyToSend,
        type: ntype,
      });
      if (insertError) {
        console.error("DB insert falló en tabla notifications: ", insertError.message, { requestId });
        return new Response(
          JSON.stringify({ success: false, error: { code: "db_insert_failed", message: "Error al registrar notificación. Intenta nuevamente." }, requestId }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );        // manejar error como ya lo haces
      }
    } else {
      console.warn("No se resolvió targetUserId; se omite registro en notifications.", { requestId });
    }

    console.log("OUT::send-notification() - Envío de notifacion push realizado exitoasamente.", { requestId });
    return new Response(
      JSON.stringify({ success: true, data: { sentTo: tokensToSend.length, expoResults }, requestId }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (error: any) {
    console.error("Error inesperado: ", error?.message, { requestId });
    return new Response(
      JSON.stringify({ success: false, error: { code: "internal_error", message: "Error interno" }, requestId }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
