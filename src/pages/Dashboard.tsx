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
  Cell
} from 'recharts';
import { useDashboardStore } from '../stores/dashboardStore';
import DashboardCard from '../components/DashboardCard';
import DateRangePicker from '../components/DateRangePicker';
import SkeletonCard from '../components/skeletons/SkeletonCard';
import { generatePDFReport, generateExcelReport } from '../utils/reportGenerator';

const COLORS = ['#0B818F', '#139FAA', '#49BCCE', '#B3E1E4', '#F07122'];

const CustomTooltip = ({ active, payload, label, labelFormatter, valueFormatter }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white dark:bg-darkbg-lighter border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-3">
        {label && (
          <p className="text-sm font-medium text-gray-900 dark:text-white mb-1">
            {labelFormatter ? labelFormatter(label) : label}
          </p>
        )}
        {payload.map((entry: any, index: number) => (
          <p key={index} className="text-sm text-gray-700 dark:text-gray-300">
            <span className="font-medium">{entry.name}:</span> {valueFormatter ? valueFormatter(entry.value) : entry.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

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
                to="/historico" 
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
                to="/productos" 
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
                to="/alumnos"
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
          {/* --- GRÁFICA DE VENTAS POR DÍA  --- */}
          <div className="bg-white dark:bg-darkbg-lighter rounded-xl shadow-soft dark:shadow-dark p-6">
            <h2 className="text-lg font-bold text-primary-dark dark:text-white mb-6">
              Ventas por Día
            </h2>
            <div className="h-[300px]">
              {loading ? (
                <div className="w-full h-full bg-slate-200/40 dark:bg-darkbg/40 rounded-lg animate-pulse" />
              ) : metrics && metrics.recentSales.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={metrics.recentSales}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 12 }}
                      tickFormatter={(value) => {
                        const date = new Date(value + 'T12:00:00');
                        
                        return date.toLocaleDateString('es-PE', {
                          day: '2-digit',
                          month: 'short'
                        });
                      }}
                      className="dark:text-gray-300"
                      stroke="#9ca3af"
                    />
                    <YAxis
                      tick={{ fontSize: 12 }}
                      tickFormatter={(value) => `$${value}`}
                      className="dark:text-gray-300"
                      stroke="#9ca3af"
                    />
                    <Tooltip
                      content={<CustomTooltip
                        labelFormatter={(label: string) => {
                          const date = new Date(label + 'T12:00:00');
                          return date.toLocaleDateString('es-PE', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          });
                        }}
                        valueFormatter={(value: number) => `$${value}`}
                      />}
                    />
                    <Bar
                      dataKey="total"
                      fill="#0B818F"
                      radius={[8, 8, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-gray-400 dark:text-gray-500">
                  <p>No hay datos de ventas en el rango seleccionado</p>
                </div>
              )}
            </div>
          </div>

          {/* --- GRÁFICA TOP 5 PRODUCTOS --- */}
          <div className="bg-white dark:bg-darkbg-lighter rounded-xl shadow-soft dark:shadow-dark p-6">
            <h2 className="text-lg font-bold text-primary-dark dark:text-white mb-6">
              Top 5 Productos
            </h2>
            <div className="h-[300px]">
              {loading ? (
                <div className="w-full h-full bg-slate-200/40 dark:bg-darkbg/40 rounded-lg animate-pulse" />
              ) : metrics && metrics.topProducts.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={metrics.topProducts}
                    layout="vertical"
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
                    <XAxis
                      type="number"
                      tick={{ fontSize: 12 }}
                      tickFormatter={(value) => `${value}`} 
                      className="dark:text-gray-300"
                      stroke="#9ca3af"
                    />
                    <YAxis
                      type="category"
                      dataKey="name"
                      tick={{ fontSize: 12 }}
                      width={150}
                      className="dark:text-gray-300"
                      stroke="#9ca3af"
                    />
                    <Tooltip
                      cursor={{ fill: 'transparent' }}
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          return (
                            <div className="bg-white dark:bg-darkbg-lighter border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-3">
                              <p className="text-sm font-medium text-gray-900 dark:text-white mb-1">
                                {data.name}
                              </p>
                              <p className="text-sm text-gray-700 dark:text-gray-300">
                                <span className="font-medium">Ventas:</span> ${data.total.toFixed(2)}
                              </p>
                              <p className="text-sm text-gray-700 dark:text-gray-300">
                                <span className="font-medium">Unidades:</span> {data.quantity}
                              </p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Bar
                      dataKey="quantity" 
                      radius={[0, 8, 8, 0]}
                    >
                      {metrics.topProducts.map((_, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS[index % COLORS.length]}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-gray-400 dark:text-gray-500">
                  <p>No hay datos de productos en el rango seleccionado</p>
                </div>
              )}
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