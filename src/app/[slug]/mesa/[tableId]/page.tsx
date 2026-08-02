'use client';

import { useState, useEffect, use } from 'react';
import { createClient, GLUBBI_ID } from '@/lib/supabase/client';
import type { Category, ProductWithModifiers, Product } from '@/types/database';
import { CategoryNav } from '@/modules/kiosk/components/CategoryNav';
import { ProductCard } from '@/modules/kiosk/components/ProductCard';
import { CartDrawer } from '@/modules/kiosk/components/CartDrawer';
import { CustomerForm, type CustomerData } from '@/modules/kiosk/components/CustomerForm';
import { OrderTypeSelector } from '@/modules/kiosk/components/OrderTypeSelector';
import { UpsellModal } from '@/modules/kiosk/components/UpsellModal';
import { CheckoutForm } from '@/modules/kiosk/components/CheckoutForm';
import { OrderStatus } from '@/modules/kiosk/components/OrderStatus';
import { ProductCustomizationModal } from '@/modules/kiosk/components/ProductCustomizationModal';
import { useCartStore } from '@/modules/kiosk/stores/cart-store';
import { useGlubbiStore } from '@/modules/glubbi/stores/glubbi-store';
import { ShoppingBag, ChevronLeft, Home, MessageCircle, ShieldCheck, Heart } from 'lucide-react';
import { t } from '@/lib/i18n';
import { formatPrice, isRestaurantOpen } from '@/lib/utils';
import Link from 'next/link';

type FlowStep = 'browse' | 'order_type' | 'customer' | 'upsell' | 'checkout' | 'success' | 'order_status';

interface KioskPageProps {
  params: Promise<{ slug: string; tableId: string }>;
}

export default function KioskPage({ params }: KioskPageProps) {
  const { slug, tableId } = use(params);
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<ProductWithModifiers[]>([]);
  const [activeCategoryId, setActiveCategoryId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  
  // Restaurant Info States
  const [restaurantName, setRestaurantName] = useState('Burger Palace');
  const [restaurantLogo, setRestaurantLogo] = useState<string | null>(null);

  // Waiter & Delivery States
  const [isWaiter, setIsWaiter] = useState(false);
  const [waiterName, setWaiterName] = useState('');
  const [isDelivery, setIsDelivery] = useState(false);
  const [orderType, setOrderType] = useState<'pickup' | 'delivery'>('pickup');
  const [pickupTime, setPickupTime] = useState<string>('');
  const [allTables, setAllTables] = useState<any[]>([]);
  const [selectedTableId, setSelectedTableId] = useState<string>('');

  // Delivery / Pickup Info
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [deliveryPhone, setDeliveryPhone] = useState('');
  
  // Pricing Rules
  const [deliveryFee, setDeliveryFee] = useState(0);
  const [deliveryEnabled, setDeliveryEnabled] = useState(false);
  const [discountPercentage, setDiscountPercentage] = useState(0);
  
  // Flow state
  const [step, setStep] = useState<FlowStep>('browse');
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<any | null>(null);
  const [paymentMethods, setPaymentMethods] = useState<any[]>([]);
  const [customerId, setCustomerId] = useState<string | null>(null);
  const [customerName, setCustomerName] = useState<string>('');
  const [customizingProduct, setCustomizingProduct] = useState<ProductWithModifiers | null>(null);
  const [editingCartItemId, setEditingCartItemId] = useState<string | null>(null);
  const [editingInitialSelections, setEditingInitialSelections] = useState<any[]>([]);
  const [lastTotal, setLastTotal] = useState(0);
  const [lastOrderId, setLastOrderId] = useState<string | null>(null);
  const [upsellProducts, setUpsellProducts] = useState<ProductWithModifiers[]>([]);
  const [isCallingWaiter, setIsCallingWaiter] = useState(false);
  const [isFromGlubbi, setIsFromGlubbi] = useState(false);
  const [kycStatus, setKycStatus] = useState('unverified');
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [restaurantId, setRestaurantId] = useState('');
  const { favoriteRestaurants, toggleFavorite } = useGlubbiStore();
  const [isClosed, setIsClosed] = useState(false);
  
  const { addItem, getItemCount, getTotal, setContext, items, clearCart, restaurantId: cartStoreRestaurantId, updateItemModifiers } = useCartStore();
  
  // Currency from restaurant (hardcoded USD for now, could be fetched)
  const currency = 'USD';

  // Derived Pricing
  const subtotal = getTotal();
  // Only apply delivery fee if delivery is enabled in gerente settings AND it's a delivery order
  const effectiveDeliveryFee = (isDelivery) ? deliveryFee : 0;
  const deliveryDiscountAmount = effectiveDeliveryFee * (discountPercentage / 100);
  const finalDeliveryCost = effectiveDeliveryFee - deliveryDiscountAmount;
  const finalTotal = subtotal + finalDeliveryCost;

  // Helper to change step and push browser history state
  const changeStep = (newStep: FlowStep, replace = false) => {
    setStep(newStep);
    if (typeof window !== 'undefined') {
      if (replace) {
        window.history.replaceState({ step: newStep }, '');
      } else {
        window.history.pushState({ step: newStep }, '');
      }
    }
  };

  // Sync browser back/forward with React flow steps
  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.history.replaceState({ step: 'browse' }, '');

      const handlePopState = (event: PopStateEvent) => {
        if (event.state && event.state.step) {
          setStep(event.state.step);
        } else {
          setStep('browse');
        }
      };

      window.addEventListener('popstate', handlePopState);
      return () => window.removeEventListener('popstate', handlePopState);
    }
  }, []);

  // Parse parameters on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const searchParams = new URLSearchParams(window.location.search);
      if (searchParams.get('role') === 'waiter') {
        setIsWaiter(true);
        setWaiterName(searchParams.get('waiterName') || 'Mesero');
      }
      if (searchParams.get('type') === 'delivery' || tableId === 'delivery') {
        setIsDelivery(true);
      }
      if (searchParams.get('glubbi') === 'true') {
        setIsFromGlubbi(true);
      }
    }
  }, []);

  // Added location from glubbi store for delivery zone calculation
  const { location } = useGlubbiStore();

  useEffect(() => {
    async function loadData() {
      const supabase = createClient();
      
      // Get restaurant by slug
      const { data } = await supabase
        .from('restaurants')
        .select('*')
        .eq('slug', slug)
        .eq('is_active', true)
        .single();
        
      const restaurant = data as any;
      if (!restaurant) return;
      
      setContext(restaurant.id, tableId);
      setRestaurantName(restaurant.name || 'Burger Palace');
      setRestaurantLogo(restaurant.logo_url);
      setKycStatus(restaurant.kyc_status || 'unverified');
      setWhatsappNumber(restaurant.whatsapp_number || '');
      setRestaurantId(restaurant.id);
      
      if (restaurant.payment_methods) {
        try {
          setPaymentMethods(restaurant.payment_methods as any[]);
        } catch (e) {}
      }
      
      // Set defaults for delivery
      setDeliveryFee(restaurant.delivery_fee || 0);
      setDeliveryEnabled(restaurant.delivery_enabled !== false);
      setDiscountPercentage(restaurant.discount_percentage || 0);
      setIsClosed(!isRestaurantOpen(restaurant.schedule, restaurant.timezone));
      
      // Load categories
      const { data: catsData } = await supabase
        .from('categories')
        .select('*')
        .eq('restaurant_id', restaurant.id)
        .eq('is_active', true)
        .order('order_index');
        
      const cats = catsData as any[];
      if (cats && cats.length > 0) {
        setCategories(cats);
        setActiveCategoryId(cats[0].id);
      }
      
      // Load products with modifiers
      const { data: prods } = await supabase
        .from('products')
        .select('*, modifier_groups(*, modifiers(*))')
        .eq('restaurant_id', restaurant.id)
        .eq('is_available', true)
        .order('order_index');
        
      if (prods) {
        // Sort products to prioritize ones with images
        const sortedProds = [...prods].sort((a, b) => {
          if (a.image_url && !b.image_url) return -1;
          if (!a.image_url && b.image_url) return 1;
          return 0;
        });
        setProducts(sortedProds as ProductWithModifiers[]);
        
        // Find upsell products based on restaurant settings, fallback to featured
        const upsells = prods.filter(p => 
          p.id === restaurant.upsell_item_1_id || p.id === restaurant.upsell_item_2_id
        );
        
        if (upsells.length > 0) {
           setUpsellProducts(upsells as ProductWithModifiers[]);
        } else {
            setUpsellProducts(prods.filter(p => p.is_featured) as ProductWithModifiers[]);
        }
      }

      // Load all active tables for waiter selection
      const { data: tablesData } = await supabase
        .from('tables')
        .select('*')
        .eq('restaurant_id', restaurant.id)
        .eq('is_active', true)
        .order('table_number');
      if (tablesData) {
        const sorted = [...tablesData].sort((a, b) => a.table_number - b.table_number);
        setAllTables(sorted);
        // Default select the tableId if it is a valid UUID, otherwise first table
        const isValidUUID = (id: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
        if (isValidUUID(tableId)) {
          setSelectedTableId(tableId);
        } else if (sorted.length > 0) {
          setSelectedTableId(sorted[0].id);
        }
      }
      
      setIsLoading(false);
    }
    
    loadData();
  }, [slug, tableId, setContext]);

  // Effect to calculate dynamic delivery fee if location exists
  useEffect(() => {
    if (isDelivery && restaurantId && location) {
      async function calculateZoneDelivery() {
        const supabase = createClient();
        const { data, error } = await supabase.rpc('get_delivery_zones_for_location', {
          user_lat: location.lat,
          user_lng: location.lng,
          target_restaurant_id: restaurantId
        });
        
        if (data && data.length > 0) {
          // Si cae en alguna zona, usa el precio de la primera zona encontrada
          setDeliveryFee(data[0].price);
        }
      }
      calculateZoneDelivery();
    }
  }, [isDelivery, restaurantId, location]);
  
  // Scroll spy effect simplified for demo
  const scrollToCategory = (id: string) => {
    setActiveCategoryId(id);
    const element = document.getElementById(`category-${id}`);
    if (element) {
      // Offset for sticky nav
      const y = element.getBoundingClientRect().top + window.scrollY - 100;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  };

  const handleAddToCart = (product: ProductWithModifiers) => {
    // Always open modal to show description, even if no modifiers
    setCustomizingProduct(product);
  };

  const handleEditCartItem = (item: any) => {
    // Find full product including modifiers
    const product = products.find(p => p.id === item.product.id);
    if (product) {
      setEditingCartItemId(item.id);
      setEditingInitialSelections(item.selectedModifiers || []);
      setCustomizingProduct(product);
      setIsCartOpen(false);
    }
  };

  const handleModalAddToCart = (product: ProductWithModifiers, selectedModifiers: any[], unitPrice: number) => {
    // Validar si el carrito tiene productos de otro restaurante
    if (restaurantId && restaurantId !== product.restaurant_id && items.length > 0) {
      if (window.confirm("Tienes productos de otro restaurante en tu carrito. ¿Deseas vaciar tu carrito actual para empezar un pedido aquí?")) {
        clearCart();
      } else {
        return; // El usuario canceló la acción
      }
    }

    if (editingCartItemId) {
      updateItemModifiers(editingCartItemId, selectedModifiers, unitPrice);
    } else {
      addItem({
        product: product as Product,
        quantity: 1,
        selectedModifiers,
        unitPrice
      }, product.restaurant_id, tableId);
    }
    // Close modal immediately so user returns to browse
    setCustomizingProduct(null);
    setEditingCartItemId(null);
    setEditingInitialSelections([]);
  };

  const ElegantHeader = () => (
    <div className="w-full flex flex-col items-center justify-center py-5 border-b border-gray-200 bg-white relative overflow-hidden mb-6 shadow-sm">
      <div className="absolute inset-0 z-0 opacity-30">
        <div className="absolute top-[-50%] left-[-10%] w-1/2 h-[200%] bg-gradient-to-r from-orange-500 to-transparent blur-2xl rounded-full transform rotate-12" />
        <div className="absolute bottom-[-50%] right-[-10%] w-1/2 h-[200%] bg-gradient-to-l from-orange-500 to-transparent blur-2xl rounded-full transform -rotate-12" />
      </div>
      
      {/* Top Left: Home Button or Glubbi Return */}
      {step !== 'browse' ? (
        <button 
          onClick={() => { setPaymentMethod(null); changeStep('browse'); window.scrollTo(0,0); }} 
          className="absolute top-4 left-4 z-20 w-10 h-10 bg-white hover:bg-slate-50 rounded-full flex items-center justify-center shadow-md transition-colors text-slate-700 border border-gray-100"
        >
          <Home className="w-5 h-5" />
        </button>
      ) : isFromGlubbi ? (
        <Link 
          href="/glubbi"
          className="absolute top-4 left-4 z-20 w-10 h-10 bg-white hover:bg-slate-50 rounded-full flex items-center justify-center shadow-md transition-colors text-slate-700 border border-gray-100"
        >
          <ChevronLeft className="w-6 h-6" />
        </Link>
      ) : null}
      
      {/* Top Right: WhatsApp and Favorites Buttons */}
      <div className="absolute top-4 right-4 z-20 flex flex-col gap-3">
        <a 
          href={whatsappNumber ? `https://wa.me/${whatsappNumber.replace(/[^0-9]/g, '')}?text=Hola!%20Vengo%20de%20la%20App%20Glubbi` : "#"}
          target={whatsappNumber ? "_blank" : undefined}
          rel="noopener noreferrer" 
          onClick={(e) => {
            if (!whatsappNumber) {
              e.preventDefault();
              alert('Este restaurante no tiene WhatsApp configurado.');
            }
          }}
          className={`w-10 h-10 rounded-full flex items-center justify-center shadow-md transition-colors text-white ${whatsappNumber ? 'bg-green-500 hover:bg-green-600' : 'bg-gray-300'}`}
        >
          <MessageCircle className="w-5 h-5" />
        </a>
        <button 
          onClick={() => toggleFavorite(restaurantId)}
          className="w-10 h-10 bg-white hover:bg-slate-50 rounded-full flex items-center justify-center shadow-md transition-colors text-slate-700 border border-gray-100"
        >
          <Heart className={`w-5 h-5 ${favoriteRestaurants.includes(restaurantId) ? 'fill-red-500 text-red-500' : ''}`} />
        </button>
      </div>

      <div className="relative z-10 flex flex-col items-center mt-2">
        {restaurantLogo ? (
          <img src={restaurantLogo} alt={restaurantName} className="w-14 h-14 rounded-full object-cover shadow-md mb-2 border border-gray-100 bg-white p-0.5" />
        ) : (
          <div className="w-14 h-14 rounded-full brand-bg flex items-center justify-center mb-2 shadow-lg shadow-orange-500/20">
            <span className="text-xl font-bold text-white">{restaurantName.charAt(0).toUpperCase()}</span>
          </div>
        )}
        <h1 className="text-xl font-bold text-slate-900 tracking-tight">{restaurantName}</h1>
        <p className="text-[10px] text-gray-400 tracking-widest uppercase mt-0.5 font-medium">POWERED BY GLUBBI.APP</p>
      </div>
    </div>
  );

  const handleCheckoutClick = () => {
    setIsCartOpen(false);
    // Physical table QR or Waiter bypasses the order_type selection screen
    const isPhysicalTable = isWaiter || (tableId && tableId !== 'takeaway' && tableId !== 'delivery' && tableId !== '1');
    if (isPhysicalTable) {
      if (isWaiter) {
        changeStep('checkout');
      } else {
        changeStep('customer');
      }
    } else {
      changeStep('order_type');
    }
    window.scrollTo(0, 0);
  };

  const handleSelectOrderType = (type: 'pickup' | 'delivery') => {
    setOrderType(type);
    setIsDelivery(type === 'delivery');
    changeStep('customer');
    window.scrollTo(0, 0);
  };

  const handleCustomerSubmit = async (data: CustomerData) => {
    setIsProcessing(true);
    const supabase = createClient();
    
    if (data.name) setCustomerName(data.name.trim());

    // Save details to states
    if (data.address) setDeliveryAddress(data.address);
    if (data.phone) setDeliveryPhone(data.phone);
    if (data.pickupTime) setPickupTime(data.pickupTime);

    // Check if customer exists or create new in kiosk customers (for FK)
    let newCustomerId = '';
    const { data: existing } = await supabase
      .from('customers')
      .select('id')
      .eq('restaurant_id', restaurantId || '')
      .eq('email', data.email.trim().toLowerCase())
      .maybeSingle() as any;
      
    if (existing) {
      newCustomerId = existing.id;
    } else {
      const { data: newCust, error } = await supabase
        .from('customers')
        .insert({
          restaurant_id: restaurantId || GLUBBI_ID,
          name: data.name,
          email: data.email.trim().toLowerCase(),
          phone: data.phone || null
        } as any)
        .select('id')
        .single() as any;
      if (!error && newCust) newCustomerId = newCust.id;
    }
    
    setCustomerId(newCustomerId);

    // Check if they exist in glubbi_customers (App)
    const { data: glubbiExisting } = await supabase
      .from('glubbi_customers')
      .select('id, addresses')
      .eq('email', data.email.trim().toLowerCase())
      .maybeSingle();

    if (glubbiExisting) {
       setIsFromGlubbi(true); // Don't show invite
       // Update addresses if a new address was provided
       if (data.address) {
         let currentAddresses = [];
         if (Array.isArray(glubbiExisting.addresses)) {
           currentAddresses = glubbiExisting.addresses;
         }
         // check if address already exists
         const exists = currentAddresses.some((a: any) => a.address === data.address);
         if (!exists) {
           const newAddress = {
             id: Math.random().toString(36).substring(7),
             label: 'Dirección Reciente',
             address: data.address,
             phone: data.phone,
             is_default: currentAddresses.length === 0
           };
           try {
             const { saveCustomerAddressesAction } = await import('@/modules/glubbi/actions');
             await saveCustomerAddressesAction(glubbiExisting.id, [...currentAddresses, newAddress]);
           } catch (e) {
             console.error('Failed to save address in mesa:', e);
           }
         }
       }
    } else {
       // Create Shadow Account
       const nameParts = data.name.trim().split(' ');
       const firstName = nameParts[0];
       const lastName = nameParts.slice(1).join(' ') || ' ';
       
       const newAddressEntry = data.address ? [{
         id: Math.random().toString(36).substring(7),
         label: 'Dirección Reciente',
         address: data.address,
         phone: data.phone,
         is_default: true
       }] : [];

       const { error: glubbiError } = await supabase
         .from('glubbi_customers')
         .insert({
           first_name: firstName,
           last_name: lastName,
           email: data.email.trim().toLowerCase(),
           phone: data.phone || '',
           addresses: newAddressEntry
         } as any);

       if (!glubbiError) {
         fetch('/api/customer/invite', {
           method: 'POST',
           headers: { 'Content-Type': 'application/json' },
           body: JSON.stringify({ email: data.email.trim().toLowerCase(), firstName })
         }).catch(e => console.error(e));
       }
    }

    setIsProcessing(false);
    
    // Check if we should show upsell
    if (upsellProducts.length > 0) {
      changeStep('upsell');
    } else {
      changeStep('checkout');
    }
  };

  const handleUpsellAdd = (product: ProductWithModifiers) => {
    // If product has no modifiers, add directly to cart to avoid opening another modal
    if (!product.modifier_groups || product.modifier_groups.length === 0) {
      addItem({ product, quantity: 1, unitPrice: product.base_price, selectedModifiers: [] });
    } else {
      handleAddToCart(product);
    }
  };
  
  const handleUpsellProceed = () => {
    changeStep('checkout');
  };

  const handleProcessPayment = async (method: any, verificationNotes?: string) => {
    setIsProcessing(true);
    setPaymentMethod(method);
    const supabase = createClient();
    
    // Save total before processing
    const currentTotal = finalTotal;
    setLastTotal(currentTotal);
    
    // Insert into orders
    const isValidUUID = (id: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
    
    // Determine target table ID (waiter selects dynamically)
    const targetTableId = isWaiter ? selectedTableId : tableId;

    // Determine payment method type to satisfy DB CHECK constraint
    const methodType = (method.type === 'cash' || method.id === 'cash') ? 'cash' : 
                       (method.type === 'stripe' || method.id === 'stripe') ? 'stripe' : 'terminal';

    // Append origin & customer tags to notes
    let notesPrefix = '';
    const custTag = customerName ? `[Cliente: ${customerName}]` : '';
    if (isDelivery) {
      notesPrefix = `[Origen: Delivery]${custTag ? ` | ${custTag}` : ''} | Dirección: ${deliveryAddress} | Teléfono: ${deliveryPhone}`;
    } else if (orderType === 'pickup' || tableId === 'takeaway') {
      notesPrefix = `[Origen: Retiro en Local]${custTag ? ` | ${custTag}` : ''} | Hora estimada: ${pickupTime || 'En 20-30 min'}${deliveryPhone ? ` | Teléfono: ${deliveryPhone}` : ''}`;
    } else if (isWaiter) {
      notesPrefix = `[Origen: Mesero: ${waiterName}]${custTag ? ` | ${custTag}` : ''}`;
    } else if (custTag) {
      notesPrefix = custTag;
    }

    if (verificationNotes) {
      notesPrefix = notesPrefix ? `${notesPrefix} | ${verificationNotes}` : verificationNotes;
    }
    
    // Add custom payment method name to notes so KDS/Gerente can see it
    notesPrefix = notesPrefix ? `${notesPrefix} | [Pago vía: ${method.title || method.id}]` : `[Pago vía: ${method.title || method.id}]`;

    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        restaurant_id: restaurantId || GLUBBI_ID,
        table_id: (targetTableId && targetTableId !== 'takeaway' && isValidUUID(targetTableId)) ? targetTableId : null,
        customer_id: customerId || null,
        status: 'pending',
        total_amount: finalTotal,
        payment_method: methodType, // Use validated method to pass DB constraint
        payment_status: 'pending',
        notes: notesPrefix || null
      } as any)
      .select()
      .single() as any;
      
    if (orderError) {
      console.error('Error creating order:', orderError);
    } else if (order) {
      // Insert order items
      const itemsToInsert = items.map(item => ({
        order_id: order.id,
        product_id: item.product.id,
        product_name: item.product.name,
        quantity: item.quantity,
        unit_price: item.unitPrice,
        subtotal: item.unitPrice * item.quantity,
        modifiers_snapshot: item.selectedModifiers
      }));
      
      await supabase.from('order_items').insert(itemsToInsert as any);
      setLastOrderId(order.id);
    }
    
    if (orderError) {
      // Show user-friendly error, don't navigate to success
      alert('Error al guardar el pedido en la base de datos. Código: ' + orderError.code + '\nMensaje: ' + orderError.message + '\n\nPor favor contacta al administrador.');
      setIsProcessing(false);
      return;
    }
    
    // Wait slightly so the UI shows success and realtime fires
    await new Promise(r => setTimeout(r, 800));
    
    clearCart();
    setIsProcessing(false);
    changeStep('success');
  };

  /** Enviar pedido para mesa/mesero — paga al final, sin seleccionar método ahora */
  const handleSendLater = async () => {
    setIsProcessing(true);
    const supabase = createClient();
    const isValidUUID = (id: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
    const targetTableId = isWaiter ? selectedTableId : tableId;
    const custTag = customerName ? `[Cliente: ${customerName}]` : '';
    const notesPrefix = isWaiter
      ? `[Origen: Mesero: ${waiterName}] | [Pagar al final]${custTag ? ` | ${custTag}` : ''}`
      : `[Pagar al final]${custTag ? ` | ${custTag}` : ''}`;

    setLastTotal(finalTotal);

    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        restaurant_id: restaurantId || GLUBBI_ID,
        table_id: (targetTableId && targetTableId !== 'takeaway' && isValidUUID(targetTableId)) ? targetTableId : null,
        customer_id: customerId || null,
        status: 'pending',
        total_amount: finalTotal,
        payment_method: 'cash',
        payment_status: 'pending',
        notes: notesPrefix,
      } as any)
      .select()
      .single() as any;

    if (orderError) {
      alert('Error al enviar el pedido: ' + orderError.message);
      setIsProcessing(false);
      return;
    }

    if (order) {
      const itemsToInsert = items.map(item => ({
        order_id: order.id,
        product_id: item.product.id,
        product_name: item.product.name,
        quantity: item.quantity,
        unit_price: item.unitPrice,
        subtotal: item.unitPrice * item.quantity,
        modifiers_snapshot: item.selectedModifiers,
      }));
      await supabase.from('order_items').insert(itemsToInsert as any);
      setLastOrderId(order.id);
    }

    // Use a neutral placeholder for success screen
    setPaymentMethod({ id: 'send_later', title: 'Pagar al final', logoUrl: null });
    await new Promise(r => setTimeout(r, 600));
    clearCart();
    setIsProcessing(false);
    changeStep('success');
  };

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-gray-200 border-t-orange-500 rounded-full animate-spin"/>
    </div>;
  }

  // --- KYC BLOCKER ---
  if (kycStatus !== 'verified') {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 relative overflow-hidden font-sans text-center space-y-6">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl" />
        <div className="relative z-10 w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-lg border border-gray-200 mx-auto">
          <ShieldCheck className="w-10 h-10 text-orange-500" />
        </div>
        <div className="relative z-10 max-w-md mx-auto space-y-2">
          <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Restaurante en Validación</h2>
          <p className="text-gray-500 leading-relaxed">
            Este local se encuentra en proceso de validación de seguridad por el equipo de Glubbi para proteger a nuestra comunidad. Vuelve pronto.
          </p>
        </div>
      </div>
    );
  }

  // --- RENDERING FLOW STEPS ---

  if (step === 'order_type') {
    return (
      <div className="p-6 pb-32 animate-fade-in">
        <ElegantHeader />

        <button onClick={() => changeStep('browse')} className="flex items-center text-gray-500 mb-6 hover:text-slate-900 transition-colors">
          <ChevronLeft className="w-5 h-5 mr-1" />
          Volver al menú
        </button>

        <OrderTypeSelector 
          onSelectType={handleSelectOrderType}
          deliveryEnabled={deliveryEnabled}
        />
      </div>
    );
  }

  if (step === 'customer') {
    return (
      <div className="p-6 pb-32 animate-fade-in">
        <ElegantHeader />

        <button onClick={() => changeStep(isWaiter || (tableId && tableId !== 'takeaway' && tableId !== 'delivery' && tableId !== '1') ? 'browse' : 'order_type')} className="flex items-center text-gray-500 mb-8 hover:text-slate-900 transition-colors">
          <ChevronLeft className="w-5 h-5 mr-1" />
          {isWaiter || (tableId && tableId !== 'takeaway' && tableId !== 'delivery' && tableId !== '1') ? 'Volver al menú' : 'Cambiar opción de entrega'}
        </button>
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Tus Datos</h2>
          <p className="text-gray-500">
            {orderType === 'pickup' 
              ? 'Ingresa tus datos y la hora estimada para retirar tu pedido.' 
              : isDelivery 
              ? 'Ingresa la dirección exacta donde entregaremos tu pedido.' 
              : 'Ingresa tus datos para vincular el pedido a tu mesa.'}
          </p>
        </div>
        <CustomerForm 
          onSubmit={handleCustomerSubmit} 
          isLoading={isProcessing} 
          isDelivery={isDelivery} 
          orderType={orderType}
        />
      </div>
    );
  }

  if (step === 'success') {
    return (
      <div className="p-6 pb-32 animate-fade-in flex flex-col items-center justify-center min-h-[60vh] text-center">
        <ElegantHeader />

        <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mb-6">
          <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center text-white text-2xl font-bold">
            ✓
          </div>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">¡Pedido Confirmado!</h2>
        <p className="text-gray-500 mb-8 max-w-sm">
          {paymentMethod === 'cash' 
            ? 'Tu orden ha sido enviada a la cocina. Paga en caja.' 
            : paymentMethod === 'terminal' 
              ? 'Tu orden está en cocina. El mesero traerá la terminal de pago.'
              : 'El pago ha sido exitoso y la cocina ya prepara tu pedido.'}
        </p>
        
        <div className="bg-white shadow-sm rounded-2xl p-6 w-full max-w-sm mb-8 border border-gray-200">
          <p className="text-sm text-gray-500 mb-1">Total pagado:</p>
          <p className="text-3xl font-bold brand-text">{formatPrice(lastTotal, currency)}</p>
          {lastOrderId && (
            <p className="text-xs text-gray-400 mt-3 font-mono">Orden #{lastOrderId.substring(0, 8)}</p>
          )}
        </div>
        
        {/* Banner de Invitación a la App (Shadow Registration Conversion) */}
        {!isFromGlubbi && (
          <div className="w-full max-w-sm mb-8 bg-gradient-to-r from-orange-500 to-rose-500 rounded-3xl p-6 text-white shadow-lg relative overflow-hidden transform hover:scale-[1.02] transition-transform">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-10 -mt-10" />
            <h3 className="font-bold text-xl mb-2 relative z-10">¡Tus datos están seguros!</h3>
            <p className="text-sm text-white/90 mb-4 relative z-10">
              Hemos guardado tu dirección para futuras compras. Descarga Glubbi App para rastrear tu orden y acceder a recompensas.
            </p>
            <div className="flex flex-col gap-2 relative z-10">
              <a href="https://play.google.com/store" target="_blank" rel="noreferrer" className="bg-white text-orange-600 font-bold py-2.5 rounded-xl text-sm flex items-center justify-center shadow-sm">
                Descargar en Google Play
              </a>
            </div>
          </div>
        )}

        <div className="w-full max-w-sm space-y-4">
          <button 
            onClick={() => changeStep('order_status')}
            className="w-full brand-bg text-white font-bold py-4 rounded-xl hover:brightness-110 shadow-lg shadow-orange-500/20 transition-all flex items-center justify-center"
          >
            VER MI ORDEN
          </button>
          
          <button 
            onClick={() => {
              setPaymentMethod(null);
              changeStep('browse');
              window.scrollTo(0, 0);
            }}
            className="w-full bg-slate-100 text-slate-900 hover:text-white font-bold py-4 rounded-xl hover:bg-zinc-700 transition-all"
          >
            Hacer un nuevo pedido
          </button>
        </div>
      </div>
    );
  }

  if (step === 'order_status' && lastOrderId) {
    return (
      <div className="p-6 pb-32 animate-fade-in">
        <ElegantHeader />

        <button onClick={() => changeStep('success')} className="flex items-center text-gray-500 mb-8 hover:text-white transition-colors">
          <ChevronLeft className="w-5 h-5 mr-1" />
          Volver
        </button>
        <OrderStatus orderId={lastOrderId} restaurantId={restaurantId || ''} />
      </div>
    );
  }

  if (step === 'checkout') {
    return (
      <div className="p-6 pb-32 animate-fade-in">
        <ElegantHeader />

        <button 
          onClick={() => {
            changeStep('browse');
            setTimeout(() => setIsCartOpen(true), 100);
          }} 
          className="flex items-center text-gray-500 mb-8" 
          disabled={isProcessing}
        >
          <ChevronLeft className="w-5 h-5 mr-1" />
          Revisar Carrito
        </button>
        <CheckoutForm 
          total={finalTotal} 
          currency={currency}
          onSelectPayment={handleProcessPayment}
          isProcessing={isProcessing}
          paymentMethod={paymentMethod}
          paymentMethods={paymentMethods}
          isWaiter={isWaiter}
          tables={allTables}
          selectedTableId={selectedTableId}
          onTableChange={setSelectedTableId}
          isPhysicalTable={isPhysicalTable}
        />
        {/* Floating Buttons */}
        <div className="fixed bottom-24 right-4 z-40 flex flex-col gap-3">
          {isDelivery && (
            <a
              href={`https://wa.me/?text=Hola`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-12 h-12 bg-green-500 rounded-full shadow-lg flex items-center justify-center text-white hover:scale-105 transition-transform"
            >
              <span className="text-xl">💬</span>
            </a>
          )}
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="pb-8">
        <div className="sticky top-0 bg-slate-50/95 backdrop-blur-md z-50 border-b border-gray-200/60 shadow-md">
          <ElegantHeader />

          {isWaiter && (
            <div className="bg-indigo-600 text-white text-xs font-bold text-center py-2.5 px-4 flex items-center justify-center gap-2">
              <span>🧑‍💼 MODO MESERO ACTIVO — Tomando pedido para: {allTables.find(t => t.id === selectedTableId)?.label || `Mesa ${selectedTableId}`}</span>
            </div>
          )}
          <div className="py-2">
            <CategoryNav 
              categories={categories} 
              activeId={activeCategoryId} 
              onSelect={scrollToCategory} 
            />
          </div>
        </div>
      
      <div className="p-4 space-y-12 animate-fade-in">
        {categories.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center px-4 bg-white shadow-sm/40 rounded-3xl border border-gray-200">
            <span className="text-4xl mb-4">🍽️</span>
            <h3 className="text-xl font-bold text-slate-900 mb-2">Menú en preparación</h3>
            <p className="text-sm text-gray-500 max-w-sm">
              El restaurante está configurando su menú en este momento. Por favor, vuelve a cargar la página en unos minutos.
            </p>
          </div>
        ) : (
          categories.map(category => {
            const categoryProducts = products.filter(p => p.category_id === category.id);
            if (categoryProducts.length === 0) return null;
            
            return (
              <div key={category.id} id={`category-${category.id}`} className="scroll-mt-24">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">{category.name}</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {categoryProducts.map(product => (
                    <ProductCard 
                      key={product.id} 
                      product={product} 
                      onAdd={handleAddToCart}
                      currency={currency}
                      disabled={isClosed}
                    />
                  ))}
                </div>
              </div>
            );
          })
        )}
      </div>

      </div>

      {/* Closed Overlay */}
      {isClosed && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-6">
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl animate-scale-in">
            <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 border-4 border-slate-200">
              <span className="text-4xl">😴</span>
            </div>
            <h3 className="text-2xl font-black text-slate-900 mb-2">Estamos Cerrados</h3>
            <p className="text-slate-500 mb-6">
              El restaurante se encuentra fuera de su horario de atención. Vuelve más tarde para disfrutar de nuestro menú.
            </p>
            <button 
              onClick={() => window.location.reload()}
              className="w-full bg-slate-900 text-white font-bold py-4 rounded-xl shadow-lg hover:shadow-xl transition-all"
            >
              Actualizar
            </button>
          </div>
        </div>
      )}

      {/* Floating Cart Button */}
      {getItemCount() > 0 && step === 'browse' && (
        <div className="fixed bottom-6 left-0 right-0 z-40 px-4 max-w-2xl mx-auto animate-slide-up">
          <button 
            onClick={() => setIsCartOpen(true)}
            className="w-full brand-bg hover:brightness-110 text-white shadow-2xl shadow-orange-500/20 rounded-2xl py-4 px-6 flex items-center justify-between font-bold text-lg active:scale-95 transition-all"
          >
            <div className="flex items-center gap-3">
              <div className="bg-white/20 px-3 py-1 rounded-full text-sm">
                {getItemCount()}
              </div>
              <span>Ver Pedido</span>
            </div>
            <span>{formatPrice(finalTotal, currency)}</span>
          </button>
        </div>
      )}

      <CartDrawer 
        isOpen={isCartOpen} 
        onClose={() => setIsCartOpen(false)} 
        onCheckout={handleCheckoutClick}
        onSendLater={handleSendLater}
        currency={currency}
        onEditItem={handleEditCartItem}
        deliveryFee={deliveryFee}
        deliveryEnabled={deliveryEnabled}
        discountPercentage={discountPercentage}
        isDelivery={isDelivery}
        isMesaOrWaiter={!isDelivery}
      />

      <UpsellModal 
        isOpen={step === 'upsell'}
        products={upsellProducts}
        onAdd={handleUpsellAdd}
        onSkip={handleUpsellProceed}
        currency={currency}
      />

      <ProductCustomizationModal 
        isOpen={!!customizingProduct}
        product={customizingProduct}
        onClose={() => {
          setCustomizingProduct(null);
          setEditingCartItemId(null);
          setEditingInitialSelections([]);
        }}
        onAddToCart={handleModalAddToCart}
        currency={currency}
        initialSelections={editingInitialSelections}
        isEditing={!!editingCartItemId}
      />
    </>
  );
}
