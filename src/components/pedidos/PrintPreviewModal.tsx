import React from 'react';
import { X } from 'lucide-react';
import PrintTicket from './PrintTicket';

interface Props {
  onClose: () => void;
}

export default function PrintPreviewModal({ onClose }: Props) {
  const handlePrint = () => {
    // Create an iframe for printing
    const iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    document.body.appendChild(iframe);

    // Get the iframe document
    const doc = iframe.contentWindow?.document;
    if (!doc) {
      alert('Error al preparar la impresión');
      return;
    }

    // Write the print content with 80mm paper configuration
    doc.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            @page {
              size: 80mm auto;
              margin: 0mm;
            }
            body {
              margin: 0;
              padding: 8px;
              width: 80mm;
              font-family: 'Courier New', monospace;
              font-size: 11px;
              line-height: 1.2;
            }
            * {
              box-sizing: border-box;
            }
            .print-ticket {
              width: 80mm !important;
            }
          </style>
        </head>
        <body>
          ${document.getElementById('print-content')?.innerHTML || ''}
        </body>
      </html>
    `);
    doc.close();

    // Print and remove iframe
    iframe.contentWindow?.focus();
    iframe.contentWindow?.print();
    
    // Remove iframe after printing
    setTimeout(() => {
      document.body.removeChild(iframe);
      onClose();
    }, 500);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-darkbg-lighter rounded-xl shadow-xl w-full max-w-md mx-4">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-darkbg">
          <h2 className="text-lg font-bold text-primary-dark dark:text-white">
            Vista Previa de Impresión (80mm)
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-darkbg rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        <div className="p-6">
          <div className="mb-4 text-sm text-gray-600 dark:text-gray-400">
            <p>Configuración: Papel de 80mm de ancho</p>
            <p>Fuente: Monospace para mejor legibilidad</p>
          </div>
          
          <div 
            id="print-content" 
            className="bg-white rounded-lg p-4 shadow-sm mb-4 mx-auto" 
            style={{ width: '80mm', maxWidth: '100%' }}
          >
            <PrintTicket isTest={true} />
          </div>

          <div className="flex justify-end gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-darkbg rounded-lg hover:bg-gray-200 dark:hover:bg-darkbg-darker transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handlePrint}
              className="px-4 py-2 text-sm font-medium text-white bg-primary dark:bg-secondary rounded-lg hover:bg-primary-dark dark:hover:bg-secondary/90 transition-colors"
            >
              Imprimir Prueba
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}