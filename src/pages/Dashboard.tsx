import React, { useEffect } from 'react';
import { 
  ShoppingBag, 
  DollarSign, 
  Coffee, 
  TrendingUp,
  Users,
  UserPlus,
  Download,
  FileSpreadsheet,
  Clock
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { useDashboardStore } from '../stores/dashboardStore';
import DashboardCard from '../components/DashboardCard';
import DateRangePicker from '../components/DateRangePicker';
import SkeletonCard from '../components/skeletons/SkeletonCard';
import { generatePDFReport, generateExcelReport } from '../utils/reportGenerator';

const COLORS = ['#0B818F', '#139FAA', '#49BCCE', '#B3E1E4', '#F07122'];

export default function Dashboard() {
  const { 
    metrics, 
    loading, 
    error, 
    dateRange,
    setDateRange,
    fetchMetrics,
  } = useDashboardStore();

  useEffect(() => {
    fetchMetrics();
    const interval = setInterval(fetchMetrics, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchMetrics]);

  const handleExportPDF = () => {
    if (!metrics) return;
    generatePDFReport(metrics);
  };

  const handleExportExcel = () => {
    if (!metrics) return;
    generateExcelReport(metrics);
  };

  if (error) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
        <div className="bg-red-50 dark:bg-darkbg-lighter border border-red-100 dark:border-red-900 rounded-xl p-6 max-w-md text-center">
          <p className="text-lg font-medium text-red-800 dark:text-red-400">Error al cargar el dashboard</p>
          <p className="mt-2 text-sm text-red-600 dark:text-red-300">{error}</p>
          <button
            onClick={() => fetchMetrics()}
            className="mt-4 px-4 py-2 bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300 rounded-lg hover:bg-red-200 dark:hover:bg-red-900 transition-colors"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-darkbg transition-colors duration-200">
      <div className="p-6 space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-primary-dark dark:text-white">Dashboard</h1>
            <p className="text-sm text-gray-600 dark:text-gray-300">Resumen general del sistema</p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <DateRangePicker
              startDate={dateRange.startDate}
              endDate={dateRange.endDate}
              onChange={setDateRange}
            />

            <div className="flex items-center gap-2">
              <button
                onClick={handleExportPDF}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-primary dark:text-secondary bg-white dark:bg-darkbg-lighter rounded-xl hover:bg-primary/5 dark:hover:bg-darkbg transition-colors border border-primary/20 dark:border-secondary/20"
              >
                <Download className="w-4 h-4" />
                PDF
              </button>

              <button
                onClick={handleExportExcel}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-primary dark:text-secondary bg-white dark:bg-darkbg-lighter rounded-xl hover:bg-primary/5 dark:hover:bg-darkbg transition-colors border border-primary/20 dark:border-secondary/20"
              >
                <FileSpreadsheet className="w-4 h-4" />
                Excel
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
          {loading ? (
            <>
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
            </>
          ) : metrics ? (
            <>
              <DashboardCard
                title="Pedidos"
                value={metrics.totalOrders}
                icon={ShoppingBag}
                color="primary"
              />
              <DashboardCard
                title="Ventas"
                value={metrics.totalSales}
                icon={DollarSign}
                color="accent"
                isCurrency
              />
              <DashboardCard
                title="Productos Activos"
                value={metrics.activeProducts}
                icon={Coffee}
                color="secondary"
              />
              <DashboardCard
                title="Promedio de Venta"
                value={metrics.totalOrders ? metrics.totalSales / metrics.totalOrders : 0}
                icon={TrendingUp}
                color="primary-light"
                isCurrency
              />
              <DashboardCard
                title="Usuarios Totales"
                value={metrics.totalUsers}
                icon={Users}
                color="primary"
              />
              <DashboardCard
                title="Nuevos Usuarios"
                value={metrics.newUsers}
                icon={UserPlus}
                color="accent"
              />
            </>
          ) : null}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-darkbg-lighter rounded-xl shadow-soft dark:shadow-dark p-6">
            <h2 className="text-lg font-bold text-primary-dark dark:text-white mb-6">
              Ventas por Día
            </h2>
            <div className="h-[300px]">
              {loading ? (
                <div className="w-full h-full bg-slate-200/40 dark:bg-darkbg/40 rounded-lg animate-pulse" />
              ) : metrics ? (
                <ResponsiveContainer width="100%\" height="100%">
                  <BarChart data={metrics.recentSales}>
                    <defs>
                      <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#F07122" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#F07122" stopOpacity={0.2}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" className="dark:opacity-10" />
                    <XAxis 
                      dataKey="date" 
                      tick={{ fontSize: 12, fill: '#666' }}
                      tickFormatter={(value) => {
                        const date = new Date(value);
                        return date.toLocaleDateString('es-PE', { 
                          day: '2-digit',
                          month: 'short'
                        });
                      }}
                      axisLine={{ stroke: '#e5e5e5' }}
                      className="dark:text-gray-400"
                    />
                    <YAxis 
                      tick={{ fontSize: 12, fill: '#666' }}
                      tickFormatter={(value) => `$${value}`}
                      axisLine={{ stroke: '#e5e5e5' }}
                      className="dark:text-gray-400"
                    />
                    <Tooltip 
                      formatter={(value: number) => [`$${value}`, "Ventas"]}
                      labelFormatter={(label) => {
                        const date = new Date(label);
                        return date.toLocaleDateString('es-PE', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        });
                      }}
                      contentStyle={{
                        backgroundColor: 'white',
                        border: '1px solid #e5e5e5',
                        borderRadius: '8px',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
                      }}
                      className="dark:bg-darkbg-lighter dark:border-darkbg dark:text-white"
                    />
                    <Bar 
                      dataKey="total" 
                      fill="url(#barGradient)"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              ) : null}
            </div>
          </div>

          <div className="bg-white dark:bg-darkbg-lighter rounded-xl shadow-soft dark:shadow-dark p-6">
            <h2 className="text-lg font-bold text-primary-dark dark:text-white mb-6">
              Top 5 Productos
            </h2>
            <div className="h-[300px]">
              {loading ? (
                <div className="w-full h-full bg-slate-200/40 dark:bg-darkbg/40 rounded-lg animate-pulse" />
              ) : metrics ? (
                <ResponsiveContainer width="100%\" height="100%">
                  <PieChart>
                    <Pie
                      data={metrics.topProducts}
                      dataKey="total"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      label={({ name, percent }) => 
                        `${name}: ${(percent * 100).toFixed(0)}%`
                      }
                      labelLine={{ stroke: '#666', className: 'dark:text-gray-400' }}
                    >
                      {metrics.topProducts.map((_, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={COLORS[index % COLORS.length]}
                          strokeWidth={1}
                        />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value: number) => `$${value}`}
                      contentStyle={{
                        backgroundColor: 'white',
                        border: '1px solid #e5e5e5',
                        borderRadius: '8px',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
                      }}
                      className="dark:bg-darkbg-lighter dark:border-darkbg dark:text-white"
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : null}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-darkbg-lighter rounded-xl shadow-soft dark:shadow-dark overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 dark:border-darkbg">
              <h2 className="text-lg font-bold text-primary-dark dark:text-white flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Horas Pico
              </h2>
            </div>
            <div className="p-6">
              {loading ? (
                <div className="space-y-4">
                  {Array.from({ length: 5 }).map((_, index) => (
                    <div key={index} className="flex items-center gap-4">
                      <div className="w-20 h-4 bg-slate-200/40 dark:bg-darkbg/40 rounded animate-pulse" />
                      <div className="flex-1 h-2 bg-slate-200/40 dark:bg-darkbg/40 rounded animate-pulse" />
                      <div className="w-20 h-4 bg-slate-200/40 dark:bg-darkbg/40 rounded animate-pulse" />
                    </div>
                  ))}
                </div>
              ) : metrics ? (
                <div className="space-y-4">
                  {metrics.peakHours.map((hour, index) => (
                    <div key={index} className="flex items-center gap-4">
                      <div className="text-sm font-medium text-gray-600 dark:text-gray-300 w-20">
                        {`${hour.hour}:00`}
                      </div>
                      <div className="flex-1 h-2 bg-gray-100 dark:bg-darkbg rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-primary dark:bg-secondary rounded-full transition-all"
                          style={{ 
                            width: `${(hour.count / Math.max(...metrics.peakHours.map(h => h.count))) * 100}%` 
                          }}
                        />
                      </div>
                      <div className="text-sm font-medium text-gray-900 dark:text-white w-20 text-right">
                        {hour.count} pedidos
                      </div>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
          </div>

          <div className="bg-white dark:bg-darkbg-lighter rounded-xl shadow-soft dark:shadow-dark overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 dark:border-darkbg">
              <h2 className="text-lg font-bold text-primary-dark dark:text-white flex items-center gap-2">
                <Users className="w-5 h-5" />
                Top Clientes
              </h2>
            </div>
            <div className="overflow-x-auto">
              {loading ? (
                <table className="min-w-full divide-y divide-gray-100 dark:divide-darkbg">
                  <thead>
                    <tr className="bg-gray-50/50 dark:bg-darkbg/50">
                      <th className="px-6 py-4 text-left">
                        <div className="h-4 bg-slate-200/40 dark:bg-darkbg/40 rounded w-24 animate-pulse" />
                      </th>
                      <th className="px-6 py-4 text-right">
                        <div className="h-4 bg-slate-200/40 dark:bg-darkbg/40 rounded w-24 ml-auto animate-pulse" />
                      </th>
                      <th className="px-6 py-4 text-right">
                        <div className="h-4 bg-slate-200/40 dark:bg-darkbg/40 rounded w-24 ml-auto animate-pulse" />
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-darkbg">
                    {Array.from({ length: 5 }).map((_, index) => (
                      <tr key={index}>
                        <td className="px-6 py-4">
                          <div className="h-4 bg-slate-200/40 dark:bg-darkbg/40 rounded w-32 animate-pulse" />
                        </td>
                        <td className="px-6 py-4">
                          <div className="h-4 bg-slate-200/40 dark:bg-darkbg/40 rounded w-16 ml-auto animate-pulse" />
                        </td>
                        <td className="px-6 py-4">
                          <div className="h-4 bg-slate-200/40 dark:bg-darkbg/40 rounded w-24 ml-auto animate-pulse" />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : metrics ? (
                <table className="min-w-full divide-y divide-gray-100 dark:divide-darkbg">
                  <thead>
                    <tr className="bg-gray-50/50 dark:bg-darkbg/50">
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Cliente
                      </th>
                      <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Pedidos
                      </th>
                      <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Total
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-darkbg">
                    {metrics.topCustomers.map((customer, index) => (
                      <tr 
                        key={index}
                        className="hover:bg-gray-50/50 dark:hover:bg-darkbg/50 transition-colors"
                      >
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                          {customer.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900 dark:text-white">
                          {customer.orders}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900 dark:text-white">
                          ${customer.total}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}