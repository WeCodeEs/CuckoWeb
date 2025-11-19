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
  totalOrders: number;
  totalSales: number;
  activeProducts: number;
  totalUsers: number;
  newUsers: number;
  topProducts: Array<{
    name: string;
    total: number;
    quantity: number;
  }>;
  recentSales: Array<{
    date: string;
    total: number;
  }>;
  peakHours: Array<{
    hour: number;
    count: number;
  }>;
  topCustomers: Array<{
    name: string;
    orders: number;
    total: number;
  }>;
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

      // Get orders within date range
      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select(`
          id,
          total,
          created_at,
          status,
          user:users(
            uuid,
            first_name,
            last_name
          )
        `)
        .gte('created_at', dateRange.startDate.toISOString())
        .lte('created_at', dateRange.endDate.toISOString());

      if (ordersError) throw ordersError;

      const totalOrders = ordersData?.length || 0;
      const totalSales = ordersData?.reduce((sum, order) => sum + (order.total || 0), 0) || 0;

      // Get active products
      const { count: activeProducts, error: productsError } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true })
        .eq('active', true);

      if (productsError) throw productsError;

      // Get user metrics
      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select('uuid, created_at');

      if (usersError) throw usersError;

      const totalUsers = usersData?.length || 0;
      const newUsers = usersData?.filter(user => 
        parseISO(user.created_at) >= dateRange.startDate
      ).length || 0;

      // Get top products with quantities
      const { data: topProductsData, error: topProductsError } = await supabase
        .from('order_details')
        .select(`
          quantity,
          product:products(name),
          unit_price
        `)
        .gte('created_at', dateRange.startDate.toISOString())
        .lte('created_at', dateRange.endDate.toISOString())
        .order('quantity', { ascending: false })
        .limit(5);

      if (topProductsError) throw topProductsError;

      const topProducts = topProductsData
        .map(item => ({
          name: item.product?.name || 'Unknown Product',
          quantity: item.quantity || 0,
          total: (item.quantity || 0) * (item.unit_price || 0)
        }))
        .sort((a, b) => b.total - a.total);

      // Calculate peak hours
      const hourCounts = ordersData?.reduce((acc: { [key: number]: number }, order) => {
        const hour = new Date(order.created_at).getHours();
        acc[hour] = (acc[hour] || 0) + 1;
        return acc;
      }, {});

      const peakHours = Object.entries(hourCounts || {})
        .map(([hour, count]) => ({ hour: parseInt(hour), count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      // Calculate top customers
      const customerOrders = ordersData?.reduce((acc: { [key: string]: any }, order) => {
        const userId = order.user?.uuid;
        if (!userId) return acc;

        if (!acc[userId]) {
          acc[userId] = {
            name: `${order.user.first_name} ${order.user.last_name}`,
            orders: 0,
            total: 0
          };
        }

        acc[userId].orders++;
        acc[userId].total += order.total || 0;
        return acc;
      }, {});

      const topCustomers = Object.values(customerOrders || {})
        .sort((a: any, b: any) => b.total - a.total)
        .slice(0, 5);

      // Calculate daily sales
      const dailySales = Array.from({ length: 7 }, (_, i) => {
        const date = subDays(dateRange.endDate, i);
        return {
          date: format(date, 'yyyy-MM-dd'),
          total: 0
        };
      }).reverse();

      ordersData?.forEach(order => {
        const orderDate = format(new Date(order.created_at), 'yyyy-MM-dd');
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
    const { metrics } = get();
    if (!metrics) return;

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;

    // Add title
    doc.setFontSize(20);
    doc.text('Reporte del Dashboard', pageWidth / 2, 20, { align: 'center' });

    // Add date range
    doc.setFontSize(12);
    const { dateRange } = get();
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
    doc.text('Top 5 Productos', 20, doc.lastAutoTable.finalY + 20);
    
    const productsData = metrics.topProducts.map(product => [
      product.name,
      product.quantity.toString(),
      `S/ ${product.total.toFixed(2)}`,
    ]);

    autoTable(doc, {
      startY: doc.lastAutoTable.finalY + 25,
      head: [['Producto', 'Cantidad', 'Total']],
      body: productsData,
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

    // Save the file
    writeFile(workbook, 'dashboard-report.xlsx');
  },
}));