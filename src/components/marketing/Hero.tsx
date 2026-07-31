'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, QrCode, Timer, TrendingUp, ShoppingBag, Plus, Clock, CheckCircle2, Activity, Search, X } from 'lucide-react';

export function Hero() {
  const [isDemoOpen, setIsDemoOpen] = useState(false);

  return (
    <section id="home" className="relative pt-12 pb-12 md:pt-16 md:pb-20 overflow-hidden bg-gradient-to-br from-[#080d1a] via-[#0f1627] to-[#030610]">
      
      {/* =========================================
          FASE 1: GLOWS LÍQUIDOS DE FONDO (Armonía Naranja/Ámbar)
      ========================================= */}
      {/* Resplandor Naranja Superior Izquierdo */}
      <div className="absolute top-[-10%] left-[10%] w-[500px] h-[500px] bg-orange-500/10 rounded-full blur-[140px] pointer-events-none mix-blend-screen" />
      {/* Resplandor Ámbar Inferior Derecho (Detrás de mockups) */}
      <div className="absolute bottom-[10%] right-[5%] w-[600px] h-[600px] bg-amber-500/8 rounded-full blur-[150px] pointer-events-none mix-blend-screen" />

      {/* Estilos locales para las animaciones flotantes */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes floatPhone {
          0%, 100% { transform: translateY(0px) rotate(-6deg); }
          50% { transform: translateY(-12px) rotate(-4deg); }
        }
        @keyframes floatLaptop {
          0%, 100% { transform: translateY(0px) rotate(0.5deg); }
          50% { transform: translateY(-8px) rotate(-0.5deg); }
        }
        @keyframes floatBadge {
          0%, 100% { transform: translateY(0px) rotate(-3deg); }
          50% { transform: translateY(-15px) rotate(3deg); }
        }
        .animate-float-phone {
          animation: floatPhone 6s ease-in-out infinite;
        }
        .animate-float-laptop {
          animation: floatLaptop 8s ease-in-out infinite;
        }
        .animate-float-badge {
          animation: floatBadge 7s ease-in-out infinite reverse;
        }
      `}} />

      {/* =========================================
          FASE 2: CONTENEDOR DE CONTENIDO
      ========================================= */}
      <div className="relative z-20 max-w-7xl mx-auto px-6 grid lg:grid-cols-[1.1fr_0.9fr] gap-16 items-center">
        
        {/* LADO IZQUIERDO: Copywriting adaptado a Dark Mode */}
        <div className="text-center lg:text-left flex flex-col justify-center">
          <h1 className="tracking-tight mb-5 animate-fade-in-up">
            <span className="text-4xl sm:text-5xl md:text-6xl lg:text-[76px] font-black text-white leading-none block">
              Menú Interactivo
            </span>
            <span className="text-3xl sm:text-4xl md:text-5xl lg:text-[60px] font-black leading-tight text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-amber-300 block mt-2">
              Aumenta Delivery
            </span>
            <span className="text-2xl sm:text-3xl md:text-4xl lg:text-[46px] font-black leading-tight text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-orange-600 block mt-1">
              Gestiona tus Clientes
            </span>
          </h1>
          <p className="max-w-xl mx-auto lg:mx-0 text-lg md:text-xl text-slate-300 mb-8 leading-relaxed animate-fade-in-up" style={{animationDelay: '100ms'}}>
            glubbi.app une Menú Digital, Pedidos QR/NFC, Kitchen Display System, CRM y Analítica con IA en un solo ecosistema. De la mesa a la cocina en segundos.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 animate-fade-in-up" style={{animationDelay: '200ms'}}>
            {/* Botón Principal con resplandor (Glow shadow) */}
            <Link href="/register" className="w-full sm:w-auto">
              <button className="group flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-full px-8 w-full sm:w-auto h-14 text-lg transition-all shadow-[0_0_30px_-5px_rgba(249,115,22,0.4)] active:scale-[0.98]">
                Regístrate
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 transition-transform group-hover:translate-x-1"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
              </button>
            </Link>
            {/* Botón Secundario estilo Glassmorphism */}
            <button 
              onClick={() => setIsDemoOpen(true)}
              className="w-full sm:w-auto bg-white/5 border border-white/10 text-white hover:bg-white/10 backdrop-blur-md rounded-full px-8 h-14 text-lg transition-all active:scale-[0.98]"
            >
              Ver Demo
            </button>
          </div>
        </div>

        {/* LADO DERECHO: Mockups "emitiendo luz" que rompen la ola */}
        {/* El translate-y-16 empuja los mockups hacia abajo para que crucen la línea del SVG */}
        <div className="relative w-full h-[500px] lg:h-[600px] flex items-center justify-center lg:translate-y-16 animate-fade-in-up" style={{animationDelay: '150ms'}}>
          <div className="relative w-full max-w-[590px] z-30 pt-16 sm:pt-20">
            
            {/* GLUBBI BADGE (Estático, más alto, más grande) */}
            <div className="absolute -top-12 sm:-top-16 left-1/2 -translate-x-1/2 z-50">
              <div className="flex items-center gap-4 bg-slate-900/80 backdrop-blur-xl border border-blue-500/50 p-3.5 pr-8 rounded-full shadow-[0_0_50px_-5px_rgba(59,130,246,0.5)]">
                {/* Logo Glubbi Real */}
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-slate-950 flex items-center justify-center shadow-inner overflow-hidden border border-blue-400/50 shrink-0">
                  <Image src="/logo-glubbi.png" alt="Glubbi Logo" width={80} height={80} className="object-cover w-full h-full" />
                </div>
                {/* Text */}
                <div className="flex flex-col justify-center">
                  <span className="text-[11px] sm:text-xs font-black text-blue-400 uppercase tracking-[0.25em] leading-none mb-1">Acceso Exclusivo</span>
                  <span className="text-base sm:text-lg font-bold text-slate-100 leading-none">APP Delivery</span>
                </div>
              </div>
            </div>

            {/* KDS LAPTOP (Pega tu código de estructura KDS actual aquí dentro) */}
            {/* Nota el shadow personalizado simulando luz que emana de la pantalla */}
            <div className="relative w-full h-[370px] rounded-2xl border border-slate-700 bg-slate-950 shadow-[0_0_60px_-15px_rgba(249,115,22,0.3)] z-20 animate-float-laptop overflow-hidden">
              
              {/* Cabecera del navegador */}
              <div className="h-8 bg-slate-900/90 border-b border-slate-800 flex items-center px-4 gap-1.5 relative select-none">
                <div className="flex gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                </div>
                <div className="w-56 h-4.5 rounded bg-slate-950/60 mx-auto text-[9px] text-slate-400 flex items-center justify-center tracking-wide font-mono border border-slate-800/40">
                  glubbi.app/admin/dashboard
                </div>
              </div>

              {/* Cuerpo del Dashboard */}
              <div className="flex h-[calc(100%-32px)]">
                {/* Sidebar del Dashboard */}
                <div className="w-24 bg-slate-900/40 border-r border-slate-900 p-2 flex flex-col gap-1.5 shrink-0 select-none">
                  <div className="text-[10px] font-black text-orange-500 mb-3 flex items-center gap-1">
                    <span className="w-2 h-2 rounded bg-orange-500" />
                    Glubbi
                  </div>
                  <div className="space-y-1">
                    <div className="bg-slate-800/80 text-orange-400 text-[8px] font-bold rounded px-2 py-1 flex items-center gap-1">
                      <Activity className="w-2.5 h-2.5" /> Kiosko
                    </div>
                    <div className="text-slate-400 text-[8px] rounded px-2 py-1 hover:bg-slate-800/30 transition-colors">Pedidos</div>
                    <div className="text-slate-400 text-[8px] rounded px-2 py-1 hover:bg-slate-800/30 transition-colors">Menú</div>
                    <div className="text-slate-400 text-[8px] rounded px-2 py-1 hover:bg-slate-800/30 transition-colors">Clientes</div>
                    <div className="text-slate-400 text-[8px] rounded px-2 py-1 hover:bg-slate-800/30 transition-colors">Ajustes</div>
                  </div>
                </div>

                {/* Contenido principal del KDS / Dashboard */}
                <div className="flex-1 bg-slate-950 p-3.5 flex flex-col gap-3 overflow-hidden">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <h2 className="text-xs font-bold text-slate-100">Panel Kiosko/Admin</h2>
                      <span className="flex items-center gap-1 text-[8px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        Tiempo real
                      </span>
                    </div>
                    <div className="text-[9px] text-slate-400 bg-slate-900 px-2 py-0.5 rounded-md border border-slate-800/60 font-semibold flex items-center gap-1">
                      <TrendingUp className="w-3 h-3 text-orange-500" /> Upsell IA: +23%
                    </div>
                  </div>

                  {/* Métricas destacadas */}
                  <div className="grid grid-cols-3 gap-2">
                    <div className="bg-slate-900/60 border border-slate-800/50 rounded-lg p-1.5 flex flex-col justify-between">
                      <span className="text-[7px] text-slate-400 uppercase tracking-wider">Ventas de Hoy</span>
                      <span className="text-[10px] font-extrabold text-slate-100">$1,424.50</span>
                    </div>
                    <div className="bg-slate-900/60 border border-slate-800/50 rounded-lg p-1.5 flex flex-col justify-between">
                      <span className="text-[7px] text-slate-400 uppercase tracking-wider">Pedidos Totales</span>
                      <span className="text-[10px] font-extrabold text-slate-100">48</span>
                    </div>
                    <div className="bg-slate-900/60 border border-slate-800/50 rounded-lg p-1.5 flex flex-col justify-between">
                      <span className="text-[7px] text-slate-400 uppercase tracking-wider">Ticket Prom.</span>
                      <span className="text-[10px] font-extrabold text-emerald-400 font-mono flex items-center gap-0.5">+$14.20</span>
                    </div>
                  </div>

                  {/* Tablero Kanban KDS de Pedidos */}
                  <div className="flex-1 grid grid-cols-3 gap-2 overflow-hidden min-h-0">
                    {/* Columna Entrantes */}
                    <div className="bg-slate-900/40 border border-orange-500/20 rounded-lg p-1.5 flex flex-col gap-1.5 min-h-0">
                      <div className="flex items-center justify-between shrink-0 pb-1 border-b border-slate-800/40">
                        <span className="text-[8px] font-bold text-orange-400 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-ping" />
                          Entrantes
                        </span>
                        <span className="text-[7px] text-slate-500 font-bold bg-slate-900 px-1 rounded">2</span>
                      </div>
                      <div className="space-y-1.5 overflow-y-auto pr-0.5 flex-1 select-none">
                        <div className="bg-slate-950 border border-orange-500/10 rounded-md p-1.5 flex flex-col gap-1 shadow-sm">
                          <div className="flex justify-between items-center text-[7px]">
                            <span className="font-bold text-orange-400">#2045 - Mesa 4</span>
                            <span className="text-slate-500 flex items-center gap-0.5"><Clock className="w-2 h-2" /> 1m</span>
                          </div>
                          <p className="text-[7.5px] text-slate-300 font-semibold truncate leading-tight">2x Burger Master, 1x Papas Trufadas</p>
                          <div className="flex justify-between items-center mt-1">
                            <span className="text-[7px] font-black text-slate-400">$31.97</span>
                            <span className="bg-orange-500 text-white text-[6.5px] font-extrabold px-1.5 py-0.5 rounded">Aceptar</span>
                          </div>
                        </div>
                        <div className="bg-slate-950 border border-slate-800 rounded-md p-1.5 flex flex-col gap-1 opacity-70">
                          <div className="flex justify-between items-center text-[7px]">
                            <span className="font-bold text-slate-400">#2044 - Delivery</span>
                            <span className="text-slate-500"><Clock className="w-2 h-2" /> 3m</span>
                          </div>
                          <p className="text-[7.5px] text-slate-300 truncate leading-tight">1x Chicken Crispy, 1x Limonada</p>
                        </div>
                      </div>
                    </div>

                    {/* Columna En Cocina */}
                    <div className="bg-slate-900/40 border border-blue-500/20 rounded-lg p-1.5 flex flex-col gap-1.5 min-h-0">
                      <div className="flex items-center justify-between shrink-0 pb-1 border-b border-slate-800/40">
                        <span className="text-[8px] font-bold text-blue-400 flex items-center gap-1">
                          <Clock className="w-2 h-2 text-blue-400" />
                          En Cocina
                        </span>
                        <span className="text-[7px] text-slate-500 font-bold bg-slate-900 px-1 rounded">1</span>
                      </div>
                      <div className="space-y-1.5 overflow-y-auto pr-0.5 flex-1 select-none">
                        <div className="bg-slate-950 border border-blue-500/20 rounded-md p-1.5 flex flex-col gap-1">
                          <div className="flex justify-between items-center text-[7px]">
                            <span className="font-bold text-blue-400">#2042 - Mesa 1</span>
                            <span className="text-emerald-400 flex items-center gap-0.5 bg-emerald-500/10 px-1 py-0.2 rounded"><Timer className="w-2 h-2" /> 4:12</span>
                          </div>
                          <p className="text-[7.5px] text-slate-300 font-semibold truncate leading-tight">1x Pizza Lab, 2x Soda</p>
                          <div className="flex justify-between items-center mt-1">
                            <span className="text-[7px] font-black text-slate-400">$22.00</span>
                            <span className="bg-blue-600 text-white text-[6.5px] font-extrabold px-1.5 py-0.5 rounded">Terminar</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Columna Entregados */}
                    <div className="bg-slate-900/40 border border-emerald-500/20 rounded-lg p-1.5 flex flex-col gap-1.5 min-h-0">
                      <div className="flex items-center justify-between shrink-0 pb-1 border-b border-slate-800/40">
                        <span className="text-[8px] font-bold text-emerald-400 flex items-center gap-1">
                          <CheckCircle2 className="w-2.5 h-2.5 text-emerald-400" />
                          Entregados
                        </span>
                        <span className="text-[7px] text-slate-500 font-bold bg-slate-900 px-1 rounded">5</span>
                      </div>
                      <div className="space-y-1.5 overflow-y-auto pr-0.5 flex-1 select-none">
                        <div className="bg-slate-950 border border-emerald-500/10 rounded-md p-1.5 flex flex-col gap-1 opacity-80">
                          <div className="flex justify-between items-center text-[7px]">
                            <span className="font-bold text-emerald-400">#2040 - Mesa 2</span>
                            <span className="text-slate-500">12m</span>
                          </div>
                          <p className="text-[7.5px] text-slate-400 truncate leading-tight">1x Burger Master, 1x Papa Frita</p>
                          <div className="flex justify-between items-center mt-1">
                            <span className="text-[7px] font-black text-slate-500">$18.98</span>
                            <span className="text-emerald-400 text-[6.5px] font-bold bg-emerald-500/10 px-1 py-0.2 rounded">Entregado</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* MÓVIL MENU (Pega tu código de estructura Móvil actual aquí dentro) */}
            {/* Nota el shadow personalizado simulando luz naranja emitiendo del dispositivo */}
            <div className="absolute -bottom-20 -left-12 w-[245px] h-[450px] rounded-[2.2rem] border-[6px] border-slate-800 bg-slate-950 shadow-[0_0_60px_-15px_rgba(249,115,22,0.4)] z-30 animate-float-phone overflow-hidden">
              
              {/* Dynamic Island / Notch */}
              <div className="absolute top-2 left-1/2 -translate-x-1/2 w-20 h-4.5 bg-slate-950 rounded-full z-30 flex items-center justify-center pointer-events-none">
                <span className="absolute right-3.5 w-1 h-1 rounded-full bg-slate-900 border border-slate-800" />
                <span className="absolute right-8 w-1.5 h-1.5 rounded-full bg-blue-950/40" />
              </div>

              {/* Pantalla del teléfono */}
              <div className="h-full flex flex-col justify-between bg-slate-50 relative">
                {/* Barra de estado */}
                <div className="h-5 bg-orange-500 text-white flex items-center justify-between px-4 text-[8px] pt-1 font-bold select-none shrink-0">
                  <span>9:41</span>
                  <div className="flex items-center gap-1">
                    <span>📶</span>
                    <span>🔋</span>
                  </div>
                </div>

                {/* Header curvo oficial Glubbi */}
                <div className="bg-orange-500 px-3 pt-1 pb-3 text-white rounded-b-2xl shadow-sm shrink-0 select-none">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[11px] font-black tracking-tight flex items-center gap-1">
                      glubbi<span className="text-orange-200">.app</span>
                    </span>
                    <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-[9px]">
                      🔔
                    </div>
                  </div>
                  <div className="bg-orange-600/60 rounded-xl px-2.5 py-1 text-[7.5px] flex items-center justify-between text-orange-50">
                    <span className="truncate">📍 Entregar en: <strong>Mérida Central</strong></span>
                    <span className="text-[9px]">▾</span>
                  </div>
                </div>

                {/* Lista de productos gourmet de alto impacto */}
                <div className="flex-1 p-2.5 overflow-y-auto space-y-2.5 select-none">
                  {/* Banner Oferta / Promo del día */}
                  <div className="relative h-16 rounded-xl overflow-hidden shadow-sm group">
                    <img
                      src="https://images.unsplash.com/photo-1513104890138-7c749659a591?w=400&auto=format&fit=crop&q=80"
                      alt="Promoción Especial"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-r from-slate-900/80 via-slate-900/40 to-transparent p-2 flex flex-col justify-center text-white">
                      <span className="bg-orange-500 text-[5.5px] font-extrabold px-1.5 py-0.5 rounded-full w-fit uppercase tracking-wider mb-0.5">2x1 HOY</span>
                      <h4 className="text-[9px] font-black leading-tight">Pizza Pepperoni Suprema</h4>
                      <p className="text-[6.5px] text-orange-200 font-semibold">$8.99 <span className="line-through text-slate-400">$14.00</span></p>
                    </div>
                  </div>

                  {/* Producto 1: Hamburguesa Gourmet */}
                  <div className="bg-white border border-slate-150 rounded-xl p-2 flex gap-2 shadow-sm relative hover:border-orange-500/30 transition-colors">
                    <div className="flex-1 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center gap-1 mb-0.5">
                          <span className="text-[6px] font-extrabold bg-orange-50 text-orange-600 border border-orange-100 px-1 py-0.2 rounded">🔥 TOP VENDIDO</span>
                        </div>
                        <h4 className="text-[9.5px] font-extrabold text-slate-900 leading-tight">Burger Master Glubbi</h4>
                        <p className="text-[6.5px] text-slate-500 leading-tight mt-0.5">Double smash beef, queso cheddar derretido, tocino crujiente.</p>
                      </div>
                      <div className="flex items-center justify-between mt-1.5">
                        <span className="text-[9.5px] font-black text-slate-900">$9.50</span>
                        <button className="bg-orange-500 hover:bg-orange-600 text-white text-[7.5px] font-bold px-2 py-0.5 rounded-lg shadow-sm flex items-center gap-0.5">
                          <span>+</span> Agregar
                        </button>
                      </div>
                    </div>
                    <div className="relative shrink-0 w-14 h-14 rounded-lg overflow-hidden border border-slate-100">
                      <img
                        src="https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=150&auto=format&fit=crop&q=80"
                        alt="Burger Master Glubbi"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>

                  {/* Producto 2: Sushi Roll Premium */}
                  <div className="bg-white border border-slate-150 rounded-xl p-2 flex gap-2 shadow-sm relative">
                    <div className="flex-1 flex flex-col justify-between">
                      <div>
                        <h4 className="text-[9.5px] font-extrabold text-slate-900 leading-tight">Fresh Salmon Roll</h4>
                        <p className="text-[6.5px] text-slate-500 leading-tight mt-0.5">Salmón fresco, aguacate, queso crema y lluvia de sésamo.</p>
                      </div>
                      <div className="flex items-center justify-between mt-1.5">
                        <span className="text-[9.5px] font-black text-slate-900">$11.00</span>
                        <button className="bg-orange-500 hover:bg-orange-600 text-white text-[7.5px] font-bold px-2 py-0.5 rounded-lg shadow-sm flex items-center gap-0.5">
                          <span>+</span> Agregar
                        </button>
                      </div>
                    </div>
                    <div className="relative shrink-0 w-14 h-14 rounded-lg overflow-hidden border border-slate-100">
                      <img
                        src="https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=150&auto=format&fit=crop&q=80"
                        alt="Fresh Salmon Roll"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>
                </div>

                {/* Bottom Bar Oficial con Botón Flotante Naranja de Carrito */}
                <div className="bg-white border-t border-slate-150 px-3 py-1.5 relative flex items-center justify-between shrink-0 shadow-lg select-none">
                  {/* Íconos laterales de navegación */}
                  <div className="flex items-center gap-4 text-slate-400">
                    <div className="flex flex-col items-center gap-0.5 text-orange-500 font-bold">
                      <span className="text-[10px]">🏠</span>
                      <span className="text-[5.5px]">Inicio</span>
                    </div>
                    <div className="flex flex-col items-center gap-0.5">
                      <span className="text-[10px]">📋</span>
                      <span className="text-[5.5px]">Pedidos</span>
                    </div>
                  </div>

                  {/* BOTÓN FLOTANTE CENTRAL CIRCULAR DE CARRITO GLUBBI */}
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-10 h-10 rounded-full bg-gradient-to-tr from-orange-600 to-orange-400 border-2 border-white flex items-center justify-center text-white shadow-lg shadow-orange-500/40 cursor-pointer active:scale-90 transition-transform">
                    <ShoppingBag className="w-4 h-4" />
                    <span className="absolute -top-1 -right-1 bg-slate-900 text-white text-[6.5px] font-black w-3.5 h-3.5 rounded-full flex items-center justify-center border border-white">
                      2
                    </span>
                  </div>

                  <div className="flex items-center gap-4 text-slate-400">
                    <div className="flex flex-col items-center gap-0.5">
                      <span className="text-[10px]">❤️</span>
                      <span className="text-[5.5px]">Favoritos</span>
                    </div>
                    <div className="flex flex-col items-center gap-0.5">
                      <span className="text-[10px]">👤</span>
                      <span className="text-[5.5px]">Perfil</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
          </div>
        </div>
      </div>

      {/* =========================================
          FASE 3: OLA SVG DIVISORIA ASIMÉTRICA
      ========================================= */}
      {/* El translate-y-[1px] elimina una pequeña línea de 1px que a veces renderizan los navegadores */}
      <div className="absolute bottom-0 left-0 w-full overflow-hidden leading-none z-10 transform translate-y-[1px]">
        <svg 
          className="relative block w-full h-[120px] md:h-[180px] lg:h-[240px]" 
          data-name="Layer 1" 
          xmlns="http://www.w3.org/2000/svg" 
          viewBox="0 0 1200 120" 
          preserveAspectRatio="none"
        >
          <path 
            d="M0,60 C150,110 350,110 500,70 C650,30 850,30 1000,70 C1100,90 1150,95 1200,90 L1200,120 L0,120 Z" 
            className="fill-slate-50" 
          ></path>
        </svg>
      </div>

      {/* =========================================
          FASE 4: CELULAR EMERGENTE (VIDEO DEMO MODAL)
      ========================================= */}
      {isDemoOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md transition-all duration-300"
          onClick={() => setIsDemoOpen(false)}
        >
          <div 
            className="relative w-full max-w-[360px] h-[640px] max-h-[90vh] rounded-[2.8rem] border-[12px] border-slate-900 bg-slate-950 shadow-[0_0_80px_rgba(249,115,22,0.3)] flex flex-col items-center justify-center overflow-hidden transition-all duration-300 transform scale-100"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Dynamic Island / Notch */}
            <div className="absolute top-3 left-1/2 -translate-x-1/2 w-28 h-5 bg-slate-950 rounded-full z-50 flex items-center justify-center pointer-events-none">
              <span className="absolute right-4 w-1.5 h-1.5 rounded-full bg-slate-900 border border-slate-800" />
              <span className="absolute right-10 w-2 h-2 rounded-full bg-blue-950/40" />
            </div>

            {/* Close Button */}
            <button 
              onClick={() => setIsDemoOpen(false)}
              className="absolute top-4 right-4 z-50 text-slate-400 hover:text-white transition-colors bg-black/40 hover:bg-black/60 p-1.5 rounded-full border border-white/10"
              aria-label="Cerrar video"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Screen Content: Video */}
            <div className="w-full h-full bg-slate-950 flex items-center justify-center rounded-[2.1rem] overflow-hidden relative">
              <video 
                src="/videos/VIDEO HERO.mp4" 
                controls 
                autoPlay 
                playsInline
                className="w-full h-full object-contain"
              />
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
