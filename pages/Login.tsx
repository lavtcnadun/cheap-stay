
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../supabaseClient';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    
    if (error) {
      if (error.message.includes('Email not confirmed')) {
        alert('Your email is not confirmed. Please check your inbox for the confirmation link.');
      } else {
        alert(error.message);
      }
      setLoading(false);
      return;
    }

    if (data.user) {
      // Fetch profile to check role
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', data.user.id)
        .single();

      if (profileError || !profile) {
        console.warn('Profile not found for user:', data.user.id);
        navigate('/dashboard');
      } else if (profile.role === 'admin') {
        // Redirect admins to the admin panel
        navigate('/admin');
      } else {
        // Redirect normal users to their dashboard
        navigate('/dashboard');
      }
    }
    setLoading(false);
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <div className="bg-white p-10 rounded-3xl shadow-2xl border border-slate-100 w-full max-w-md space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-black text-slate-800 tracking-tight">CheapStay Login</h1>
          <p className="text-slate-500 font-medium">Log in to manage your listings or site</p>
        </div>
        
        <form onSubmit={handleLogin} className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-600 ml-1">Email Address</label>
            <input required type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full p-4 bg-slate-50 rounded-2xl border border-slate-200 outline-none focus:border-emerald-500 transition-colors font-medium" placeholder="your@email.com" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-600 ml-1">Password</label>
            <input required type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full p-4 bg-slate-50 rounded-2xl border border-slate-200 outline-none focus:border-emerald-500 transition-colors font-medium" placeholder="••••••••" />
          </div>
          <button disabled={loading} type="submit" className="w-full bg-emerald-600 text-white font-black py-4 rounded-2xl shadow-xl shadow-emerald-600/20 active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center">
            {loading ? (
              <svg className="animate-spin h-5 w-5 text-white mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
            ) : null}
            {loading ? 'Authenticating...' : 'Sign In'}
          </button>
        </form>

        <div className="text-center text-slate-400 text-sm font-medium">
          Don't have an account? <Link to="/register" className="text-emerald-600 font-bold hover:underline">Register now</Link>
        </div>
      </div>
    </div>
  );
};

export default Login;
