'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { PinAuthModal } from '@/components/shared/PinAuthModal';
import { BarChart3, Building2, Save, Lock, TrendingUp, Users, Package, DollarSign, Calendar, Truck, Percent } from 'lucide-react';
import { formatPrice } from '@/lib/utils';
import type { Product, OrderWithItems, Customer } from '@/types/database';

interface PaymentMethodItem {
  id: string;
  title: string;
  details: string;
  logoUrl: string;
}

export default function SettingsAdminPage() {
  const router = useRouter();
  const pathname = usePathname();
  // Extract slug from URL: /[slug]/gerente/settings
  const slugFromUrl = pathname?.split('/')?.[1] || '';
  const supabase = createClient();

  // --- Settings State ---
  const [restaurant, setRestaurant] = useState<any>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [upsell1, setUpsell1] = useState('');
  const [upsell2, setUpsell2] = useState('');

  // --- Editable Business Data ---
  const [name, setName] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [coverImageUrl, setCoverImageUrl] = useState('');
  const [uploadMode, setUploadMode] = useState<'url' | 'file'>('url');
  const [coverUploadMode, setCoverUploadMode] = useState<'url' | 'file'>('url');
  const [taxId, setTaxId] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [glubbiType, setGlubbiType] = useState('Restaurantes');
  const [glubbiCategory, setGlubbiCategory] = useState('');
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethodItem[]>([]);
  const [discountPercentage, setDiscountPercentage] = useState(0);
  const [hasFreeDelivery, setHasFreeDelivery] = useState(false);
  const [whatsappNumber, setWhatsappNumber] = useState('');

  // --- Admin Password State ---
  const [newAdminPassword, setNewAdminPassword] = useState('');
  const [confirmAdminPassword, setConfirmAdminPassword] = useState('');
  const [isSavingPassword, setIsSavingPassword] = useState(false);
  
  // --- Reports State ---
  const [orders, setOrders] = useState<OrderWithItems[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);

  const [restaurantId, setRestaurantId] = useState('');

  useEffect(() => {
    // Prefer loading by slug from URL for reliability
    if (slugFromUrl) {
      supabase
        .from('restaurants')
        .select('id')
        .eq('slug', slugFromUrl)
        .single()
        .then(({ data }) => {
          if (data?.id) {
            setRestaurantId(data.id);
            localStorage.setItem('active_restaurant_id', data.id);
          }
        });
    } else {
      setRestaurantId(localStorage.getItem('active_restaurant_id') || process.env.NEXT_PUBLIC_RESTAURANT_ID || '');
    }
  }, [slugFromUrl]);

  // --- Load Data ---
  useEffect(() => {
    if (!restaurantId) return;

    async function loadAll() {
      setIsLoading(true);
      
      // Restaurant settings
      const { data: restData } = await supabase
        .from('restaurants')
        .select('*')
        .eq('id', restaurantId)
        .single();
        
      if (restData) {
        setRestaurant(restData);
        setUpsell1(restData.upsell_item_1_id || '');
        setUpsell2(restData.upsell_item_2_id || '');
        setName(restData.name || '');
        setLogoUrl(restData.logo_url || '');
        setCoverImageUrl(restData.cover_image_url || '');
        setTaxId(restData.tax_id || '');
        setPhone(restData.phone || '');
        setAddress(restData.address || '');
        setGlubbiType(restData.glubbi_type || 'Restaurantes');
        setGlubbiCategory(restData.glubbi_category || '');
        if (restData.payment_methods) {
          try {
            // Supabase JSON returns as any, we cast or parse it
            setPaymentMethods(restData.payment_methods as any || []);
          } catch (e) {
            console.error('Error parsing payment methods', e);
          }
        }
        setDiscountPercentage(restData.discount_percentage || 0);
        setHasFreeDelivery(restData.has_free_delivery || false);
        setWhatsappNumber(restData.whatsapp_number || '');
      }
      
      // Products for upsell selection
      const { data: prodData } = await supabase
        .from('products')
        .select('*')
        .eq('restaurant_id', restaurantId)
        .eq('is_available', true);
        
      if (prodData) {
        setProducts(prodData as Product[]);
      }

      // Orders for reports
      const { data: ordersData } = await supabase
        .from('orders')
        .select(`*, order_items (*)`)
        .eq('status', 'delivered');
        
      const { data: customersData } = await supabase
        .from('customers')
        .select('*');

      if (ordersData) setOrders(ordersData as OrderWithItems[]);
      if (customersData) setCustomers(customersData as Customer[]);
      
      setIsLoading(false);
    }
    
    loadAll();
  }, [restaurantId]);

  const saveSettings = async () => {
    setIsSaving(true);
    
    await supabase
      .from('restaurants')
      .update({
        upsell_item_1_id: upsell1 || null,
        upsell_item_2_id: upsell2 || null,
        name,
        logo_url: logoUrl,
        cover_image_url: coverImageUrl,
        tax_id: taxId,
        phone,
        address,
        glubbi_type: glubbiType,
        glubbi_category: glubbiCategory,
        payment_methods: paymentMethods,
        discount_percentage: discountPercentage,
        has_free_delivery: hasFreeDelivery,
        whatsapp_number: whatsappNumber
      } as any)
      .eq('id', restaurantId);
      
    setIsSaving(false);
    alert('Configuración guardada correctamente.');
  };

  const addPaymentMethod = () => {
    const newMethod: PaymentMethodItem = {
      id: crypto.randomUUID(),
      title: 'Nuevo Método',
      details: '',
      logoUrl: ''
    };
    setPaymentMethods([...paymentMethods, newMethod]);
  };

  const updatePaymentMethod = (id: string, field: keyof PaymentMethodItem, value: string) => {
    setPaymentMethods(paymentMethods.map(pm => pm.id === id ? { ...pm, [field]: value } : pm));
  };

  const removePaymentMethod = (id: string) => {
    setPaymentMethods(paymentMethods.filter(pm => pm.id !== id));
  };

  const changeAdminPassword = async () => {
    if (newAdminPassword.length < 4) {
      alert('La contraseña debe tener al menos 4 caracteres.');
      return;
    }
    if (newAdminPassword !== confirmAdminPassword) {
      alert('Las contraseñas no coinciden.');
      return;
    }
    
    setIsSavingPassword(true);
    let { error } = await supabase
      .from('restaurants')
      .update({
        admin_pin: newAdminPassword,
        super_admin_password: newAdminPassword
      } as any)
      .eq('id', restaurantId);
      
    if (error && error.message && error.message.includes('admin_pin')) {
      console.warn('admin_pin column not found in schema. Falling back to super_admin_password only...');
      const fallback = await supabase
        .from('restaurants')
        .update({
          super_admin_password: newAdminPassword
        } as any)
        .eq('id', restaurantId);
      error = fallback.error;
    }

    setIsSavingPassword(false);
    if (error) {
      alert('Error al actualizar la contraseña: ' + error.message);
    } else {
      alert('Contraseña de Administrador actualizada correctamente.');
      setNewAdminPassword('');
      setConfirmAdminPassword('');
    }
  };

  // --- PIN Auth Removed ---

  if (isLoading) {
    return <div className="p-12 flex justify-center"><div className="w-8 h-8 border-4 border-gray-200 border-t-orange-500 rounded-full animate-spin"/></div>;
  }

  // --- Reports Calculations ---
  const now = new Date();
  
  let todaySales = 0;
  let weekSales = 0;
  let monthSales = 0;

  orders.forEach(order => {
    if (order.payment_status !== 'paid') return;
    const orderDate = new Date(order.created_at);
    const amount = Number(order.total_amount) || 0;
    
    if (orderDate.toDateString() === now.toDateString()) {
      todaySales += amount;
    }
    
    const diffDays = (now.getTime() - orderDate.getTime()) / (1000 * 3600 * 24);
    if (diffDays <= 7) {
      weekSales += amount;
    }
    
    if (orderDate.getMonth() === now.getMonth() && orderDate.getFullYear() === now.getFullYear()) {
      monthSales += amount;
    }
  });

  // Best selling products
  const productSales: Record<string, { name: string, qty: number, revenue: number }> = {};
  orders.forEach(order => {
    if (order.payment_status !== 'paid') return;
    order.order_items.forEach(item => {
      if (!productSales[item.product_id]) {
        productSales[item.product_id] = { name: item.product_name, qty: 0, revenue: 0 };
      }
      productSales[item.product_id].qty += item.quantity;
      productSales[item.product_id].revenue += Number(item.subtotal);
    });
  });
  const topProducts = Object.values(productSales).sort((a, b) => b.qty - a.qty).slice(0, 5);

  // Best customers
  const customerSales: Record<string, { name: string, totalSpent: number, ordersCount: number }> = {};
  orders.forEach(order => {
    if (order.payment_status !== 'paid' || !order.customer_id) return;
    const cid = order.customer_id;
    if (!customerSales[cid]) {
      const c = customers.find(x => x.id === cid);
      customerSales[cid] = { name: c ? c.name : 'Desconocido', totalSpent: 0, ordersCount: 0 };
    }
    customerSales[cid].totalSpent += Number(order.total_amount);
    customerSales[cid].ordersCount += 1;
  });
  const topCustomers = Object.values(customerSales).sort((a, b) => b.totalSpent - a.totalSpent).slice(0, 5);

  return (
    <div className="p-6 md:p-12 max-w-7xl mx-auto space-y-12 animate-fade-in">
      {/* Page Header */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <BarChart3 className="w-8 h-8 text-orange-500" />
          <h1 className="text-3xl font-bold text-gray-900">Administrador</h1>
        </div>
        <p className="text-gray-500 text-lg">Reportes financieros, configuración del negocio y opciones del Kiosco.</p>
      </div>

      {/* ============================================================ */}
      {/* SECTION 1: REPORTES FINANCIEROS (Previously the Reports page) */}
      {/* ============================================================ */}
      <section>
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-2xl bg-orange-500/20 text-orange-500 flex items-center justify-center">
            <TrendingUp className="w-5 h-5" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900">Reportes Financieros</h2>
        </div>

        {/* Top KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-amber-500/[0.08] border border-amber-500/20 rounded-3xl p-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-6 opacity-10 text-orange-500"><DollarSign className="w-24 h-24" /></div>
            <p className="text-amber-800  font-bold flex items-center gap-2 mb-2"><Calendar className="w-4 h-4"/> Ventas Hoy</p>
            <h2 className="text-4xl font-extrabold text-amber-950 ">{formatPrice(todaySales, 'USD')}</h2>
          </div>
          <div className="bg-blue-500/[0.08] border border-blue-500/20 rounded-3xl p-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-6 opacity-10 text-blue-500"><TrendingUp className="w-24 h-24" /></div>
            <p className="text-blue-800  font-bold flex items-center gap-2 mb-2"><Calendar className="w-4 h-4"/> Ventas Semana</p>
            <h2 className="text-4xl font-extrabold text-blue-950 ">{formatPrice(weekSales, 'USD')}</h2>
          </div>
          <div className="bg-emerald-500/[0.08] border border-emerald-500/20 rounded-3xl p-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-6 opacity-10 text-emerald-500"><TrendingUp className="w-24 h-24" /></div>
            <p className="text-emerald-800  font-bold flex items-center gap-2 mb-2"><Calendar className="w-4 h-4"/> Ventas Mes</p>
            <h2 className="text-4xl font-extrabold text-emerald-950 ">{formatPrice(monthSales, 'USD')}</h2>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Products */}
          <div className="bg-white shadow-sm border border-gray-200 rounded-3xl p-6">
            <div className="flex items-center gap-3 mb-6">
              <Package className="w-5 h-5 text-orange-500" />
              <h3 className="text-lg font-bold text-white">Productos más vendidos</h3>
            </div>
            <div className="space-y-4">
              {topProducts.length === 0 && <p className="text-gray-400 text-sm">No hay datos suficientes.</p>}
              {topProducts.map((p, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-gray-200/50">
                  <div className="flex items-center gap-4">
                    <div className="w-8 h-8 rounded-full bg-slate-100 text-gray-500 flex items-center justify-center font-bold text-sm">
                      {i + 1}
                    </div>
                    <span className="font-medium text-white">{p.name}</span>
                  </div>
                  <div className="text-right">
                    <p className="text-orange-500 font-bold">{p.qty} unid.</p>
                    <p className="text-xs text-gray-400">{formatPrice(p.revenue, 'USD')}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Top Customers */}
          <div className="bg-white shadow-sm border border-gray-200 rounded-3xl p-6">
            <div className="flex items-center gap-3 mb-6">
              <Users className="w-5 h-5 text-emerald-500" />
              <h3 className="text-lg font-bold text-white">Mejores Clientes</h3>
            </div>
            <div className="space-y-4">
              {topCustomers.length === 0 && <p className="text-gray-400 text-sm">No hay clientes registrados con compras.</p>}
              {topCustomers.map((c, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-gray-200/50">
                  <div className="flex items-center gap-4">
                    <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-500 flex items-center justify-center font-bold text-sm">
                      {c.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <span className="font-medium text-white block">{c.name}</span>
                      <span className="text-xs text-gray-400">{c.ordersCount} pedidos</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-emerald-500 font-bold">{formatPrice(c.totalSpent, 'USD')}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Divider */}
      <hr className="border-gray-200" />

      {/* ============================================================ */}
      {/* SECTION 2: CONFIGURACIÓN (Upsell + Datos del Negocio)       */}
      {/* ============================================================ */}
      <section>
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-2xl bg-orange-500/20 text-orange-500 flex items-center justify-center">
            <Building2 className="w-5 h-5" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900">Configuración</h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Venta Sugerida */}
          <div className="bg-white shadow-sm border border-gray-200 rounded-2xl p-6 shadow-xl h-fit">
            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
              <span className="text-orange-500">💰</span> Venta Sugerida (Upsell)
            </h2>
            <p className="text-gray-500 text-sm mb-6">
              Selecciona los 2 productos que se ofrecerán al cliente justo antes de finalizar su pago en el kiosco.
            </p>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-2">Producto Sugerido 1</label>
                <select 
                  value={upsell1} 
                  onChange={(e) => setUpsell1(e.target.value)}
                  className="w-full bg-slate-100 border border-gray-200 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  <option value="">-- Seleccionar producto --</option>
                  {products.map(p => (
                    <option key={p.id} value={p.id}>{p.name} (${p.base_price})</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-2">Producto Sugerido 2</label>
                <select 
                  value={upsell2} 
                  onChange={(e) => setUpsell2(e.target.value)}
                  className="w-full bg-slate-100 border border-gray-200 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  <option value="">-- Seleccionar producto --</option>
                  {products.map(p => (
                    <option key={p.id} value={p.id}>{p.name} (${p.base_price})</option>
                  ))}
                </select>
              </div>
              
              <button 
                onClick={saveSettings}
                disabled={isSaving}
                className="w-full mt-4 bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 rounded-xl transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <Save className="w-5 h-5" />
                {isSaving ? 'Guardando...' : 'Guardar Configuración'}
              </button>
            </div>
          </div>

          {/* Configuración de Glubbi Marketplace */}
          <div className="bg-white shadow-sm border border-gray-200 rounded-2xl p-6 shadow-xl h-fit">
            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
              <span className="text-orange-500">🛒</span> Presencia en Glubbi
            </h2>
            <p className="text-gray-500 text-sm mb-6">
              Asegúrate de clasificar correctamente tu negocio para aparecer en las búsquedas del marketplace de Glubbi.
            </p>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-2">Tipo de Negocio</label>
                <select 
                  value={glubbiType} 
                  onChange={(e) => setGlubbiType(e.target.value)}
                  className="w-full bg-slate-100 border border-gray-200 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  <option value="Restaurantes">Restaurantes</option>
                  <option value="Mercado">Mercado</option>
                  <option value="Farmacia">Farmacia</option>
                </select>
              </div>

              {glubbiType === 'Restaurantes' && (
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-2">Especialidad (Filtro)</label>
                  <select 
                    value={glubbiCategory} 
                    onChange={(e) => setGlubbiCategory(e.target.value)}
                    className="w-full bg-slate-100 border border-gray-200 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                  >
                    <option value="">Seleccione una especialidad</option>
                    <option value="Hamburguesas">Hamburguesas 🍔</option>
                    <option value="Pizzas">Pizzas 🍕</option>
                    <option value="Sushi">Sushi 🍣</option>
                    <option value="Saludable">Saludable 🥗</option>
                    <option value="Postres">Postres 🍦</option>
                    <option value="Mexicana">Mexicana 🌮</option>
                    <option value="Cafeteria">Cafetería ☕</option>
                    <option value="Pollo">Pollo 🍗</option>
                  </select>
                </div>
              )}

              {/* Cover Image URL for Glubbi Feed */}
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-2">Foto de Portada (Glubbi Feed)</label>
                
                <div className="flex gap-2 mb-2">
                  <button 
                    type="button" 
                    onClick={() => setCoverUploadMode('url')} 
                    className={`px-3 py-1.5 text-xs rounded-md transition-colors ${coverUploadMode === 'url' ? 'bg-orange-500/20 text-orange-500 border border-orange-500/30' : 'bg-slate-100 shadow-sm border border-gray-200 text-gray-500 hover:bg-slate-200'}`}
                  >
                    Enlace (URL)
                  </button>
                  <button 
                    type="button" 
                    onClick={() => setCoverUploadMode('file')} 
                    className={`px-3 py-1.5 text-xs rounded-md transition-colors ${coverUploadMode === 'file' ? 'bg-orange-500/20 text-orange-500 border border-orange-500/30' : 'bg-slate-100 shadow-sm border border-gray-200 text-gray-500 hover:bg-slate-200'}`}
                  >
                    Subir Archivo
                  </button>
                </div>

                {coverUploadMode === 'url' ? (
                  <input 
                    type="url"
                    value={coverImageUrl} 
                    onChange={(e) => setCoverImageUrl(e.target.value)}
                    placeholder="https://ejemplo.com/portada.jpg"
                    className="w-full bg-slate-100 border border-gray-200 rounded-xl px-4 py-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm"
                  />
                ) : (
                  <input 
                    type="file" 
                    accept="image/png, image/jpeg, image/webp" 
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      if (file.size > 5 * 1024 * 1024) {
                        alert("La imagen es demasiado grande. El límite es 5MB.");
                        return;
                      }
                      const reader = new FileReader();
                      reader.onloadend = () => setCoverImageUrl(reader.result as string);
                      reader.readAsDataURL(file);
                    }} 
                    className="w-full bg-slate-100 border border-gray-200 rounded-xl py-2 px-3 text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-orange-100 file:text-orange-700 hover:file:bg-orange-200 cursor-pointer" 
                  />
                )}
                <p className="text-xs text-gray-400 mt-1">Esta es la foto grande que atrae clientes en la aplicación principal.</p>
                {coverImageUrl && (
                  <div className="mt-3 w-full h-32 rounded-xl border border-gray-200 overflow-hidden bg-slate-50">
                    <img src={coverImageUrl} alt="Portada Preview" className="w-full h-full object-cover" />
                  </div>
                )}
              </div>

              <button 
                onClick={saveSettings}
                disabled={isSaving}
                className="w-full mt-4 bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 rounded-xl transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <Save className="w-5 h-5" />
                {isSaving ? 'Guardando...' : 'Guardar Glubbi'}
              </button>
            </div>
          </div>

          {/* Contacto WhatsApp */}
          <div className="bg-white shadow-sm border border-gray-200 rounded-2xl p-6 shadow-xl h-fit">
            <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
              <span className="text-emerald-500">💬</span> Contacto WhatsApp
            </h2>
            <p className="text-gray-500 text-sm mb-6">
              Ingresa el número de WhatsApp para que tus clientes puedan contactarte directamente desde la App.
            </p>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-2">Número de WhatsApp</label>
                <input 
                  type="text"
                  value={whatsappNumber} 
                  onChange={(e) => setWhatsappNumber(e.target.value)}
                  placeholder="Ej. +584141234567"
                  className="w-full bg-slate-100 border border-gray-200 rounded-xl px-4 py-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm"
                />
                <p className="text-xs text-gray-400 mt-2">Asegúrate de incluir el código de país (Ej: +58 o +57).</p>
              </div>

              <button 
                onClick={saveSettings}
                disabled={isSaving}
                className="w-full mt-4 bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-3 rounded-xl transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <Save className="w-5 h-5" />
                {isSaving ? 'Guardando...' : 'Guardar WhatsApp'}
              </button>
            </div>
          </div>

          {/* Seguridad del Sistema (Super-Admin Password) */}
          <div className="bg-white shadow-sm border border-gray-200 rounded-2xl p-6 shadow-xl h-fit">
            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
              <Lock className="w-5 h-5 text-orange-500" /> Seguridad de la Plataforma
            </h2>
            <p className="text-gray-500 text-sm mb-6">
              Mantén tu clave segura. Puedes cambiarla cuando quieras desde aquí.
            </p>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-2">Nueva Contraseña</label>
                <input 
                  type="password"
                  value={newAdminPassword} 
                  onChange={(e) => setNewAdminPassword(e.target.value)}
                  placeholder="Mínimo 4 caracteres"
                  className="w-full bg-slate-100 border border-gray-200 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-500 mb-2">Confirmar Contraseña</label>
                <input 
                  type="password"
                  value={confirmAdminPassword} 
                  onChange={(e) => setConfirmAdminPassword(e.target.value)}
                  placeholder="Confirmar nueva contraseña"
                  className="w-full bg-slate-100 border border-gray-200 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm"
                />
              </div>
              
              <button 
                onClick={changeAdminPassword}
                disabled={isSavingPassword || !newAdminPassword || newAdminPassword !== confirmAdminPassword}
                className="w-full mt-4 bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 rounded-xl transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <Lock className="w-5 h-5" />
                {isSavingPassword ? 'Actualizando...' : 'Actualizar Contraseña'}
              </button>
            </div>
          </div>

          {/* Datos del Negocio (Editables) */}
          <div className="bg-white shadow-sm border border-gray-200 rounded-2xl p-6 shadow-xl relative overflow-hidden group h-fit">
            <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-orange-500" /> Datos del Negocio
            </h2>
            
            <div className="space-y-4 relative z-10">
              
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-4">
                <div className="w-16 h-16 bg-slate-100 border border-gray-200 rounded-xl overflow-hidden flex items-center justify-center shrink-0">
                  <img src={logoUrl || '/logo.svg'} alt="Logo" className="w-full h-full object-contain p-1" />
                </div>
                <div className="flex-1 w-full">
                  <div className="flex gap-2 mb-2">
                    <button 
                      type="button" 
                      onClick={() => setUploadMode('url')} 
                      className={`px-3 py-1.5 text-xs rounded-md transition-colors ${uploadMode === 'url' ? 'bg-orange-500/20 text-orange-500 border border-orange-500/30' : 'bg-white shadow-sm border border-gray-200 text-gray-500 hover:bg-slate-100'}`}
                    >
                      Enlace (URL)
                    </button>
                    <button 
                      type="button" 
                      onClick={() => setUploadMode('file')} 
                      className={`px-3 py-1.5 text-xs rounded-md transition-colors ${uploadMode === 'file' ? 'bg-orange-500/20 text-orange-500 border border-orange-500/30' : 'bg-white shadow-sm border border-gray-200 text-gray-500 hover:bg-slate-100'}`}
                    >
                      Subir Archivo
                    </button>
                  </div>
                  
                  {uploadMode === 'url' ? (
                    <input 
                      type="text"
                      value={logoUrl}
                      onChange={(e) => setLogoUrl(e.target.value)}
                      placeholder="https://ejemplo.com/mi-logo.png"
                      className="w-full bg-slate-50 border border-gray-200 rounded-lg px-3 py-2 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  ) : (
                    <input 
                      type="file" 
                      accept="image/png, image/jpeg, image/webp, image/svg+xml" 
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        if (file.size > 2 * 1024 * 1024) {
                          alert("La imagen es demasiado grande. El límite es 2MB.");
                          return;
                        }
                        const reader = new FileReader();
                        reader.onloadend = () => setLogoUrl(reader.result as string);
                        reader.readAsDataURL(file);
                      }} 
                      className="w-full bg-slate-50 border border-gray-200 rounded-lg py-1.5 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-slate-200 file:text-gray-700 hover:file:bg-slate-300 cursor-pointer" 
                    />
                  )}
                </div>
              </div>
              
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Nombre de la Empresa</label>
                <input 
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-50 border border-gray-200 rounded-lg px-3 py-2 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Identificación Fiscal</label>
                  <input 
                    type="text"
                    value={taxId}
                    onChange={(e) => setTaxId(e.target.value)}
                    className="w-full bg-slate-50 border border-gray-200 rounded-lg px-3 py-2 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Teléfono</label>
                  <input 
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full bg-slate-50 border border-gray-200 rounded-lg px-3 py-2 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Dirección</label>
                <input 
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full bg-slate-50 border border-gray-200 rounded-lg px-3 py-2 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div className="mt-6 pt-4 border-t border-gray-100 grid grid-cols-2 gap-4">
                <div className="bg-slate-50 p-3 rounded-xl border border-gray-100">
                  <p className="text-[10px] uppercase font-bold text-gray-400 mb-1 flex items-center gap-1"><Lock className="w-3 h-3"/> Licencia</p>
                  <p className="text-xs font-mono text-orange-500 truncate" title={restaurant?.license_code}>
                    {restaurant?.license_code || 'No registrada'}
                  </p>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl border border-gray-100">
                  <p className="text-[10px] uppercase font-bold text-gray-400 mb-1 flex items-center gap-1"><Lock className="w-3 h-3"/> Corte</p>
                  <p className="text-xs font-medium text-slate-700">
                    {restaurant?.license_valid_until 
                      ? new Date(restaurant.license_valid_until).toLocaleDateString() 
                      : 'No registrada'}
                  </p>
                </div>
              </div>
              
              <button 
                onClick={saveSettings}
                disabled={isSaving}
                className="w-full mt-4 bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 rounded-xl transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <Save className="w-5 h-5" />
                {isSaving ? 'Guardando...' : 'Guardar Datos'}
              </button>
            </div>
          </div>

          {/* Delivery & Descuentos */}
          <div className="bg-white shadow-sm border border-gray-200 rounded-2xl p-6 shadow-xl h-fit">
            <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
              <Truck className="w-5 h-5 text-orange-500" /> Promociones de Envío
            </h2>
            <p className="text-gray-500 text-sm mb-6">
              El costo del envío se configura ahora desde tu mapa interactivo en la sección "Zonas de Envío". 
              Aquí puedes aplicar un descuento promocional a esas zonas.
            </p>
            
            <div className="space-y-6">
              {/* Delivery Discount */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Percent className="w-4 h-4 text-emerald-500" />
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider">Descuento en Delivery (%)</label>
                </div>
                <p className="text-xs text-gray-500 mb-2">Aplica un porcentaje de descuento exclusivo al costo del envío configurado en el mapa. (0 = sin descuento)</p>
                <input 
                  type="number"
                  step="1"
                  min="0"
                  max="100"
                  value={discountPercentage}
                  onChange={(e) => setDiscountPercentage(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-50 border border-gray-200 rounded-lg px-3 py-2 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 mb-6"
                  placeholder="Ej. 50"
                />
                  
                  <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                    <div>
                      <h3 className="font-bold text-emerald-600">Delivery Gratis (Promoción)</h3>
                      <p className="text-xs text-gray-500">Aparecerás destacado en la sección de Ofertas Top de la App Glubbi.</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        className="sr-only peer" 
                        checked={hasFreeDelivery}
                        onChange={(e) => setHasFreeDelivery(e.target.checked)}
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                    </label>
                  </div>
                </div>
              <button 
                onClick={saveSettings}
                disabled={isSaving}
                className="w-full mt-4 bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 rounded-xl transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <Save className="w-5 h-5" />
                {isSaving ? 'Guardando...' : 'Guardar Delivery'}
              </button>
            </div>
          </div>
          
          {/* Métodos de Pago Dinámicos */}
          <div className="bg-white shadow-sm border border-gray-200 rounded-2xl p-6 shadow-xl relative overflow-hidden group h-fit col-span-1 lg:col-span-2">
            <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-orange-500" /> Métodos de Pago
            </h2>
            <p className="text-gray-500 text-sm mb-6">
              Registra los instrumentos de pago que aceptas. Estos se mostrarán en el kiosco al finalizar la compra.
            </p>
            
            <div className="space-y-4">
              {paymentMethods.map((pm, index) => (
                <div key={pm.id} className="border border-gray-200 p-4 rounded-xl bg-slate-50 relative">
                  <button 
                    onClick={() => removePaymentMethod(pm.id)}
                    className="absolute top-4 right-4 text-red-500 hover:bg-red-50 p-1.5 rounded-lg transition-colors text-xs font-bold"
                  >
                    Eliminar
                  </button>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Título (Ej. Pago Móvil)</label>
                      <input 
                        type="text"
                        value={pm.title}
                        onChange={(e) => updatePaymentMethod(pm.id, 'title', e.target.value)}
                        className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Detalles / Instrucciones</label>
                      <textarea 
                        value={pm.details}
                        onChange={(e) => updatePaymentMethod(pm.id, 'details', e.target.value)}
                        placeholder="Ej. Banco: Banesco, CI: 1234567, Tel: 0414-1234567"
                        className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 h-20"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Logo del Método (URL o Subir)</label>
                      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                        <div className="w-12 h-12 bg-white border border-gray-200 rounded-xl overflow-hidden flex items-center justify-center shrink-0">
                          {pm.logoUrl ? (
                            <img src={pm.logoUrl} alt="Logo" className="w-full h-full object-contain p-1" />
                          ) : (
                            <DollarSign className="w-5 h-5 text-gray-300" />
                          )}
                        </div>
                        <div className="flex-1 w-full space-y-2">
                          <input 
                            type="text"
                            value={pm.logoUrl.startsWith('data:') ? 'Imagen subida (Base64)' : pm.logoUrl}
                            onChange={(e) => updatePaymentMethod(pm.id, 'logoUrl', e.target.value)}
                            placeholder="https://ejemplo.com/logo-zelle.png"
                            disabled={pm.logoUrl.startsWith('data:')}
                            className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 disabled:opacity-50"
                          />
                          <input 
                            type="file" 
                            accept="image/png, image/jpeg, image/webp, image/svg+xml" 
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (!file) return;
                              if (file.size > 2 * 1024 * 1024) {
                                alert("La imagen es demasiado grande. El límite es 2MB.");
                                return;
                              }
                              const reader = new FileReader();
                              reader.onloadend = () => updatePaymentMethod(pm.id, 'logoUrl', reader.result as string);
                              reader.readAsDataURL(file);
                            }} 
                            className="w-full text-sm file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-orange-100 file:text-orange-700 hover:file:bg-orange-200 cursor-pointer" 
                          />
                          {pm.logoUrl.startsWith('data:') && (
                            <button onClick={() => updatePaymentMethod(pm.id, 'logoUrl', '')} className="text-xs text-red-500 font-medium">Borrar imagen subida</button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              
              <button 
                onClick={addPaymentMethod}
                className="w-full border-2 border-dashed border-gray-300 text-gray-500 font-bold py-3 rounded-xl hover:border-orange-500 hover:text-orange-500 transition-colors"
              >
                + Añadir Nuevo Método de Pago
              </button>

              <button 
                onClick={saveSettings}
                disabled={isSaving}
                className="w-full mt-4 bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 rounded-xl transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <Save className="w-5 h-5" />
                {isSaving ? 'Guardando...' : 'Guardar Métodos'}
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
