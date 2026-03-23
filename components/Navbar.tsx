
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { UserProfile, HomepageSettings } from '../types';

const Navbar: React.FC = () => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [settings, setSettings] = useState<HomepageSettings | null>(null);
  const [user, setUser] = useState<any>(null);
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  const fetchProfile = async (uid: string) => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', uid)
      .single();
    if (data) setProfile(data);
  };

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase.from('homepage_settings').select('*').eq('id', 1).single();
      if (data) setSettings(data);
    } catch (e) {
      console.warn("Settings fetch failed, using defaults");
    }
  };

  useEffect(() => {
    const initAuth = async () => {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      setUser(authUser);
      if (authUser) {
        fetchProfile(authUser.id);
      }
    };

    initAuth();
    fetchSettings();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const authUser = session?.user || null;
      setUser(authUser);
      if (authUser) {
        fetchProfile(authUser.id);
      } else {
        setProfile(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  // Fallback to a placeholder that resembles a mountain/stay logo if none is set
  const logoSrc = settings?.logo_url || 'https://raw.githubusercontent.com/shadcn-ui/ui/main/apps/www/public/favicon.ico';

  return (
    <nav className="bg-white border-b border-slate-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-20 items-center">
          <div className="flex items-center">
            <Link to="/" className="flex items-center group">
              <div className="h-16 w-auto flex items-center justify-center transition-transform hover:scale-105">
                <img 
                  src={logoSrc} 
                  alt="CheapStay Nuwara Eliya" 
                  className="h-full w-auto object-contain"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = 'https://raw.githubusercontent.com/shadcn-ui/ui/main/apps/www/public/favicon.ico';
                  }}
                />
              </div>
              {!settings?.logo_url && (
                <span className="ml-3 text-2xl font-black bg-gradient-to-r from-emerald-600 to-sky-600 bg-clip-text text-transparent tracking-tighter">
                  CheapStay
                </span>
              )}
            </Link>
          </div>

          <div className="hidden md:flex items-center space-x-6">
            <Link to="/" className="text-slate-600 hover:text-emerald-600 font-bold text-sm">Explore</Link>
            {user ? (
              <>
                <Link to="/dashboard" className="text-slate-600 hover:text-emerald-600 font-bold text-sm">Dashboard</Link>
                {profile?.role === 'admin' && (
                  <Link to="/admin" className="text-emerald-700 font-black text-xs px-3 py-1 bg-emerald-50 rounded-full border border-emerald-100 uppercase tracking-widest">
                    Admin
                  </Link>
                )}
                <button 
                  onClick={handleLogout}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-xl transition-all font-bold text-sm"
                >
                  Logout
                </button>
              </>
            ) : (
              <div className="flex items-center space-x-3">
                <Link to="/login" className="text-slate-600 hover:text-emerald-600 font-bold text-sm px-4 py-2">Login</Link>
                <Link to="/register" className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2 rounded-xl transition-all shadow-lg shadow-emerald-600/10 font-bold text-sm">
                  Register
                </Link>
              </div>
            )}
          </div>

          <div className="md:hidden flex items-center">
            <button onClick={() => setIsOpen(!isOpen)} className="text-slate-500 hover:text-slate-700 focus:outline-none">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {isOpen ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /> : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />}
              </svg>
            </button>
          </div>
        </div>
      </div>

      {isOpen && (
        <div className="md:hidden bg-white border-t border-slate-100 px-4 pt-2 pb-6 space-y-3 shadow-lg">
          <Link to="/" className="block text-slate-600 font-bold py-2">Explore</Link>
          {user ? (
            <>
              <Link to="/dashboard" className="block text-slate-600 font-bold py-2">Dashboard</Link>
              {profile?.role === 'admin' && <Link to="/admin" className="block text-emerald-600 font-black py-2 uppercase text-xs tracking-widest">Admin Panel</Link>}
              <button onClick={handleLogout} className="w-full text-left text-rose-600 font-bold py-2">Logout</button>
            </>
          ) : (
            <>
              <Link to="/login" className="block text-slate-600 font-bold py-2">Login</Link>
              <Link to="/register" className="block bg-emerald-600 text-white text-center font-bold py-3 rounded-xl shadow-lg shadow-emerald-600/10">Register</Link>
            </>
          )}
        </div>
      )}
    </nav>
  );
};

export default Navbar;
