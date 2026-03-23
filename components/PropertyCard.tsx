
import React from 'react';
import { Link } from 'react-router-dom';
import { Property } from '../types';

interface PropertyCardProps {
  property: Property;
}

const PropertyCard: React.FC<PropertyCardProps> = ({ property }) => {
  return (
    <Link 
      to={`/property/${property.id}`}
      className="group bg-white rounded-2xl overflow-hidden border border-slate-200 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
    >
      <div className="relative aspect-[4/3] overflow-hidden">
        <img 
          src={property.images[0] || 'https://picsum.photos/seed/cs/400/300'} 
          alt={property.title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          loading="lazy"
        />
        <div className="absolute top-3 left-3 bg-white/90 backdrop-blur px-3 py-1 rounded-full text-xs font-bold text-slate-800 shadow-sm">
          {property.location}
        </div>
        <div className="absolute bottom-3 right-3 bg-emerald-600 text-white px-3 py-1 rounded-lg text-sm font-bold shadow-lg">
          Rs. {property.price_per_night.toLocaleString()} / night
        </div>
      </div>
      
      <div className="p-4">
        <h3 className="font-bold text-lg text-slate-800 line-clamp-1 group-hover:text-emerald-600 transition-colors">
          {property.title}
        </h3>
        <p className="text-slate-500 text-sm mt-1 flex items-center">
          <svg className="w-4 h-4 mr-1 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1" />
          </svg>
          {property.bedrooms} Bedrooms • Nuwara Eliya
        </p>
        <div className="mt-3 flex flex-wrap gap-1">
          {property.amenities.slice(0, 3).map((amenity, idx) => (
            <span key={idx} className="bg-slate-100 text-slate-600 text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider font-semibold">
              {amenity}
            </span>
          ))}
          {property.amenities.length > 3 && (
            <span className="text-[10px] text-slate-400 font-medium">+{property.amenities.length - 3} more</span>
          )}
        </div>
      </div>
    </Link>
  );
};

export default PropertyCard;
