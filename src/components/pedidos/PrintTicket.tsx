import React from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { formatCurrency } from '../../utils/formatCurrency';

interface OrderOption {
  id: number;
  option: {
    name: string;
  };
}

interface OrderDetail {
  quantity: number;
  product: {
    name: string;
  };
  unit_price: number;
  subtotal: number;
  options?: OrderOption[];
}

interface Order {
  id: number;
  created_at: string;
  started_at?: string | null;
  ready_at?: string | null;
  delivered_at?: string | null;
  scheduled_delivery_time?: string | null;
  status: string;
  total: number;
  user?: {
    first_name: string;
    last_name: string;
    faculty?: string;
  };
  details: OrderDetail[];
}

interface Props {
  order?: Order;
  isTest?: boolean;
}

export default function PrintTicket({ order, isTest = false }: Props) {
  const testOrder: Order = {
    id: 0,
    created_at: new Date().toISOString(),
    status: 'Recibido',
    total: 25.5,
    user: {
      first_name: 'Test',
      last_name: 'Print',
      faculty: 'Ingeniería',
    },
    details: [
      {
        quantity: 1,
        product: {
          name: 'Café Americano',
        },
        unit_price: 15.5,
        subtotal: 15.5,
        options: [
          { id: 1, option: { name: 'Grande' } },
          { id: 2, option: { name: 'Leche de almendra' } },
        ],
      },
      {
        quantity: 2,
        product: {
          name: 'Pan Dulce',
        },
        unit_price: 5,
        subtotal: 10,
      },
    ],
  };

  const displayOrder = isTest ? testOrder : order;
  if (!displayOrder) return null;

  return (
    <div
      className="print-ticket"
      style={{ width: '80mm', padding: '8px', fontFamily: 'monospace' }}
    >
      <div style={{ textAlign: 'center', marginBottom: '8px' }}>
        <h1 style={{ fontSize: 22, margin: '0 0 4px 0', fontWeight: 'bold' }}>CuckooEats</h1>
        <p style={{ fontSize: 24, margin: '4px 0', fontWeight: 'bold' }}>
          {isTest ? 'PRUEBA DE IMPRESIÓN' : `Pedido #${displayOrder.id}`}
        </p>
        {!isTest && displayOrder.scheduled_delivery_time && (
          <div style={{
            fontSize: 18,
            margin: '8px 0',
            fontWeight: 'bold',
            padding: '6px',
            border: '2px solid #000',
            borderRadius: '4px'
          }}>
            <p style={{ margin: '0 0 2px 0' }}>PEDIDO AGENDADO</p>
            <p style={{ margin: 0, fontSize: 16 }}>
              Para la(s) {format(new Date(displayOrder.scheduled_delivery_time), 'HH:mm')}
            </p>
          </div>
        )}
      </div>

      <div style={{ fontSize: 13, marginBottom: 8 }}>
        <p style={{ margin: 0 }}>
          Fecha:{' '}
          {format(new Date(displayOrder.created_at), 'dd/MM/yyyy HH:mm', {
            locale: es,
          })}
        </p>
        <p style={{ margin: 0 }}>
          Cliente:{' '}
          {displayOrder.user
            ? `${displayOrder.user.first_name} ${displayOrder.user.last_name}`
            : 'Cliente'}
          {displayOrder.user?.faculty && ` (${displayOrder.user.faculty})`}
        </p>
        <p style={{ margin: 0 }}>Estado: {displayOrder.status}</p>
        {displayOrder.started_at && (
          <p style={{ margin: 0 }}>
            Iniciado: {format(new Date(displayOrder.started_at), 'dd/MM/yyyy HH:mm', { locale: es })}
          </p>
        )}
        {displayOrder.ready_at && (
          <p style={{ margin: 0 }}>
            Listo: {format(new Date(displayOrder.ready_at), 'dd/MM/yyyy HH:mm', { locale: es })}
          </p>
        )}
        {displayOrder.delivered_at && (
          <p style={{ margin: 0 }}>
            Entregado: {format(new Date(displayOrder.delivered_at), 'dd/MM/yyyy HH:mm', { locale: es })}
          </p>
        )}
      </div>

      <div
        style={{
          borderTop: '1px dashed #000',
          borderBottom: '1px dashed #000',
          padding: '8px 0',
          marginBottom: 8,
        }}
      >
        {displayOrder.details.map((detail, index) => (
          <div
            key={index}
            style={{ fontSize: 14, marginBottom: 4 }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ maxWidth: '60%', wordWrap: 'break-word' }}>
                {detail.quantity}x {detail.product.name}
              </span>
              <span>{formatCurrency(detail.subtotal)}</span>
            </div>
            {detail.options && detail.options.length > 0 && (
              <div style={{ paddingLeft: 12, color: 'black', fontSize: 14, fontWeight: 'normal' }}>
                {detail.options.map(opt => opt.option.name).join(', ')}
              </div>
            )}
          </div>
        ))}
      </div>

      <div
        style={{
          fontSize: 16,
          textAlign: 'right',
          fontWeight: 'bold',
          marginBottom: 8,
        }}
      >
        Total: {formatCurrency(displayOrder.total)}
      </div>

      {isTest && (
        <div
          style={{
            marginTop: 16,
            textAlign: 'center',
            fontSize: 10,
            border: '1px solid #000',
            padding: '8px',
          }}
        >
          <p style={{ margin: '0 0 4px 0', fontWeight: 'bold' }}>PRUEBA DE IMPRESIÓN 80MM</p>
          <p style={{ margin: 0 }}>
            Si puede leer esto claramente y el texto no se corta,
            la impresora está configurada correctamente para papel de 80mm.
          </p>
        </div>
      )}
    </div>
  );
}
