'use client';

import React, { useState } from 'react';
import { useAccessibility } from '@/lib/accessibility-context';
import { SupportedLanguage } from '@rehabsense/types';
import { 
  Headphones, 
  Volume2, 
  Globe, 
  CheckCircle2, 
  Play, 
  Sparkles, 
  ArrowLeftRight,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';

interface AudioCoachWidgetProps {
  compact?: boolean;
}

export default function AudioCoachWidget({ compact = false }: AudioCoachWidgetProps) {
  const { 
    language, 
    setLanguage, 
    voiceEnabled, 
    toggleVoice, 
    earphoneMode, 
    toggleEarphoneMode, 
    testEarphone, 
    activePanSide,
    speak,
    getPhrase
  } = useAccessibility();

  const [testingSide, setTestingSide] = useState<'left' | 'right' | null>(null);
  const [testingVoice, setTestingVoice] = useState(false);

  const handleTestEarphone = (side: 'left' | 'right') => {
    setTestingSide(side);
    testEarphone(side);
    setTimeout(() => {
      setTestingSide(null);
    }, 1800);
  };

  const handleTestVoice = () => {
    setTestingVoice(true);
    const greeting = getPhrase('test_voice_greeting');
    speak(greeting);
    setTimeout(() => {
      setTestingVoice(false);
    }, 2200);
  };

  const languages: { id: SupportedLanguage; label: string; sub: string; flag: string }[] = [
    { id: 'en', label: 'English', sub: 'Calm Natural Coach', flag: '🇬🇧' },
    { id: 'hi', label: 'हिन्दी', sub: 'प्राकृतिक आवाज़', flag: '🇮🇳' },
    { id: 'mr', label: 'मराठी', sub: 'स्पष्ट ऑडिओ मार्गदर्शक', flag: '🚩' }
  ];

  return (
    <div className="glass-card-strong rounded-3xl p-6 sm:p-7 border border-white/90 shadow-xl backdrop-blur-2xl space-y-6 relative overflow-hidden group">
      
      {/* Decorative gradient glow */}
      <div className="absolute top-0 right-0 w-80 h-40 bg-gradient-to-l from-emerald-500/10 via-sky-500/10 to-transparent blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/70 pb-5">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass-chip text-emerald-800 text-xs font-bold border border-emerald-300/60 shadow-xs">
            <Globe className="w-3.5 h-3.5 text-emerald-600" />
            <span>Multi-Language Audio & Spatial Earphones</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <span>Audio Coach & Binaural Earphone Calibration</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 max-w-2xl leading-relaxed">
            Choose your preferred spoken language and test directional earphone buzzes before starting exercises.
          </p>
        </div>

        {/* Global Sound & Earphone Toggles */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={toggleVoice}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold border transition-all flex items-center gap-2 shadow-xs cursor-pointer ${
              voiceEnabled 
                ? 'bg-emerald-700 text-white border-emerald-600 shadow-emerald-900/10' 
                : 'glass-chip text-slate-600 border-white/80 hover:bg-white'
            }`}
          >
            <Volume2 className="w-4 h-4" />
            <span>{voiceEnabled ? 'Voice Coach: ON' : 'Voice: Muted'}</span>
          </button>

          <button
            type="button"
            onClick={toggleEarphoneMode}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold border transition-all flex items-center gap-2 shadow-xs cursor-pointer ${
              earphoneMode 
                ? 'bg-[#244b38] text-white border-emerald-700 shadow-emerald-950/15' 
                : 'glass-chip text-slate-600 border-white/80 hover:bg-white'
            }`}
          >
            <Headphones className="w-4 h-4" />
            <span>{earphoneMode ? 'Spatial Earphones: ON' : 'Earphones: OFF'}</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Language Translator (Left) & Binaural Earphone Haptics (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Multi-Language Selector */}
        <div className="lg:col-span-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>Select Audio Language / भाषा निवडा</span>
            </h3>
            <span className="text-[11px] font-semibold text-slate-500">
              Active: <strong className="text-slate-900 font-bold uppercase">{language}</strong>
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2.5">
            {languages.map((lang) => {
              const isActive = language === lang.id;
              return (
                <button
                  key={lang.id}
                  type="button"
                  onClick={() => setLanguage(lang.id)}
                  className={`p-3.5 rounded-2xl border text-left transition-all relative cursor-pointer flex flex-col justify-between ${
                    isActive
                      ? 'bg-gradient-to-br from-emerald-600 to-teal-700 text-white border-emerald-500 shadow-md shadow-emerald-900/20 scale-[1.02]'
                      : 'glass-card text-slate-800 border-white/80 hover:border-emerald-300 hover:bg-white/90'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-lg">{lang.flag}</span>
                    {isActive && (
                      <CheckCircle2 className="w-4 h-4 text-emerald-200" />
                    )}
                  </div>
                  <div>
                    <p className={`font-bold text-sm leading-tight ${isActive ? 'text-white' : 'text-slate-900'}`}>
                      {lang.label}
                    </p>
                    <p className={`text-[10px] mt-0.5 line-clamp-1 ${isActive ? 'text-emerald-100' : 'text-slate-500'}`}>
                      {lang.sub}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Test Voice Greeting Button */}
          <div className="p-3.5 rounded-2xl glass-chip border border-white/80 flex items-center justify-between gap-3">
            <div className="text-xs text-slate-600">
              <p className="font-semibold text-slate-800">
                {language === 'mr' ? 'मराठी आवाज चाचणी' : language === 'hi' ? 'हिंदी आवाज़ परीक्षण' : 'Natural Clinical Tone'}
              </p>
              <p className="text-[11px] text-slate-500">
                {language === 'mr' 
                  ? 'शांत आणि मानवी उच्चार ("उजवा खांदा खाली करा", "पुनरावृत्ती १")' 
                  : language === 'hi' 
                  ? 'संतुलित एवं प्राकृतिक मार्गदर्शन ("दायाँ कंधा ढीला रखें")' 
                  : 'Calibrated at 0.9x pacing for clear medical guidance.'}
              </p>
            </div>

            <button
              type="button"
              onClick={handleTestVoice}
              disabled={testingVoice}
              className="px-3.5 py-2 rounded-xl bg-white text-emerald-900 hover:bg-emerald-50 text-xs font-bold border border-emerald-200/80 shadow-xs flex items-center gap-1.5 shrink-0 transition-all cursor-pointer disabled:opacity-50"
            >
              <Play className={`w-3.5 h-3.5 ${testingVoice ? 'animate-spin text-emerald-600' : 'text-emerald-700'}`} />
              <span>{testingVoice ? 'Speaking...' : 'Test Voice'}</span>
            </button>
          </div>
        </div>

        {/* Right Column: Directional Earphone Haptic Feedback */}
        <div className="lg:col-span-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-sky-500" />
              <span>Directional Earphone Feedback (Left vs Right)</span>
            </h3>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded-full glass-chip text-sky-800 border border-sky-300/60 font-semibold">
              Web Audio Stereo Pan
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-950 to-sky-950 text-white border border-slate-800 shadow-lg space-y-3.5">
            
            <div className="flex items-start justify-between gap-3 text-xs">
              <div className="flex items-center gap-2 text-sky-300 font-bold">
                <Headphones className="w-4 h-4 text-sky-400 shrink-0" />
                <span>Headphone Posture Guidance Active</span>
              </div>
              <span className="text-[10px] text-slate-400">
                Connect AirPods, Bluetooth or 3.5mm Earphones
              </span>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              If your <strong className="text-sky-300">left posture</strong> is incorrect, only your <strong>left earphone buzzes</strong> (⬅️). If your <strong className="text-emerald-300">right posture</strong> is incorrect, only your <strong>right earphone buzzes</strong> (➡️).
            </p>

            {/* Live Visual Stereo Balance Meter */}
            <div className="space-y-1.5 pt-1">
              <div className="flex items-center justify-between text-[10px] font-bold tracking-wider text-slate-400 uppercase">
                <span className={activePanSide === 'left' ? 'text-amber-400 font-extrabold animate-pulse' : ''}>
                  ⬅️ Left Earbud {activePanSide === 'left' ? '(BUZZING)' : ''}
                </span>
                <span className={activePanSide === 'center' ? 'text-slate-400' : ''}>
                  Stereo Balance
                </span>
                <span className={activePanSide === 'right' ? 'text-amber-400 font-extrabold animate-pulse' : ''}>
                  {activePanSide === 'right' ? '(BUZZING)' : ''} Right Earbud ➡️
                </span>
              </div>

              <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden p-0.5 border border-slate-700 flex items-center justify-center relative">
                {/* Center marker */}
                <div className="absolute w-0.5 h-full bg-slate-600 left-1/2 -translate-x-1/2 z-10" />

                {/* Left Active Glow */}
                <div 
                  className={`h-full rounded-l-full transition-all duration-200 ${
                    activePanSide === 'left' 
                      ? 'w-1/2 bg-gradient-to-l from-amber-400 to-amber-500 shadow-md shadow-amber-400/50 mr-auto' 
                      : 'w-0'
                  }`}
                />

                {/* Right Active Glow */}
                <div 
                  className={`h-full rounded-r-full transition-all duration-200 ${
                    activePanSide === 'right' 
                      ? 'w-1/2 bg-gradient-to-r from-amber-400 to-amber-500 shadow-md shadow-amber-400/50 ml-auto' 
                      : 'w-0'
                  }`}
                />
              </div>
            </div>

            {/* Test Left / Right Earphone Buttons */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                type="button"
                onClick={() => handleTestEarphone('left')}
                className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  testingSide === 'left' || activePanSide === 'left'
                    ? 'bg-amber-500 text-slate-950 border-amber-300 shadow-lg shadow-amber-500/30 font-black'
                    : 'bg-white/10 hover:bg-white/20 text-slate-200 border-white/10'
                }`}
              >
                <span>⬅️ Test Left Earphone</span>
                {testingSide === 'left' && <span className="w-2 h-2 rounded-full bg-slate-950 animate-ping" />}
              </button>

              <button
                type="button"
                onClick={() => handleTestEarphone('right')}
                className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  testingSide === 'right' || activePanSide === 'right'
                    ? 'bg-amber-500 text-slate-950 border-amber-300 shadow-lg shadow-amber-500/30 font-black'
                    : 'bg-white/10 hover:bg-white/20 text-slate-200 border-white/10'
                }`}
              >
                <span>Test Right Earphone ➡️</span>
                {testingSide === 'right' && <span className="w-2 h-2 rounded-full bg-slate-950 animate-ping" />}
              </button>
            </div>

          </div>
        </div>

      </div>

    </div>
  );
}
