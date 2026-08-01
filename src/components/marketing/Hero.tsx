'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, X } from 'lucide-react';

export function Hero() {
  const [isDemoOpen, setIsDemoOpen] = useState(false);

  return (
    <section id="home" className="relative min-h-[calc(100vh-70px)] flex flex-col justify-between pt-4 pb-14 md:pt-6 md:pb-16 overflow-hidden bg-gradient-to-br from-[#080d1a] via-[#0f1627] to-[#030610]">
      
      {/* =========================================
          FASE 1: GLOWS LÍQUIDOS DE FONDO
      ========================================= */}
      <div className="absolute top-[-10%] left-[10%] w-[500px] h-[500px] bg-orange-500/10 rounded-full blur-[140px] pointer-events-none mix-blend-screen" />
      <div className="absolute bottom-[10%] right-[5%] w-[600px] h-[600px] bg-amber-500/8 rounded-full blur-[150px] pointer-events-none mix-blend-screen" />

      {/* Estilos de animación sutil */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes floatHero3D {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-14px) rotate(-1.5deg); }
        }
        .animate-float-3d {
          animation: floatHero3D 7s ease-in-out infinite;
        }
      `}} />

      {/* =========================================
          FASE 2: CONTENEDOR DE CONTENIDO PRINCIPAL
      ========================================= */}
      <div className="relative z-20 max-w-7xl mx-auto px-6 my-auto grid lg:grid-cols-[1.05fr_0.95fr] gap-8 lg:gap-12 items-center w-full">
        
        {/* LADO IZQUIERDO: COPYWRITING & BOTONES COMPACTOS DE ALTO IMPACTO */}
        <div className="text-center lg:text-left flex flex-col justify-center">
          <h1 className="tracking-tight mb-4 animate-fade-in-up">
            <span className="text-3xl sm:text-4xl md:text-5xl lg:text-[62px] font-black text-white leading-tight block">
              Menú Interactivo
            </span>
            <span className="text-2xl sm:text-3xl md:text-4xl lg:text-[48px] font-black leading-tight text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-amber-300 block mt-1">
              Aumenta Delivery
            </span>
            <span className="text-xl sm:text-2xl md:text-3xl lg:text-[38px] font-black leading-tight text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-orange-600 block mt-1">
              Gestiona tus Clientes
            </span>
          </h1>

          {/* DESCRIPCIÓN CON GLUBBI'APP EN VERDE */}
          <p className="max-w-lg mx-auto lg:mx-0 text-base md:text-lg text-slate-300 mb-6 leading-relaxed animate-fade-in-up" style={{animationDelay: '100ms'}}>
            <strong className="text-[#22c55e] font-black">Glubbi&apos;app</strong> une Menú Digital, Pedidos QR/NFC, Kitchen Display System, CRM y Analítica con IA en un solo ecosistema. De la mesa a la cocina en segundos.
          </p>
          
          {/* BOTONES DE ACCIÓN */}
          <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3.5 animate-fade-in-up" style={{animationDelay: '200ms'}}>
            {/* Botón Principal: Regístrate */}
            <Link href="/register" className="w-full sm:w-auto">
              <button className="group flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-extrabold rounded-full px-7 w-full sm:w-auto h-12 text-base transition-all shadow-[0_0_25px_-5px_rgba(249,115,22,0.4)] active:scale-[0.98]">
                Regístrate
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </button>
            </Link>

            {/* Botón Secundario: Ver Demo */}
            <button 
              onClick={() => setIsDemoOpen(true)}
              className="w-full sm:w-auto bg-white/5 border border-white/10 text-white hover:bg-white/10 backdrop-blur-md rounded-full px-7 h-12 text-base transition-all active:scale-[0.98]"
            >
              Ver Demo
            </button>
          </div>
        </div>

        {/* LADO DERECHO: COMPOSICIÓN 3D CELULAR (SIN SOMBRA NEGRA EN LA PARTE INFERIOR) */}
        <div className="relative w-full flex justify-center lg:justify-end items-center lg:translate-y-12 translate-y-6 animate-fade-in-up" style={{animationDelay: '150ms'}}>
          <div className="relative w-full max-w-[540px] sm:max-w-[660px] lg:max-w-[780px] xl:max-w-[840px] flex items-center justify-center lg:justify-end pointer-events-none">
            <img
              src="/hero-3d-composition.png"
              alt="Glubbi Ecosistema 3D Mobile"
              className="w-full h-auto object-contain"
            />
          </div>
        </div>

      </div>

      {/* =========================================
          FASE 3: BOTÓN OFICIAL DISPONIBLE EN GOOGLE PLAY (SECCIÓN CLARA)
      ========================================= */}
      <div className="absolute bottom-1 md:bottom-2 left-1/2 -translate-x-1/2 z-30 pointer-events-auto">
        <a 
          href="/glubbi" 
          target="_blank" 
          rel="noopener noreferrer"
          className="block transition-transform hover:scale-105 active:scale-95"
        >
          <img 
            src="/google-play-es.png" 
            alt="Disponible en Google Play" 
            className="h-10 sm:h-12 md:h-13 w-auto object-contain"
          />
        </a>
      </div>

      {/* =========================================
          FASE 4: OLA SVG DIVISORIA ASIMÉTRICA
      ========================================= */}
      <div className="absolute bottom-0 left-0 w-full overflow-hidden leading-none z-10 transform translate-y-[1px]">
        <svg 
          className="relative block w-full h-[120px] md:h-[160px] lg:h-[200px]" 
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
          FASE 5: MODAL DE VIDEO DEMO
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
            <div className="absolute top-3 left-1/2 -translate-x-1/2 w-28 h-5 bg-slate-950 rounded-full z-50 flex items-center justify-center pointer-events-none">
              <span className="absolute right-4 w-1.5 h-1.5 rounded-full bg-slate-900 border border-slate-800" />
              <span className="absolute right-10 w-2 h-2 rounded-full bg-blue-950/40" />
            </div>

            <button 
              onClick={() => setIsDemoOpen(false)}
              className="absolute top-4 right-4 z-50 text-slate-400 hover:text-white transition-colors bg-black/40 hover:bg-black/60 p-1.5 rounded-full border border-white/10"
              aria-label="Cerrar video"
            >
              <X className="w-4 h-4" />
            </button>

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
