import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Dumbbell, 
  Flame, 
  History, 
  LayoutDashboard, 
  MessageSquare, 
  Settings, 
  ChevronRight,
  Trophy,
  Clock,
  Zap,
  ArrowLeft,
  Sparkles,
  Send,
  X,
  Info,
  Moon,
  Sun,
  User as UserIcon,
  ShieldCheck,
  LogOut
} from 'lucide-react';
import { EXERCISES, Exercise } from './data/exercises';
import { WorkoutTimer } from './components/WorkoutTimer';
import { generateWorkoutPlan, askFitnessQuestion } from './services/gemini';
import { cn } from './lib/utils';
import Markdown from 'react-markdown';
import { Auth, LocalUser } from './components/Auth';

type View = 'dashboard' | 'exercises' | 'history' | 'ai-coach' | 'active-workout' | 'profile';

export default function App() {
  const [user, setUser] = useState<LocalUser | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [currentView, setCurrentView] = useState<View>('dashboard');
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);
  const [workoutHistory, setWorkoutHistory] = useState<any[]>([]);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResponse, setAiResponse] = useState<any>(null);
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState<{role: 'user' | 'ai', text: string}[]>([]);
  const [showInstructions, setShowInstructions] = useState<any | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [streak, setStreak] = useState(0);
  const [totalMinutes, setTotalMinutes] = useState(0);
  const [isWorkoutStarted, setIsWorkoutStarted] = useState(false);
  const [difficultyFilter, setDifficultyFilter] = useState<'all' | 'beginner' | 'intermediate' | 'advanced'>('all');

  const findVideoForExercise = (name: string) => {
    const match = EXERCISES.find(ex => 
      name.toLowerCase().includes(ex.name.toLowerCase()) || 
      ex.name.toLowerCase().includes(name.toLowerCase())
    );
    return match?.videoUrl;
  };

  useEffect(() => {
    const savedUser = localStorage.getItem('local_user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    setAuthLoading(false);
  }, []);

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') setIsDarkMode(true);
  }, []);

  const toggleTheme = () => {
    const nextTheme = !isDarkMode;
    setIsDarkMode(nextTheme);
    localStorage.setItem('theme', nextTheme ? 'dark' : 'light');
  };

  useEffect(() => {
    const saved = localStorage.getItem('workout_history');
    if (saved) {
      const history = JSON.parse(saved);
      setWorkoutHistory(history);
      calculateStats(history);
    }
  }, []);

  const calculateStats = (history: any[]) => {
    const mins = history.reduce((acc, curr) => acc + (curr.duration || 0), 0);
    setTotalMinutes(mins);

    if (history.length === 0) {
      setStreak(0);
      return;
    }

    const dates = history.map(h => new Date(h.date).toDateString());
    const uniqueDates = Array.from(new Set(dates)).map(d => new Date(d));
    uniqueDates.sort((a, b) => b.getTime() - a.getTime());

    let currentStreak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let checkDate = new Date(uniqueDates[0]);
    checkDate.setHours(0, 0, 0, 0);

    const diffDays = Math.floor((today.getTime() - checkDate.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays > 1) {
      setStreak(0);
      return;
    }

    currentStreak = 1;
    for (let i = 0; i < uniqueDates.length - 1; i++) {
      const d1 = new Date(uniqueDates[i]);
      const d2 = new Date(uniqueDates[i+1]);
      d1.setHours(0,0,0,0);
      d2.setHours(0,0,0,0);
      
      const diff = Math.floor((d1.getTime() - d2.getTime()) / (1000 * 60 * 60 * 24));
      if (diff === 1) {
        currentStreak++;
      } else {
        break;
      }
    }
    setStreak(currentStreak);
  };

  const saveWorkout = (workout: any) => {
    const newHistory = [workout, ...workoutHistory];
    setWorkoutHistory(newHistory);
    localStorage.setItem('workout_history', JSON.stringify(newHistory));
    calculateStats(newHistory);
  };

  const handleGenerateWorkout = async () => {
    setAiLoading(true);
    try {
      const plan = await generateWorkoutPlan('Kilo verme ve sıkılaşma', 'Orta', 20);
      setAiResponse(plan);
      setCurrentView('active-workout');
      setIsWorkoutStarted(false);
    } catch (error) {
      console.error(error);
    } finally {
      setAiLoading(false);
    }
  };

  const handleChat = async () => {
    if (!chatInput.trim()) return;
    const userMsg = chatInput;
    setChatInput('');
    setChatMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    
    setAiLoading(true);
    try {
      const response = await askFitnessQuestion(userMsg);
      setChatMessages(prev => [...prev, { role: 'ai', text: response }]);
    } catch (error) {
      console.error(error);
    } finally {
      setAiLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className={cn(
        "min-h-screen flex items-center justify-center",
        isDarkMode ? "bg-zinc-950" : "bg-zinc-50"
      )}>
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
          <p className="text-zinc-500 font-medium animate-pulse">Yükleniyor...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className={cn(
        "min-h-screen flex items-center justify-center transition-colors duration-300",
        isDarkMode ? "bg-zinc-950 text-zinc-100" : "bg-[#F5F5F5] text-zinc-900"
      )}>
        <Auth onAuthSuccess={(u) => setUser(u)} isDarkMode={isDarkMode} />
      </div>
    );
  }

  return (
    <div className={cn(
      "min-h-screen font-sans pb-24 transition-colors duration-300",
      isDarkMode ? "bg-zinc-950 text-zinc-100" : "bg-[#F5F5F5] text-zinc-900"
    )}>
      {/* Header */}
      <header className={cn(
        "px-6 py-4 sticky top-0 z-50 flex justify-between items-center transition-colors duration-300",
        isDarkMode ? "bg-zinc-900 border-zinc-800" : "bg-white border-zinc-200 border-b"
      )}>
        <div className="flex items-center gap-2">
          <div className="bg-emerald-500 p-2 rounded-xl">
            <Dumbbell className="text-white" size={20} />
          </div>
          <h1 className="font-bold text-xl tracking-tight">Evde Formda</h1>
        </div>
        <div className="flex items-center gap-4">
          <button 
            onClick={toggleTheme}
            className={cn(
              "p-2 rounded-xl transition-colors",
              isDarkMode ? "bg-zinc-800 text-yellow-400 hover:bg-zinc-700" : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
            )}
          >
            {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
          </button>
          <div className="flex flex-col items-end">
            <span className={cn(
              "text-[10px] uppercase tracking-widest font-bold",
              isDarkMode ? "text-zinc-500" : "text-zinc-400"
            )}>Günlük Seri</span>
            <div className="flex items-center gap-1">
              <Flame size={16} className={cn(
                "transition-colors",
                streak > 0 ? "text-orange-500 fill-orange-500" : "text-zinc-300"
              )} />
              <span className="font-bold">{streak} Gün</span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto p-6">
        <AnimatePresence mode="wait">
          {currentView === 'dashboard' && (
            <motion.div
              key="dashboard"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              <section className="bg-zinc-900 text-white p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden group">
                <div className="relative z-10">
                  <div className="flex items-center gap-2 mb-4">
                    <span className="bg-emerald-500/20 text-emerald-400 text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full border border-emerald-500/30">AI Destekli</span>
                  </div>
                  <h2 className="text-4xl font-black mb-2 tracking-tight">Bugün Ne <br/>Çalışıyoruz?</h2>
                  <p className="text-zinc-400 mb-8 max-w-[220px] text-sm leading-relaxed">AI Koçun senin için en etkili programı hazırlamaya hazır.</p>
                  <div className="flex flex-col gap-3">
                    <button 
                      onClick={handleGenerateWorkout}
                      disabled={aiLoading}
                      className="bg-emerald-500 hover:bg-emerald-400 text-white px-6 py-5 rounded-2xl font-black text-lg flex items-center justify-center gap-3 transition-all active:scale-95 disabled:opacity-50 shadow-xl shadow-emerald-500/20"
                    >
                      {aiLoading ? <Sparkles className="animate-spin" size={24} /> : <Sparkles size={24} />}
                      AI ANTRENMAN OLUŞTUR
                    </button>
                  </div>
                </div>
                <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 blur-[100px] rounded-full -mr-32 -mt-32 group-hover:bg-emerald-500/20 transition-colors duration-700" />
                <div className="absolute bottom-0 left-0 w-32 h-32 bg-blue-500/5 blur-[60px] rounded-full -ml-16 -mb-16" />
              </section>

              <div className="grid grid-cols-2 gap-4">
                <div className={cn(
                  "p-6 rounded-[2rem] border shadow-sm transition-all hover:shadow-md",
                  isDarkMode ? "bg-zinc-900 border-zinc-800" : "bg-white border-zinc-200"
                )}>
                  <div className={cn(
                    "w-12 h-12 rounded-2xl flex items-center justify-center mb-4",
                    isDarkMode ? "bg-blue-500/10" : "bg-blue-50"
                  )}>
                    <Clock className="text-blue-500" size={24} />
                  </div>
                  <div className="text-3xl font-black">{totalMinutes}</div>
                  <div className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest mt-1">Toplam Dakika</div>
                </div>
                <div className={cn(
                  "p-6 rounded-[2rem] border shadow-sm transition-all hover:shadow-md",
                  isDarkMode ? "bg-zinc-900 border-zinc-800" : "bg-white border-zinc-200"
                )}>
                  <div className={cn(
                    "w-12 h-12 rounded-2xl flex items-center justify-center mb-4",
                    isDarkMode ? "bg-orange-500/10" : "bg-orange-50"
                  )}>
                    <Zap className="text-orange-500" size={24} />
                  </div>
                  <div className="text-3xl font-black">{workoutHistory.length}</div>
                  <div className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest mt-1">Toplam Seri</div>
                </div>
              </div>

              <section>
                <div className="flex justify-between items-center mb-5 px-2">
                  <h3 className="font-black text-xl tracking-tight">Popüler Hareketler</h3>
                  <button onClick={() => setCurrentView('exercises')} className="text-emerald-500 text-xs font-black uppercase tracking-widest hover:text-emerald-400 transition-colors">Tümünü Gör</button>
                </div>
                <div className="space-y-3">
                  {EXERCISES.slice(0, 3).map(ex => (
                    <div 
                      key={ex.id}
                      className={cn(
                        "p-5 rounded-[2rem] border flex items-center gap-5 transition-all cursor-pointer group relative overflow-hidden",
                        isDarkMode ? "bg-zinc-900 border-zinc-800 hover:border-emerald-500/50" : "bg-white border-zinc-200 hover:border-emerald-500/50"
                      )}
                      onClick={() => {
                        setSelectedExercise(ex);
                        setCurrentView('exercises');
                      }}
                    >
                      <div className="relative flex-shrink-0">
                        <img src={ex.image} alt={ex.name} className="w-20 h-20 rounded-2xl object-cover shadow-md group-hover:scale-105 transition-transform duration-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-black text-lg truncate">{ex.name}</h4>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={cn(
                            "text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md",
                            ex.difficulty === 'beginner' ? "bg-emerald-500/10 text-emerald-500" :
                            ex.difficulty === 'intermediate' ? "bg-blue-500/10 text-blue-500" : "bg-amber-500/10 text-amber-500"
                          )}>{ex.difficulty === 'beginner' ? 'Başlangıç' : ex.difficulty === 'intermediate' ? 'Orta' : 'İleri'}</span>
                          <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest">{ex.category}</span>
                        </div>
                      </div>
                      <div className="bg-zinc-100 dark:bg-zinc-800 p-2 rounded-xl group-hover:bg-emerald-500 group-hover:text-white transition-all">
                        <ChevronRight size={20} />
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            </motion.div>
          )}

          {currentView === 'exercises' && (
            <motion.div
              key="exercises"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <button onClick={() => setCurrentView('dashboard')} className="flex items-center gap-2 text-zinc-500 font-medium">
                <ArrowLeft size={20} /> Geri Dön
              </button>
              
              <h2 className="text-2xl font-bold">Egzersiz Kütüphanesi</h2>

              <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                {(['all', 'beginner', 'intermediate', 'advanced'] as const).map((level) => (
                  <button
                    key={level}
                    onClick={() => setDifficultyFilter(level)}
                    className={cn(
                      "px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider whitespace-nowrap transition-all",
                      difficultyFilter === level
                        ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20"
                        : (isDarkMode ? "bg-zinc-900 text-zinc-400 border border-zinc-800" : "bg-white text-zinc-500 border border-zinc-200")
                    )}
                  >
                    {level === 'all' ? 'Tümü' : 
                     level === 'beginner' ? 'Başlangıç' : 
                     level === 'intermediate' ? 'Orta' : 'İleri'}
                  </button>
                ))}
              </div>
              
              <div className="grid grid-cols-1 gap-4">
                {EXERCISES
                  .filter(ex => difficultyFilter === 'all' || ex.difficulty === difficultyFilter)
                  .map(ex => (
                  <div key={ex.id} className={cn(
                    "rounded-3xl border overflow-hidden shadow-sm transition-colors",
                    isDarkMode ? "bg-zinc-900 border-zinc-800" : "bg-white border-zinc-200"
                  )}>
                      <div className="relative">
                        <img src={ex.image} alt={ex.name} className="w-full h-48 object-cover" />
                        {ex.videoUrl && (
                          <div className="absolute top-3 left-3 bg-emerald-500 text-white px-2 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1 shadow-lg">
                            <Zap size={10} fill="white" />
                            VİDEO
                          </div>
                        )}
                      </div>
                    <div className="p-6">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="text-xl font-bold">{ex.name}</h3>
                        <span className={cn(
                          "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider",
                          ex.difficulty === 'beginner' ? "bg-emerald-100 text-emerald-700" :
                          ex.difficulty === 'intermediate' ? "bg-blue-100 text-blue-700" : "bg-red-100 text-red-700"
                        )}>
                          {ex.difficulty}
                        </span>
                      </div>
                      <p className={cn(
                        "text-sm mb-4",
                        isDarkMode ? "text-zinc-400" : "text-zinc-500"
                      )}>{ex.description}</p>
                      <button 
                        onClick={() => setShowInstructions(ex)}
                        className={cn(
                          "w-full py-3 rounded-xl font-bold transition-colors flex items-center justify-center gap-2",
                          isDarkMode ? "bg-zinc-800 hover:bg-zinc-700 text-zinc-200" : "bg-zinc-100 hover:bg-zinc-200 text-zinc-900"
                        )}
                      >
                        <Info size={18} />
                        Nasıl Yapılır?
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {currentView === 'active-workout' && aiResponse && (
            <motion.div
              key="active-workout"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="space-y-6"
            >
              {!isWorkoutStarted ? (
                <motion.div 
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  className={cn(
                    "p-8 rounded-[2.5rem] border-2 border-emerald-500 shadow-2xl shadow-emerald-500/20 text-center transition-colors",
                    isDarkMode ? "bg-zinc-900" : "bg-white"
                  )}
                >
                  <div className="w-20 h-20 bg-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-emerald-500/40 animate-pulse">
                    <Zap size={40} className="text-white" />
                  </div>
                  <h2 className="text-3xl font-bold mb-3">{aiResponse.title}</h2>
                  <p className={cn(
                    "text-zinc-500 mb-8 max-w-sm mx-auto",
                    isDarkMode ? "text-zinc-400" : "text-zinc-500"
                  )}>{aiResponse.description}</p>
                  <button 
                    onClick={() => setIsWorkoutStarted(true)}
                    className="w-full bg-emerald-500 hover:bg-emerald-400 text-white py-5 rounded-2xl font-black text-xl shadow-xl shadow-emerald-500/30 active:scale-95 transition-all flex items-center justify-center gap-3"
                  >
                    ANTRENMANI BAŞLAT
                    <ChevronRight size={24} />
                  </button>
                </motion.div>
              ) : (
                <div className={cn(
                  "p-6 rounded-3xl border shadow-sm transition-colors",
                  isDarkMode ? "bg-zinc-900 border-zinc-800" : "bg-white border-zinc-200"
                )}>
                  <h2 className="text-2xl font-bold mb-2">{aiResponse.title}</h2>
                  <p className={cn(
                    "text-sm",
                    isDarkMode ? "text-zinc-400" : "text-zinc-500"
                  )}>{aiResponse.description}</p>
                </div>
              )}

              <div className="space-y-4">
                {aiResponse.exercises.map((ex: any, idx: number) => (
                  <div 
                    key={idx} 
                    className={cn(
                      "p-6 rounded-3xl border flex items-center gap-4 cursor-pointer transition-all group",
                      isDarkMode ? "bg-zinc-900 border-zinc-800 hover:border-emerald-500" : "bg-white border-zinc-200 hover:border-emerald-500"
                    )}
                    onClick={() => setShowInstructions(ex)}
                  >
                    <div className="relative">
                      <div className="w-10 h-10 bg-emerald-500 text-white rounded-full flex items-center justify-center font-bold">
                        {idx + 1}
                      </div>
                      {(ex.videoUrl || findVideoForExercise(ex.name)) && (
                        <div className="absolute -top-1 -right-1 bg-emerald-500 text-white p-1 rounded-full border-2 border-white dark:border-zinc-900">
                          <Zap size={8} fill="white" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-bold">{ex.name}</h4>
                      <p className={cn(
                        "text-sm",
                        isDarkMode ? "text-zinc-400" : "text-zinc-500"
                      )}>{ex.reps} • Dinlenme: {ex.rest}</p>
                    </div>
                    <Info size={18} className="text-zinc-300 group-hover:text-emerald-500 transition-colors" />
                  </div>
                ))}
              </div>

              {isWorkoutStarted && (
                <WorkoutTimer 
                  duration={30} 
                  label="Set Süresi" 
                  onComplete={() => {}} 
                />
              )}

              <button 
                onClick={() => {
                  saveWorkout({
                    date: new Date().toISOString(),
                    title: aiResponse.title,
                    exercises: aiResponse.exercises.length,
                    duration: 20
                  });
                  setCurrentView('dashboard');
                  setIsWorkoutStarted(false);
                }}
                className="w-full bg-zinc-900 text-white py-4 rounded-2xl font-bold shadow-lg border border-zinc-800 active:scale-[0.98] transition-transform"
              >
                Antrenmanı Bitir ve Kaydet
              </button>
            </motion.div>
          )}

          {currentView === 'ai-coach' && (
            <motion.div
              key="ai-coach"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col h-[calc(100vh-180px)]"
            >
              <div className="flex-1 overflow-y-auto space-y-4 mb-4 pr-2">
                <div className="bg-emerald-500 text-white p-4 rounded-2xl rounded-tl-none max-w-[80%]">
                  Merhaba! Ben senin AI Fitness Koçunum. Evde ekipmansız antrenmanlar, beslenme veya motivasyon hakkında ne sormak istersin?
                </div>
                {chatMessages.map((msg, i) => (
                  <div 
                    key={i} 
                    className={cn(
                      "p-4 rounded-2xl max-w-[80%] prose prose-sm",
                      msg.role === 'user' 
                        ? (isDarkMode ? "bg-zinc-900 border border-zinc-800 text-zinc-200 ml-auto rounded-tr-none" : "bg-white border border-zinc-200 ml-auto rounded-tr-none")
                        : "bg-emerald-500 text-white rounded-tl-none"
                    )}
                  >
                    <Markdown>{msg.text}</Markdown>
                  </div>
                ))}
                {aiLoading && (
                  <div className={cn(
                    "p-4 rounded-2xl rounded-tl-none w-24 flex gap-1 justify-center",
                    isDarkMode ? "bg-emerald-500/20" : "bg-emerald-500/10"
                  )}>
                    <span className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce" />
                    <span className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce [animation-delay:0.2s]" />
                    <span className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce [animation-delay:0.4s]" />
                  </div>
                )}
              </div>

              <div className="relative">
                <input 
                  type="text" 
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleChat()}
                  placeholder="Bir soru sor..."
                  className={cn(
                    "w-full border rounded-2xl px-6 py-4 pr-14 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all",
                    isDarkMode ? "bg-zinc-900 border-zinc-800 text-zinc-100" : "bg-white border-zinc-200 text-zinc-900"
                  )}
                />
                <button 
                  onClick={handleChat}
                  disabled={aiLoading}
                  className="absolute right-2 top-2 bottom-2 bg-emerald-500 text-white w-10 h-10 rounded-xl flex items-center justify-center hover:bg-emerald-400 transition-colors disabled:opacity-50"
                >
                  <Send size={18} />
                </button>
              </div>
            </motion.div>
          )}

          {currentView === 'profile' && (
            <motion.div
              key="profile"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              <div className={cn(
                "p-8 rounded-[2.5rem] border text-center relative overflow-hidden transition-colors",
                isDarkMode ? "bg-zinc-900 border-zinc-800" : "bg-white border-zinc-200"
              )}>
                <div className="relative z-10">
                  <div className="w-24 h-24 bg-emerald-500 rounded-[2rem] flex items-center justify-center mx-auto mb-6 shadow-xl shadow-emerald-500/20">
                    <UserIcon size={48} className="text-white" />
                  </div>
                  <h2 className="text-2xl font-black mb-1">{user?.firstName} {user?.lastName}</h2>
                  <p className="text-zinc-500 text-sm mb-2">{user?.gender} • {user?.age} Yaş</p>
                  <div className="h-4" />

                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-1">
                      <div className="text-xl font-black">{streak}</div>
                      <div className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest">Seri</div>
                    </div>
                    <div className="space-y-1 border-x border-zinc-100 dark:border-zinc-800">
                      <div className="text-xl font-black">{workoutHistory.length}</div>
                      <div className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest">Antrenman</div>
                    </div>
                    <div className="space-y-1">
                      <div className="text-xl font-black">{totalMinutes}</div>
                      <div className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest">Dakika</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <button className={cn(
                  "w-full p-5 rounded-2xl border flex items-center gap-4 font-bold transition-all hover:bg-zinc-50 dark:hover:bg-zinc-800/50",
                  isDarkMode ? "bg-zinc-900 border-zinc-800" : "bg-white border-zinc-200"
                )}>
                  <Settings size={20} className="text-zinc-400" />
                  Hesap Ayarları
                  <ChevronRight size={20} className="ml-auto text-zinc-300" />
                </button>
                <button className={cn(
                  "w-full p-5 rounded-2xl border flex items-center gap-4 font-bold transition-all hover:bg-zinc-50 dark:hover:bg-zinc-800/50",
                  isDarkMode ? "bg-zinc-900 border-zinc-800" : "bg-white border-zinc-200"
                )}>
                  <ShieldCheck size={20} className="text-zinc-400" />
                  Gizlilik ve Güvenlik
                  <ChevronRight size={20} className="ml-auto text-zinc-300" />
                </button>
                <button 
                  onClick={() => {
                    localStorage.removeItem('local_user');
                    setUser(null);
                  }}
                  className="w-full p-5 rounded-2xl border border-red-500/20 bg-red-500/5 text-red-500 flex items-center gap-4 font-bold hover:bg-red-500/10 transition-all"
                >
                  <LogOut size={20} />
                  Bilgileri Sıfırla ve Çıkış Yap
                </button>
              </div>
            </motion.div>
          )}

          {currentView === 'history' && (
            <motion.div
              key="history"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-6"
            >
              <h2 className="text-2xl font-bold">Antrenman Geçmişi</h2>
              {workoutHistory.length === 0 ? (
                <div className={cn(
                  "p-12 rounded-3xl border text-center transition-colors",
                  isDarkMode ? "bg-zinc-900 border-zinc-800" : "bg-white border-zinc-200"
                )}>
                  <div className={cn(
                    "w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4",
                    isDarkMode ? "bg-zinc-800" : "bg-zinc-50"
                  )}>
                    <History className="text-zinc-300" size={32} />
                  </div>
                  <p className="text-zinc-500">Henüz antrenman yapmadın. Hadi başlayalım!</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {workoutHistory.map((item, i) => (
                    <div key={i} className={cn(
                      "p-6 rounded-3xl border flex justify-between items-center transition-colors",
                      isDarkMode ? "bg-zinc-900 border-zinc-800" : "bg-white border-zinc-200"
                    )}>
                      <div>
                        <h4 className="font-bold">{item.title}</h4>
                        <p className="text-xs text-zinc-400">{new Date(item.date).toLocaleDateString('tr-TR')}</p>
                      </div>
                      <div className="text-emerald-500 font-bold flex items-center gap-1">
                        <Trophy size={16} />
                        {item.exercises} Egzersiz
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Bottom Navigation */}
      <nav className={cn(
        "fixed bottom-0 left-0 right-0 border-t px-6 py-3 flex justify-around items-center z-50 transition-colors duration-300",
        isDarkMode ? "bg-zinc-900 border-zinc-800" : "bg-white border-zinc-200"
      )}>
        <NavButton 
          active={currentView === 'dashboard'} 
          onClick={() => setCurrentView('dashboard')}
          icon={<LayoutDashboard size={24} />}
          label="Ana Sayfa"
          isDarkMode={isDarkMode}
        />
        <NavButton 
          active={currentView === 'exercises'} 
          onClick={() => setCurrentView('exercises')}
          icon={<Dumbbell size={24} />}
          label="Egzersizler"
          isDarkMode={isDarkMode}
        />
        <NavButton 
          active={currentView === 'ai-coach'} 
          onClick={() => setCurrentView('ai-coach')}
          icon={<MessageSquare size={24} />}
          label="AI Koç"
          isDarkMode={isDarkMode}
        />
        <NavButton 
          active={currentView === 'history'} 
          onClick={() => setCurrentView('history')}
          icon={<History size={24} />}
          label="Geçmiş"
          isDarkMode={isDarkMode}
        />
        <NavButton 
          active={currentView === 'profile'} 
          onClick={() => setCurrentView('profile')}
          icon={<UserIcon size={24} />}
          label="Profil"
          isDarkMode={isDarkMode}
        />
      </nav>

      {/* Instructions Modal */}
      <AnimatePresence>
        {showInstructions && (
          <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowInstructions(null)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, y: 100 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 100 }}
              className={cn(
                "relative w-full max-w-lg rounded-t-[2rem] sm:rounded-[2rem] overflow-hidden shadow-2xl transition-colors duration-300",
                isDarkMode ? "bg-zinc-900" : "bg-white"
              )}
            >
              <div className={cn(
                "p-6 border-b flex justify-between items-center",
                isDarkMode ? "border-zinc-800" : "border-zinc-100"
              )}>
                <h3 className="text-xl font-bold">{showInstructions.name}</h3>
                <button 
                  onClick={() => setShowInstructions(null)}
                  className={cn(
                    "p-2 rounded-full transition-colors",
                    isDarkMode ? "hover:bg-zinc-800" : "hover:bg-zinc-100"
                  )}
                >
                  <X size={24} />
                </button>
              </div>
              <div className="p-6 max-h-[70vh] overflow-y-auto">
                <div className={cn(
                  "relative w-full h-64 mb-6 rounded-2xl overflow-hidden shadow-md",
                  isDarkMode ? "bg-zinc-800" : "bg-zinc-100"
                )}>
                  {(() => {
                    const videoId = showInstructions.videoUrl || findVideoForExercise(showInstructions.name);
                    if (videoId) {
                      return (
                        <iframe
                          key={videoId}
                          width="100%"
                          height="100%"
                          src={`https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&loop=1&playlist=${videoId}&controls=1&modestbranding=1&rel=0`}
                          title={showInstructions.name}
                          frameBorder="0"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                          className="w-full h-full"
                        ></iframe>
                      );
                    }
                    return (
                      <img 
                        src={showInstructions.image || `https://picsum.photos/seed/${showInstructions.name}/800/600`} 
                        alt={showInstructions.name} 
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = `https://picsum.photos/seed/${showInstructions.name}/800/600`;
                        }}
                      />
                    );
                  })()}
                </div>
                <div className="space-y-4">
                  <div>
                    <h4 className={cn(
                      "text-xs font-bold uppercase tracking-wider mb-2",
                      isDarkMode ? "text-zinc-500" : "text-zinc-400"
                    )}>Nasıl Yapılır?</h4>
                    <div className={cn(
                      "leading-relaxed whitespace-pre-line",
                      isDarkMode ? "text-zinc-300" : "text-zinc-700"
                    )}>
                      {showInstructions.instructions}
                    </div>
                  </div>
                  {showInstructions.reps && (
                    <div className={cn(
                      "p-4 rounded-2xl flex items-center gap-3 transition-colors",
                      isDarkMode ? "bg-emerald-500/10" : "bg-emerald-50"
                    )}>
                      <Zap className="text-emerald-500" size={20} />
                      <div>
                        <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-600">Önerilen</div>
                        <div className={cn(
                          "font-bold",
                          isDarkMode ? "text-emerald-400" : "text-emerald-900"
                        )}>{showInstructions.reps}</div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <div className={cn(
                "p-6 transition-colors flex flex-col gap-3",
                isDarkMode ? "bg-zinc-900" : "bg-zinc-50"
              )}>
                <button 
                  onClick={() => {
                    setAiResponse({
                      title: showInstructions.name + " Antrenmanı",
                      description: showInstructions.description,
                      exercises: [{ ...showInstructions, reps: '3 Set', rest: '60sn' }]
                    });
                    setShowInstructions(null);
                    setCurrentView('active-workout');
                    setIsWorkoutStarted(true);
                  }}
                  className="w-full bg-emerald-500 text-white py-4 rounded-2xl font-bold shadow-lg active:scale-95 transition-transform flex items-center justify-center gap-2"
                >
                  <Zap size={20} />
                  Bu Egzersizi Başlat
                </button>
                <button 
                  onClick={() => setShowInstructions(null)}
                  className={cn(
                    "w-full py-4 rounded-2xl font-bold active:scale-95 transition-transform border",
                    isDarkMode ? "bg-zinc-800 text-zinc-300 border-zinc-700" : "bg-white text-zinc-600 border-zinc-200"
                  )}
                >
                  Kapat
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function NavButton({ active, onClick, icon, label, isDarkMode }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string, isDarkMode: boolean }) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "flex flex-col items-center gap-1 transition-colors relative",
        active ? "text-emerald-500" : (isDarkMode ? "text-zinc-600 hover:text-zinc-400" : "text-zinc-400 hover:text-zinc-600")
      )}
    >
      {icon}
      <span className="text-[10px] font-bold uppercase tracking-wider">{label}</span>
      {active && (
        <motion.div 
          layoutId="nav-indicator"
          className="absolute -top-3 w-12 h-1 bg-emerald-500 rounded-full"
        />
      )}
    </button>
  );
}