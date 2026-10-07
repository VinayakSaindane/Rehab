import { FeedbackEvent, SupportedLanguage } from '@rehabsense/types';
import { RepTransitionResult } from './rep-state-machine';
import { ConfidenceGateResult } from './confidence-gate';
import { CompensationResult } from './compensation-detector';

interface LocalizedPhrases {
  paused_confidence: string;
  completed: (target: number) => string;
  rep_complete: (rep: number) => string;
  range_low: (rep: number) => string;
  target_reached: string;
  smooth_movement: string;
  posture_alert_left: string;
  posture_alert_right: string;
}

const PHRASES: Record<SupportedLanguage, LocalizedPhrases> = {
  en: {
    paused_confidence: 'Movement analysis paused — please adjust your camera.',
    completed: (t) => `Prescribed target of ${t} reps completed! You may finish your session.`,
    rep_complete: (r) => `Repetition ${r} completed. Well controlled movement.`,
    range_low: (r) => `Repetition ${r} recorded. Movement was below the prescribed range.`,
    target_reached: 'Target reached — control the return motion',
    smooth_movement: 'Smooth movement detected',
    posture_alert_left: 'Left posture incorrect: relax and align your left side.',
    posture_alert_right: 'Right posture incorrect: relax and align your right side.'
  },
  hi: {
    paused_confidence: 'गतिविधि विश्लेषण रुका हुआ है — कृपया कैमरे की स्थिति सही करें।',
    completed: (t) => `बधाई हो! निर्धारित ${t} पुनरावृत्तियां पूरी हुईं। आप सत्र समाप्त कर सकते हैं।`,
    rep_complete: (r) => `पुनरावृत्ति ${r} पूरी हुई। बहुत अच्छा और नियंत्रित संतुलन।`,
    range_low: (r) => `पुनरावृत्ति ${r} दर्ज हुई। गतिविधि निर्धारित सीमा से कम रही।`,
    target_reached: 'लक्ष्य प्राप्त हुआ — अब धीरे-धीरे वापस आएं',
    smooth_movement: 'संतुलित गतिविधि जारी है',
    posture_alert_left: 'बाईं मुद्रा गलत है: बाईं बाजू का संतुलन सही करें।',
    posture_alert_right: 'दाहिनी मुद्रा गलत है: दाहिनी बाजू का संतुलन सही करें।'
  },
  mr: {
    paused_confidence: 'हालचाल विश्लेषण थांबले आहे — कृपया कॅमेऱ्यासमोर नीट उभे राहा.',
    completed: (t) => `अभिनंदन! ठरवलेल्या ${t} पुनरावृत्त्या पूर्ण झाल्या आहेत. तुम्ही सत्र पूर्ण करू शकता.`,
    rep_complete: (r) => `पुनरावृत्ती ${r} पूर्ण झाली. हालचाल अतिशय उत्तम आणि नियंत्रित आहे.`,
    range_low: (r) => `पुनरावृत्ती ${r} नोंदवली. हालचाल ठरलेल्या मर्यादेपेक्षा कमी आहे.`,
    target_reached: 'लक्ष्य गाठले — हळूवारपणे मूळ स्थितीत परत या',
    smooth_movement: 'हालचाल सुरळीत आणि नियंत्रित आहे',
    posture_alert_left: 'डाव्या बाजूची मुद्रा चुकली आहे: डावी बाजू सरळ करा.',
    posture_alert_right: 'उजव्या बाजूची मुद्रा चुकली आहे: उजवा भाग सरळ करा.'
  }
};

export class FeedbackEngine {
  private lastSpokenMessage: string = '';
  private lastSpokenTimeMs: number = 0;
  private speechSynthesisEnabled: boolean = true;
  private lastEmittedEvent: FeedbackEvent | null = null;
  private language: SupportedLanguage = 'en';

  constructor(speechSynthesisEnabled = true, language: SupportedLanguage = 'en') {
    this.speechSynthesisEnabled = speechSynthesisEnabled;
    this.language = language;
  }

  public setVoiceEnabled(enabled: boolean): void {
    this.speechSynthesisEnabled = enabled;
  }

  public setLanguage(lang: SupportedLanguage): void {
    this.language = lang;
  }

  public getLanguage(): SupportedLanguage {
    return this.language;
  }

  public generateFeedback(
    confidenceResult: ConfidenceGateResult,
    repResult: RepTransitionResult,
    targetReps: number,
    compensationResult?: CompensationResult,
    activeSide?: 'left' | 'right'
  ): FeedbackEvent {
    const now = Date.now();
    const phrases = PHRASES[this.language] || PHRASES.en;

    // 1. Critical Priority: Confidence Gate Paused
    if (confidenceResult.isGated) {
      const event: FeedbackEvent = {
        type: 'PAUSED_CONFIDENCE',
        message: confidenceResult.reason || phrases.paused_confidence,
        severity: 'warning',
        timestamp: now,
        language: this.language
      };
      this.maybeSpeak(phrases.paused_confidence, 4000);
      this.lastEmittedEvent = event;
      return event;
    }

    // 2. High Priority: Posture Compensation Error Detected
    if (compensationResult?.hasCompensation) {
      const faultSide = compensationResult.faultSide || activeSide || 'center';
      const sideText = faultSide === 'left' ? phrases.posture_alert_left : faultSide === 'right' ? phrases.posture_alert_right : compensationResult.reasons[0] || 'Posture alignment error';
      const event: FeedbackEvent = {
        type: 'COMPENSATION_ALERT',
        message: compensationResult.reasons[0] || sideText,
        severity: 'warning',
        timestamp: now,
        side: faultSide as 'left' | 'right' | 'center',
        faultSide: compensationResult.faultSide || (faultSide === 'center' ? null : faultSide),
        compensationFlag: compensationResult.compensation_flags[0],
        language: this.language
      };
      this.maybeSpeak(sideText, 3500);
      this.lastEmittedEvent = event;
      return event;
    }

    // 3. Repetition Completed
    if (repResult.isRepCompletedThisFrame && repResult.completedRepMetric) {
      const isTargetMet = repResult.completedRepMetric.isValid;
      const repNum = repResult.completedReps;

      if (repNum >= targetReps) {
        const event: FeedbackEvent = {
          type: 'COMPLETED',
          message: phrases.completed(targetReps),
          severity: 'success',
          timestamp: now,
          language: this.language
        };
        this.maybeSpeak(event.message, 3000);
        this.lastEmittedEvent = event;
        return event;
      }

      if (isTargetMet) {
        const event: FeedbackEvent = {
          type: 'REP_COMPLETE',
          message: phrases.rep_complete(repNum),
          severity: 'success',
          timestamp: now,
          language: this.language
        };
        const voiceShort = this.language === 'mr' ? `पुनरावृत्ती ${repNum}` : this.language === 'hi' ? `पुनरावृत्ति ${repNum}` : `Rep ${repNum}`;
        this.maybeSpeak(voiceShort, 2000);
        this.lastEmittedEvent = event;
        return event;
      } else {
        const event: FeedbackEvent = {
          type: 'RANGE_LOW',
          message: phrases.range_low(repNum),
          severity: 'warning',
          timestamp: now,
          language: this.language
        };
        const voiceShort = this.language === 'mr' ? `पुनरावृत्ती ${repNum}, पूर्ण ताण द्या` : this.language === 'hi' ? `पुनरावृत्ति ${repNum}, पूरा विस्तार करें` : `Rep ${repNum}, range below target`;
        this.maybeSpeak(voiceShort, 2500);
        this.lastEmittedEvent = event;
        return event;
      }
    }

    // 4. In-flight status
    let message = repResult.statusMessage;
    let severity: 'info' | 'success' | 'warning' = 'info';

    if (repResult.currentState === 'TARGET_ZONE') {
      message = phrases.target_reached;
      severity = 'success';
    } else if (repResult.currentState === 'MOVING') {
      message = phrases.smooth_movement;
      severity = 'info';
    }

    const event: FeedbackEvent = {
      type: repResult.currentState === 'TARGET_ZONE' ? 'RANGE_GOOD' : 'REST',
      message,
      severity,
      timestamp: now,
      language: this.language
    };

    return event;
  }

  private maybeSpeak(text: string, throttleMs = 2500): void {
    if (!this.speechSynthesisEnabled) return;
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

    const now = Date.now();
    if (text === this.lastSpokenMessage && (now - this.lastSpokenTimeMs) < throttleMs) {
      return;
    }

    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);

      const voices = window.speechSynthesis.getVoices() || [];
      const lang = this.language;

      if (lang === 'mr') {
        const mrVoice = voices.find(v => v.lang.toLowerCase().startsWith('mr') || v.name.toLowerCase().includes('marathi'));
        const hiVoice = voices.find(v => v.lang.toLowerCase().startsWith('hi') || v.name.toLowerCase().includes('hindi'));
        if (mrVoice) utterance.voice = mrVoice;
        else if (hiVoice) utterance.voice = hiVoice;
        utterance.lang = mrVoice ? mrVoice.lang : 'hi-IN';
      } else if (lang === 'hi') {
        const hiVoice = voices.find(v => v.lang.toLowerCase().startsWith('hi') || v.name.toLowerCase().includes('hindi'));
        if (hiVoice) utterance.voice = hiVoice;
        utterance.lang = 'hi-IN';
      } else {
        const enVoice = voices.find(v => v.lang.toLowerCase().startsWith('en') && (v.name.includes('Natural') || v.name.includes('Google') || v.name.includes('Enhanced')))
          || voices.find(v => v.lang.toLowerCase() === 'en-in')
          || voices.find(v => v.lang.toLowerCase().startsWith('en'));
        if (enVoice) utterance.voice = enVoice;
        utterance.lang = 'en-US';
      }

      // Calm, clinical pacing (0.90) and warm pitch (0.99)
      utterance.rate = 0.90;
      utterance.pitch = 0.99;
      utterance.volume = 0.85;

      window.speechSynthesis.speak(utterance);
      this.lastSpokenMessage = text;
      this.lastSpokenTimeMs = now;
    } catch {
      // Audio synthesis fallback silently ignored if blocked by browser policy
    }
  }
}
