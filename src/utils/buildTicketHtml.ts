import { format } from 'date-fns';
import { formatInTimeZone } from 'date-fns-tz';
import { es } from 'date-fns/locale';
import { formatCurrency } from './formatCurrency';
import type { Order } from '../stores/orderStore';

const testOrder: Order = {
  id: 0,
  display_number: 0,
  user_uuid: '',
  created_at: new Date().toISOString(),
  started_at: null,
  ready_at: null,
  delivered_at: null,
  updated_at: new Date().toISOString(),
  status: 'Recibido',
  payment_status: 'paid',
  is_takeaway: true,
  total: 25.5,
  user: {
    uuid: '',
    first_name: 'Test',
    last_name: 'Print',
    faculty: 'Ingeniería',
  },
  details: [
    {
      id: 0,
      product_id: null,
      quantity: 1,
      product_name: 'Café Americano',
      product_image_url: null,
      product: null,
      unit_price: 15.5,
      subtotal: 15.5,
      options: [
        { id: 1, option_id: null, option_name: 'Grande', option_group_name: '', price_at_moment: 0, quantity: 1, option: null },
        { id: 2, option_id: null, option_name: 'Leche de almendra', option_group_name: '', price_at_moment: 0, quantity: 1, option: null },
      ],
    },
    {
      id: 1,
      product_id: null,
      quantity: 2,
      product_name: 'Pan Dulce',
      product_image_url: null,
      product: null,
      unit_price: 5,
      subtotal: 10,
    },
  ],
};

function formatDate(dateStr: string): string {
  return format(new Date(dateStr), 'dd/MM/yyyy HH:mm', { locale: es });
}

function formatTime(dateStr: string, storeTimezone: string): string {
  return formatInTimeZone(new Date(dateStr), storeTimezone, 'HH:mm');
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function buildTicketHtml(
  storeTimezone: string,order?: Order, isTest = false): string {
  const o = isTest ? testOrder : order;
  if (!o) return '';

  const title = isTest ? 'PRUEBA DE IMPRESIÓN' : `Pedido #${o.display_number}`;
  const takeawayLabel = o.is_takeaway ? '*** PARA LLEVAR ***' : '--- COMER AQUI ---';
  const clientName = o.user
    ? `${escapeHtml(o.user.first_name)} ${escapeHtml(o.user.last_name)}`
    : 'Cliente';
  const facultyLine = o.user?.faculty ? ` (${escapeHtml(o.user.faculty)})` : '';

  const scheduledBlock =
    !isTest && o.scheduled_delivery_time
      ? `<div style="font-size:20px;margin:8px 0;font-weight:bold;padding:6px;border:2px solid #000;border-radius:4px;">
           <p style="margin:0 0 2px 0;">PEDIDO AGENDADO</p>
           <p style="margin:0;font-size:18px;">Para la(s) ${formatTime(o.scheduled_delivery_time, storeTimezone)}</p>
         </div>`
      : '';

  const detailRows = o.details
    .map((detail) => {
      const name = escapeHtml(
        detail.product_name || detail.product?.name || 'Producto eliminado'
      );
      const optionsLine =
        detail.options && detail.options.length > 0
          ? `<div style="padding-left:14px;color:#000;font-size:16px;font-weight:normal;">${detail.options
              .map((opt) =>
                escapeHtml(opt.option_name || opt.option?.name || 'Opcion eliminada')
              )
              .join(', ')}</div>`
          : '';
      return `<div style="font-size:18px;font-weight:bold;margin-bottom:6px;">
        <div style="display:flex;justify-content:space-between;">
          <span style="max-width:60%;word-wrap:break-word;">${detail.quantity}x ${name}</span>
          <span>${formatCurrency(detail.subtotal)}</span>
        </div>
        ${optionsLine}
      </div>`;
    })
    .join('');

  const testFooter = isTest
    ? `<div style="margin-top:16px;text-align:center;font-size:12px;border:1px solid #000;padding:8px;">
         <p style="margin:0 0 4px 0;font-weight:bold;">PRUEBA DE IMPRESION 80MM</p>
         <p style="margin:0;">Si puede leer esto claramente y el texto no se corta, la impresora esta configurada correctamente.</p>
       </div>`
    : '';

  return `<div style="width:80mm;padding:8px;font-family:monospace;color:#000;font-weight:bold;">
    <div style="text-align:center;margin-bottom:10px;">
      <h1 style="font-size:24px;margin:0 0 4px 0;font-weight:bold;">CuckooEats</h1>
      <p style="font-size:26px;margin:4px 0;font-weight:bold;">${title}</p>
      <div style="font-size:22px;margin:8px 0;font-weight:bold;padding:8px;border:3px solid #000;border-radius:4px;text-align:center;">
        ${takeawayLabel}
      </div>
      ${scheduledBlock}
    </div>
    <div style="font-size:16px;margin-bottom:10px;">
      <p style="margin:0 0 2px 0;">Fecha: ${formatDate(o.created_at)}</p>
      <p style="margin:0;">Cliente: ${clientName}${facultyLine}</p>
    </div>
    <div style="border-top:2px dashed #000;border-bottom:2px dashed #000;padding:10px 0;margin-bottom:10px;">
      ${detailRows}
    </div>
    <div style="font-size:22px;text-align:right;font-weight:bold;margin-bottom:8px;">
      Total: ${formatCurrency(o.total)}
    </div>
    ${testFooter}
  </div>`;
}