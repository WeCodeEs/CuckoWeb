import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { startOfDay, subDays, format, parseISO } from 'date-fns';
import { utils, writeFile } from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface DateRange {
  startDate: Date;
  endDate: Date;
}

interface DashboardMetrics {
  totalOrders: number;      // Pedidos (excepto 'creando')
  totalSales: number;       // Ventas (solo 'paid')
  activeProducts: number;   // Productos Activos
  totalUsers: number;       // Usuarios Totales (alumnos)
  newUsers: number;         // Nuevos Usuarios (en rango)
  averageSale: number;      // Promedio de Venta (solo 'paid')
  topProducts: Array<{
    name: string;
    total: number;
    quantity: number;
  }>;                      // Top 5 Productos (por cantidad, 'paid')
  recentSales: Array<{
    date: string;
    total: number;
  }>;                      // Ventas por Día ('paid')
  peakHours: Array<{
    hour: number;
    count: number;
  }>;                      // Horas Pico 
  topCustomers: Array<{
    name: string;
    orders: number;
    total: number;
  }>;                   // Top Clientes (por pedidos, 'paid')
}

interface DashboardState {
  metrics: DashboardMetrics | null;
  loading: boolean;
  error: string | null;
  dateRange: DateRange;
  setDateRange: (range: DateRange) => void;
  fetchMetrics: () => Promise<void>;
  exportToPDF: () => void;
  exportToExcel: () => void;
}

const initialMetrics: DashboardMetrics = {
  totalOrders: 0,
  totalSales: 0,
  activeProducts: 0,
  totalUsers: 0,
  newUsers: 0,
  averageSale: 0,
  topProducts: [],
  recentSales: [],
  peakHours: [],
  topCustomers: [],
};

export const useDashboardStore = create<DashboardState>((set, get) => ({
  metrics: null,
  loading: false,
  error: null,
  dateRange: {
    startDate: subDays(startOfDay(new Date()), 7),
    endDate: new Date(),
  },

  setDateRange: (range: DateRange) => {
    set({ dateRange: range });
    get().fetchMetrics();
  },

  fetchMetrics: async () => {
    try {
      set({ loading: true, error: null });
      const { dateRange } = get();

      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select(`
          id,
          total,
          created_at,
          status,
          payment_status,
          user:users(
            uuid,
            first_name,
            last_name
          )
        `)
        .gte('created_at', dateRange.startDate.toISOString())
        .lte('created_at', dateRange.endDate.toISOString());

      if (ordersError) throw ordersError;

      const validOrdersForTotalCount = ordersData?.filter(o => o.status !== 'Creando') || [];
      const totalOrders = validOrdersForTotalCount.length;

      const paidOrders = ordersData?.filter(o => o.payment_status === 'paid') || [];
      const totalSales = paidOrders.reduce((sum, order) => sum + (order.total || 0), 0);
      
      const totalPaidOrders = paidOrders.length;
      const averageSale = totalPaidOrders > 0 ? totalSales / totalPaidOrders : 0;
      console.log('Ordenes pagadas: ', totalPaidOrders);
      console.log('Ordenes totales: ', totalOrders);

      const { count: activeProducts, error: productsError } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true })
        .eq('active', true);

      if (productsError) throw productsError;

      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select('uuid, created_at');

      if (usersError) throw usersError;

      const totalUsers = usersData?.length || 0;
      const newUsers = usersData?.filter(user => 
        parseISO(user.created_at) >= dateRange.startDate
      ).length || 0;

      const { data: topProductsData, error: topProductsError } = await supabase
        .from('order_details')
        .select(`
          quantity,
          subtotal,
          product_id,
          product_name,
          product:products(name),
          order:orders!inner(created_at, payment_status)
        `)
        .eq('order.payment_status', 'paid')
        .gte('order.created_at', dateRange.startDate.toISOString())
        .lte('order.created_at', dateRange.endDate.toISOString());

      if (topProductsError) throw topProductsError;

      const productMap = new Map<string, { name: string; quantity: number; total: number }>();

      topProductsData?.forEach(item => {
        const productName = item.product_name || (item.product as any)?.name || 'Producto eliminado';
        const groupKey = item.product_id != null ? `id:${item.product_id}` : `name:${productName}`;
        const quantity = item.quantity || 0;
        const subtotal = item.subtotal || 0;

        if (productMap.has(groupKey)) {
          const existing = productMap.get(groupKey)!;
          existing.quantity += quantity;
          existing.total += subtotal;
        } else {
          productMap.set(groupKey, {
            name: productName,
            quantity,
            total: subtotal
          });
        }
      });

      const topProducts = Array.from(productMap.values())
        .sort((a, b) => b.quantity - a.quantity)
        .slice(0, 5);

      const { data: peakHoursData, error: peakHoursError } = await supabase
        .from('orders')
        .select('created_at, scheduled_delivery_time')
        .not('status', 'eq', 'Creando') 
        .gte('created_at', dateRange.startDate.toISOString())
        .lte('created_at', dateRange.endDate.toISOString());
        
      if (peakHoursError) throw peakHoursError;

      const hourCounts = peakHoursData?.reduce((acc: { [key: number]: number }, order) => {
        const baseDate = order.scheduled_delivery_time 
          ? new Date(order.scheduled_delivery_time) 
          : new Date(order.created_at);

        const hour = baseDate.getHours();
        acc[hour] = (acc[hour] || 0) + 1;
        return acc;
      }, {});

      const peakHours = Object.entries(hourCounts || {})
        .map(([hour, count]) => ({ hour: parseInt(hour), count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      const { data: topCustomersData, error: topCustomersError } = await supabase
        .from('orders')
        .select(`
          total,
          user:users!inner(
            uuid,
            first_name,
            last_name
          )
        `)
        .eq('payment_status', 'paid')
        .gte('created_at', dateRange.startDate.toISOString())
        .lte('created_at', dateRange.endDate.toISOString());

      if (topCustomersError) throw topCustomersError;

      const customerOrders = topCustomersData?.reduce((acc: { [key: string]: any }, order) => {
        const userId = order.user.uuid;
        if (!userId) return acc;

        if (!acc[userId]) {
          acc[userId] = {
            name: `${order.user.first_name || ''} ${order.user.last_name || ''}`.trim(),
            orders: 0,
            total: 0
          };
        }

        acc[userId].orders++; 
        acc[userId].total += order.total || 0;
        return acc;
      }, {});

      const topCustomers = Object.values(customerOrders || {})
        .sort((a: any, b: any) => b.orders - a.orders) 
        .slice(0, 5);

      const startDay = startOfDay(dateRange.startDate);
      const endDay = startOfDay(dateRange.endDate);
      const daysDiff = Math.ceil((endDay.getTime() - startDay.getTime()) / (1000 * 60 * 60 * 24)) + 1;

      const dailySales = Array.from({ length: daysDiff }, (_, i) => {
        const date = new Date(startDay);
        date.setDate(startDay.getDate() + i);
        return {
          date: format(date, 'yyyy-MM-dd'),
          total: 0
        };
      });

      paidOrders?.forEach(order => {
        const localDate = new Date(order.created_at);
        const orderDate = format(localDate, 'yyyy-MM-dd');
        const dayData = dailySales.find(day => day.date === orderDate);
        if (dayData) {
          dayData.total += order.total || 0;
        }
      });

      set({
        metrics: {
          totalOrders,
          totalSales,
          activeProducts: activeProducts || 0,
          totalUsers,
          newUsers,
          averageSale,
          topProducts,
          recentSales: dailySales,
          peakHours,
          topCustomers,
        },
        loading: false,
        error: null
      });
    } catch (error: any) {
      set({
        metrics: initialMetrics,
        loading: false,
        error: error.message || 'Error al cargar las métricas del dashboard'
      });
    }
  },

  exportToPDF: () => {
    const { metrics, dateRange } = get();
    if (!metrics) return;

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;

    // Add title
    doc.setFontSize(20);
    doc.text('Reporte del Dashboard', pageWidth / 2, 20, { align: 'center' });

    // Add date range
    doc.setFontSize(12);
    doc.text(
      `Período: ${format(dateRange.startDate, 'dd/MM/yyyy')} - ${format(dateRange.endDate, 'dd/MM/yyyy')}`,
      pageWidth / 2,
      30,
      { align: 'center' }
    );

    // Add summary metrics
    doc.setFontSize(14);
    doc.text('Resumen General', 20, 45);
    
    const summaryData = [
      ['Total de Pedidos', metrics.totalOrders.toString()],
      ['Ventas Totales', `S/ ${metrics.totalSales.toFixed(2)}`],
      ['Promedio de Venta', `S/ ${metrics.averageSale.toFixed(2)}`], // <-- AÑADIDO
      ['Productos Activos', metrics.activeProducts.toString()],
      ['Usuarios Totales', metrics.totalUsers.toString()],
      ['Nuevos Usuarios', metrics.newUsers.toString()],
    ];

    autoTable(doc, {
      startY: 50,
      head: [['Métrica', 'Valor']],
      body: summaryData,
    });

    // Add top products
    doc.text('Top 5 Productos', 20, (doc as any).lastAutoTable.finalY + 20);
    
    const productsData = metrics.topProducts.map(product => [
      product.name,
      product.quantity.toString(),
      `S/ ${product.total.toFixed(2)}`,
    ]);

    autoTable(doc, {
      startY: (doc as any).lastAutoTable.finalY + 25,
      head: [['Producto', 'Cantidad', 'Total']],
      body: productsData,
    });
    
    // Add top customers
    doc.text('Top 5 Clientes (Histórico)', 20, (doc as any).lastAutoTable.finalY + 20);
    
    const customersData = metrics.topCustomers.map(customer => [
      customer.name,
      customer.orders.toString(),
      `S/ ${customer.total.toFixed(2)}`,
    ]);

    autoTable(doc, {
      startY: (doc as any).lastAutoTable.finalY + 25,
      head: [['Cliente', 'N° Pedidos', 'Total Gastado']],
      body: customersData,
    });

    // Save the PDF
    doc.save('dashboard-report.pdf');
  },

  exportToExcel: () => {
    const { metrics, dateRange } = get();
    if (!metrics) return;

    const workbook = utils.book_new();

    // Summary sheet
    const summaryData = [
      ['Reporte del Dashboard'],
      [`Período: ${format(dateRange.startDate, 'dd/MM/yyyy')} - ${format(dateRange.endDate, 'dd/MM/yyyy')}`],
      [],
      ['Métrica', 'Valor'],
      ['Total de Pedidos', metrics.totalOrders],
      ['Ventas Totales', metrics.totalSales],
      ['Promedio de Venta', metrics.averageSale], // <-- AÑADIDO
      ['Productos Activos', metrics.activeProducts],
      ['Usuarios Totales', metrics.totalUsers],
      ['Nuevos Usuarios', metrics.newUsers],
    ];
    const summarySheet = utils.aoa_to_sheet(summaryData);
    utils.book_append_sheet(workbook, summarySheet, 'Resumen');

    // Top Products sheet
    const productsData = [
      ['Producto', 'Cantidad', 'Total'],
      ...metrics.topProducts.map(product => [
        product.name,
        product.quantity,
        product.total,
      ]),
    ];
    const productsSheet = utils.aoa_to_sheet(productsData);
    utils.book_append_sheet(workbook, productsSheet, 'Top Productos');
    
    // Top Customers sheet
    const customersData = [
      ['Cliente', 'N° Pedidos', 'Total Gastado'],
      ...metrics.topCustomers.map(customer => [
        customer.name,
        customer.orders,
        customer.total,
      ]),
    ];
    const customersSheet = utils.aoa_to_sheet(customersData);
    utils.book_append_sheet(workbook, customersSheet, 'Top Clientes');
    
    // Daily Sales sheet
    const dailySalesData = [
      ['Fecha', 'Ventas Totales'],
      ...metrics.recentSales.map(day => [
        day.date,
        day.total,
      ]),
    ];
    const dailySalesSheet = utils.aoa_to_sheet(dailySalesData);
    utils.book_append_sheet(workbook, dailySalesSheet, 'Ventas Diarias');

    // Save the file
    writeFile(workbook, 'dashboard-report.xlsx');
  },
}));