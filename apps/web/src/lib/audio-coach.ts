'use client';

import { SupportedLanguage } from '@rehabsense/types';
import { spatialAudio, AudioPanSide } from './spatial-audio';

export interface CoachingPhraseOptions {
  repNumber?: number;
  targetReps?: number;
  side?: AudioPanSide;
  angle?: number;
  faultSide?: 'left' | 'right';
}

/**
 * Native clinically calibrated translations dictionary for:
 * - English (en)
 * - Hindi (hi - हिन्दी)
 * - Marathi (mr - मराठी)
 */
export const TRANSLATIONS: Record<SupportedLanguage, Record<string, string | ((opts: CoachingPhraseOptions) => string)>> = {
  en: {
    // Session Cues
    session_start: 'Welcome to your rehabilitation session. Stand comfortably in front of the camera.',
    countdown_3: 'Three',
    countdown_2: 'Two',
    countdown_1: 'One',
    countdown_begin: 'Begin exercise. Keep movement controlled.',
    
    // Repetition Counts
    rep_count: (opts) => `Repetition ${opts.repNumber || 1}`,
    rep_valid: 'Good repetition. Well controlled movement.',
    rep_under_range: 'Movement was below target range. Try to reach full extension.',
    target_reached: 'Target reached! Smoothly return to start position.',
    target_completed: (opts) => `Prescribed target of ${opts.targetReps || 10} repetitions completed! Excellent work.`,
    
    // Safety & Framing
    confidence_paused: 'Movement analysis paused. Step into camera view.',
    framing_optimal: 'Framing optimal. You are in good position.',
    framing_close: 'Please step back slightly.',
    framing_far: 'Please move slightly closer.',
    
    // Posture & Directional Correction (Left / Right)
    posture_left_warning: 'Left posture error detected. Check your left side alignment.',
    posture_right_warning: 'Right posture error detected. Check your right side alignment.',
    shoulder_hike_left: 'Left shoulder is too high. Relax and lower your left shoulder.',
    shoulder_hike_right: 'Right shoulder is too high. Relax and lower your right shoulder.',
    trunk_lean_left: 'Leaning to the left. Keep your spine upright and straight.',
    trunk_lean_right: 'Leaning to the right. Keep your spine upright and straight.',
    pelvic_shift_left: 'Uneven weight shift to the left. Distribute weight evenly.',
    pelvic_shift_right: 'Uneven weight shift to the right. Distribute weight evenly.',
    arm_misaligned_left: 'Left arm posture incorrect. Align your arm smoothly.',
    arm_misaligned_right: 'Right arm posture incorrect. Align your arm smoothly.',

    // Earphone Tests
    test_left_earphone: 'Left earphone active. Sound is in your left ear.',
    test_right_earphone: 'Right earphone active. Sound is in your right ear.',
    test_voice_greeting: 'Hello Aarav. Your audio rehab coach is calibrated in English.',
  },

  hi: {
    // Session Cues
    session_start: 'आपके पुनर्वास सत्र में आपका स्वागत है। कैमरे के सामने आराम से खड़े रहें।',
    countdown_3: 'तीन',
    countdown_2: 'दो',
    countdown_1: 'एक',
    countdown_begin: 'व्यायाम शुरू करें। गति को पूरी तरह से नियंत्रित रखें।',
    
    // Repetition Counts
    rep_count: (opts) => `पुनरावृत्ति ${opts.repNumber || 1}`,
    rep_valid: 'बहुत बढ़िया! गति पूरी तरह से संतुलित और सही है।',
    rep_under_range: 'गतिविधि लक्ष्य से कम रही। थोड़ा और विस्तार करने का प्रयास करें।',
    target_reached: 'लक्ष्य प्राप्त हुआ! अब धीरे-धीरे प्रारंभिक स्थिति में वापस आएं।',
    target_completed: (opts) => `बधाई हो! निर्धारित ${opts.targetReps || 10} पुनरावृत्तियां पूरी हुईं। आप सत्र समाप्त कर सकते हैं।`,
    
    // Safety & Framing
    confidence_paused: 'विश्लेषण रुका हुआ है। कृपया कैमरे के सामने सही दूरी पर आएं।',
    framing_optimal: 'कैमरा स्थिति सही है। व्यायाम जारी रखें।',
    framing_close: 'कृपया थोड़ा पीछे हटें।',
    framing_far: 'कृपया थोड़ा आगे आएं।',
    
    // Posture & Directional Correction (Left / Right)
    posture_left_warning: 'बाईं मुद्रा गलत है। बायां संतुलन ठीक करें।',
    posture_right_warning: 'दाहिनी मुद्रा गलत है। दायां संतुलन ठीक करें।',
    shoulder_hike_left: 'बायां कंधा बहुत ऊपर उठ रहा है। बायां कंधा ढीला और नीचे रखें।',
    shoulder_hike_right: 'दायां कंधा बहुत ऊपर उठ रहा है। दायां कंधा ढीला और नीचे रखें।',
    trunk_lean_left: 'शरीर बाईं ओर झुक रहा है। अपनी रीढ़ की हड्डी को सीधा रखें।',
    trunk_lean_right: 'शरीर दाईं ओर झुक रहा है। अपनी रीढ़ की हड्डी को सीधा रखें।',
    pelvic_shift_left: 'बाईं ओर असंतुलित वजन। दोनों पैरों पर समान भार रखें।',
    pelvic_shift_right: 'दाईं ओर असंतुलित वजन। दोनों पैरों पर समान भार रखें।',
    arm_misaligned_left: 'बाएं हाथ की मुद्रा गलत है। हाथ को सही सीध में रखें।',
    arm_misaligned_right: 'दाएं हाथ की मुद्रा गलत है। हाथ को सही सीध में रखें।',

    // Earphone Tests
    test_left_earphone: 'बायां ईयरफोन सक्रिय। आवाज़ आपके बाएं कान में आ रही है।',
    test_right_earphone: 'दायां ईयरफोन सक्रिय। आवाज़ आपके दाएं कान में आ रही है।',
    test_voice_greeting: 'नमस्ते आरव। आपका ऑडियो रिहैब कोच हिंदी में सक्रिय है।',
  },

  mr: {
    // Session Cues
    session_start: 'तुमच्या पुनर्वसन सत्रात स्वागत आहे. कॅमेऱ्यासमोर शांतपणे उभे राहा.',
    countdown_3: 'तीन',
    countdown_2: 'दोन',
    countdown_1: 'एक',
    countdown_begin: 'व्यायाम सुरू करा. हालचाल सावकाश आणि नियंत्रित ठेवा.',
    
    // Repetition Counts
    rep_count: (opts) => `पुनरावृत्ती ${opts.repNumber || 1}`,
    rep_valid: 'छान! हालचाल अतिशय उत्तम आणि नियंत्रित आहे.',
    rep_under_range: 'हालचाल ठरलेल्या मर्यादेपेक्षा कमी आहे. संपूर्ण ताण देण्याचा प्रयत्न करा.',
    target_reached: 'लक्ष्य गाठले! आता हळूवारपणे मूळ स्थितीत परत या.',
    target_completed: (opts) => `अभिनंदन! ठरवलेल्या ${opts.targetReps || 10} पुनरावृत्त्या यशस्वीरीत्या पूर्ण झाल्या आहेत.`,
    
    // Safety & Framing
    confidence_paused: 'हालचाल विश्लेषण थांबले आहे. कृपया कॅमेऱ्यासमोर नीट उभे राहा.',
    framing_optimal: 'कॅमेरा पोझिशन योग्य आहे. व्यायाम सुरू ठेवा.',
    framing_close: 'कृपया थोडे मागे व्हा.',
    framing_far: 'कृपया थोडे पुढे या.',
    
    // Posture & Directional Correction (Left / Right)
    posture_left_warning: 'डाव्या बाजूची मुद्रा चुकली आहे. डावा भाग सरळ करा.',
    posture_right_warning: 'उजव्या बाजूची मुद्रा चुकली आहे. उजवा भाग सरळ करा.',
    shoulder_hike_left: 'डावा खांदा खूप वर उचलला आहे. डावा खांदा सैल आणि खाली ठेवा.',
    shoulder_hike_right: 'उजवा खांदा खूप वर उचलला आहे. उजवा खांदा सैल आणि खाली ठेवा.',
    trunk_lean_left: 'शरीर डाव्या बाजूला झुकत आहे. पाठीचा कणा ताठ आणि सरळ ठेवा.',
    trunk_lean_right: 'शरीर उजव्या बाजूला झुकत आहे. पाठीचा कणा ताठ आणि सरळ ठेवा.',
    pelvic_shift_left: 'डाव्या बाजूला असमान वजन. दोन्ही पायांवर समान भार ठेवा.',
    pelvic_shift_right: 'उजव्या बाजूला असमान वजन. दोन्ही पायांवर समान भार ठेवा.',
    arm_misaligned_left: 'डाव्या हाताची हालचाल चुकली आहे. हात योग्य रेषेत ठेवा.',
    arm_misaligned_right: 'उजव्या हाताची हालचाल चुकली आहे. हात योग्य रेषेत ठेवा.',

    // Earphone Tests
    test_left_earphone: 'डावा इयरफोन सक्रिय. आवाज तुमच्या डाव्या कानात येत आहे.',
    test_right_earphone: 'उजवा इयरफोन सक्रिय. आवाज तुमच्या उजव्या कानात येत आहे.',
    test_voice_greeting: 'नमस्कार आरव. तुमचा ऑडिओ रिहॅब कोच मराठीमध्ये सक्रिय झाला आहे.',
  }
};

/**
 * Best voice resolver for SpeechSynthesis
 * Selects calm, natural human voices across Chromium, Safari, Edge, Firefox, and macOS
 */
function selectNaturalVoice(lang: SupportedLanguage): { voice: SpeechSynthesisVoice | null; langCode: string } {
  if (typeof window === 'undefined' || !window.speechSynthesis) {
    return { voice: null, langCode: 'en-US' };
  }

  const voices = window.speechSynthesis.getVoices() || [];

  if (lang === 'mr') {
    // 1. Check for native Marathi voice
    const mrVoice = voices.find((v) => 
      v.lang.toLowerCase().startsWith('mr') || 
      v.name.toLowerCase().includes('marathi') ||
      v.name.toLowerCase().includes('मराठी')
    );
    if (mrVoice) return { voice: mrVoice, langCode: mrVoice.lang || 'mr-IN' };

    // 2. High-quality Hindi voice fallback (Hindi & Marathi share Devanagari script and phonetics)
    const hiVoice = voices.find((v) => 
      v.lang.toLowerCase().startsWith('hi') || 
      v.name.toLowerCase().includes('hindi') || 
      v.name.includes('हिन्दी') ||
      v.name.toLowerCase().includes('lekha') ||
      v.name.toLowerCase().includes('rishi')
    );
    if (hiVoice) return { voice: hiVoice, langCode: 'hi-IN' };

    return { voice: null, langCode: 'mr-IN' };
  }

  if (lang === 'hi') {
    // High-quality Hindi voices (Google हिन्दी, Lekha, Rishi, Neerja, Swara)
    const hiVoice = voices.find((v) => 
      (v.lang.toLowerCase().startsWith('hi') || v.name.toLowerCase().includes('hindi') || v.name.includes('हिन्दी')) &&
      (v.name.includes('Google') || v.name.includes('Natural') || v.name.includes('Enhanced'))
    ) || voices.find((v) => v.lang.toLowerCase().startsWith('hi') || v.name.toLowerCase().includes('hindi') || v.name.includes('हिन्दी'));

    if (hiVoice) return { voice: hiVoice, langCode: hiVoice.lang || 'hi-IN' };
    return { voice: null, langCode: 'hi-IN' };
  }

  // English: Pick natural, enhanced, calm voices instead of robotic synthesizer
  const naturalEnVoice = voices.find((v) => 
    v.lang.toLowerCase().startsWith('en') && 
    (v.name.includes('Natural') || v.name.includes('Enhanced') || v.name.includes('Google') || v.name.includes('Samantha') || v.name.includes('Ava') || v.name.includes('Daniel') || v.name.includes('Serena'))
  ) || voices.find((v) => v.lang.toLowerCase() === 'en-in')
    || voices.find((v) => v.lang.toLowerCase().startsWith('en'));

  return { voice: naturalEnVoice || null, langCode: naturalEnVoice?.lang || 'en-US' };
}

class AudioCoachManager {
  private currentLanguage: SupportedLanguage = 'en';
  private voiceEnabled: boolean = true;
  private earphoneFeedbackEnabled: boolean = true;
  private lastSpokenText: string = '';
  private lastSpokenTimestamp: number = 0;
  private isSpeaking: boolean = false;

  constructor() {
    // Listen for voice catalog loading in browser
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.onvoiceschanged = () => {
        // Pre-warm voice registry
        selectNaturalVoice(this.currentLanguage);
      };
    }
  }

  public setLanguage(lang: SupportedLanguage) {
    this.currentLanguage = lang;
  }

  public getLanguage(): SupportedLanguage {
    return this.currentLanguage;
  }

  public setVoiceEnabled(enabled: boolean) {
    this.voiceEnabled = enabled;
  }

  public isVoiceEnabled(): boolean {
    return this.voiceEnabled;
  }

  public setEarphoneFeedbackEnabled(enabled: boolean) {
    this.earphoneFeedbackEnabled = enabled;
  }

  public isEarphoneFeedbackEnabled(): boolean {
    return this.earphoneFeedbackEnabled;
  }

  /**
   * Get localized string for a key with options
   */
  public getPhrase(key: string, opts: CoachingPhraseOptions = {}): string {
    const langDict = TRANSLATIONS[this.currentLanguage] || TRANSLATIONS.en;
    const item = langDict[key] || TRANSLATIONS.en[key];

    if (!item) return key;
    if (typeof item === 'function') {
      return item(opts);
    }
    return item;
  }

  /**
   * Speak clinical coaching phrase with natural voice acoustic calibration
   */
  public speak(
    text: string, 
    customLang?: SupportedLanguage, 
    throttleMs = 2000, 
    panSide: AudioPanSide = 'center'
  ): void {
    if (!this.voiceEnabled || typeof window === 'undefined' || !window.speechSynthesis) {
      return;
    }

    const now = Date.now();
    if (text === this.lastSpokenText && (now - this.lastSpokenTimestamp) < throttleMs) {
      return; // prevent rapid repeats
    }

    const targetLang = customLang || this.currentLanguage;

    try {
      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      const { voice, langCode } = selectNaturalVoice(targetLang);

      if (voice) {
        utterance.voice = voice;
      }
      utterance.lang = langCode;

      // Natural acoustic parameters (addresses user's "too much AI and too much sound"):
      // 0.88-0.92 rate provides calm, human, patient-friendly cadence instead of rushed robotic speed
      utterance.rate = targetLang === 'en' ? 0.91 : 0.89;
      // 0.98 pitch produces warm natural resonance without shrill synthesizer artifacts
      utterance.pitch = 0.99;
      // 0.85 volume is comfortable and clear, preventing clipping
      utterance.volume = 0.85;

      this.lastSpokenText = text;
      this.lastSpokenTimestamp = now;
      this.isSpeaking = true;

      utterance.onend = () => {
        this.isSpeaking = false;
      };

      utterance.onerror = () => {
        this.isSpeaking = false;
      };

      window.speechSynthesis.speak(utterance);
    } catch {
      this.isSpeaking = false;
    }
  }

  /**
   * Coordinated Directional Coaching Event:
   * 1. Plays distinct acoustic "Buzz" in the offender's earphone (Left or Right)
   * 2. Speaks the corrective coaching instruction in Marathi / Hindi / English
   */
  public triggerDirectionalCorrection(
    faultSide: 'left' | 'right',
    flagKey: 'shoulder_hike' | 'trunk_lean' | 'pelvic_shift' | 'arm_misaligned' | 'general' = 'general'
  ): void {
    // 1. Play directional earphone buzz
    if (this.earphoneFeedbackEnabled) {
      spatialAudio.playPostureBuzz(faultSide, 2500);
    }

    // 2. Select appropriate localized coaching phrase
    let phraseKey = `posture_${faultSide}_warning`;
    if (flagKey === 'shoulder_hike') {
      phraseKey = `shoulder_hike_${faultSide}`;
    } else if (flagKey === 'trunk_lean') {
      phraseKey = `trunk_lean_${faultSide}`;
    } else if (flagKey === 'pelvic_shift') {
      phraseKey = `pelvic_shift_${faultSide}`;
    } else if (flagKey === 'arm_misaligned') {
      phraseKey = `arm_misaligned_${faultSide}`;
    }

    const message = this.getPhrase(phraseKey, { faultSide });
    this.speak(message, this.currentLanguage, 3000, faultSide);
  }

  /**
   * Test Left Earphone: Buzzes left earphone and speaks left test message
   */
  public testLeftEarphone(): void {
    spatialAudio.playPostureBuzz('left', 0);
    const msg = this.getPhrase('test_left_earphone');
    this.speak(msg, this.currentLanguage, 0, 'left');
  }

  /**
   * Test Right Earphone: Buzzes right earphone and speaks right test message
   */
  public testRightEarphone(): void {
    spatialAudio.playPostureBuzz('right', 0);
    const msg = this.getPhrase('test_right_earphone');
    this.speak(msg, this.currentLanguage, 0, 'right');
  }

  /**
   * Test Voice Greeting in current language
   */
  public testVoiceGreeting(): void {
    const msg = this.getPhrase('test_voice_greeting');
    this.speak(msg, this.currentLanguage, 0, 'center');
  }
}

export const audioCoach = new AudioCoachManager();
