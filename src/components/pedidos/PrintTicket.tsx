import type { Order } from '../../stores/orderStore';
import { buildTicketHtml } from '../../utils/buildTicketHtml';

interface Props {
  order?: Order;
  isTest?: boolean;
}

export default function PrintTicket({ order, isTest = false }: Props) {
  const html = buildTicketHtml(order, isTest);
  if (!html) return null;

  return (
    <div
      className="print-ticket"
      style={{ width: '80mm', padding: '8px', fontFamily: 'monospace' }}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
