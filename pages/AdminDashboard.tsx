
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { Property, AdStatus, Payment, HomepageSettings, UserProfile } from '../types';
import { convertToWebP } from '../utils/imageUtils';

interface AdWithPayment extends Property {
  payment?: Payment;
}

const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
    income: 0,
    monthlyIncome: 0
  });
  const [pendingAds, setPendingAds] = useState<AdWithPayment[]>([]);
  const [approvedAds, setApprovedAds] = useState<Property[]>([]);
  const [settings, setSettings] = useState<HomepageSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'pending' | 'active' | 'settings'>('pending');
  const navigate = useNavigate();

  useEffect(() => {
    checkAdminAccess();
  }, []);

  const checkAdminAccess = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate('/login');
      return;
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile || profile.role !== 'admin') {
      alert('Access Denied: You do not have permission to view this page.');
      navigate('/');
      return;
    }

    fetchData();
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data: ads } = await supabase.from('properties').select('*');
      const { data: payments } = await supabase.from('payments').select('*');
      const verifiedPayments = payments?.filter(p => p.status === 'verified') || [];
      
      if (ads) {
        setStats({
          total: ads.length,
          pending: ads.filter(a => a.status === AdStatus.PENDING).length,
          approved: ads.filter(a => a.status === AdStatus.APPROVED).length,
          rejected: ads.filter(a => a.status === AdStatus.REJECTED).length,
          income: verifiedPayments.length * 500,
          monthlyIncome: verifiedPayments.filter(p => new Date(p.created_at).getMonth() === new Date().getMonth()).length * 500
        });

        const pending = ads.filter(a => a.status === AdStatus.PENDING).map(ad => ({
          ...ad,
          payment: payments?.find(p => p.property_id === ad.id)
        }));

        setPendingAds(pending);
        setApprovedAds(ads.filter(a => a.status === AdStatus.APPROVED));
      }

      const { data: setts } = await supabase.from('homepage_settings').select('*').eq('id', 1).single();
      if (setts) setSettings(setts);
    } catch (err) {
      console.error("Fetch data error:", err);
    }
    setLoading(false);
  };

  const handleApprove = async (ad: AdWithPayment) => {
    const approvalDate = new Date();
    const expiryDate = new Date();
    expiryDate.setMonth(expiryDate.getMonth() + 2);

    const { error } = await supabase
      .from('properties')
      .update({
        status: AdStatus.APPROVED,
        approval_date: approvalDate.toISOString(),
        expiry_date: expiryDate.toISOString()
      })
      .eq('id', ad.id);

    if (error) return alert(error.message);

    if (ad.payment) {
      await supabase
        .from('payments')
        .update({ status: 'verified' })
        .eq('id', ad.payment.id);
    }

    fetchData();
    alert('Advertisement approved and activated!');
  };

  const handleReject = async (adId: string) => {
    await supabase.from('properties').update({ status: AdStatus.REJECTED }).eq('id', adId);
    fetchData();
  };

  const handleUpdateSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;
    const { error } = await supabase.from('homepage_settings').upsert({
      ...settings,
      id: 1 // Force ID 1
    });
    if (error) alert(error.message);
    else {
      alert('Settings updated successfully!');
      window.location.reload(); 
    }
  };

  const handleSettingImage = async (field: string, file: File) => {
    try {
      setLoading(true);
      const webp = await convertToWebP(file);
      const fileName = `settings/${field}-${Date.now()}.webp`;
      
      const { data, error: uploadError } = await supabase.storage.from('site').upload(fileName, webp, { contentType: 'image/webp' });
      
      if (uploadError) throw uploadError;

      if (data) {
        const { data: { publicUrl } } = supabase.storage.from('site').getPublicUrl(data.path);
        
        // Use upsert to ensure the single settings row exists
        const { error: updateError } = await supabase
          .from('homepage_settings')
          .upsert({ id: 1, [field]: publicUrl });

        if (updateError) throw updateError;

        setSettings(prev => prev ? { ...prev, [field]: publicUrl } : { id: 1, [field]: publicUrl } as any);
        alert(`${field === 'logo_url' ? 'Logo' : 'Image'} uploaded and saved to database!`);
      }
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const downloadReport = () => {
    const headers = ['Ad Number', 'Amount', 'Date', 'Status'];
    const rows = approvedAds.map(ad => [ad.advertisement_number, 500, ad.approval_date, ad.status]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers, ...rows].map(e => e.join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `CheapStay_Income_Report.csv`);
    document.body.appendChild(link);
    link.click();
  };

  if (loading && !settings) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 py-12 space-y-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight">Admin Control Panel</h1>
          <p className="text-slate-500 font-medium">Manage listings, finances and site content</p>
        </div>
        <button 
          onClick={downloadReport}
          className="bg-slate-800 text-white font-bold px-6 py-3 rounded-2xl flex items-center space-x-2 shadow-xl active:scale-95 transition-all"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
          <span>Download CSV Report</span>
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-2">
           <p className="text-slate-400 text-xs font-black uppercase tracking-widest">Total Ads</p>
           <p className="text-4xl font-black text-slate-800">{stats.total}</p>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-2">
           <p className="text-amber-400 text-xs font-black uppercase tracking-widest">Pending</p>
           <p className="text-4xl font-black text-amber-600">{stats.pending}</p>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-2">
           <p className="text-emerald-400 text-xs font-black uppercase tracking-widest text-[10px]">Total Income</p>
           <p className="text-3xl font-black text-emerald-600">Rs. {stats.income}</p>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-2">
           <p className="text-sky-400 text-xs font-black uppercase tracking-widest">Active Ads</p>
           <p className="text-4xl font-black text-sky-600">{stats.approved}</p>
        </div>
      </div>

      <div className="flex space-x-2 bg-slate-100 p-1 rounded-2xl w-fit">
        <button onClick={() => setActiveTab('pending')} className={`px-6 py-2 rounded-xl font-bold text-sm transition-all ${activeTab === 'pending' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>Pending Approval</button>
        <button onClick={() => setActiveTab('active')} className={`px-6 py-2 rounded-xl font-bold text-sm transition-all ${activeTab === 'active' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>Active Listings</button>
        <button onClick={() => setActiveTab('settings')} className={`px-6 py-2 rounded-xl font-bold text-sm transition-all ${activeTab === 'settings' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>Homepage CMS</button>
      </div>

      {activeTab === 'pending' && (
        <div className="space-y-12">
          {pendingAds.length > 0 ? (
            pendingAds.map(ad => (
              <div key={ad.id} className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 space-y-8">
                <div className="flex flex-col md:flex-row justify-between gap-6 border-b border-slate-50 pb-6">
                   <div>
                     <div className="flex items-center space-x-3 mb-2">
                       <span className="text-[10px] font-black text-sky-600 bg-sky-50 px-2 py-0.5 rounded-full uppercase tracking-widest">{ad.advertisement_number}</span>
                       <h3 className="text-2xl font-black text-slate-800">{ad.title}</h3>
                     </div>
                     <p className="text-slate-500 max-w-2xl">{ad.description}</p>
                   </div>
                   <div className="flex flex-col sm:flex-row gap-3">
                      <button onClick={() => handleApprove(ad)} className="bg-emerald-600 text-white font-bold px-8 py-3 rounded-2xl shadow-xl shadow-emerald-600/10 hover:bg-emerald-700 transition-colors">Approve Ad</button>
                      <button onClick={() => handleReject(ad.id)} className="bg-slate-50 text-rose-600 font-bold px-8 py-3 rounded-2xl hover:bg-rose-50 transition-colors">Reject</button>
                   </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                   <div className="space-y-4">
                      <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">Property Images</h4>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {ad.images.map((img, idx) => (
                          <div key={idx} className="aspect-square rounded-xl overflow-hidden bg-slate-100 border border-slate-100 group cursor-pointer">
                            <img src={img} className="w-full h-full object-cover transition-transform group-hover:scale-110" alt={`Prop ${idx}`} onClick={() => window.open(img, '_blank')}/>
                          </div>
                        ))}
                      </div>
                   </div>

                   <div className="space-y-4">
                      <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">Payment Verification</h4>
                      {ad.payment ? (
                        <div className="flex flex-col sm:flex-row gap-6 bg-slate-50 p-6 rounded-2xl border border-slate-100">
                          <div className="w-32 h-40 bg-white rounded-xl overflow-hidden border border-slate-200 cursor-zoom-in group shadow-sm">
                            <img src={ad.payment.slip_image} className="w-full h-full object-cover group-hover:opacity-80 transition-opacity" alt="Slip" onClick={() => window.open(ad.payment?.slip_image, '_blank')}/>
                          </div>
                          <div className="flex-1 space-y-4">
                            <div>
                               <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Reference No.</p>
                               <p className="text-lg font-black text-sky-600">{ad.payment.reference_number}</p>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                               <div>
                                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Amount Paid</p>
                                  <p className="text-emerald-600 font-black">Rs. {ad.payment.amount}</p>
                               </div>
                               <div>
                                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Payment Date</p>
                                  <p className="text-slate-600 font-bold text-sm">{new Date(ad.payment.created_at).toLocaleDateString()}</p>
                               </div>
                            </div>
                            <p className="text-[10px] bg-amber-100 text-amber-700 px-2 py-1 rounded-full w-fit font-black">PENDING VERIFICATION</p>
                          </div>
                        </div>
                      ) : (
                        <div className="p-10 bg-rose-50 border border-rose-100 rounded-2xl text-rose-500 font-bold text-center">No payment slip uploaded yet.</div>
                      )}
                   </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-20 bg-white rounded-3xl border border-slate-100 text-slate-400">No pending advertisements at the moment.</div>
          )}
        </div>
      )}

      {activeTab === 'active' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {approvedAds.map(ad => (
            <div key={ad.id} className="bg-white rounded-3xl overflow-hidden shadow-sm border border-slate-100 p-6 space-y-4">
               <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-slate-800">{ad.title}</h3>
                    <p className="text-xs text-slate-400 font-bold uppercase">{ad.advertisement_number}</p>
                  </div>
                  <span className="bg-emerald-50 text-emerald-600 text-[10px] font-black px-2 py-1 rounded-full">ACTIVE</span>
               </div>
               <div className="pt-4 border-t border-slate-50 flex justify-between items-center">
                  <span className="text-xs text-slate-400 font-medium">Expires: {new Date(ad.expiry_date!).toLocaleDateString()}</span>
                  <button onClick={() => handleReject(ad.id)} className="text-rose-500 text-xs font-bold hover:underline">Deactivate</button>
               </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'settings' && (
        <div className="space-y-10">
          <form onSubmit={handleUpdateSettings} className="bg-white p-10 rounded-3xl border border-slate-100 shadow-xl max-w-4xl mx-auto space-y-10">
            <div className="space-y-6">
              <h2 className="text-2xl font-black text-slate-800 border-b pb-4">Brand Identity</h2>
              <div className="grid grid-cols-1 gap-8 items-start">
                <div className="space-y-4">
                  <label className="text-sm font-bold text-slate-600">Website Logo (Header & Footer)</label>
                  <div className="flex flex-col md:flex-row items-center gap-8">
                    <div className="w-full md:w-64 h-32 rounded-2xl border-2 border-emerald-500/10 overflow-hidden bg-slate-50 flex items-center justify-center p-4 shadow-inner">
                      <img 
                        src={settings?.logo_url || 'https://raw.githubusercontent.com/shadcn-ui/ui/main/apps/www/public/favicon.ico'} 
                        className="w-full h-full object-contain" 
                        alt="Current Brand Logo" 
                        onError={(e) => { (e.target as HTMLImageElement).src = 'https://raw.githubusercontent.com/shadcn-ui/ui/main/apps/www/public/favicon.ico'; }}
                      />
                    </div>
                    <div className="flex-1 space-y-4 w-full">
                      <div className="relative group">
                        <input 
                          type="file" 
                          accept="image/*"
                          onChange={e => e.target.files?.[0] && handleSettingImage('logo_url', e.target.files[0])} 
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                        />
                        <div className="p-6 border-2 border-dashed border-slate-200 rounded-2xl flex items-center justify-center space-x-3 bg-slate-50 group-hover:bg-slate-100 transition-all">
                           <svg className="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                           <span className="text-sm font-bold text-slate-500">Upload New Logo Asset</span>
                        </div>
                      </div>
                      <p className="text-[10px] text-slate-400 font-medium uppercase tracking-widest text-center">Transparent PNG or WebP Recommended</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <h2 className="text-2xl font-black text-slate-800 border-b pb-4">Hero Section</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-600">Main Heading</label>
                  <input type="text" className="w-full p-4 bg-slate-50 rounded-xl border focus:border-emerald-500 outline-none font-medium" value={settings?.homepage_heading || ''} onChange={e => setSettings(prev => prev ? {...prev, homepage_heading: e.target.value} : null)} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-600">Hero Image (Background)</label>
                  <input type="file" onChange={e => e.target.files?.[0] && handleSettingImage('hero_image', e.target.files[0])} className="w-full p-3 bg-slate-50 rounded-xl border text-xs" />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-600">Hero Description</label>
                <textarea rows={3} className="w-full p-4 bg-slate-50 rounded-xl border focus:border-emerald-500 outline-none font-medium" value={settings?.homepage_description || ''} onChange={e => setSettings(prev => prev ? {...prev, homepage_description: e.target.value} : null)}></textarea>
              </div>
            </div>

            <button type="submit" className="w-full bg-emerald-600 text-white font-black py-5 rounded-2xl shadow-2xl active:scale-[0.98] transition-all">Save Content Updates</button>
          </form>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
