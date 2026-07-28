import React from 'react';
import Link from 'next/link';
import { Star, Clock, MapPin, Bike } from 'lucide-react';

interface Restaurant {
  id: string;
  slug: string;
  name: string;
  logo_url?: string;
  cover_image_url?: string;
  rating?: number;
  estimated_time?: string;
  glubbi_category?: string;
  isOpen?: boolean;
}

interface HorizontalScrollProps {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  restaurants: Restaurant[];
  tagText?: string;
  tagColor?: string;
}

export default function HorizontalRestaurantScroll({ 
  title, 
  subtitle, 
  icon, 
  restaurants,
  tagText,
  tagColor = 'bg-orange-500 text-white'
}: HorizontalScrollProps) {
  
  if (!restaurants || restaurants.length === 0) return null;

  return (
    <div className="mt-8">
      <div className="flex items-center justify-between px-4 mb-3">
        <div>
          <h3 className="text-lg font-black text-slate-800 flex items-center gap-2">
            {icon} {title}
          </h3>
          {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
        </div>
        <button className="text-sm font-bold text-orange-500">Ver más</button>
      </div>

      <div className="flex overflow-x-auto hide-scrollbar gap-4 px-4 pb-4 snap-x">
        {restaurants.map((rest) => (
          <Link 
            href={`/${rest.slug}/mesa/delivery?glubbi=true`} 
            key={rest.id}
            className="snap-start shrink-0 w-[240px] bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden block active:scale-[0.98] transition-transform relative"
          >
            {/* Cover Image */}
            <div className="w-full h-32 bg-gray-200 relative">
              {rest.cover_image_url ? (
                <img 
                  src={rest.cover_image_url} 
                  alt={rest.name} 
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-slate-200 to-slate-300 flex items-center justify-center">
                  <span className="text-slate-400 font-medium">Sin Portada</span>
                </div>
              )}
              
              {/* Optional Custom Tag */}
              {tagText && (
                <div className={`absolute top-2 left-2 px-2 py-1 rounded-lg text-[10px] font-bold shadow-sm ${tagColor}`}>
                  {tagText}
                </div>
              )}
              
              {/* Closed Overlay */}
              {rest.isOpen === false && (
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center backdrop-blur-[1px]">
                  <span className="bg-slate-900/80 text-white text-xs font-bold px-3 py-1 rounded-full border border-white/20 shadow-lg">CERRADO</span>
                </div>
              )}
            </div>

            {/* Info */}
            <div className={`p-3 ${rest.isOpen === false ? 'opacity-60' : ''}`}>
              <h4 className="font-bold text-slate-800 text-sm mb-1 truncate">{rest.name}</h4>
              <p className="text-xs text-slate-500 truncate mb-2">{rest.glubbi_category || 'Comida'}</p>
              
              <div className="flex items-center justify-between text-xs font-semibold">
                <div className="flex items-center text-slate-700">
                  <Star className={`w-3.5 h-3.5 mr-1 ${rest.isOpen === false ? 'text-gray-400 fill-gray-400' : 'text-yellow-500 fill-yellow-500'}`} />
                  {rest.rating?.toFixed(1) || '4.5'}
                </div>
                <div className="flex items-center text-slate-700">
                  <Clock className="w-3.5 h-3.5 mr-1 text-slate-400" />
                  {rest.estimated_time || '30-45 min'}
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
