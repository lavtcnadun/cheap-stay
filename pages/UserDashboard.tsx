
import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { Property, AdStatus, UserProfile } from '../types';
import { convertToWebP, generateAdNumber } from '../utils/imageUtils';
import { useNavigate, Link } from 'react-router-dom';

const AMENITIES_LIST = [
  'Wifi', 'Hot Water', 'Kitchen', 'Parking', 'TV', 
  'Heater', 'Lake View', 'Garden', 'Breakfast Included', 'Pet Friendly'
];

const UserDashboard: React.FC = () => {
  const [ads, setAds] = useState<Property[]>([]);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const navigate = useNavigate();

  // Form State
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    location: '',
    bedrooms: '1',
    amenities: [] as string[],
  });
  const [files, setFiles] = useState<File[]>([]);
  const [showPayment, setShowPayment] = useState(false);
  const [newAdId, setNewAdId] = useState<string | null>(null);
  const [newAdNumber, setNewAdNumber] = useState<string | null>(null);
  const [slipFile, setSlipFile] = useState<File | null>(null);

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate('/login');
      return;
    }

    const { data: prof } = await supabase.from('profiles').select('*').eq('id', user.id).single();
    setProfile(prof);

    const { data: properties } = await supabase
      .from('properties')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (properties) setAds(properties);
    setLoading(false);
  };

  const handleToggleAmenity = (amenity: string) => {
    setFormData(prev => ({
      ...prev,
      amenities: prev.amenities.includes(amenity)
        ? prev.amenities.filter(a => a !== amenity)
        : [...prev.amenities, amenity]
    }));
  };

  const startEditing = (ad: Property) => {
    setFormData({
      title: ad.title,
      description: ad.description,
      price: ad.price_per_night.toString(),
      location: ad.location,
      bedrooms: ad.bedrooms.toString(),
      amenities: ad.amenities || [],
    });
    setIsEditing(ad.id);
    setIsAdding(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSaveAd = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      let imageUrls: string[] = [];
      
      if (files.length > 0) {
        if (files.length > 5) throw new Error('Maximum 5 images allowed');
        for (const file of files) {
          const webpBlob = await convertToWebP(file);
          const fileName = `${user.id}/${Date.now()}-${Math.random().toString(36).substring(7)}.webp`;
          const { data, error } = await supabase.storage.from('properties').upload(fileName, webpBlob, { contentType: 'image/webp' });
          if (error) throw error;
          const { data: { publicUrl } } = supabase.storage.from('properties').getPublicUrl(data.path);
          imageUrls.push(publicUrl);
        }
      }

      if (isEditing) {
        // Find existing ad to check if it's already approved
        const existingAd = ads.find(a => a.id === isEditing);
        
        const updateData: any = {
          title: formData.title,
          description: formData.description,
          price_per_night: parseFloat(formData.price),
          location: formData.location,
          bedrooms: parseInt(formData.bedrooms),
          amenities: formData.amenities,
        };

        // If images are provided, update them. Otherwise keep existing.
        if (imageUrls.length > 0) updateData.images = imageUrls;

        // NOTE: Edits to approved ads keep their approved status in this implementation, 
        // allowing instant updates as requested.
        const { error } = await supabase.from('properties').update(updateData).eq('id', isEditing);
        if (error) throw error;
        
        alert('Advertisement updated successfully!');
        resetForm();
      } else {
        // Create new
        if (files.length === 0) throw new Error('Please upload at least one image');
        
        // Use a unique number based on current count
        const { count } = await supabase.from('properties').select('*', { count: 'exact', head: true });
        const adNumber = generateAdNumber((count || 0) + 1);

        const { data: newProp, error: propError } = await supabase.from('properties').insert({
          user_id: user.id,
          title: formData.title,
          description: formData.description,
          price_per_night: parseFloat(formData.price),
          location: formData.location,
          bedrooms: parseInt(formData.bedrooms),
          amenities: formData.amenities,
          images: imageUrls,
          advertisement_number: adNumber,
          status: AdStatus.PENDING
        }).select().single();

        if (propError) throw propError;

        setNewAdId(newProp.id);
        setNewAdNumber(adNumber);
        setShowPayment(true);
      }
      fetchUserData();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleUploadSlip = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!slipFile || !newAdId) return;

    setUploading(true);
    try {
      const webpBlob = await convertToWebP(slipFile);
      const fileName = `slips/${newAdId}-${Date.now()}.webp`;
      const { data, error } = await supabase.storage.from('payments').upload(fileName, webpBlob, { contentType: 'image/webp' });
      if (error) throw error;
      const { data: { publicUrl } } = supabase.storage.from('payments').getPublicUrl(data.path);

      const { error: payError } = await supabase.from('payments').insert({
        property_id: newAdId,
        reference_number: newAdNumber,
        slip_image: publicUrl,
        amount: 500,
        status: 'pending'
      });

      if (payError) throw payError;

      alert('Payment slip uploaded successfully! Your ad is now pending approval.');
      resetForm();
      fetchUserData();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setUploading(false);
    }
  };

  const resetForm = () => {
    setIsAdding(false);
    setIsEditing(null);
    setShowPayment(false);
    setFormData({
      title: '',
      description: '',
      price: '',
      location: '',
      bedrooms: '1',
      amenities: [],
    });
    setFiles([]);
    setSlipFile(null);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-10">
        <div>
          <h1 className="text-3xl font-black text-slate-800">My Dashboard</h1>
          <p className="text-slate-500 font-medium">Manage your properties and active advertisements</p>
        </div>
        {!isAdding && (
          <button 
            onClick={() => setIsAdding(true)}
            className="bg-emerald-600 text-white font-bold px-8 py-3.5 rounded-2xl shadow-xl shadow-emerald-600/20 flex items-center space-x-3 active:scale-95 transition-all"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" /></svg>
            <span>Post New Ad</span>
          </button>
        )}
      </div>

      {isAdding ? (
        <div className="bg-white rounded-[2.5rem] shadow-2xl border border-slate-100 p-8 md:p-12 max-w-4xl mx-auto relative overflow-hidden">
          <button onClick={resetForm} className="absolute top-8 right-8 text-slate-300 hover:text-slate-600 transition-colors">
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>

          {!showPayment ? (
            <form onSubmit={handleSaveAd} className="space-y-8">
              <div className="space-y-1">
                <h2 className="text-3xl font-black text-slate-800">
                  {isEditing ? 'Edit Your Listing' : 'List Your Property'}
                </h2>
                <p className="text-slate-500 font-medium">Fill in the details for your Nuwara Eliya stay.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1.5">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Property Title</label>
                  <input required type="text" className="w-full p-4 bg-slate-50 rounded-2xl border-2 border-transparent focus:border-emerald-500 focus:bg-white outline-none transition-all font-medium" placeholder="Modern Villa near Lake Gregory" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Price per night (LKR)</label>
                  <input required type="number" className="w-full p-4 bg-slate-50 rounded-2xl border-2 border-transparent focus:border-emerald-500 focus:bg-white outline-none transition-all font-medium" placeholder="7500" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Exact Location</label>
                  <input required type="text" className="w-full p-4 bg-slate-50 rounded-2xl border-2 border-transparent focus:border-emerald-500 focus:bg-white outline-none transition-all font-medium" placeholder="Badulla Road, Nuwara Eliya" value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Bedrooms</label>
                  <select className="w-full p-4 bg-slate-50 rounded-2xl border-2 border-transparent focus:border-emerald-500 focus:bg-white outline-none transition-all font-bold text-slate-700" value={formData.bedrooms} onChange={e => setFormData({...formData, bedrooms: e.target.value})}>
                    {[1, 2, 3, 4, 5].map(n => <option key={n} value={n}>{n} {n === 1 ? 'Bedroom' : 'Bedrooms'}</option>)}
                    <option value="6">6+ Bedrooms</option>
                  </select>
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Amenities (Select all that apply)</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {AMENITIES_LIST.map(amenity => (
                    <button
                      key={amenity}
                      type="button"
                      onClick={() => handleToggleAmenity(amenity)}
                      className={`flex items-center space-x-3 p-3.5 rounded-2xl border-2 transition-all text-sm font-bold ${
                        formData.amenities.includes(amenity)
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-700 shadow-sm'
                        : 'bg-slate-50 border-transparent text-slate-500 hover:bg-slate-100'
                      }`}
                    >
                      <div className={`w-5 h-5 rounded-lg flex items-center justify-center border-2 ${
                        formData.amenities.includes(amenity) ? 'bg-emerald-600 border-emerald-600' : 'bg-white border-slate-200'
                      }`}>
                        {formData.amenities.includes(amenity) && <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M5 13l4 4L19 7" /></svg>}
                      </div>
                      <span>{amenity}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Description</label>
                <textarea required rows={5} className="w-full p-4 bg-slate-50 rounded-2xl border-2 border-transparent focus:border-emerald-500 focus:bg-white outline-none transition-all font-medium" placeholder="Describe the unique features, view, and proximity to landmarks..." value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})}></textarea>
              </div>

              <div className="space-y-3">
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">
                  {isEditing ? 'Replace Images (Optional, Max 5)' : 'Property Images (Max 5)'}
                </label>
                <div className="relative group">
                   <input type="file" multiple accept="image/*" onChange={e => setFiles(Array.from(e.target.files || []))} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                   <div className="w-full p-10 bg-slate-50 border-4 border-dashed border-slate-200 rounded-[2rem] flex flex-col items-center justify-center space-y-3 group-hover:bg-slate-100 group-hover:border-emerald-200 transition-all">
                      <div className="w-12 h-12 bg-white rounded-2xl shadow-sm flex items-center justify-center text-slate-400">
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                      </div>
                      <p className="font-bold text-slate-500">
                        {files.length > 0 ? `${files.length} images selected` : 'Drag or click to upload images'}
                      </p>
                   </div>
                </div>
              </div>

              <button 
                disabled={uploading}
                type="submit" 
                className="w-full bg-emerald-600 text-white font-black py-5 rounded-[2rem] shadow-2xl shadow-emerald-600/30 disabled:bg-slate-300 transition-all active:scale-[0.98] text-lg"
              >
                {uploading ? (
                   <span className="flex items-center justify-center space-x-3">
                     <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                     <span>Saving Property...</span>
                   </span>
                ) : isEditing ? 'Update Advertisement' : 'Submit & Proceed to Payment'}
              </button>
            </form>
          ) : (
            <div className="space-y-10 py-6">
              <div className="text-center space-y-4">
                <div className="w-24 h-24 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
                  <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M5 13l4 4L19 7" /></svg>
                </div>
                <div>
                  <h2 className="text-4xl font-black text-slate-800">Payment Required</h2>
                  <p className="text-slate-500 font-medium mt-2 max-w-sm mx-auto leading-relaxed">To activate listing <span className="font-black text-emerald-600">{newAdNumber}</span>, please pay the listing fee.</p>
                </div>
              </div>

              <div className="bg-slate-50 p-8 md:p-10 rounded-[2.5rem] border-2 border-slate-100 shadow-sm space-y-8">
                <div className="flex items-center space-x-3 border-b border-slate-200 pb-4">
                  <div className="w-10 h-10 bg-slate-800 text-white rounded-xl flex items-center justify-center font-black">PB</div>
                  <h3 className="text-xl font-black text-slate-800 tracking-tight">People's Bank Transfer</h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-sm">
                  <div className="space-y-1">
                    <p className="text-slate-400 font-black uppercase text-[10px] tracking-widest">Account Number</p>
                    <p className="text-slate-800 font-black text-2xl tracking-tighter">080200186339354</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-slate-400 font-black uppercase text-[10px] tracking-widest">Branch</p>
                    <p className="text-slate-800 font-black text-xl">Ratmalana</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-slate-400 font-black uppercase text-[10px] tracking-widest">Payable Amount</p>
                    <p className="text-emerald-600 font-black text-3xl">Rs. 500.00</p>
                  </div>
                  <div className="space-y-1 p-4 bg-sky-50 rounded-2xl border-2 border-sky-100">
                    <p className="text-sky-800 font-black uppercase text-[10px] tracking-widest">Required Reference</p>
                    <p className="text-sky-600 font-black text-2xl">{newAdNumber}</p>
                  </div>
                </div>
              </div>

              <form onSubmit={handleUploadSlip} className="space-y-6">
                 <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-600 ml-1">Upload Bank Slip or Transfer Screenshot</label>
                    <div className="relative group">
                       <input required type="file" accept="image/*" onChange={e => setSlipFile(e.target.files?.[0] || null)} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                       <div className="w-full p-8 border-2 border-dashed border-emerald-300 rounded-3xl bg-emerald-50/30 flex items-center justify-center space-x-3 group-hover:bg-emerald-50 transition-all">
                          <svg className="w-6 h-6 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                          <span className="font-bold text-emerald-800">{slipFile ? slipFile.name : 'Choose Slip Image'}</span>
                       </div>
                    </div>
                 </div>
                 <button 
                  disabled={uploading}
                  type="submit" 
                  className="w-full bg-sky-600 text-white font-black py-5 rounded-[2rem] shadow-2xl shadow-sky-600/30 transition-all active:scale-[0.98]"
                >
                  {uploading ? 'Processing Slip...' : 'Upload & Activate Ad'}
                </button>
              </form>
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {ads.length > 0 ? (
            ads.map(ad => (
              <div key={ad.id} className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden flex flex-col group hover:shadow-xl transition-all duration-500">
                <div className="relative h-56">
                  <img src={ad.images[0]} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt={ad.title} />
                  <div className="absolute top-4 right-4">
                    <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-xl backdrop-blur-md border ${
                      ad.status === AdStatus.APPROVED ? 'bg-emerald-500/90 text-white border-emerald-400' :
                      ad.status === AdStatus.PENDING ? 'bg-amber-500/90 text-white border-amber-400' :
                      'bg-rose-500/90 text-white border-rose-400'
                    }`}>
                      {ad.status}
                    </span>
                  </div>
                </div>
                <div className="p-8 flex-1 flex flex-col space-y-4">
                  <div className="space-y-1">
                    <h3 className="text-xl font-black text-slate-800 line-clamp-1">{ad.title}</h3>
                    <div className="flex items-center text-slate-400 font-bold text-xs uppercase tracking-tighter">
                      <span>{ad.advertisement_number}</span>
                      <span className="mx-2">•</span>
                      <span className="text-emerald-600">Rs. {ad.price_per_night}</span>
                    </div>
                  </div>
                  
                  <div className="pt-4 mt-auto border-t border-slate-50 grid grid-cols-2 gap-3">
                     <Link to={`/property/${ad.id}`} className="flex items-center justify-center py-3.5 bg-slate-50 text-slate-600 font-black rounded-2xl hover:bg-slate-100 transition-colors text-xs uppercase tracking-widest">
                      View
                    </Link>
                    <button onClick={() => startEditing(ad)} className="flex items-center justify-center py-3.5 bg-sky-50 text-sky-600 font-black rounded-2xl hover:bg-sky-100 transition-colors text-xs uppercase tracking-widest">
                      Edit
                    </button>
                  </div>

                  {ad.status === AdStatus.APPROVED && (
                    <div className="text-center pt-2">
                       <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em]">Expires {new Date(ad.expiry_date!).toLocaleDateString()}</p>
                    </div>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="md:col-span-3 text-center py-32 bg-white rounded-[3rem] border-4 border-dashed border-slate-100">
               <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-200 shadow-inner">
                 <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
               </div>
               <h3 className="text-2xl font-black text-slate-800 tracking-tight">No Active Listings</h3>
               <p className="text-slate-400 mt-2 font-medium">Click the button above to start your first advertisement.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default UserDashboard;
