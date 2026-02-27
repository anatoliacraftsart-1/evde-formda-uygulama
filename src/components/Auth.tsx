import React, { useState } from 'react';
import { motion } from 'motion/react';
import { User as UserIcon, Sparkles, ArrowRight, Calendar, Users } from 'lucide-react';
import { cn } from '../lib/utils';

export interface LocalUser {
  firstName: string;
  lastName: string;
  age: string;
  gender: string;
}

interface AuthProps {
  onAuthSuccess: (user: LocalUser) => void;
  isDarkMode: boolean;
}

export const Auth: React.FC<AuthProps> = ({ onAuthSuccess, isDarkMode }) => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    const userData: LocalUser = {
      firstName,
      lastName,
      age,
      gender
    };

    // UX için kısa bir gecikme
    setTimeout(() => {
      localStorage.setItem('local_user', JSON.stringify(userData));
      onAuthSuccess(userData);
      setLoading(false);
    }, 800);
  };

  return (
    <div className="w-full max-w-md mx-auto p-8 space-y-8">
      <div className="text-center space-y-2">
        <div className="w-16 h-16 bg-emerald-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-emerald-500/20">
          <Sparkles className="text-white" size={32} />
        </div>
        <h1 className="text-3xl font-bold tracking-tight">Hoş Geldiniz</h1>
        <p className="text-zinc-500">Size özel antrenmanlar için bilgilerinizi girin.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-bold uppercase tracking-wider text-zinc-500 ml-1">Ad</label>
            <div className="relative">
              <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={20} />
              <input 
                type="text" required value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="Adınız"
                className={cn(
                  "w-full pl-12 pr-4 py-4 rounded-2xl border focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all",
                  isDarkMode ? "bg-zinc-900 border-zinc-800 text-white" : "bg-white border-zinc-200 text-zinc-900"
                )}
              />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-bold uppercase tracking-wider text-zinc-500 ml-1">Soyad</label>
            <input 
              type="text" required value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              placeholder="Soyadınız"
              className={cn(
                "w-full px-4 py-4 rounded-2xl border focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all",
                isDarkMode ? "bg-zinc-900 border-zinc-800 text-white" : "bg-white border-zinc-200 text-zinc-900"
              )}
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-bold uppercase tracking-wider text-zinc-500 ml-1">Yaş</label>
          <div className="relative">
            <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={20} />
            <input 
              type="number" required min="10" max="100" value={age}
              onChange={(e) => setAge(e.target.value)}
              placeholder="Yaşınız"
              className={cn(
                "w-full pl-12 pr-4 py-4 rounded-2xl border focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all",
                isDarkMode ? "bg-zinc-900 border-zinc-800 text-white" : "bg-white border-zinc-200 text-zinc-900"
              )}
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-bold uppercase tracking-wider text-zinc-500 ml-1">Cinsiyet</label>
          <div className="relative">
            <Users className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={20} />
            <select 
              required value={gender}
              onChange={(e) => setGender(e.target.value)}
              className={cn(
                "w-full pl-12 pr-4 py-4 rounded-2xl border focus:outline-none focus:ring-2 focus:ring-emerald-500 appearance-none transition-all",
                isDarkMode ? "bg-zinc-900 border-zinc-800 text-white" : "bg-white border-zinc-200 text-zinc-900"
              )}
            >
              <option value="">Seçiniz</option>
              <option value="Erkek">Erkek</option>
              <option value="Kadın">Kadın</option>
              <option value="Diğer">Diğer</option>
            </select>
          </div>
        </div>

        <button 
          type="submit" disabled={loading}
          className="w-full bg-emerald-500 hover:bg-emerald-400 text-white py-4 rounded-2xl font-bold shadow-lg shadow-emerald-500/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50 mt-4"
        >
          {loading ? (
            <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <>Başla <ArrowRight size={20} /></>
          )}
        </button>
      </form>
    </div>
  );
};