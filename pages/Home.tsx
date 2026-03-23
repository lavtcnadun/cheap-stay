
import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { Property, HomepageSettings, AdStatus } from '../types';
import PropertyCard from '../components/PropertyCard';
import { Link } from 'react-router-dom';

const Home: React.FC = () => {
  const [properties, setProperties] = useState<Property[]>([]);
  const [settings, setSettings] = useState<HomepageSettings | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Search state
  const [searchTerm, setSearchTerm] = useState('');
  const [location, setLocation] = useState('');
  const [priceRange, setPriceRange] = useState('all');
  const [bedrooms, setBedrooms] = useState('all');

  useEffect(() => {
    fetchData();
    document.title = "CheapStay | Nuwara Eliya Budget Stays & Rentals";
  }, []);

  const fetchData = async () => {
    setLoading(true);
    const { data: setts } = await supabase.from('homepage_settings').select('*').single();
    if (setts) setSettings(setts);

    const now = new Date().toISOString();
    const { data: props } = await supabase
      .from('properties')
      .select('*')
      .eq('status', AdStatus.APPROVED)
      .gt('expiry_date', now)
      .order('created_at', { ascending: false });

    if (props) setProperties(props);
    setLoading(false);
  };

  const filteredProperties = properties.filter(p => {
    const matchesSearch = p.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          p.location.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesLocation = location === '' || p.location.toLowerCase().includes(location.toLowerCase());
    const matchesBedrooms = bedrooms === 'all' || p.bedrooms === parseInt(bedrooms);
    
    let matchesPrice = true;
    if (priceRange === '0-5000') matchesPrice = p.price_per_night <= 5000;
    else if (priceRange === '5001-15000') matchesPrice = p.price_per_night > 5000 && p.price_per_night <= 15000;
    else if (priceRange === '15001+') matchesPrice = p.price_per_night > 15000;

    return matchesSearch && matchesLocation && matchesBedrooms && matchesPrice;
  });

  return (
    <div className="space-y-12 pb-20">
      {/* Hero Section - SEO Centric */}
      <section className="relative h-[650px] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img 
            src={settings?.hero_image || 'https://images.unsplash.com/photo-1549410191-44330669ba4c?auto=format&fit=crop&q=80&w=1920'} 
            className="w-full h-full object-cover"
            alt="Beautiful misty mountains of Nuwara Eliya, Sri Lanka"
          />
          <div className="absolute inset-0 bg-black/50 backdrop-blur-[1px]"></div>
        </div>
        
        <div className="relative z-10 text-center px-4 max-w-4xl mx-auto space-y-6">
          <h1 className="text-4xl md:text-7xl font-extrabold text-white leading-tight drop-shadow-2xl">
            {settings?.homepage_heading || "Cheap Stays in Nuwara Eliya"}
          </h1>
          <h2 className="text-lg md:text-2xl text-slate-100 drop-shadow-sm font-medium opacity-90">
            {settings?.homepage_description || "Browse the best budget hotels, affordable guest houses, and cheap villas in Sri Lanka's hill country."}
          </h2>
          
          {/* Search Bar - Main Conversion Point */}
          <div className="bg-white/95 backdrop-blur-md p-2 rounded-2xl md:rounded-full shadow-2xl flex flex-col md:flex-row items-center gap-2 max-w-3xl mx-auto border border-white/20">
            <div className="flex-1 w-full flex items-center px-4 py-2 group">
              <svg className="w-5 h-5 text-slate-400 group-focus-within:text-emerald-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
              <input 
                type="text" 
                placeholder="Find cheap villas, apartments, or rooms..." 
                className="w-full bg-transparent outline-none text-slate-800 placeholder-slate-400 font-bold"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="h-8 w-px bg-slate-200 hidden md:block"></div>
            <div className="w-full md:w-auto px-4 py-2">
              <select 
                className="w-full bg-transparent outline-none text-slate-600 font-bold"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              >
                <option value="">All Locations</option>
                <option value="Lake Gregory">Lake Gregory Area</option>
                <option value="Town Center">Town Center</option>
                <option value="Hakgala">Hakgala & Botanical Gardens</option>
                <option value="Moon Plains">Moon Plains</option>
                <option value="Shanthipura">Shanthipura (High View)</option>
              </select>
            </div>
            <button className="w-full md:w-auto bg-emerald-600 hover:bg-emerald-700 text-white font-black py-4 px-10 rounded-xl md:rounded-full transition-all shadow-xl shadow-emerald-600/30 active:scale-95">
              Find My Stay
            </button>
          </div>

          <div className="pt-4 flex flex-wrap justify-center gap-4">
             <span className="text-white/60 text-xs font-bold uppercase tracking-widest bg-white/10 px-3 py-1 rounded-full border border-white/10">#BudgetTravelSL</span>
             <span className="text-white/60 text-xs font-bold uppercase tracking-widest bg-white/10 px-3 py-1 rounded-full border border-white/10">#CheapStayNuwaraEliya</span>
             <span className="text-white/60 text-xs font-bold uppercase tracking-widest bg-white/10 px-3 py-1 rounded-full border border-white/10">#VisitSriLanka</span>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
        
        {/* Why Choose Us Section - SEO Content */}
        <section className="py-10 text-center space-y-4">
           <h2 className="text-3xl font-black text-slate-800">Why CheapStay Nuwara Eliya?</h2>
           <p className="text-slate-500 max-w-2xl mx-auto font-medium">
             We specialize in connecting budget travelers from around the world with high-quality, 
             vetted rentals in the coolest city in Sri Lanka. From lakeside rooms to mountain cabins, 
             we ensure you get the best price for your stay.
           </p>
        </section>

        {/* Filter Toolbar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex flex-col">
              <span className="text-[10px] font-black text-slate-400 uppercase ml-1 mb-1">Price Nightly</span>
              <select 
                className="bg-slate-50 px-6 py-2 rounded-xl text-sm font-black text-slate-800 outline-none border border-slate-200"
                value={priceRange}
                onChange={(e) => setPriceRange(e.target.value)}
              >
                <option value="all">Any Price</option>
                <option value="0-5000">Under Rs. 5,000</option>
                <option value="5001-15000">Rs. 5,000 - 15,000</option>
                <option value="15001+">Above Rs. 15,000</option>
              </select>
            </div>

            <div className="flex flex-col">
              <span className="text-[10px] font-black text-slate-400 uppercase ml-1 mb-1">Room Capacity</span>
              <select 
                className="bg-slate-50 px-6 py-2 rounded-xl text-sm font-black text-slate-800 outline-none border border-slate-200"
                value={bedrooms}
                onChange={(e) => setBedrooms(e.target.value)}
              >
                <option value="all">Any Bedrooms</option>
                <option value="1">1 Bedroom</option>
                <option value="2">2 Bedrooms</option>
                <option value="3">3+ Bedrooms</option>
              </select>
            </div>
          </div>
          
          <div className="text-slate-400 text-sm font-black uppercase tracking-widest">
            <span className="text-emerald-600 font-black text-lg">{filteredProperties.length}</span> verified stays
          </div>
        </div>

        {/* Listings Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-10">
            {[1,2,3,4].map(n => (
              <div key={n} className="animate-pulse space-y-4">
                <div className="bg-slate-200 h-72 rounded-[2rem]"></div>
                <div className="h-4 bg-slate-200 rounded w-3/4"></div>
                <div className="h-4 bg-slate-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        ) : filteredProperties.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-10">
            {filteredProperties.map(property => (
              <PropertyCard key={property.id} property={property} />
            ))}
          </div>
        ) : (
          <div className="text-center py-32 bg-slate-50 rounded-[3rem] border-4 border-dashed border-slate-100">
            <div className="text-slate-200 mb-6">
              <svg className="w-20 h-20 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1" /></svg>
            </div>
            <h3 className="text-2xl font-black text-slate-800">No cheap stays found here!</h3>
            <p className="text-slate-500 mt-2 font-medium">Try broadening your search or selecting a different location in Nuwara Eliya.</p>
          </div>
        )}
      </main>

      {/* SEO Footer Content Section */}
      <section className="max-w-7xl mx-auto px-4 py-20 border-t border-slate-100">
         <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <div className="space-y-4">
               <h2 className="text-xl font-black text-slate-800 uppercase tracking-tight">Travel Nuwara Eliya on a Budget</h2>
               <p className="text-sm text-slate-500 leading-relaxed font-medium">
                 Nuwara Eliya, often called "Little England," is famous for its tea plantations, Gregory Lake, 
                 and cool climate. While it can be expensive, <strong>CheapStay</strong> helps you find the 
                 most affordable rooms in Nuwara Eliya without sacrificing comfort. Our platform is 
                 the preferred choice for budget-conscious travelers in Sri Lanka.
               </p>
            </div>
            <div className="space-y-4">
               <h2 className="text-xl font-black text-slate-800 uppercase tracking-tight">Popular Neighborhoods</h2>
               <div className="flex flex-wrap gap-2">
                  <span className="text-[11px] font-bold text-slate-500 bg-slate-100 px-3 py-1 rounded-full">Lake Gregory Budget Stays</span>
                  <span className="text-[11px] font-bold text-slate-500 bg-slate-100 px-3 py-1 rounded-full">Horton Plains Proximity Stays</span>
                  <span className="text-[11px] font-bold text-slate-500 bg-slate-100 px-3 py-1 rounded-full">Pedro Tea Estate Rooms</span>
                  <span className="text-[11px] font-bold text-slate-500 bg-slate-100 px-3 py-1 rounded-full">Victoria Park Guest Houses</span>
               </div>
            </div>
         </div>
      </section>

      {/* Floating Action Button for Contact */}
      <a 
        href="https://wa.me/94700000000" 
        target="_blank" 
        rel="noopener noreferrer"
        className="fixed bottom-8 right-8 bg-[#25D366] text-white p-4 rounded-full shadow-2xl hover:scale-110 transition-transform z-50 group flex items-center space-x-2"
        title="Chat with CheapStay Support"
      >
        <span className="max-w-0 overflow-hidden group-hover:max-w-xs transition-all duration-300 font-black uppercase text-xs tracking-widest px-0 group-hover:px-2">Help</span>
        <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
      </a>
    </div>
  );
};

export default Home;
