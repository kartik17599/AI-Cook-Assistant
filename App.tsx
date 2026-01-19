
import React, { useState, useRef, useMemo, useCallback, useEffect } from 'react';
import { UserPreferences, FullPlan, CityType } from './types';
import { 
  generateCookingPlan, 
  identifyIngredientsFromImage, 
  generateMealVisualization, 
  generateBriefingAudio 
} from './services/geminiService';

const IconCamera = () => <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>;
const IconLock = () => <svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>;
const IconChef = () => <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2v2M5 4l1 1M19 4l-1 1M5 10v4M19 10v4M12 22a10 10 0 0 1-10-10h20a10 10 0 0 1-10 10zM12 18v-4"/></svg>;
const IconCheck = () => <svg aria-hidden="true" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4"><polyline points="20 6 9 17 4 12"/></svg>;
const IconSearch = () => <svg aria-hidden="true" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>;
const IconMap = () => <svg aria-hidden="true" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"/><line x1="8" y1="2" x2="8" y2="18"/><line x1="16" y1="6" x2="16" y2="22"/></svg>;
const IconVoice = () => <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>;
const IconEdit = () => <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>;

const CITIES: CityType[] = ['Metro', 'Tier-2', 'Tier-3'];
const DIETARY_OPTIONS = ['Veg', 'Non-Veg', 'Eggetarian', 'Vegan'];
const CONSTRAINT_OPTIONS: Array<UserPreferences['mealConstraint']> = ['Standard', 'Portable', 'Low-Effort', 'One-Pot'];

const LOADING_MESSAGES = [
  "Synchronizing with Google Search for price reality...",
  "Mapping supply nodes via Google Maps...",
  "Generating tactical dish visualizations with Imagen 4.0...",
  "Optimizing protein-to-cost ratios...",
  "Calibrating TTS mission briefing voice...",
  "Verifying Kirana availability in your sector..."
];

function decodeBase64(base64: string) {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

async function decodeAudioData(data: Uint8Array, ctx: AudioContext, sampleRate: number, numChannels: number): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);
  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

export default function App() {
  const [prefs, setPrefs] = useState<UserPreferences>(() => {
    const saved = localStorage.getItem('mafia_prefs');
    return saved ? JSON.parse(saved) : {
      scheduleSummary: '',
      timePerMeal: 25,
      budgetPerDay: 150,
      cityType: 'Tier-2',
      kitchenSetup: 'Medium',
      currency: 'INR',
      days: 2,
      dietaryRestrictions: '',
      dietaryType: 'Veg',
      mealConstraint: 'Standard',
      availableIngredients: 'rice, dal, onions, tomatoes, potatoes, turmeric'
    };
  });
  
  const [loading, setLoading] = useState(false);
  const [loadingMsgIdx, setLoadingMsgIdx] = useState(0);
  const [scanning, setScanning] = useState(false);
  const [plan, setPlan] = useState<FullPlan | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>('day-1');
  const [mealImages, setMealImages] = useState<Record<string, string>>({});
  const [imageLoading, setImageLoading] = useState<Record<string, boolean>>({});
  const [briefingPlaying, setBriefingPlaying] = useState(false);
  const [showHub, setShowHub] = useState(true);
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    localStorage.setItem('mafia_prefs', JSON.stringify(prefs));
  }, [prefs]);

  useEffect(() => {
    let interval: any;
    if (loading) {
      interval = setInterval(() => {
        setLoadingMsgIdx(prev => (prev + 1) % LOADING_MESSAGES.length);
      }, 3000);
    }
    return () => clearInterval(interval);
  }, [loading]);

  const ingredientCount = useMemo(() => {
    return prefs.availableIngredients.split(',').filter(i => i.trim().length > 0).length;
  }, [prefs.availableIngredients]);

  const handleImageUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setScanning(true);
    setError(null);
    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64 = (reader.result as string).split(',')[1];
      try {
        const detected = await identifyIngredientsFromImage(base64);
        setPrefs(p => ({ ...p, availableIngredients: p.availableIngredients ? `${p.availableIngredients}, ${detected}` : detected }));
      } catch (err: any) {
        setError(err.message);
      } finally {
        setScanning(false);
      }
    };
    reader.readAsDataURL(file);
  }, []);

  const handlePlanGeneration = useCallback(async () => {
    setLoading(true);
    setError(null);
    setMealImages({});
    setBriefingPlaying(false);

    let location = undefined;
    try {
      const pos = await new Promise<GeolocationPosition>((res, rej) => 
        navigator.geolocation.getCurrentPosition(res, rej, { timeout: 3000 }));
      location = { lat: pos.coords.latitude, lng: pos.coords.longitude };
    } catch (e) {
      console.warn("Location intel unavailable.");
    }

    try {
      const result = await generateCookingPlan(prefs, location);
      setPlan(result);
      setActiveTab('day-1');
      setShowHub(false); // Hide the hub after successful generation
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [prefs]);

  const handleVisualizeMeal = async (mealName: string) => {
    if (imageLoading[mealName] || mealImages[mealName]) return;
    setImageLoading(prev => ({ ...prev, [mealName]: true }));
    try {
      const url = await generateMealVisualization(mealName);
      setMealImages(prev => ({ ...prev, [mealName]: url }));
    } catch (e) {
      console.error("Visual failed.");
    } finally {
      setImageLoading(prev => ({ ...prev, [mealName]: false }));
    }
  };

  const handlePlayBriefing = async (text: string) => {
    if (briefingPlaying) return;
    setBriefingPlaying(true);
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      }
      const ctx = audioContextRef.current;
      const base64Audio = await generateBriefingAudio(text);
      if (!base64Audio) throw new Error("Audio generation failed.");
      
      const bytes = decodeBase64(base64Audio);
      const buffer = await decodeAudioData(bytes, ctx, 24000, 1);
      
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.connect(ctx.destination);
      source.onended = () => setBriefingPlaying(false);
      source.start();
    } catch (e) {
      console.error("Briefing audio failed.", e);
      setBriefingPlaying(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FBF9F5] text-slate-900 selection:bg-red-500/20 antialiased">
      <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-[#B91C1C] text-white p-4 rounded-xl z-[100] font-black">Skip to Operation Center</a>

      <header className="bg-white border-b-4 border-[#111827] sticky top-0 z-50 py-4 shadow-xl" role="banner">
        <div className="max-w-7xl mx-auto px-4 flex items-center justify-between">
          <div className="flex items-center space-x-6">
            <div className="relative group" aria-label="Mafia Food Logo">
              <div className="w-20 h-20 rounded-full border-4 border-[#B91C1C] p-1 shadow-2xl bg-white overflow-hidden flex items-center justify-center transform group-hover:scale-105 transition-transform duration-300">
                 <img 
                   src="https://img.freepik.com/premium-vector/cute-panda-chef-logo-mascot-cartoon-character_188398-468.jpg" 
                   alt="Mafia Food Panda Mascot" 
                   className="w-full h-full object-contain"
                 />
              </div>
              <div className="absolute -bottom-1 -right-1 bg-[#111827] text-[#D97706] p-2 rounded-full shadow-xl border-2 border-white">
                <IconChef />
              </div>
            </div>
            <div>
              <h1 className="text-4xl font-syne font-black tracking-tighter uppercase leading-none text-[#111827]">Mafia Food</h1>
              <p className="text-[12px] font-bold text-[#B91C1C] tracking-[0.4em] uppercase mt-1">Ground-Zero Ops</p>
            </div>
          </div>
          <div className="flex items-center gap-6">
            {plan && !showHub && (
              <button 
                onClick={() => setShowHub(true)}
                className="flex items-center gap-3 bg-[#111827] text-[#D97706] px-8 py-3 rounded-full text-[11px] font-black uppercase tracking-widest hover:bg-[#B91C1C] hover:text-white transition-all shadow-xl"
              >
                <IconEdit /> Adjust Intel
              </button>
            )}
            <div className="hidden lg:flex flex-col items-end border-l-2 border-slate-100 pl-6">
              <span className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Grounding Status</span>
              <div className="flex items-center gap-2 mt-1">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                <span className="text-[11px] font-black uppercase text-green-600">Secure Links Verified</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main id="main-content" className={`max-w-7xl mx-auto px-4 mt-12 grid grid-cols-1 ${showHub ? 'lg:grid-cols-12' : 'lg:grid-cols-1'} gap-10 pb-20`}>
        
        {/* INPUT: COMMAND HUB - Hidden after generation unless toggled */}
        {showHub && (
          <section className="lg:col-span-4 space-y-8 animate-in slide-in-from-left-8 duration-500" aria-labelledby="form-heading">
            <div className="bg-white rounded-[2.5rem] border-2 border-[#111827] shadow-2xl overflow-hidden lg:sticky lg:top-32">
              <div className="bg-[#B91C1C] px-8 py-6 flex items-center justify-between text-white border-b-4 border-[#111827]">
                 <h2 id="form-heading" className="text-[12px] font-syne font-black uppercase tracking-[0.35em]">Command Hub</h2>
                 <IconChef />
              </div>
              
              <div className="p-8 space-y-8">
                {error && (
                  <div role="alert" className="p-5 bg-red-50 border-l-8 border-[#B91C1C] rounded-xl text-[13px] font-bold text-[#B91C1C] flex items-start gap-3">
                    <span className="text-xl" aria-hidden="true">🥊</span> 
                    <p>{error}</p>
                  </div>
                )}

                <div className="space-y-3">
                  <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest ml-1">Tactical Mode</label>
                  <div className="grid grid-cols-2 gap-3" role="radiogroup" aria-label="Mission Mode Selection">
                    {CONSTRAINT_OPTIONS.map(opt => (
                      <button 
                        key={opt}
                        role="radio"
                        aria-checked={prefs.mealConstraint === opt}
                        onClick={() => setPrefs({...prefs, mealConstraint: opt})}
                        className={`py-4 px-4 rounded-2xl border-2 transition-all text-[12px] font-black ${
                          prefs.mealConstraint === opt ? 'bg-[#111827] border-[#111827] text-[#D97706] shadow-xl scale-[1.02]' : 'bg-slate-50 border-slate-200 text-slate-400 hover:border-[#B91C1C]/40'
                        }`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label htmlFor="city-intel" className="text-[11px] font-black text-slate-500 uppercase tracking-widest ml-1">Market Intel</label>
                    <select 
                      id="city-intel"
                      className="w-full bg-slate-50 border-2 border-slate-200 rounded-2xl p-4 text-sm font-bold outline-none focus:border-[#B91C1C] transition-all"
                      value={prefs.cityType}
                      onChange={(e) => setPrefs({...prefs, cityType: e.target.value as CityType})}
                    >
                      {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="daily-cap" className="text-[11px] font-black text-slate-500 uppercase tracking-widest ml-1">Daily Cap</label>
                    <input 
                      id="daily-cap"
                      type="number"
                      className="w-full bg-slate-50 border-2 border-slate-200 rounded-2xl p-4 text-sm font-bold outline-none focus:border-[#B91C1C] transition-all"
                      value={prefs.budgetPerDay}
                      onChange={(e) => setPrefs({...prefs, budgetPerDay: Math.max(0, Number(e.target.value))})}
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between items-center mb-1 px-1">
                    <label htmlFor="pantry-intel" className="text-[11px] font-black text-slate-500 uppercase tracking-widest">Pantry Assets</label>
                    <button 
                      onClick={() => fileInputRef.current?.click()}
                      disabled={scanning}
                      className="text-[11px] font-black text-[#B91C1C] flex items-center space-x-2 bg-red-50 px-3 py-1.5 rounded-full"
                    >
                      <IconCamera /> <span>{scanning ? 'SCANNING...' : 'SCAN'}</span>
                    </button>
                    <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handleImageUpload} />
                  </div>
                  <textarea 
                    id="pantry-intel"
                    className="w-full bg-slate-50 border-2 border-slate-200 rounded-[1.5rem] p-6 text-sm font-medium min-h-[100px] outline-none focus:border-[#B91C1C] transition-all resize-none shadow-inner"
                    value={prefs.availableIngredients}
                    onChange={(e) => setPrefs({...prefs, availableIngredients: e.target.value})}
                  />
                </div>

                <button 
                  onClick={handlePlanGeneration}
                  disabled={loading}
                  aria-busy={loading}
                  className="w-full py-6 bg-[#111827] text-[#D97706] rounded-[2rem] font-syne font-black text-sm uppercase tracking-[0.4em] shadow-2xl hover:bg-[#1f2937] transition-all disabled:opacity-50 border-b-8 border-[#B91C1C]"
                >
                  {loading ? 'ARCHITECTING...' : 'Execute Blueprint'}
                </button>
              </div>
            </div>
          </section>
        )}

        {/* OUTPUT: OPERATION BLUEPRINT - Becomes full width if Hub is hidden */}
        <section className={showHub ? 'lg:col-span-8 space-y-10' : 'lg:col-span-12 space-y-10'} aria-live="polite">
          {plan ? (
            <div className="animate-in fade-in slide-in-from-bottom-8 duration-700">
              
              <div className="bg-white rounded-[3.5rem] p-14 border-4 border-[#111827] shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-80 h-80 bg-[#B91C1C]/5 rounded-full -mr-40 -mt-40 blur-3xl" aria-hidden="true"></div>
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-12 relative z-10">
                  <div className="space-y-6 flex-1">
                    <div className="flex items-center gap-6">
                      <h2 className="text-6xl font-syne font-black tracking-tighter text-[#111827] uppercase italic">The Intel</h2>
                      <span className={`px-6 py-2 rounded-full text-[12px] font-black uppercase tracking-[0.25em] border-4 ${plan.isFallback ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'}`}>
                        {plan.isFallback ? 'BUDGET ALERT' : 'SECURE'}
                      </span>
                    </div>
                    
                    <div className="relative">
                      <p className="text-slate-600 text-lg font-medium max-w-xl leading-relaxed italic border-l-[12px] border-[#B91C1C] pl-10 py-3">
                        "{plan.personalisationProof}"
                      </p>
                      <button 
                        onClick={() => handlePlayBriefing(plan.personalisationProof)}
                        disabled={briefingPlaying}
                        className="mt-4 flex items-center gap-3 bg-[#111827] text-[#D97706] px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-[#B91C1C] hover:text-white transition-all disabled:opacity-50 shadow-lg"
                      >
                        <IconVoice /> {briefingPlaying ? 'PLAYING BRIEFING...' : 'LISTEN TO BRIEFING'}
                      </button>
                    </div>
                    
                    {plan.sources && plan.sources.length > 0 && (
                      <div className="mt-8 p-6 bg-slate-50 rounded-3xl border-2 border-slate-100">
                        <h4 className="text-[11px] font-black uppercase tracking-[0.3em] text-slate-400 mb-4 flex items-center gap-2">
                           <span className="w-2 h-2 bg-[#B91C1C] rounded-full"></span> Multi-Modal Ground-Truth Intelligence
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                          {plan.sources.map((source: any, idx) => (
                            <a 
                              key={idx} 
                              href={source.uri} 
                              target="_blank" 
                              rel="noopener noreferrer" 
                              className="bg-white p-3 rounded-xl border border-slate-200 text-[11px] font-bold text-[#111827] hover:border-[#B91C1C] hover:text-[#B91C1C] transition-all flex items-center gap-3 group shadow-sm"
                            >
                              <div className="text-[#B91C1C]">{source.type === 'maps' ? <IconMap /> : <IconSearch />}</div>
                              <span className="truncate">{source.title}</span>
                              <span className="opacity-0 group-hover:opacity-100 transition-opacity ml-auto">↗</span>
                            </a>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="bg-[#FBF9F5] p-12 rounded-[3rem] border-4 border-[#111827] text-right flex flex-col justify-center min-w-[300px] shadow-2xl transform rotate-1">
                    <span className="text-[12px] font-black text-slate-500 uppercase tracking-widest mb-2">Operation Spend</span>
                    <span className="text-6xl font-syne font-black text-[#B91C1C]">{plan.totalEstimatedCost}</span>
                    <span className="text-[11px] font-bold text-[#D97706] mt-3 uppercase tracking-widest">{plan.budgetAnalysis}</span>
                  </div>
                </div>
              </div>

              <nav className="flex gap-5 mb-10 mt-10 overflow-x-auto pb-6 no-scrollbar" role="tablist">
                {plan.days.map(day => (
                  <button 
                    key={day.dayNumber}
                    role="tab"
                    aria-selected={activeTab === `day-${day.dayNumber}`}
                    onClick={() => setActiveTab(`day-${day.dayNumber}`)}
                    className={`px-12 py-6 rounded-[2rem] text-sm font-black transition-all border-4 shrink-0 ${
                      activeTab === `day-${day.dayNumber}` ? 'bg-[#B91C1C] border-[#111827] text-white shadow-2xl -translate-y-1' : 'bg-white border-slate-200 text-slate-400 hover:border-[#B91C1C]'
                    }`}
                  >
                    Day {day.dayNumber} Blueprint
                  </button>
                ))}
                <button 
                  role="tab"
                  aria-selected={activeTab === 'grocery'}
                  onClick={() => setActiveTab('grocery')}
                  className={`px-12 py-6 rounded-[2rem] text-sm font-black transition-all border-4 shrink-0 ${
                    activeTab === 'grocery' ? 'bg-[#111827] border-[#111827] text-[#D97706] shadow-2xl' : 'bg-white border-slate-200 text-slate-400'
                  }`}
                >
                  Hit List
                </button>
              </nav>

              {plan.days.map(day => (
                <div key={day.dayNumber} className={activeTab === `day-${day.dayNumber}` ? 'space-y-12 animate-in fade-in' : 'hidden'}>
                  <div className="bg-[#111827] p-12 rounded-[3.5rem] shadow-2xl text-white border-b-[12px] border-[#B91C1C] transform -rotate-1">
                    <div className="flex items-center gap-6 mb-10">
                       <div className="w-14 h-14 rounded-full bg-[#B91C1C] flex items-center justify-center text-3xl shadow-xl" aria-hidden="true">🎯</div>
                       <h3 className="text-[14px] font-black uppercase tracking-[0.6em] text-[#D97706]">Order of Operations</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                      {day.cookingSequence.map((step, idx) => (
                        <div key={idx} className="bg-white/5 p-6 rounded-3xl border-2 border-white/10 text-[13px] font-bold leading-tight flex gap-6 hover:bg-white/10 transition-all cursor-default group">
                          <span className="text-[#B91C1C] font-syne font-black text-3xl group-hover:scale-110 transition-transform">0{idx+1}</span>
                          <span className="text-slate-200">{step}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-12">
                    {day.meals.map((meal, midx) => (
                      <article key={midx} className="bg-white rounded-[4rem] border-4 border-slate-200 shadow-2xl overflow-hidden group hover:border-[#B91C1C] transition-all duration-500">
                        <div className="flex flex-col md:flex-row">
                          <div className="md:w-1/3 bg-[#FBF9F5] p-14 border-r-4 border-slate-100 relative">
                            <span className="text-[12px] font-black px-6 py-2.5 bg-[#111827] rounded-full text-white uppercase tracking-[0.25em]">{meal.type}</span>
                            <h4 className="text-5xl font-syne font-black text-[#111827] mt-8 italic tracking-tighter leading-none group-hover:text-[#B91C1C] transition-colors">{meal.name}</h4>
                            
                            <div className="mt-8 relative aspect-square rounded-[2rem] overflow-hidden border-4 border-slate-200 shadow-inner bg-slate-100">
                              {mealImages[meal.name] ? (
                                <img src={mealImages[meal.name]} alt={meal.name} className="w-full h-full object-cover animate-in fade-in" />
                              ) : (
                                <button 
                                  onClick={() => handleVisualizeMeal(meal.name)}
                                  disabled={imageLoading[meal.name]}
                                  className="w-full h-full flex flex-col items-center justify-center text-[#B91C1C] p-6 hover:bg-slate-200 transition-colors"
                                >
                                  {imageLoading[meal.name] ? (
                                    <div className="w-8 h-8 border-4 border-t-transparent border-[#B91C1C] rounded-full animate-spin"></div>
                                  ) : (
                                    <>
                                      <span className="text-3xl mb-2">📸</span>
                                      <span className="text-[11px] font-black uppercase tracking-widest text-center">Visualize Operation Blueprint</span>
                                    </>
                                  )}
                                </button>
                              )}
                            </div>

                            <div className="mt-8 flex flex-wrap gap-4">
                               <span className="text-[12px] font-bold text-slate-500 bg-white px-5 py-2 rounded-full border-2 border-slate-100 shadow-sm">⏱ {meal.timeEstimate}</span>
                               {meal.constraintBadge && (
                                 <span className="text-[12px] font-black text-[#D97706] bg-[#111827] px-5 py-2 rounded-full shadow-2xl">🏅 {meal.constraintBadge}</span>
                               )}
                            </div>
                          </div>
                          
                          <div className="flex-1 p-14 grid grid-cols-1 md:grid-cols-2 gap-14">
                             <div className="space-y-8">
                               <h5 className="text-[14px] font-black text-[#111827] uppercase tracking-[0.3em] flex items-center gap-4">
                                 <div className="w-3 h-3 bg-[#B91C1C] rounded-full shadow-lg" aria-hidden="true"></div> Inventory
                               </h5>
                               <ul className="space-y-5">
                                 {meal.ingredients.map((ing, iidx) => (
                                   <li key={iidx} className="flex justify-between items-center text-lg font-bold border-b-2 border-slate-50 pb-4">
                                     <span className="text-slate-700">{ing.name} <span className="text-slate-400 text-sm font-normal italic">({ing.amount})</span></span>
                                     <span className={`text-[11px] px-5 py-1.5 rounded-full font-black uppercase tracking-widest ${ing.source === 'Pantry' ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'}`}>
                                       {ing.source}
                                     </span>
                                   </li>
                                 ))}
                               </ul>
                             </div>
                             <div className="space-y-8">
                               <h5 className="text-[14px] font-black text-[#111827] uppercase tracking-[0.3em] flex items-center gap-4">
                                 <div className="w-3 h-3 bg-[#111827] rounded-full shadow-lg" aria-hidden="true"></div> Methodology
                               </h5>
                               <ol className="space-y-6">
                                 {meal.steps.map((step, sidx) => (
                                   <li key={sidx} className="text-base font-bold text-slate-600 flex leading-relaxed">
                                     <span className="text-[#B91C1C] mr-6 font-syne font-black text-2xl" aria-hidden="true">{sidx+1}.</span>
                                     {step}
                                   </li>
                                 ))}
                               </ol>
                             </div>
                          </div>
                        </div>
                      </article>
                    ))}
                  </div>
                </div>
              ))}

              <div className={activeTab === 'grocery' ? 'animate-in fade-in duration-700' : 'hidden'}>
                <div className="bg-white rounded-[5rem] p-24 border-8 border-[#111827] shadow-2xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-full h-full opacity-5 bg-[url('https://www.transparenttextures.com/patterns/natural-paper.png')]" aria-hidden="true"></div>
                  <div className="flex flex-col md:flex-row justify-between items-end mb-24 border-b-8 border-slate-100 pb-16 relative z-10">
                    <div>
                      <h3 className="text-7xl font-syne font-black text-[#111827] uppercase italic tracking-tighter leading-tight">Acquisition</h3>
                      <p className="text-lg font-bold text-slate-400 uppercase tracking-[0.6em] mt-6 underline decoration-[#B91C1C] decoration-8 underline-offset-[12px]">Strategy Blueprint</p>
                    </div>
                    <div className="text-right mt-10 md:mt-0">
                       <span className="text-[14px] font-black text-slate-400 uppercase tracking-widest">Rate Verified</span>
                       <div className="text-4xl font-syne font-black text-[#B91C1C] uppercase mt-3 italic tracking-[0.2em]">Google Grounded</div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-24 relative z-10">
                    {['Produce', 'Protein', 'Pantry', 'Dairy', 'Other'].map(cat => {
                      const items = plan.groceryList.filter(i => i.category === cat);
                      if (items.length === 0) return null;
                      return (
                        <div key={cat} className="space-y-10">
                          <h4 className="text-lg font-syne font-black text-[#111827] uppercase tracking-[0.7em] flex items-center gap-6">
                             <div className="w-10 h-2 bg-[#B91C1C] rounded-full shadow-lg" aria-hidden="true"></div> {cat}
                          </h4>
                          <ul className="space-y-8">
                            {items.map((item, idx) => (
                              <li key={idx} className="flex items-center justify-between group cursor-pointer border-b-2 border-slate-50 pb-6">
                                <label className="flex items-center cursor-pointer flex-1">
                                  <input type="checkbox" className="w-8 h-8 rounded-xl border-4 border-slate-300 text-[#B91C1C] focus:ring-[#B91C1C] mr-8 transition-all hover:scale-110" />
                                  <span className="text-xl font-black text-slate-700 group-hover:text-[#B91C1C] transition-colors uppercase italic tracking-tight">{item.item}</span>
                                </label>
                                <span className="text-lg font-syne font-black text-slate-400">{item.estimatedCost}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

            </div>
          ) : (
            <div className="h-full min-h-[700px] flex flex-col items-center justify-center text-center p-24 bg-white border-4 border-slate-200 rounded-[5rem] shadow-2xl relative overflow-hidden group">
              <div className="absolute inset-0 bg-slate-50 opacity-40 group-hover:opacity-60 transition-opacity" aria-hidden="true"></div>
              {loading ? (
                <div className="space-y-16 relative z-10" role="alert" aria-busy="true">
                  <div className="w-32 h-32 border-[16px] border-slate-100 border-t-[#B91C1C] rounded-full animate-spin mx-auto shadow-2xl"></div>
                  <div className="space-y-4">
                    <h3 className="text-4xl font-syne font-black text-[#111827] uppercase italic tracking-[0.3em]">{LOADING_MESSAGES[loadingMsgIdx]}</h3>
                    <p className="text-[12px] font-black uppercase text-slate-400 tracking-[0.8em] animate-pulse">Consulting Google Search & Maps...</p>
                  </div>
                </div>
              ) : (
                <div className="relative z-10 space-y-12">
                  <div className="w-48 h-48 bg-white rounded-full flex items-center justify-center shadow-2xl border-8 border-[#B91C1C] mx-auto transform hover:rotate-[15deg] hover:scale-110 transition-all duration-500 cursor-pointer shadow-red-200">
                     <span className="text-8xl" role="img" aria-label="Tactical Panda Mascot">🐼</span>
                  </div>
                  <div className="space-y-5">
                    <h3 className="text-6xl font-syne font-black text-[#111827] italic tracking-tighter uppercase leading-none">Mafia Food Engine</h3>
                    <p className="text-slate-400 text-[14px] font-black uppercase tracking-[0.8em]">Tactical Prep • Budget Engineering</p>
                  </div>
                  <p className="text-slate-500 text-lg font-medium max-w-xl leading-relaxed mx-auto italic">
                    "Listen kid, I don't care if you're in a Tier-3 village or a Metro high-rise. Mafia Food ensures you're fed tactical, flavor-packed meals without blowing your budget. Lock in the mission intel and let's cook."
                  </p>
                </div>
              )}
            </div>
          )}
        </section>
      </main>

      <footer className="max-w-7xl mx-auto px-4 mt-40 pb-20 border-t-8 border-[#111827] pt-20 text-center" role="contentinfo">
        <div className="flex flex-col items-center space-y-8">
           <div className="w-20 h-20 rounded-full border-4 border-[#B91C1C] bg-[#111827] flex items-center justify-center text-2xl font-black text-[#D97706] shadow-2xl transform hover:rotate-[360deg] transition-transform duration-1000" aria-hidden="true">M</div>
           <div className="text-[12px] font-black text-slate-400 uppercase tracking-[1.5em] italic">MAFIA FOOD • PRECISION MEAL ENGINEERING • GROUND-ZERO OPS</div>
        </div>
      </footer>
    </div>
  );
}
