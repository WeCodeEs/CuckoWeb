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
type SpecialType = "NotificacionGeneral" | "NotificacionPersonal";
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
    notificationOptions.some(o => o.type === t)
  );
}

function uniq<T>(arr: T[]): T[] {
  return Array.from(new Set(arr));
}

interface UserRow {
  uuid: string;
  first_name: string | null;
  last_name: string | null;
}

function personalizeText(template: string, user: UserRow): string {
  const name = (user.first_name ?? "").trim() || (user.last_name ?? "").trim() || "Alumno";
  return template.replaceAll("{{nombre}}", name);
}

function needsPersonalization(title: string, body: string): boolean {
  return title.includes("{{nombre}}") || body.includes("{{nombre}}");
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

const IN_CHUNK_SIZE = 80;

async function queryInChunks<T>(
  sb: ReturnType<typeof createClient>,
  table: string,
  columns: string,
  filterCol: string,
  ids: string[],
  extraFilters?: (q: any) => any,
): Promise<{ data: T[]; error: any }> {
  const allRows: T[] = [];
  for (let i = 0; i < ids.length; i += IN_CHUNK_SIZE) {
    const chunk = ids.slice(i, i + IN_CHUNK_SIZE);
    let q = sb.from(table).select(columns).in(filterCol, chunk);
    if (extraFilters) q = extraFilters(q);
    const { data, error } = await q;
    if (error) return { data: allRows, error };
    if (data) allRows.push(...(data as T[]));
  }
  return { data: allRows, error: null };
}

function jsonResp(data: unknown, status: number, requestId?: string) {
  return new Response(
    JSON.stringify({ ...data as object, requestId }),
    { status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}

function errResp(code: string, message: string, status: number, requestId?: string) {
  return jsonResp({ success: false, error: { code, message } }, status, requestId);
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
    // ── Autenticación ──
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return errResp("unauthorized", "No fue posible procesar la solicitud", 401, requestId);
    }

    const tokenAuth = authHeader.replace("Bearer ", "").trim();
    const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

    if (tokenAuth !== SERVICE_ROLE) {
      const { data: { user }, error: verifyError } = await supabase.auth.getUser(tokenAuth);
      if (verifyError || !user) {
        return errResp("unauthorized", "No fue posible procesar la solicitud", 401, requestId);
      }
    }

    // ── Parseo del body ──
    type Filter =
      | { type: "escuela"; value: string }
      | { type: "preseleccionado"; user_uuids: string[] }
      | { type: "pendientes" };

    type Body = {
      user_uuid?: string;
      type?: string;
      title?: string;
      body?: string;
      order_id?: number | null;
      filter?: Filter;
    };

    let body: Body;
    try {
      body = await req.json();
    } catch {
      return errResp("bad_request", "No fue posible procesar la solicitud", 400, requestId);
    }

    const ntype = sanitizeStr(body.type);
    if (!isKnownType(ntype)) {
      return errResp("bad_request", "Tipo de notificación inválido", 400, requestId);
    }

    // ── Resolver título y cuerpo ──
    let titleToSend: string;
    let bodyToSend: string;

    if (ntype === "NotificacionGeneral" || ntype === "NotificacionPersonal") {
      const customTitle = sanitizeStr(body.title);
      const customBody = sanitizeStr(body.body);
      if (!customTitle || !customBody) {
        return errResp("bad_request", "Falta title o body.", 400, requestId);
      }
      titleToSend = customTitle;
      bodyToSend = customBody;
    } else {
      const option = notificationOptions.find(o => o.type === ntype)!;
      titleToSend = option.title;
      bodyToSend = option.body;
    }

    // ══════════════════════════════════════════════════════════
    // ── NotificacionGeneral (con filtro opcional) ──
    // ══════════════════════════════════════════════════════════
    if (ntype === "NotificacionGeneral") {
      const filter = body.filter ?? null;
      const usesPersonalization = needsPersonalization(titleToSend, bodyToSend);

      let userRows: UserRow[] | null = null;
      let targetUserIds: string[] | null = null;

      // ── Resolver destinatarios según filtro ──
      if (!filter) {
        // Broadcast a todos
        if (usesPersonalization) {
          const { data, error: usersErr } = await supabase
            .from("users")
            .select("uuid, first_name, last_name");
          if (usersErr) {
            console.error("Error al consultar users para broadcast personalizado:", usersErr.message, { requestId });
            return errResp("db_read_failed", "Error al obtener usuarios", 500, requestId);
          }
          userRows = data ?? [];
          targetUserIds = userRows.map(u => u.uuid);
        }
        // Si no usa personalización, no necesitamos la tabla users
      } else if (filter.type === "escuela") {
        const faculty = sanitizeStr(filter.value);
        if (!faculty) {
          return errResp("bad_request", "Se requiere el valor de la escuela en filter.value", 400, requestId);
        }
        const { data, error: usersErr } = await supabase
          .from("users")
          .select("uuid, first_name, last_name")
          .eq("faculty", faculty);
        if (usersErr) {
          console.error("Error al consultar users por escuela:", usersErr.message, { requestId });
          return errResp("db_read_failed", "Error al obtener usuarios", 500, requestId);
        }
        userRows = data ?? [];
        targetUserIds = userRows.map(u => u.uuid);

      } else if (filter.type === "preseleccionado") {
        const uuids = Array.isArray(filter.user_uuids)
          ? filter.user_uuids.filter((id: unknown) => typeof id === "string" && (id as string).trim().length > 0)
          : [];
        if (uuids.length === 0) {
          return errResp("bad_request", "Se requiere al menos un user_uuid en filter.user_uuids", 400, requestId);
        }
        if (usesPersonalization) {
          const { data, error: usersErr } = await queryInChunks<UserRow>(
            supabase, "users", "uuid, first_name, last_name", "uuid", uuids,
          );
          if (usersErr) {
            console.error("Error al consultar users preseleccionados:", usersErr.message, { requestId });
            return errResp("db_read_failed", "Error al obtener usuarios", 500, requestId);
          }
          userRows = data;
        }
        targetUserIds = uuids;

      } else if (filter.type === "pendientes") {
        // Usuarios con teléfono guardado pero falta nombre, apellido, email o escuela = 'Default'
        // Excluye cuentas eliminadas
        const { data, error: usersErr } = await supabase
          .from("users")
          .select("uuid, first_name, last_name, email, phone, faculty")
          .not("phone", "is", null)
          .neq("phone", "");
        if (usersErr) {
          console.error("Error al consultar users pendientes:", usersErr.message, { requestId });
          return errResp("db_read_failed", "Error al obtener usuarios", 500, requestId);
        }

        const pendientes = (data ?? []).filter(u => {
          // Excluir cuentas eliminadas
          if ((u.email ?? "").includes("@deleted.") || (u.first_name ?? "") === "User Deleted") return false;
          // Es pendiente si falta algún dato
          const missingName = !(u.first_name ?? "").trim();
          const missingLastName = !(u.last_name ?? "").trim();
          const missingEmail = !(u.email ?? "").trim();
          const missingFaculty = (u.faculty ?? "Default") === "Default";
          return missingName || missingLastName || missingEmail || missingFaculty;
        });

        userRows = pendientes.map(u => ({ uuid: u.uuid, first_name: u.first_name, last_name: u.last_name }));
        targetUserIds = pendientes.map(u => u.uuid);

      } else {
        return errResp("bad_request", "Tipo de filtro no reconocido", 400, requestId);
      }

      // ── Obtener tokens ──
      let tokensToSend: string[];

      if (targetUserIds) {
        if (targetUserIds.length === 0) {
          console.log("NotificacionGeneral filtrada: no hay usuarios que coincidan", { requestId });
          return jsonResp({ success: true, data: { sentTo: 0, failed: 0 } }, 200, requestId);
        }
        const { data: tokenRows, error: tokensErr } = await queryInChunks<{ user_uuid: string; expo_push_token: string }>(
          supabase, "push_tokens", "user_uuid, expo_push_token", "user_uuid", targetUserIds,
          (q: any) => q.not("expo_push_token", "is", null),
        );
        if (tokensErr) {
          console.error("Error al obtener tokens filtrados:", tokensErr.message, { requestId });
          return errResp("db_read_failed", "Error al obtener tokens", 500, requestId);
        }

        if (usesPersonalization && userRows) {
          // Armar mensajes personalizados: cada usuario recibe su propio título/cuerpo
          const userMap = new Map<string, UserRow>();
          for (const u of userRows) userMap.set(u.uuid, u);

          const tokensByUser = new Map<string, string[]>();
          for (const row of tokenRows ?? []) {
            if (!row.expo_push_token) continue;
            const arr = tokensByUser.get(row.user_uuid) ?? [];
            arr.push(row.expo_push_token);
            tokensByUser.set(row.user_uuid, arr);
          }

          const messages: ExpoMessage[] = [];
          for (const [userId, tokens] of tokensByUser) {
            const user = userMap.get(userId);
            if (!user) continue;
            const pTitle = personalizeText(titleToSend, user);
            const pBody = personalizeText(bodyToSend, user);
            for (const t of tokens) {
              messages.push({ to: t, sound: "default", title: pTitle, body: pBody, data: { screen: "notifications" } });
            }
          }

          if (messages.length === 0) {
            console.log("NotificacionGeneral personalizada: no hay tokens", { requestId });
            return jsonResp({ success: true, data: { sentTo: 0, failed: 0 } }, 200, requestId);
          }

          const { results, failedCount } = await sendExpoBatches(messages).catch((error: any) => {
            console.error("Error enviando a Expo:", error?.message, { requestId });
            throw { _expoFail: true, message: error?.message };
          });

          const sentOk = messages.length - failedCount;
          console.log(`OUT::NotificacionGeneral personalizada - ${sentOk} enviados, ${failedCount} fallidos`, { requestId });
          return jsonResp({ success: true, data: { sentTo: sentOk, failed: failedCount, expoResults: results } }, 200, requestId);
        }

        // Sin personalización, mensaje uniforme a tokens filtrados
        tokensToSend = uniq((tokenRows ?? []).map(r => r.expo_push_token).filter(Boolean));
      } else {
        // Broadcast sin filtro, sin personalización
        const { data: allTokens, error: tokensErr } = await supabase
          .from("push_tokens")
          .select("expo_push_token")
          .not("expo_push_token", "is", null);
        if (tokensErr) {
          console.error("Error al obtener tokens para broadcast:", tokensErr.message, { requestId });
          return errResp("db_read_failed", "Error al obtener tokens", 500, requestId);
        }
        tokensToSend = uniq((allTokens ?? []).map(r => r.expo_push_token).filter(Boolean));
      }

      if (tokensToSend.length === 0) {
        console.log("NotificacionGeneral: no hay tokens", { requestId });
        return jsonResp({ success: true, data: { sentTo: 0, failed: 0 } }, 200, requestId);
      }

      const messages: ExpoMessage[] = tokensToSend.map(t => ({
        to: t, sound: "default", title: titleToSend, body: bodyToSend, data: { screen: "notifications" },
      }));

      let expoResults: unknown[];
      let failedCount: number;
      try {
        ({ results: expoResults, failedCount } = await sendExpoBatches(messages));
      } catch (error: any) {
        console.error("Error enviando general a Expo:", error?.message, { requestId });
        return errResp("push_send_failed", "No se pudieron enviar las notificaciones push.", 502, requestId);
      }

      const sentOk = tokensToSend.length - failedCount;
      console.log(`OUT::NotificacionGeneral - ${sentOk} enviados, ${failedCount} fallidos`, { requestId });
      return jsonResp({ success: true, data: { sentTo: sentOk, failed: failedCount, expoResults } }, 200, requestId);
    }

    // ══════════════════════════════════════════════════════════
    // ── NotificacionPersonal y tipos de Pedido ──
    // ══════════════════════════════════════════════════════════
    const incomingUserUuid = sanitizeStr(body.user_uuid);
    const orderId = typeof body.order_id === "number" && Number.isFinite(body.order_id) ? body.order_id : null;

    if (!incomingUserUuid) {
      return errResp("bad_request", "La notificación no tiene destinatario", 400, requestId);
    }

    const { data: rows, error: fetchErr } = await supabase
      .from("push_tokens")
      .select("expo_push_token")
      .eq("user_uuid", incomingUserUuid)
      .not("expo_push_token", "is", null);

    if (fetchErr) {
      console.error("Error al obtener tokens del usuario:", fetchErr.message, { requestId });
      return errResp("db_read_failed", "Error al procesar la solicitud", 500, requestId);
    }

    const tokensToSend = uniq((rows ?? []).map(r => r.expo_push_token).filter(Boolean));

    if (tokensToSend.length === 0) {
      console.log("No hay tokens para el usuario", { requestId, ntype });
      return jsonResp({ success: true, data: { sentTo: 0, expoResults: [] } }, 200, requestId);
    }

    const messages: ExpoMessage[] = tokensToSend.map(t => ({
      to: t, sound: "default", title: titleToSend, body: bodyToSend, data: { screen: "notifications" },
    }));

    let expoResults: unknown[];
    try {
      ({ results: expoResults } = await sendExpoBatches(messages));
    } catch (error: any) {
      console.error("Error enviando a Expo:", error?.message, { requestId });
      return errResp("push_send_failed", "No se pudieron enviar las notificaciones push.", 502, requestId);
    }

    // Registrar en notifications solo para Personal y Pedido
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
    return jsonResp({ success: true, data: { sentTo: tokensToSend.length, expoResults } }, 200, requestId);

  } catch (error: any) {
    if (error?._expoFail) {
      return errResp("push_send_failed", "No se pudieron enviar las notificaciones push.", 502, requestId);
    }
    console.error("Error inesperado:", error?.message, { requestId });
    return errResp("internal_error", "Error interno", 500, requestId);
  }
});
