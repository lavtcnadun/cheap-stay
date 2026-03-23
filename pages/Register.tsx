
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../supabaseClient';

const Register: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    whatsapp: ''
  });
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage(null);
    
    // Metadata passed in 'options.data' is picked up by the PostgreSQL trigger
    const { data, error } = await supabase.auth.signUp({
      email: formData.email,
      password: formData.password,
      options: {
        data: {
          name: formData.name,
          phone: formData.phone,
          whatsapp: formData.whatsapp,
          role: 'user'
        }
      }
    });

    if (error) {
      let msg = error.message;
      if (msg.toLowerCase().includes('email rate limit exceeded')) {
        msg = "Email rate limit exceeded. If you are the developer testing this app, go to your Supabase Dashboard > Authentication > Providers > Email and disable 'Confirm email' to allow instant registration without email verification limits.";
      }
      setErrorMessage(msg);
      setLoading(false);
      return;
    }

    if (data.user) {
      // If Supabase has "Confirm Email" enabled, session will be null
      if (!data.session) {
        alert('Registration Successful! PLEASE CHECK YOUR EMAIL to confirm your account before logging in. (Check Spam folder if not found)');
        navigate('/login');
      } else {
        alert('Welcome to CheapStay! Your account is ready.');
        navigate('/dashboard');
      }
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen py-16 flex items-center justify-center px-4 bg-slate-50">
      <div className="bg-white p-8 md:p-12 rounded-[2.5rem] shadow-2xl border border-slate-100 w-full max-w-xl space-y-8">
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-emerald-100 text-emerald-600 rounded-3xl mb-2">
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
          </div>
          <h1 className="text-4xl font-black text-slate-800 tracking-tight">Join CheapStay</h1>
          <p className="text-slate-500 font-medium max-w-xs mx-auto">List your property in Nuwara Eliya and start earning.</p>
        </div>

        {errorMessage && (
          <div className="bg-rose-50 border border-rose-100 p-4 rounded-2xl animate-in fade-in slide-in-from-top-2 duration-300">
            <p className="text-rose-600 text-sm font-bold leading-relaxed">{errorMessage}</p>
          </div>
        )}
        
        <form onSubmit={handleRegister} className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="space-y-1.5 md:col-span-2">
            <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Full Name</label>
            <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full p-4 bg-slate-50 rounded-2xl border border-slate-200 outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/5 transition-all font-medium" placeholder="Kumara Perera" />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Email</label>
            <input required type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full p-4 bg-slate-50 rounded-2xl border border-slate-200 outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/5 transition-all font-medium" placeholder="name@email.com" />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Password</label>
            <input required type="password" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} className="w-full p-4 bg-slate-50 rounded-2xl border border-slate-200 outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/5 transition-all font-medium" placeholder="Min. 6 chars" minLength={6} />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Phone</label>
            <input required type="tel" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full p-4 bg-slate-50 rounded-2xl border border-slate-200 outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/5 transition-all font-medium" placeholder="0712345678" />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">WhatsApp</label>
            <input required type="tel" value={formData.whatsapp} onChange={e => setFormData({...formData, whatsapp: e.target.value})} className="w-full p-4 bg-slate-50 rounded-2xl border border-slate-200 outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/5 transition-all font-medium" placeholder="94712345678" />
          </div>
          
          <button 
            disabled={loading} 
            type="submit" 
            className="md:col-span-2 mt-4 bg-emerald-600 hover:bg-emerald-700 text-white font-black py-4 rounded-2xl shadow-xl shadow-emerald-600/20 active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center space-x-3 group"
          >
            {loading ? (
              <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
            ) : (
              <>
                <span>Create Account</span>
                <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
              </>
            )}
          </button>
        </form>

        <div className="text-center">
          <p className="text-slate-400 text-sm font-medium">
            Already have an account? <Link to="/login" className="text-emerald-600 font-bold hover:text-emerald-700 transition-colors ml-1">Log in here</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
