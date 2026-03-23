
import React, { useState, useEffect } from 'react';
import { Routes, Route, Link, useNavigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import PropertyDetails from './pages/PropertyDetails';
import UserDashboard from './pages/UserDashboard';
import AdminDashboard from './pages/AdminDashboard';
import Login from './pages/Login';
import Register from './pages/Register';
import { supabase } from './supabaseClient';
import { HomepageSettings } from './types';

const App: React.FC = () => {
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [settings, setSettings] = useState<HomepageSettings | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const { data } = await supabase.from('homepage_settings').select('*').eq('id', 1).single();
        if (data) setSettings(data);
      } catch (err) {
        console.warn("Could not fetch global settings", err);
      }
    };
    fetchSettings();
  }, []);

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { data, error } = await supabase.auth.signInWithPassword({
      email: adminEmail,
      password: adminPassword,
    });

    if (error) {
      alert('Invalid Admin Credentials');
      setLoading(false);
      return;
    }

    if (data.user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', data.user.id)
        .single();

      if (profile?.role === 'admin') {
        setIsAdminModalOpen(false);
        setAdminEmail('');
        setAdminPassword('');
        navigate('/admin');
      } else {
        alert('Access Denied: This account is not an administrator.');
        await supabase.auth.signOut();
      }
    }
    setLoading(false);
  };

  const logoSrc = settings?.logo_url || 'https://raw.githubusercontent.com/shadcn-ui/ui/main/apps/www/public/favicon.ico';

  return (
    <div className="min-h-screen flex flex-col relative">
      <Navbar />
      <div className="flex-1">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/property/:id" element={<PropertyDetails />} />
          <Route path="/dashboard" element={<UserDashboard />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
        </Routes>
      </div>
      
      <footer className="bg-white border-t border-slate-200 py-16 relative">
        <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 md:grid-cols-4 gap-12">
          <div className="space-y-6">
            <Link to="/" className="flex items-center group">
              <div className="h-20 w-auto flex items-center justify-start">
                <img 
                  src={logoSrc} 
                  alt="CheapStay Logo" 
                  className="h-full w-auto object-contain"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = 'https://raw.githubusercontent.com/shadcn-ui/ui/main/apps/www/public/favicon.ico';
                  }}
                />
              </div>
              {!settings?.logo_url && (
                <span className="ml-2 text-xl font-black bg-gradient-to-r from-emerald-600 to-sky-600 bg-clip-text text-transparent tracking-tighter">
                  CheapStay
                </span>
              )}
            </Link>
            <p className="text-slate-500 text-sm font-medium leading-relaxed">
              Experience the mist and mountains of Nuwara Eliya with Sri Lanka's most affordable and trusted rental platform.
            </p>
          </div>
          <div>
            <h4 className="font-bold text-slate-800 mb-6 uppercase text-xs tracking-widest">Quick Links</h4>
            <ul className="space-y-3 text-slate-500 text-sm font-medium">
              <li><Link to="/" className="hover:text-emerald-600 transition-colors">Explore Stays</Link></li>
              <li><Link to="/login" className="hover:text-emerald-600 transition-colors">Post an Ad</Link></li>
              <li><Link to="/register" className="hover:text-emerald-600 transition-colors">Host Registration</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold text-slate-800 mb-6 uppercase text-xs tracking-widest">Support</h4>
            <ul className="space-y-3 text-slate-500 text-sm font-medium">
              <li><a href="#" className="hover:text-emerald-600 transition-colors">Terms of Service</a></li>
              <li><a href="#" className="hover:text-emerald-600 transition-colors">Help Center</a></li>
              <li><a href="#" className="hover:text-emerald-600 transition-colors">Privacy Policy</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold text-slate-800 mb-6 uppercase text-xs tracking-widest">Connect</h4>
            <div className="flex space-x-4">
               <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400 hover:bg-emerald-600 hover:text-white transition-all cursor-pointer text-xs font-bold">FB</div>
               <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400 hover:bg-emerald-600 hover:text-white transition-all cursor-pointer text-xs font-bold">IG</div>
               <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400 hover:bg-emerald-600 hover:text-white transition-all cursor-pointer text-xs font-bold">WA</div>
            </div>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 border-t border-slate-100 mt-16 pt-8 text-center relative">
          <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] inline-block">
            © 2026 CheapStay Nuwara Eliya. Built for the modern traveler.
          </p>
          <button 
            onClick={() => setIsAdminModalOpen(true)}
            className="absolute right-4 bottom-4 text-slate-200 hover:text-slate-400 transition-colors p-2"
            aria-label="Admin Access"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </button>
        </div>
      </footer>

      {isAdminModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center px-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-sm rounded-[2rem] p-8 shadow-2xl space-y-6 relative border border-slate-100">
            <button 
              onClick={() => setIsAdminModalOpen(false)}
              className="absolute top-6 right-6 text-slate-400 hover:text-slate-600"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
            
            <div className="text-center space-y-2">
              <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-2">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
              </div>
              <h3 className="text-xl font-black text-slate-800">Admin Authentication</h3>
              <p className="text-slate-500 text-sm font-medium">Enter secure credentials to proceed.</p>
            </div>

            <form onSubmit={handleAdminLogin} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Master Email</label>
                <input 
                  required 
                  type="email" 
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                  className="w-full p-4 bg-slate-50 rounded-2xl border border-slate-200 outline-none focus:border-emerald-500 transition-all font-medium" 
                  placeholder="admin@cheapstay.com" 
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Secret Key</label>
                <input 
                  required 
                  type="password" 
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  className="w-full p-4 bg-slate-50 rounded-2xl border border-slate-200 outline-none focus:border-emerald-500 transition-all font-medium" 
                  placeholder="••••••••" 
                />
              </div>
              <button 
                disabled={loading}
                type="submit" 
                className="w-full bg-slate-900 text-white font-black py-4 rounded-2xl shadow-xl active:scale-95 transition-all disabled:opacity-50"
              >
                {loading ? 'Verifying...' : 'Authorize Access'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
