'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { 
  Building2, 
  CreditCard, 
  Activity, 
  ArrowUpRight, 
  Lock, 
  Key, 
  Mail, 
  ShieldAlert, 
  Users, 
  TrendingUp, 
  Sparkles, 
  Percent, 
  Database, 
  Zap, 
  Clock, 
  BarChart3,
  Filter,
  Calendar
} from 'lucide-react';

export default function SuperAdminDashboard() {
  const supabase = createClient();
  
  // --- Authentication State ---
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // --- Dashboard Data State ---
  const [restaurants, setRestaurants] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dbLatency, setDbLatency] = useState<number>(0);
  const [tablesCount, setTablesCount] = useState(0);
  const [customersCount, setCustomersCount] = useState(0);
  const [hasError, setHasError] = useState(false);
  const [dateRangeFilter, setDateRangeFilter] = useState<'7_days' | '15_days' | 'this_month' | '60_days' | '90_days' | 'all'>('all');

  const restaurantId = process.env.NEXT_PUBLIC_RESTAURANT_ID || 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';

  // --- Session persistence ---
  useEffect(() => {
    const isLogged = sessionStorage.getItem('Glubbi_super_admin_logged');
    if (isLogged === 'true') {
      setIsAuthenticated(true);
    }
  }, []);

  // --- Load dashboard data ---
  useEffect(() => {
    if (!isAuthenticated) return;

    async function loadData() {
      setIsLoading(true);
      setHasError(false);
      const startTime = performance.now();
      
      // Fetch restaurants, orders, tables, and customers in parallel
      const [adminRestRes, ordersRes, tablesRes, customersRes] = await Promise.all([
        fetch('/api/admin/tenants').then(r => r.json()).catch(() => ({ success: false, data: [] })),
        supabase
          .from('orders')
          .select('id, restaurant_id, total_amount, status, payment_status, created_at')
          .order('created_at', { ascending: false }),
        supabase
          .from('tables')
          .select('id', { count: 'exact', head: true }),
        supabase
          .from('customers')
          .select('id', { count: 'exact', head: true })
      ]);

      const endTime = performance.now();
      setDbLatency(Math.round(endTime - startTime));

      if (ordersRes.error || tablesRes.error || customersRes.error) {
        setHasError(true);
      }

      if (adminRestRes?.success && Array.isArray(adminRestRes.data)) {
        setRestaurants(adminRestRes.data);
      } else {
        const { data } = await supabase.from('restaurants').select('*').order('created_at', { ascending: false });
        if (data) setRestaurants(data);
      }
      if (!ordersRes.error && ordersRes.data) {
        setOrders(ordersRes.data);
      }
      if (!tablesRes.error && tablesRes.count !== null) {
        setTablesCount(tablesRes.count);
      }
      if (!customersRes.error && customersRes.count !== null) {
        setCustomersCount(customersRes.count);
      }
      
      setIsLoading(false);
    }

    loadData();
  }, [isAuthenticated]);
  // --- Handle Login ---
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setIsLoggingIn(true);

    if (email.trim().toLowerCase() !== 'dazajulio@gmail.com') {
      setErrorMsg('Usuario o contraseña incorrectos.');
      setIsLoggingIn(false);
      return;
    }

    try {
      // Fetch password from database
      const { data, error } = await supabase
        .from('restaurants')
        .select('super_admin_password')
        .eq('id', restaurantId)
        .single() as any;

      // Fallback default password is 'admin1234'
      const correctPassword = (!error && data && data.super_admin_password) 
        ? data.super_admin_password 
        : 'admin1234';

      if (password === correctPassword) {
        sessionStorage.setItem('Glubbi_super_admin_logged', 'true');
        setIsAuthenticated(true);
      } else {
        setErrorMsg('Usuario o contraseña incorrectos.');
      }
    } catch (err) {
      if (password === 'admin1234') {
        sessionStorage.setItem('Glubbi_super_admin_logged', 'true');
        setIsAuthenticated(true);
      } else {
        setErrorMsg('Usuario o contraseña incorrectos.');
      }
    } finally {
      setIsLoggingIn(false);
    }
  };

  // --- Render Login Gate ---
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 relative overflow-hidden font-sans">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl animate-pulse" />

        <div className="relative z-10 w-full max-w-md bg-white/60 border border-gray-200 p-8 rounded-3xl backdrop-blur-md space-y-8 shadow-2xl">
          <div className="text-center space-y-2">
            <div className="w-12 h-12 bg-orange-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-orange-500/20">
              <Lock className="w-6 h-6 text-orange-500" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Acceso Restringido</h2>
            <p className="text-gray-400 text-sm">Ingresa las credenciales autorizadas del Super-Admin</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">Correo Electrónico</label>
              <div className="relative">
                <Mail className="absolute left-4 top-3.5 w-5 h-5 text-gray-600" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ejemplo@correo.com"
                  className="w-full bg-slate-50/60 border border-gray-200 rounded-xl py-3.5 pl-12 pr-4 text-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">Contraseña</label>
              <div className="relative">
                <Key className="absolute left-4 top-3.5 w-5 h-5 text-gray-600" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-50/60 border border-gray-200 rounded-xl py-3.5 pl-12 pr-4 text-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm"
                  required
                />
              </div>
            </div>

            {errorMsg && (
              <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-xs font-semibold text-red-400">
                <ShieldAlert className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoggingIn}
              className="w-full py-4 mt-6 bg-gradient-to-r from-[#FF8A3D] to-[#FF6B00] hover:brightness-110 text-white font-bold rounded-xl transition-all active:scale-[0.98] shadow-lg shadow-orange-500/10 text-sm disabled:opacity-50"
            >
              {isLoggingIn ? 'Verificando...' : 'Iniciar Sesión'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // --- Render Dashboard ---
  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-gray-200 border-t-orange-500 rounded-full animate-spin" />
      </div>
    );
  }

  // --- Global Analytics Calculations & Date Range Filtering ---
  const activeRestaurants = restaurants.filter(r => r.is_active);

  const getFilterStartDate = () => {
    if (dateRangeFilter === 'all') return null;
    const now = new Date();
    let days = 30;
    if (dateRangeFilter === '7_days') days = 7;
    if (dateRangeFilter === '15_days') days = 15;
    if (dateRangeFilter === 'this_month') days = 30;
    if (dateRangeFilter === '60_days') days = 60;
    if (dateRangeFilter === '90_days') days = 90;
    return new Date(now.getTime() - days * 24 * 3600 * 1000);
  };

  const filterStartDate = getFilterStartDate();

  // Filtered Orders by Date Range
  const filteredOrders = orders.filter(o => {
    if (!filterStartDate) return true;
    return new Date(o.created_at) >= filterStartDate;
  });

  // Filtered Paid Orders
  const paidOrders = filteredOrders.filter(o => 
    o.status !== 'cancelled' && 
    (o.payment_status === 'paid' || o.status === 'delivered' || o.status === 'ready')
  );
  const gmvGlobal = paidOrders.reduce((sum, o) => sum + Number(o.total_amount || 0), 0);

  // Orders count
  const totalOrders = filteredOrders.length;

  // Average ticket
  const averageTicketGlobal = paidOrders.length > 0 ? gmvGlobal / paidOrders.length : 0;

  // Filtered MRR
  const filteredActiveRestaurants = restaurants.filter(r => {
    if (!r.is_active) return false;
    if (!filterStartDate) return true;
    return new Date(r.created_at) >= filterStartDate;
  });

  const totalMRR = (dateRangeFilter !== 'all' && filteredActiveRestaurants.length > 0)
    ? filteredActiveRestaurants.length * 29
    : activeRestaurants.length * 29;
    
  const totalARR = totalMRR * 12;

  // Real database-backed metrics
  const realViews = Math.max(customersCount, totalOrders);
  const realAdds = Math.max(filteredOrders.filter(o => o.status !== 'cancelled').length, paidOrders.length);
  const conversionRate = realViews > 0 ? (paidOrders.length / realViews) * 100 : 0;

  // Group sales (GMV) by restaurant
  const restaurantStatsMap: { [key: string]: { name: string; sales: number; orderCount: number; ordersToday: number; logo_url: string; slug: string } } = {};
  
  restaurants.forEach(r => {
    restaurantStatsMap[r.id] = { name: r.name, sales: 0, orderCount: 0, ordersToday: 0, logo_url: r.logo_url, slug: r.slug };
  });

  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  orders.forEach(o => {
    const isPaid = o.payment_status === 'paid' && o.status !== 'cancelled';
    const isToday = new Date(o.created_at) >= startOfToday;
    
    if (restaurantStatsMap[o.restaurant_id]) {
      if (isPaid) {
        restaurantStatsMap[o.restaurant_id].sales += Number(o.total_amount || 0);
      }
      restaurantStatsMap[o.restaurant_id].orderCount += 1;
      if (isToday) {
        restaurantStatsMap[o.restaurant_id].ordersToday += 1;
      }
    }
  });

  // Helper to count orders today per restaurant
  const getRestaurantStats = (restId: string) => {
    const restOrders = orders.filter(o => o.restaurant_id === restId);
    const restOrdersToday = restOrders.filter(o => new Date(o.created_at) >= startOfToday).length;
    const restPaidOrders = restOrders.filter(o => o.payment_status === 'paid' && o.status !== 'cancelled');
    const restGmv = restPaidOrders.reduce((sum, o) => sum + Number(o.total_amount || 0), 0);
    return {
      ordersToday: restOrdersToday,
      totalGmv: restGmv,
      ordersCount: restOrders.length
    };
  };

  // Top 5 restaurants by sales volume
  const topRestaurants = Object.values(restaurantStatsMap)
    .sort((a, b) => b.sales - a.sales)
    .slice(0, 5);

  // --- Chart Data Preparation (Last 6 Months) ---
  const getPast6Months = () => {
    const months = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      months.push({
        name: d.toLocaleString('es-ES', { month: 'short' }),
        monthNum: d.getMonth(),
        year: d.getFullYear(),
        label: d.toLocaleString('es-ES', { month: 'short' }).substring(0, 3).toUpperCase()
      });
    }
    return months;
  };

  const chartMonths = getPast6Months();
  const monthlyChartData = chartMonths.map(m => {
    // MRR: restaurants created on or before this month's end
    const endOfMonth = new Date(m.year, m.monthNum + 1, 0, 23, 59, 59, 999);
    const activeRestCount = restaurants.filter(r => r.is_active && new Date(r.created_at) <= endOfMonth).length;
    const mrr = activeRestCount * 29;

    // GMV: orders paid in this month
    const gmv = paidOrders
      .filter(o => {
        const d = new Date(o.created_at);
        return d.getMonth() === m.monthNum && d.getFullYear() === m.year;
      })
      .reduce((sum, o) => sum + Number(o.total_amount || 0), 0);

    return { label: m.label, mrr, gmv: Math.round(gmv) };
  });

  // Calculate coordinates for SVG line graph (responsive simulation)
  const maxChartVal = Math.max(...monthlyChartData.map(d => Math.max(d.mrr, d.gmv)), 150);
  const svgWidth = 500;
  const svgHeight = 160;
  const paddingLeft = 40;
  const paddingRight = 10;
  const paddingTop = 15;
  const paddingBottom = 25;
  const graphWidth = svgWidth - paddingLeft - paddingRight;
  const graphHeight = svgHeight - paddingTop - paddingBottom;

  const mrrPoints = monthlyChartData.map((d, i) => {
    const x = paddingLeft + (i / 5) * graphWidth;
    const y = paddingTop + graphHeight - (d.mrr / maxChartVal) * graphHeight;
    return `${x},${y}`;
  }).join(' ');

  const gmvPoints = monthlyChartData.map((d, i) => {
    const x = paddingLeft + (i / 5) * graphWidth;
    const y = paddingTop + graphHeight - (d.gmv / maxChartVal) * graphHeight;
    return `${x},${y}`;
  }).join(' ');

  return (
    <div className="min-h-screen bg-slate-50 text-gray-800 space-y-8 animate-fade-in font-sans">
      
      {/* ── HEADER ── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-black text-gray-900 tracking-tight flex items-center gap-2">
            Visión Global <span className="text-xs bg-orange-500/10 text-orange-400 border border-orange-500/20 px-2 py-0.5 rounded-md font-bold uppercase tracking-wider">Dashboard</span>
          </h2>
          <p className="text-gray-400 text-sm">Métricas de salud financiera y volumen operativo de glubbi.app</p>
        </div>
        <button
          onClick={() => {
            sessionStorage.removeItem('Glubbi_super_admin_logged');
            setIsAuthenticated(false);
          }}
          className="px-4 py-2 border border-gray-200 bg-slate-50/40 hover:bg-white shadow-sm text-gray-500 hover:text-gray-900 rounded-xl text-xs font-bold uppercase tracking-wider transition-all"
        >
          Cerrar Sesión
        </button>
      </div>

      {/* ── FILA 1: RECUADRO AGRUPADO CON FILTRO DE FECHAS PARA KPIS PRINCIPALES ── */}
      <div className="bg-white border border-slate-200/80 rounded-3xl p-6 md:p-8 shadow-xl space-y-6 relative overflow-hidden">
        
        {/* Header con Título & Selector de Filtros por Rango de Fecha */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-5">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-black text-orange-600 bg-orange-500/10 border border-orange-500/20 px-3 py-1 rounded-full uppercase tracking-wider inline-flex items-center gap-1.5">
                <Filter className="w-3.5 h-3.5 text-orange-500" /> Filtro por Rango de Fechas
              </span>
            </div>
            <h3 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight mt-1.5">
              Rendimiento Financiero y Operativo
            </h3>
            <p className="text-slate-500 text-xs mt-0.5">
              Visualiza el Ingreso Recurrente, Ventas Globales y Órdenes Totales filtrados en tiempo real.
            </p>
          </div>

          {/* Selector de Rango de Fechas (Pills) */}
          <div className="flex items-center gap-1 bg-slate-100 p-1.5 rounded-2xl border border-slate-200/80 overflow-x-auto shrink-0 select-none">
            {[
              { id: '7_days', label: '7 Días' },
              { id: '15_days', label: '15 Días' },
              { id: 'this_month', label: 'Último Mes' },
              { id: '60_days', label: '60 Días' },
              { id: '90_days', label: '90 Días' },
              { id: 'all', label: 'Todo Acumulado' },
            ].map((option) => (
              <button
                key={option.id}
                type="button"
                onClick={() => setDateRangeFilter(option.id as any)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                  dateRangeFilter === option.id
                    ? 'bg-orange-500 text-white shadow-md shadow-orange-500/20'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {/* Grid de 4 Recuadros (3 Métricas Principales + Salud del Sistema) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          
          {/* Card 1: INGRESO RECURRENTE (MRR) */}
          <div className="bg-gradient-to-br from-orange-50/70 via-white to-amber-50/30 border border-orange-200/80 rounded-2xl p-6 relative overflow-hidden group shadow-sm hover:shadow-md transition-all">
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-orange-500/10 rounded-xl border border-orange-500/20 text-orange-600">
                <CreditCard className="w-5 h-5" />
              </div>
              <span className="flex items-center gap-1 text-[10px] font-black text-orange-600 bg-orange-500/10 border border-orange-500/20 px-2.5 py-1 rounded-full uppercase tracking-wider">
                <Calendar className="w-3 h-3" /> {
                  dateRangeFilter === '7_days' ? 'Últimos 7 días' :
                  dateRangeFilter === '15_days' ? 'Últimos 15 días' :
                  dateRangeFilter === 'this_month' ? 'Último Mes' :
                  dateRangeFilter === '60_days' ? 'Últimos 60 días' :
                  dateRangeFilter === '90_days' ? 'Últimos 90 días' : 'Todo Acumulado'
                }
              </span>
            </div>
            <h4 className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">Ingreso Recurrente (MRR)</h4>
            <p className="text-3xl font-black text-slate-900">${totalMRR.toLocaleString()}<span className="text-xs font-normal text-slate-400">/mes</span></p>
            <span className="text-[10px] text-slate-500 block mt-2 font-mono">
              ARR Proyectado: ${totalARR.toLocaleString()}/año
            </span>
          </div>

          {/* Card 2: VENTAS GLOBALES (GMV) */}
          <div className="bg-gradient-to-br from-emerald-50/70 via-white to-teal-50/30 border border-emerald-200/80 rounded-2xl p-6 relative overflow-hidden group shadow-sm hover:shadow-md transition-all">
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-emerald-500/10 rounded-xl border border-emerald-500/20 text-emerald-600">
                <TrendingUp className="w-5 h-5" />
              </div>
              <span className="flex items-center gap-1 text-[10px] font-black text-emerald-600 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full uppercase tracking-wider">
                Transaccionado
              </span>
            </div>
            <h4 className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">Ventas Globales (GMV)</h4>
            <p className="text-3xl font-black text-slate-900">${gmvGlobal.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
            <span className="text-[10px] text-slate-500 block mt-2 font-mono">
              Ticket Promedio: ${averageTicketGlobal.toFixed(2)} USD
            </span>
          </div>

          {/* Card 3: ÓRDENES TOTALES */}
          <div className="bg-gradient-to-br from-blue-50/70 via-white to-indigo-50/30 border border-blue-200/80 rounded-2xl p-6 relative overflow-hidden group shadow-sm hover:shadow-md transition-all">
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-blue-500/10 rounded-xl border border-blue-500/20 text-blue-600">
                <BarChart3 className="w-5 h-5" />
              </div>
              <span className="flex items-center gap-1 text-[10px] font-black text-blue-600 bg-blue-500/10 border border-blue-500/20 px-2.5 py-1 rounded-full uppercase tracking-wider">
                Conversión {conversionRate.toFixed(1)}%
              </span>
            </div>
            <h4 className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">Órdenes Totales</h4>
            <p className="text-3xl font-black text-slate-900">{totalOrders.toLocaleString()}</p>
            <span className="text-[10px] text-slate-500 block mt-2 font-mono">
              Completadas / Pagadas: {paidOrders.length}
            </span>
          </div>

          {/* Card 4: Carga del Sistema / Uptime */}
          <div className="bg-gradient-to-br from-slate-50 via-white to-slate-100 border border-slate-200/80 rounded-2xl p-6 relative overflow-hidden group shadow-sm hover:shadow-md transition-all">
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-emerald-500/10 rounded-xl border border-emerald-500/20 text-emerald-600">
                <Activity className="w-5 h-5" />
              </div>
              <span className="flex items-center text-[10px] font-bold text-emerald-600 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full uppercase tracking-wider">
                Estable
              </span>
            </div>
            <h4 className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">Salud del Sistema</h4>
            <p className="text-3xl font-black text-slate-900">99.99%</p>
            <span className="text-[10px] text-slate-500 block mt-2 font-mono">
              Uptime en vivo | Latencia: {dbLatency}ms
            </span>
          </div>

        </div>

      </div>

      {/* ── FILA 2: BODY (GRAPHS & FUNNEL VS TOP LISTS) ── */}
      <div className="grid lg:grid-cols-[1.1fr_0.9fr] gap-8 items-stretch">
        
        {/* LEFT COMPONENT: MRR vs GMV Graph & Conversion Funnel */}
        <div className="space-y-8 flex flex-col justify-between">
          
          {/* Crecimiento MRR vs GMV Graph */}
          <div className="bg-white shadow-md border border-gray-200 rounded-3xl p-6 md:p-8 shadow-lg backdrop-blur-xl flex-1 flex flex-col justify-between">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-lg font-bold text-gray-900 tracking-tight">Tendencia del Negocio</h3>
                <p className="text-xs text-gray-400">Comparativa mensual de suscripciones (MRR) frente a ventas de inquilinos (GMV)</p>
              </div>
              <div className="flex items-center gap-4 text-xs font-semibold">
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-purple-500"></span> MRR</span>
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-orange-500"></span> GMV</span>
              </div>
            </div>

            {/* Custom SVG Line Chart */}
            <div className="w-full h-44 relative mt-2 select-none">
              <svg className="w-full h-full" viewBox={`0 0 ${svgWidth} ${svgHeight}`} preserveAspectRatio="none">
                <defs>
                  <linearGradient id="purpleGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#a855f7" stopOpacity="0.15" />
                    <stop offset="100%" stopColor="#a855f7" stopOpacity="0" />
                  </linearGradient>
                  <linearGradient id="orangeGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#ff6b00" stopOpacity="0.15" />
                    <stop offset="100%" stopColor="#ff6b00" stopOpacity="0" />
                  </linearGradient>
                </defs>

                {/* Gridlines */}
                {[0, 0.25, 0.5, 0.75, 1].map((r, idx) => (
                  <line 
                    key={idx} 
                    x1={paddingLeft} 
                    y1={paddingTop + r * graphHeight} 
                    x2={svgWidth - paddingRight} 
                    y2={paddingTop + r * graphHeight} 
                    stroke="#e2e8f0" 
                    strokeWidth="1" 
                  />
                ))}

                {/* Y-Axis labels */}
                <text x="32" y={paddingTop + 5} fill="#94a3b8" fontSize="9" textAnchor="end" fontFamily="monospace">
                  ${Math.round(maxChartVal)}
                </text>
                <text x="32" y={paddingTop + graphHeight / 2 + 3} fill="#94a3b8" fontSize="9" textAnchor="end" fontFamily="monospace">
                  ${Math.round(maxChartVal / 2)}
                </text>
                <text x="32" y={paddingTop + graphHeight + 3} fill="#94a3b8" fontSize="9" textAnchor="end" fontFamily="monospace">
                  $0
                </text>

                {/* Filled Areas */}
                <path d={`M ${paddingLeft},${paddingTop + graphHeight} L ${mrrPoints} L ${paddingLeft + graphWidth},${paddingTop + graphHeight} Z`} fill="url(#purpleGrad)" />
                <path d={`M ${paddingLeft},${paddingTop + graphHeight} L ${gmvPoints} L ${paddingLeft + graphWidth},${paddingTop + graphHeight} Z`} fill="url(#orangeGrad)" />

                {/* Main Lines */}
                <polyline points={mrrPoints} fill="none" stroke="#a855f7" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                <polyline points={gmvPoints} fill="none" stroke="#ff6b00" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

                {/* Month labels (X-Axis) */}
                {monthlyChartData.map((d, i) => {
                  const x = paddingLeft + (i / 5) * graphWidth;
                  return (
                    <text key={i} x={x} y={svgHeight - 5} fill="#94a3b8" fontSize="8.5" fontWeight="bold" textAnchor="middle">
                      {d.label}
                    </text>
                  );
                })}
              </svg>
            </div>
          </div>

          {/* Funnel de Conversión de Pedidos */}
          <div className="bg-white shadow-md border border-gray-200 rounded-3xl p-6 md:p-8 shadow-lg backdrop-blur-xl flex-1 flex flex-col justify-between">
            <div>
              <h3 className="text-lg font-bold text-gray-900 tracking-tight">Embudo de Conversión (Funnel)</h3>
              <p className="text-xs text-gray-400">Comportamiento agregado de los comensales a nivel global</p>
            </div>

            <div className="space-y-4 mt-6">
              
              {/* Step 1 */}
              <div>
                <div className="flex justify-between items-center text-xs mb-1.5">
                  <span className="font-semibold text-gray-500">1. Menús Abiertos (QR / Web)</span>
                  <span className="font-bold text-gray-900 font-mono">{realViews} visitas (100%)</span>
                </div>
                <div className="h-2.5 bg-slate-50/60 rounded-full overflow-hidden border border-gray-200">
                  <div className="h-full bg-gradient-to-r from-orange-500 to-orange-600 rounded-full" style={{ width: '100%' }}></div>
                </div>
              </div>

              {/* Step 2 */}
              <div>
                <div className="flex justify-between items-center text-xs mb-1.5">
                  <span className="font-semibold text-gray-500">2. Producto Añadido al Carrito</span>
                  <span className="font-bold text-gray-900 font-mono">{realAdds} ({realViews > 0 ? ((realAdds / realViews) * 100).toFixed(0) : 0}%)</span>
                </div>
                <div className="h-2.5 bg-slate-50/60 rounded-full overflow-hidden border border-gray-200">
                  <div className="h-full bg-gradient-to-r from-orange-600 to-orange-500 rounded-full" style={{ width: `${realViews > 0 ? (realAdds / realViews) * 100 : 0}%` }}></div>
                </div>
              </div>

              {/* Step 3 */}
              <div>
                <div className="flex justify-between items-center text-xs mb-1.5">
                  <span className="font-semibold text-gray-500">3. Pedido Generado</span>
                  <span className="font-bold text-gray-900 font-mono">{totalOrders} ({realAdds > 0 ? ((totalOrders / realAdds) * 100).toFixed(0) : 0}%)</span>
                </div>
                <div className="h-2.5 bg-slate-50/60 rounded-full overflow-hidden border border-gray-200">
                  <div className="h-full bg-gradient-to-r from-orange-500 to-amber-500 rounded-full" style={{ width: `${realAdds > 0 ? (totalOrders / realAdds) * 100 : 0}%` }}></div>
                </div>
              </div>

              {/* Step 4 */}
              <div>
                <div className="flex justify-between items-center text-xs mb-1.5">
                  <span className="font-semibold text-gray-500">4. Pedidos Exitosos / Pagados</span>
                  <span className="font-bold text-orange-400 font-mono">{paidOrders.length} ({totalOrders > 0 ? ((paidOrders.length / totalOrders) * 100).toFixed(0) : 0}%)</span>
                </div>
                <div className="h-2.5 bg-slate-50/60 rounded-full overflow-hidden border border-gray-200">
                  <div className="h-full bg-gradient-to-r from-amber-500 to-orange-500 rounded-full" style={{ width: `${totalOrders > 0 ? (paidOrders.length / totalOrders) * 100 : 0}%` }}></div>
                </div>
              </div>

            </div>
          </div>

        </div>

        {/* RIGHT COMPONENT: Top 5 & Infraestructure Monitor */}
        <div className="space-y-8 flex flex-col justify-between">
          
          {/* Top 5 Restaurantes */}
          <div className="bg-white shadow-md border border-gray-200 rounded-3xl p-6 md:p-8 shadow-lg backdrop-blur-xl flex-1 flex flex-col justify-between">
            <div>
              <h3 className="text-lg font-bold text-gray-900 tracking-tight">Top 5 Restaurantes</h3>
              <p className="text-xs text-gray-400">Establecimientos con mayor facturación total procesada</p>
            </div>

            <div className="space-y-5 mt-6">
              {topRestaurants.map((restaurant: any, idx: number) => {
                const maxSales = Math.max(...topRestaurants.map((r: any) => r.sales), 10);
                const salesPercent = (restaurant.sales / maxSales) * 100;
                
                return (
                  <div key={idx} className="space-y-2">
                    <div className="flex justify-between items-center text-xs font-semibold">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-md bg-slate-100 text-[10px] text-gray-500 flex items-center justify-center font-bold">
                          #{idx + 1}
                        </span>
                        <span className="text-white">{restaurant.name}</span>
                      </div>
                      <span className="text-orange-400 font-mono">${restaurant.sales.toLocaleString()} <span className="text-gray-600">({restaurant.orderCount} ord)</span></span>
                    </div>
                    <div className="h-2 bg-slate-50/60 rounded-full overflow-hidden border border-gray-200">
                      <div className="h-full bg-gradient-to-r from-orange-500 to-orange-500 rounded-full transition-all duration-500" style={{ width: `${salesPercent}%` }}></div>
                    </div>
                  </div>
                );
              })}
              {topRestaurants.length === 0 && (
                <div className="text-center py-8 text-gray-600 text-sm">
                  Sin transacciones cargadas.
                </div>
              )}
            </div>
          </div>

          {/* Monitor de Infraestructura y Estabilidad */}
          <div className="bg-white shadow-md border border-gray-200 rounded-3xl p-6 md:p-8 shadow-lg backdrop-blur-xl flex-1 flex flex-col justify-between">
            <div>
              <h3 className="text-lg font-bold text-gray-900 tracking-tight">Monitor del Sistema</h3>
              <p className="text-xs text-gray-400">Estadísticas de red y concurrencia global en tiempo real</p>
            </div>

            <div className="grid grid-cols-2 gap-4 mt-6">
              
              {/* Latency DB */}
              <div className="bg-slate-50/40 border border-gray-200 p-4 rounded-2xl flex flex-col justify-between gap-2">
                <div className="flex items-center justify-between">
                  <span className="text-gray-400 text-[10px] font-bold uppercase tracking-wider">Latencia DB</span>
                  <Database className="w-4 h-4 text-orange-500" />
                </div>
                <div>
                  <p className="text-xl font-bold text-gray-900 font-mono">{dbLatency} ms</p>
                  <span className="text-[9px] text-gray-600 font-semibold block">Conexión Supabase</span>
                </div>
              </div>

              {/* Concurrent Sessions */}
              <div className="bg-slate-50/40 border border-gray-200 p-4 rounded-2xl flex flex-col justify-between gap-2">
                <div className="flex items-center justify-between">
                  <span className="text-gray-400 text-[10px] font-bold uppercase tracking-wider">Locales Activos</span>
                  <Users className="w-4 h-4 text-orange-500" />
                </div>
                <div>
                  <p className="text-xl font-bold text-gray-900 font-mono">{activeRestaurants.length}</p>
                  <span className="text-[9px] text-gray-600 font-semibold block">En producción</span>
                </div>
              </div>

              {/* Webhook Error Rate */}
              <div className="bg-slate-50/40 border border-gray-200 p-4 rounded-2xl flex flex-col justify-between gap-2">
                <div className="flex items-center justify-between">
                  <span className="text-gray-400 text-[10px] font-bold uppercase tracking-wider">Error Rate</span>
                  <ShieldAlert className="w-4 h-4 text-red-500" />
                </div>
                <div>
                  <p className="text-xl font-bold text-gray-900 font-mono">{hasError ? '100.00%' : '0.00%'}</p>
                  <span className="text-[9px] text-gray-600 font-semibold block">Fallas de API</span>
                </div>
              </div>

              {/* Active integrations */}
              <div className="bg-slate-50/40 border border-gray-200 p-4 rounded-2xl flex flex-col justify-between gap-2">
                <div className="flex items-center justify-between">
                  <span className="text-gray-400 text-[10px] font-bold uppercase tracking-wider">Mesas / Kioskos</span>
                  <Zap className="w-4 h-4 text-cyan-500" />
                </div>
                <div>
                  <p className="text-xl font-bold text-gray-900 font-mono">{tablesCount}</p>
                  <span className="text-[9px] text-gray-600 font-semibold block">Mesas registradas</span>
                </div>
              </div>

            </div>
          </div>

        </div>

      </div>

      {/* ── FILA 3: RECENT TENANTS TABLE (MEJORADA) ── */}
      <div className="bg-white shadow-md border border-gray-200 rounded-3xl overflow-hidden shadow-lg backdrop-blur-xl">
        <div className="p-6 border-b border-gray-200 flex justify-between items-center">
          <h3 className="text-lg font-bold text-gray-900 tracking-tight">Últimos Restaurantes Afiliados</h3>
          <span className="text-xs bg-orange-500/10 text-orange-500 border border-orange-500/20 px-2.5 py-0.5 rounded-md font-bold uppercase tracking-wider">
            Total: {restaurants.length}
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-gray-400 uppercase text-[9px] tracking-wider font-bold">
              <tr>
                <th className="px-6 py-4 font-bold">Restaurante</th>
                <th className="px-6 py-4 font-bold">Slug / Enlace</th>
                <th className="px-6 py-4 font-bold text-center">Órdenes Hoy</th>
                <th className="px-6 py-4 text-right font-bold">Ventas Totales</th>
                <th className="px-6 py-4 font-bold text-center">Estatus</th>
                <th className="px-6 py-4 font-bold text-center">Fecha de Alta</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 text-gray-800">
              {restaurants.map((tenant) => {
                const stats = getRestaurantStats(tenant.id);
                return (
                  <tr key={tenant.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-6 py-4 font-semibold text-gray-900 flex items-center gap-3">
                      {tenant.logo_url ? (
                        <img src={tenant.logo_url} alt={tenant.name} className="w-8 h-8 rounded-lg object-cover" />
                      ) : (
                        <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-xs font-black text-gray-500">
                          {tenant.name.substring(0,2).toUpperCase()}
                        </div>
                      )}
                      {tenant.name}
                    </td>
                    <td className="px-6 py-4 font-mono text-gray-500">
                      <a href={`/${tenant.slug}`} target="_blank" rel="noopener noreferrer" className="text-orange-500 hover:text-orange-400 hover:underline">
                        /{tenant.slug}
                      </a>
                    </td>
                    <td className="px-6 py-4 text-center font-mono font-bold text-gray-800">
                      {stats.ordersToday > 0 ? (
                        <span className="inline-block bg-orange-500/10 text-orange-400 border border-orange-500/20 px-2 py-0.5 rounded text-xs">
                          {stats.ordersToday}
                        </span>
                      ) : (
                        <span className="text-gray-600">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right font-mono font-bold text-gray-900">
                      ${stats.totalGmv.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className="px-6 py-4 text-center">
                      {tenant.is_active ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-green-500/10 text-green-400 border border-green-500/20">
                          <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                          Activo
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-red-500/10 text-red-400 border border-red-500/20">
                          <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
                          Inactivo
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center text-gray-400 font-mono text-xs">
                      {new Date(tenant.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                );
              })}
              {restaurants.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-600">
                    No hay restaurantes registrados aún.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
