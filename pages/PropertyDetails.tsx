
import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { Property } from '../types';

const PropertyDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [property, setProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeImage, setActiveImage] = useState(0);

  useEffect(() => {
    const fetchProperty = async () => {
      setLoading(true);
      const { data } = await supabase
        .from('properties')
        .select('*, profiles(*)')
        .eq('id', id)
        .single();
      
      if (data) {
        setProperty(data);
        // SEO: Dynamic Page Title
        document.title = `${data.title} | Cheap Stay Nuwara Eliya`;
      }
      setLoading(false);
    };

    fetchProperty();
  }, [id]);

  if (loading) return (
    <div className="max-w-7xl mx-auto px-4 py-12 animate-pulse space-y-8">
      <div className="h-[500px] bg-slate-200 rounded-[3rem]"></div>
      <div className="h-10 bg-slate-200 rounded-2xl w-1/2"></div>
      <div className="h-40 bg-slate-200 rounded-2xl"></div>
    </div>
  );

  if (!property) return (
    <div className="text-center py-20 bg-white min-h-[50vh] flex flex-col items-center justify-center space-y-4">
      <div className="text-slate-200">
        <svg className="w-24 h-24 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
      </div>
      <h2 className="text-3xl font-black text-slate-800">Property Not Found</h2>
      <p className="text-slate-500 font-medium">This listing might have expired or was removed by the owner.</p>
      <Link to="/" className="bg-emerald-600 text-white font-black px-10 py-3 rounded-2xl shadow-xl hover:bg-emerald-700 transition-all">Back to Explore Stays</Link>
    </div>
  );

  const normalizeWhatsappNumber = (whatsapp: string | undefined): string => {
    if (!whatsapp) return '94700000000';
    
    // Remove all non-numeric characters
    let cleaned = whatsapp.replace(/\D/g, '');
    
    // Sri Lanka Specific Normalization
    // If it starts with 0, replace with 94 (e.g., 0771234567 -> 94771234567)
    if (cleaned.startsWith('0')) {
      cleaned = '94' + cleaned.substring(1);
    }
    
    // If it starts with 7 and is 9 digits (local format without leading 0), add 94 (e.g., 771234567 -> 94771234567)
    if (cleaned.length === 9 && (cleaned.startsWith('7') || cleaned.startsWith('1') || cleaned.startsWith('9'))) {
       cleaned = '94' + cleaned;
    }

    // Default fallback if logic above doesn't apply
    return cleaned || '94700000000';
  };

  const whatsappNumber = normalizeWhatsappNumber(property.profiles?.whatsapp);
  const message = `Hi, I'm interested in your property ${property.title} (ID: ${property.advertisement_number}) listed on CheapStay Nuwara Eliya. Is it available?`;
  const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-12">
      {/* Breadcrumbs for SEO */}
      <nav className="flex items-center space-x-2 text-xs font-black text-slate-400 uppercase tracking-widest">
        <Link to="/" className="hover:text-emerald-600">Home</Link>
        <span>/</span>
        <Link to="/" className="hover:text-emerald-600">Nuwara Eliya Rentals</Link>
        <span>/</span>
        <span className="text-slate-800 truncate max-w-[200px]">{property.title}</span>
      </nav>

      {/* Header */}
      <div className="space-y-4">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-2">
            <h1 className="text-3xl md:text-5xl font-black text-slate-800 tracking-tight">{property.title}</h1>
            <div className="flex items-center space-x-2 text-slate-500 font-bold">
               <svg className="w-5 h-5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
               <span>{property.location}, Nuwara Eliya, Sri Lanka</span>
            </div>
          </div>
          <div className="bg-emerald-50 border border-emerald-100 p-6 rounded-[2rem] text-right flex flex-col justify-center shadow-sm">
             <p className="text-emerald-600 text-4xl font-black tracking-tighter">Rs. {property.price_per_night.toLocaleString()}</p>
             <p className="text-slate-400 text-xs font-black uppercase tracking-widest">Best Budget Rate / Night</p>
          </div>
        </div>
      </div>

      {/* Image Gallery */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 h-[400px] md:h-[650px]">
        <div className="md:col-span-3 rounded-[3rem] overflow-hidden relative shadow-2xl group">
          <img 
            src={property.images[activeImage]} 
            className="w-full h-full object-cover transition-opacity duration-500"
            alt={`${property.title} - Cheap Stay in ${property.location}`}
          />
          <div className="absolute inset-x-0 bottom-6 flex justify-center space-x-3">
            {property.images.map((_, i) => (
              <button 
                key={i} 
                onClick={() => setActiveImage(i)}
                className={`w-3 h-3 rounded-full border-2 border-white transition-all ${i === activeImage ? 'bg-white w-8' : 'bg-white/40'}`}
                aria-label={`View image ${i+1}`}
              ></button>
            ))}
          </div>
        </div>
        <div className="hidden md:flex flex-col gap-4 overflow-y-auto hide-scrollbar pr-2">
          {property.images.map((img, i) => (
            <button 
              key={i} 
              onClick={() => setActiveImage(i)}
              className={`relative h-32 rounded-3xl overflow-hidden border-4 transition-all shadow-md flex-shrink-0 ${i === activeImage ? 'border-emerald-500 scale-105 shadow-emerald-500/20' : 'border-transparent opacity-80 hover:opacity-100'}`}
            >
              <img src={img} className="w-full h-full object-cover" alt={`${property.title} preview ${i+1}`} />
            </button>
          ))}
        </div>
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        <div className="lg:col-span-2 space-y-10">
          <div className="p-10 bg-white rounded-[2.5rem] border border-slate-100 shadow-sm space-y-8">
            <div className="flex items-center justify-between pb-8 border-b border-slate-50">
               <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-sky-600 rounded-full flex items-center justify-center text-white text-xl font-black shadow-lg">
                    {property.profiles?.name.charAt(0)}
                  </div>
                  <div>
                    <h4 className="font-black text-xl text-slate-800">Verified Owner: {property.profiles?.name}</h4>
                    <p className="text-slate-400 text-sm font-bold uppercase tracking-widest">Elite Budget Host</p>
                  </div>
               </div>
               <div className="hidden sm:block text-right">
                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Listing Reference</p>
                 <p className="text-sky-600 font-black text-lg">{property.advertisement_number}</p>
               </div>
            </div>

            {/* Quick Specs - Optimized for User & SEO */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 space-y-1 text-center">
                 <p className="text-slate-400 text-[10px] uppercase font-black tracking-widest">Bedrooms</p>
                 <p className="text-2xl font-black text-slate-800">{property.bedrooms}</p>
              </div>
              <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 space-y-1 text-center">
                 <p className="text-slate-400 text-[10px] uppercase font-black tracking-widest">Location</p>
                 <p className="text-sm font-black text-slate-800 leading-tight">{property.location}</p>
              </div>
              <div className="p-6 bg-emerald-50 rounded-3xl border border-emerald-100 space-y-1 text-center">
                 <p className="text-emerald-700 text-[10px] uppercase font-black tracking-widest">Rating</p>
                 <p className="text-sm font-black text-emerald-600 uppercase">Top Rated</p>
              </div>
              <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 space-y-1 text-center">
                 <p className="text-slate-400 text-[10px] uppercase font-black tracking-widest">Property ID</p>
                 <p className="text-xs font-black text-slate-800">{property.advertisement_number.split('-').pop()}</p>
              </div>
            </div>

            <div className="space-y-6">
              <h3 className="text-2xl font-black text-slate-800 tracking-tight">Stay Details & Features</h3>
              <p className="text-slate-600 leading-relaxed font-medium whitespace-pre-line text-lg italic">
                {property.description}
              </p>
            </div>

            <div className="space-y-6 pt-6 border-t border-slate-50">
              <h3 className="text-2xl font-black text-slate-800 tracking-tight">Provided Amenities</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-6">
                {property.amenities.map((item, idx) => (
                  <div key={idx} className="flex items-center space-x-3 text-slate-700 bg-slate-50/50 p-3 rounded-2xl border border-transparent hover:border-emerald-100 transition-all">
                    <div className="w-8 h-8 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center">
                       <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                    </div>
                    <span className="font-bold text-sm">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          {/* SEO Local Guide Text */}
          <div className="p-8 bg-slate-900 text-white rounded-[2.5rem] shadow-2xl relative overflow-hidden">
             <div className="relative z-10 space-y-4">
                <h4 className="text-xl font-black">Nuwara Eliya Budget Travel Tip</h4>
                <p className="text-slate-300 font-medium leading-relaxed italic">
                  "Staying in {property.location} is a fantastic choice for budget seekers. 
                  Most key attractions in Nuwara Eliya are within a 15-minute drive from here. 
                  Don't forget to pack warm clothes—the nights get chilly even in the best budget rooms!"
                </p>
             </div>
             <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-emerald-600/20 rounded-full blur-3xl"></div>
          </div>
        </div>

        {/* Sidebar / Booking CTA */}
        <div className="space-y-8">
           <div className="sticky top-28 p-10 bg-white rounded-[2.5rem] shadow-2xl border border-slate-100 space-y-8">
              <div className="space-y-3">
                 <h4 className="text-2xl font-black text-slate-800 tracking-tight">Check Availability</h4>
                 <p className="text-slate-500 text-sm font-medium leading-relaxed">Direct messaging ensures you get the <span className="text-emerald-600 font-black italic">lowest possible price</span> without commission fees.</p>
              </div>

              <div className="p-6 bg-sky-50 rounded-3xl border border-sky-100 space-y-2">
                 <p className="text-sky-800 font-black uppercase text-[10px] tracking-widest">Booking Reference</p>
                 <p className="text-sky-600 font-black text-3xl tracking-tighter">{property.advertisement_number}</p>
              </div>

              <div className="space-y-3">
                <a 
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full bg-[#25D366] hover:bg-[#20bd5a] text-white text-center font-black py-5 rounded-[2rem] transition-all shadow-xl shadow-emerald-500/30 active:scale-95 flex items-center justify-center space-x-3 text-lg"
                >
                  <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                  <span>Book on WhatsApp</span>
                </a>
                <p className="text-[10px] text-slate-400 text-center uppercase tracking-widest font-black">Zero Commission Guaranteed</p>
              </div>

              <div className="pt-6 border-t border-slate-50 flex items-center justify-between">
                 <div className="flex -space-x-2">
                    {[1,2,3,4].map(i => <div key={i} className="w-8 h-8 rounded-full border-2 border-white bg-slate-200"></div>)}
                 </div>
                 <p className="text-xs text-slate-400 font-bold">42 people viewed this today</p>
              </div>
           </div>
           
           <div className="p-6 bg-slate-100 rounded-3xl border border-slate-200">
              <h5 className="font-black text-slate-700 uppercase text-[10px] tracking-widest mb-2">CheapStay Promise</h5>
              <p className="text-slate-500 text-xs font-medium leading-relaxed">
                All listings in Nuwara Eliya are manually verified by our team. If you encounter any issues with this property, please contact our support.
              </p>
           </div>
        </div>
      </div>
    </div>
  );
};

export default PropertyDetails;
