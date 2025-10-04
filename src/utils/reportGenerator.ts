import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { utils, writeFile } from 'xlsx';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { formatCurrency } from './formatCurrency';

const COLORS = {
  primary: '#0B818F',
  primaryDark: '#183542',
  primaryLight: '#139FAA',
  secondary: '#49BCCE',
  secondaryLight: '#B3E1E4',
  accent: '#F07122',
};

export const generatePDFReport = (metrics: any) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;
  const margin = 20;

  // Add logo and title
  doc.addImage('https://i.ibb.co/yRNKTMZ/Logo-Vertical.png', 'PNG', margin, 10, 30, 30);
  doc.setFontSize(20);
  doc.setTextColor(COLORS.primaryDark);
  doc.text('Reporte de Métricas', pageWidth / 2, 25, { align: 'center' });
  
  // Add date
  doc.setFontSize(12);
  doc.setTextColor(100);
  doc.text(
    `Generado el ${format(new Date(), "d 'de' MMMM, yyyy", { locale: es })}`,
    pageWidth / 2,
    35,
    { align: 'center' }
  );

  // Summary section
  doc.setFontSize(16);
  doc.setTextColor(COLORS.primary);
  doc.text('Resumen General', margin, 50);

  const summaryData = [
    ['Total de Pedidos', metrics.totalOrders.toString()],
    ['Ventas Totales', formatCurrency(metrics.totalSales)],
    ['Productos Activos', metrics.activeProducts.toString()],
    ['Usuarios Totales', metrics.totalUsers.toString()],
    ['Nuevos Usuarios', metrics.newUsers.toString()],
  ];

  autoTable(doc, {
    startY: 55,
    head: [['Métrica', 'Valor']],
    body: summaryData,
    theme: 'striped',
    headStyles: {
      fillColor: COLORS.primary,
      textColor: '#FFFFFF',
      fontSize: 12,
    },
    styles: {
      fontSize: 10,
      cellPadding: 5,
    },
    margin: { left: margin },
  });

  // Top Products section
  doc.addPage();
  doc.setFontSize(16);
  doc.setTextColor(COLORS.primary);
  doc.text('Productos Más Vendidos', margin, 20);

  const productsData = metrics.topProducts.map((product: any) => [
    product.name,
    product.quantity.toString(),
    formatCurrency(product.total),
  ]);

  autoTable(doc, {
    startY: 25,
    head: [['Producto', 'Cantidad', 'Total']],
    body: productsData,
    theme: 'striped',
    headStyles: {
      fillColor: COLORS.primary,
      textColor: '#FFFFFF',
      fontSize: 12,
    },
    styles: {
      fontSize: 10,
      cellPadding: 5,
    },
    margin: { left: margin },
  });

  // Add footer with page numbers
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(
      `Página ${i} de ${totalPages}`,
      pageWidth / 2,
      pageHeight - 10,
      { align: 'center' }
    );
  }

  // Save the PDF
  doc.save('dashboard-report.pdf');
};

export const generateExcelReport = (metrics: any) => {
  const workbook = utils.book_new();

  // Summary sheet
  const summaryData = [
    ['Reporte de Métricas'],
    [`Generado el ${format(new Date(), "d 'de' MMMM, yyyy", { locale: es })}`],
    [],
    ['Métrica', 'Valor'],
    ['Total de Pedidos', metrics.totalOrders],
    ['Ventas Totales', metrics.totalSales],
    ['Productos Activos', metrics.activeProducts],
    ['Usuarios Totales', metrics.totalUsers],
    ['Nuevos Usuarios', metrics.newUsers],
  ];

  const summarySheet = utils.aoa_to_sheet(summaryData);
  utils.book_append_sheet(workbook, summarySheet, 'Resumen');

  // Top Products sheet
  const productsData = [
    ['Producto', 'Cantidad', 'Total'],
    ...metrics.topProducts.map((product: any) => [
      product.name,
      product.quantity,
      product.total,
    ]),
  ];

  const productsSheet = utils.aoa_to_sheet(productsData);
  utils.book_append_sheet(workbook, productsSheet, 'Top Productos');

  // Peak Hours sheet
  const hoursData = [
    ['Hora', 'Pedidos'],
    ...metrics.peakHours.map((hour: any) => [
      `${hour.hour}:00`,
      hour.count,
    ]),
  ];

  const hoursSheet = utils.aoa_to_sheet(hoursData);
  utils.book_append_sheet(workbook, hoursSheet, 'Horas Pico');

  // Top Customers sheet
  const customersData = [
    ['Cliente', 'Pedidos', 'Total'],
    ...metrics.topCustomers.map((customer: any) => [
      customer.name,
      customer.orders,
      customer.total,
    ]),
  ];

  const customersSheet = utils.aoa_to_sheet(customersData);
  utils.book_append_sheet(workbook, customersSheet, 'Top Clientes');

  // Apply styles
  ['Resumen', 'Top Productos', 'Horas Pico', 'Top Clientes'].forEach(sheetName => {
    const sheet = workbook.Sheets[sheetName];
    const range = utils.decode_range(sheet['!ref'] || 'A1');
    
    // Style header row
    for (let C = range.s.c; C <= range.e.c; ++C) {
      const address = utils.encode_cell({ r: 0, c: C });
      if (!sheet[address]) continue;
      sheet[address].s = {
        font: { bold: true },
        fill: { fgColor: { rgb: "F2F2F2" } },
      };
    }
  });

  // Save the file
  writeFile(workbook, 'dashboard-report.xlsx');
};