import React, { useCallback, useMemo, useState } from 'react';
import { X } from 'lucide-react';
import type { Order } from '../../stores/orderStore';
import { useOrderStore } from '../../stores/orderStore';
import { useToast } from '../ui/use-toast';

interface Props {
  order: Order;
  onClose: () => void;
}

export default function NotificationModal({ order, onClose }: Props) {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { sendPersonalNotification } = useOrderStore();
  const { toast } = useToast();

  const recipientName = useMemo(() => {
    const f = order.user?.first_name ?? '';
    const l = order.user?.last_name ?? '';
    const name = `${f} ${l}`.trim();
    return name || 'Usuario';
  }, [order.user]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!title.trim() || !body.trim()) {
      setError('Por favor completa título y cuerpo.');
      return;
    }
    setSubmitting(true);
    try {
      await sendPersonalNotification(order, title, body);
      toast({
        title: 'Notificación enviada',
        description: `El mensaje fue enviado a ${recipientName}.`,
        className: 'border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20',
      });
      onClose();
      setTitle('');
      setBody('');
    } catch (err: any) {
      console.error('Error enviando notificación:', err);
      setError(err?.message || 'No se pudo enviar la notificación.');
      toast({
        variant: 'destructive',
        title: 'Error al enviar',
        description: err?.message || 'No se pudo enviar la notificación.',
      });
    } finally {
      setSubmitting(false);
    }
  }, [title, body, order, sendPersonalNotification, toast, recipientName, onClose]);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-darkbg-lighter rounded-xl shadow-xl w-full max-w-lg mx-4">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-darkbg">
          <h2 className="text-lg font-bold text-primary-dark dark:text-white">
            Enviar Notificación
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-darkbg rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500 dark:text-gray-300" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Destinatario
            </label>
            <input
              type="text"
              value={recipientName}
              disabled
              className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-darkbg bg-gray-100 dark:bg-darkbg text-gray-600 italic cursor-not-allowed"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Título
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Escribe el título del mensaje"
              className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-darkbg focus:ring-2 focus:ring-primary/20 dark:focus:ring-secondary/20 focus:border-primary dark:focus:border-secondary bg-white dark:bg-darkbg text-gray-900 dark:text-white"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Cuerpo del mensaje
            </label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Escribe el cuerpo del mensaje"
              rows={4}
              className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-darkbg focus:ring-2 focus:ring-primary/20 dark:focus:ring-secondary/20 focus:border-primary dark:focus:border-secondary bg-white dark:bg-darkbg text-gray-900 dark:text-white resize-y"
              required
            />
          </div>

          {error && (
            <div className="text-sm text-red-600 dark:text-red-400">
              {error}
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-darkbg rounded-lg hover:bg-gray-200 dark:hover:bg-darkbg/80 transition-colors"
              disabled={submitting}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              disabled={submitting}
            >
              {submitting ? 'Enviando…' : 'Enviar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}