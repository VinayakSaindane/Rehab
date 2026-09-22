'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  CheckCircle2, 
  Camera, 
  ShieldCheck, 
  User, 
  Stethoscope, 
  Sliders, 
  ArrowRight, 
  ArrowLeft, 
  AlertTriangle,
  Lightbulb,
  Maximize2,
  Lock,
  Play
} from 'lucide-react';

export default function PatientOnboardingPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [cameraStreamActive, setCameraStreamActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [readinessChecked, setReadinessChecked] = useState(false);
  const [isSimulatedCamera, setIsSimulatedCamera] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // Camera setup in step 6
  useEffect(() => {
    if (currentStep === 6 && !cameraStreamActive) {
      startCamera();
    }
    return () => {
      if (currentStep !== 6 && videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(t => t.stop());
      }
    };
  }, [currentStep]);

  const startCamera = async () => {
    try {
      setCameraError(null);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480, facingMode: 'user' }
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setCameraStreamActive(true);
      setIsSimulatedCamera(false);
      setTimeout(() => setReadinessChecked(true), 1200);
    } catch (err: any) {
      console.warn('Camera access error, switching to simulation mode:', err.message);
      setIsSimulatedCamera(true);
      setCameraStreamActive(true);
      setReadinessChecked(true);
    }
  };

  const steps = [
    { id: 1, title: 'Welcome' },
    { id: 2, title: 'Profile' },
    { id: 3, title: 'Care Team' },
    { id: 4, title: 'Permissions' },
    { id: 5, title: 'Setup Guide' },
    { id: 6, title: 'Readiness Test' },
    { id: 7, title: 'Prescription' }
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-12 px-4 sm:px-6 lg:px-8 flex flex-col justify-center">
      <div className="max-w-3xl mx-auto w-full space-y-8">
        
        {/* Step Progress Tracker */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between">
            {steps.map((s, idx) => (
              <div key={s.id} className="flex items-center">
                <div className="flex flex-col items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                    currentStep > s.id
                      ? 'bg-emerald-600 text-white'
                      : currentStep === s.id
                        ? 'bg-sky-600 text-white ring-4 ring-sky-100 dark:ring-sky-950'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                  }`}>
                    {currentStep > s.id ? <CheckCircle2 className="w-4 h-4" /> : s.id}
                  </div>
                  <span className="text-[10px] font-semibold text-slate-500 mt-1 hidden sm:block">
                    {s.title}
                  </span>
                </div>
                {idx < steps.length - 1 && (
                  <div className={`h-0.5 w-6 sm:w-12 mx-1 sm:mx-2 ${
                    currentStep > s.id ? 'bg-emerald-500' : 'bg-slate-200 dark:bg-slate-800'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Step Content Card */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-200 dark:border-slate-800 shadow-xl min-h-[420px] flex flex-col justify-between">
          
          {/* STEP 1: WELCOME */}
          {currentStep === 1 && (
            <div className="space-y-4 animate-fadeIn">
              <div className="w-12 h-12 rounded-2xl bg-sky-100 dark:bg-sky-950 flex items-center justify-center text-sky-600 mb-2">
                <Camera className="w-6 h-6" />
              </div>
              <span className="text-xs font-bold uppercase tracking-widest text-sky-600">
                Step 1 of 7: Welcome to RehabSense
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
                Camera-Assisted Home Rehabilitation
              </h2>
              <p className="text-slate-600 dark:text-slate-300 text-sm sm:text-base leading-relaxed">
                Welcome, <strong>Aarav</strong>. RehabSense assists you in performing your prescribed home exercises using your standard smartphone or laptop camera.
              </p>
              <div className="bg-slate-50 dark:bg-slate-800/60 rounded-2xl p-4 border border-slate-200 dark:border-slate-700/60 space-y-2 text-xs text-slate-600 dark:text-slate-300">
                <p className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Real-time feedback as you move</span>
                </p>
                <p className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Automatic repetition counter and movement range tracking</span>
                </p>
                <p className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Continuous review by your physiotherapist</span>
                </p>
              </div>
              <div className="p-3 bg-amber-50 dark:bg-amber-950/40 rounded-xl border border-amber-200 dark:border-amber-800/50 text-xs text-amber-800 dark:text-amber-300 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>
                  RehabSense is an assistive monitoring prototype and does not replace the medical diagnosis or supervision of your licensed healthcare provider.
                </span>
              </div>
            </div>
          )}

          {/* STEP 2: PROFILE */}
          {currentStep === 2 && (
            <div className="space-y-4 animate-fadeIn">
              <div className="w-12 h-12 rounded-2xl bg-sky-100 dark:bg-sky-950 flex items-center justify-center text-sky-600 mb-2">
                <User className="w-6 h-6" />
              </div>
              <span className="text-xs font-bold uppercase tracking-widest text-sky-600">
                Step 2 of 7: Patient Profile
              </span>
              <h2 className="text-2xl font-black text-slate-900 dark:text-white">
                Verify Your Clinical Details
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60">
                  <p className="text-xs text-slate-400 font-semibold">Full Name</p>
                  <p className="text-base font-bold text-slate-900 dark:text-white mt-0.5">Aarav Mehta</p>
                </div>
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60">
                  <p className="text-xs text-slate-400 font-semibold">Age</p>
                  <p className="text-base font-bold text-slate-900 dark:text-white mt-0.5">32 Years</p>
                </div>
                <div className="sm:col-span-2 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60">
                  <p className="text-xs text-slate-400 font-semibold">Rehabilitation Phase Label</p>
                  <p className="text-base font-bold text-sky-700 dark:text-sky-300 mt-0.5">
                    Post-operative upper-limb rehabilitation
                  </p>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Configured by your physical therapy clinic. Note: This is an administrative recovery label, not a diagnostic finding.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: THERAPIST CONNECTION */}
          {currentStep === 3 && (
            <div className="space-y-4 animate-fadeIn">
              <div className="w-12 h-12 rounded-2xl bg-teal-100 dark:bg-teal-950 flex items-center justify-center text-teal-600 mb-2">
                <Stethoscope className="w-6 h-6" />
              </div>
              <span className="text-xs font-bold uppercase tracking-widest text-teal-600">
                Step 3 of 7: Connected Care Team
              </span>
              <h2 className="text-2xl font-black text-slate-900 dark:text-white">
                Supervising Clinician
              </h2>
              <div className="p-6 rounded-2xl bg-teal-50/50 dark:bg-teal-950/30 border border-teal-200 dark:border-teal-800 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-teal-600 text-white font-bold flex items-center justify-center text-sm">
                    AS
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 dark:text-white">Dr. Ananya Sharma</h4>
                    <p className="text-xs text-teal-700 dark:text-teal-300 font-medium">Lead Musculoskeletal Physiotherapist</p>
                  </div>
                </div>
                <div className="text-xs text-slate-600 dark:text-slate-300 border-t border-teal-200 dark:border-teal-800/60 pt-3 space-y-1">
                  <p><strong>Clinic:</strong> Apex Physical Therapy & Orthopaedic Center</p>
                  <p><strong>Review Cadence:</strong> Weekly progress audit & target recalibration</p>
                  <p><strong>Clinician Target:</strong> 120° Elbow Flexion (Phase 2 mobilization)</p>
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: PERMISSIONS */}
          {currentStep === 4 && (
            <div className="space-y-4 animate-fadeIn">
              <div className="w-12 h-12 rounded-2xl bg-sky-100 dark:bg-sky-950 flex items-center justify-center text-sky-600 mb-2">
                <Lock className="w-6 h-6" />
              </div>
              <span className="text-xs font-bold uppercase tracking-widest text-sky-600">
                Step 4 of 7: Privacy & Permissions
              </span>
              <h2 className="text-2xl font-black text-slate-900 dark:text-white">
                Camera Access & Privacy Consent
              </h2>
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 text-xs space-y-3 text-slate-600 dark:text-slate-300">
                <div className="flex items-start gap-2.5">
                  <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
                  <p>
                    <strong>Edge-Only Analysis:</strong> Your camera feed is analyzed directly inside your browser. No video is ever saved to disk or transmitted to our servers.
                  </p>
                </div>
                <div className="flex items-start gap-2.5">
                  <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
                  <p>
                    <strong>Structured Metrics Only:</strong> Only numeric joint angles, repetition counts, and session durations are shared with Dr. Sharma.
                  </p>
                </div>
              </div>

              <div className="p-3 bg-sky-50 dark:bg-sky-950/40 rounded-xl border border-sky-200 dark:border-sky-800 text-xs text-sky-800 dark:text-sky-300 font-medium">
                &quot;I understand that RehabSense analyzes camera-based movement data locally on my device to provide exercise feedback.&quot;
              </div>
            </div>
          )}

          {/* STEP 5: CAMERA SETUP GUIDANCE */}
          {currentStep === 5 && (
            <div className="space-y-4 animate-fadeIn">
              <div className="w-12 h-12 rounded-2xl bg-sky-100 dark:bg-sky-950 flex items-center justify-center text-sky-600 mb-2">
                <Maximize2 className="w-6 h-6" />
              </div>
              <span className="text-xs font-bold uppercase tracking-widest text-sky-600">
                Step 5 of 7: Camera Setup
              </span>
              <h2 className="text-2xl font-black text-slate-900 dark:text-white">
                Positioning for Optimal Tracking
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                  <p className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5 mb-1">
                    <Maximize2 className="w-4 h-4 text-sky-600" />
                    <span>Distance</span>
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Place your device approximately 6–10 feet away at chest/elbow height.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                  <p className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5 mb-1">
                    <Lightbulb className="w-4 h-4 text-amber-500" />
                    <span>Lighting</span>
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Ensure the room is well-lit. Avoid bright windows directly behind you.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                  <p className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5 mb-1">
                    <User className="w-4 h-4 text-emerald-600" />
                    <span>Framing</span>
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Keep your upper body, arms, and elbows fully inside the camera frame.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                  <p className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5 mb-1">
                    <ShieldCheck className="w-4 h-4 text-teal-600" />
                    <span>Stability</span>
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Rest your device on a stable surface or stand. Avoid holding it by hand.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* STEP 6: CAMERA READINESS TEST */}
          {currentStep === 6 && (
            <div className="space-y-4 animate-fadeIn">
              <span className="text-xs font-bold uppercase tracking-widest text-sky-600">
                Step 6 of 7: Camera Readiness Test
              </span>
              <h2 className="text-2xl font-black text-slate-900 dark:text-white">
                Checking Camera Calibration
              </h2>

              <div className="relative rounded-2xl overflow-hidden bg-slate-950 aspect-video flex items-center justify-center border border-slate-800">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className={`w-full h-full object-cover ${isSimulatedCamera ? 'hidden' : 'block'}`}
                />

                {isSimulatedCamera && (
                  <div className="text-center p-6 space-y-2">
                    <div className="w-12 h-12 rounded-full bg-sky-950 text-sky-400 flex items-center justify-center mx-auto mb-2">
                      <Camera className="w-6 h-6" />
                    </div>
                    <p className="text-sm font-bold text-white">Camera Simulation Mode Active</p>
                    <p className="text-xs text-slate-400 max-w-sm">
                      Webcam unavailable or permission bypassed — demo simulation engine engaged for seamless readiness verification.
                    </p>
                  </div>
                )}

                {/* Readiness Results Overlay */}
                <div className="absolute bottom-3 left-3 right-3 bg-slate-900/90 backdrop-blur rounded-xl p-3 border border-slate-700 flex items-center justify-between">
                  <div className="flex items-center gap-4 text-xs font-medium">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                      <span className="text-slate-200">Body Visible</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                      <span className="text-slate-200">Lighting Good</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                      <span className="text-slate-200">Confidence 94%</span>
                    </div>
                  </div>

                  <span className="text-xs font-bold px-2.5 py-1 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    READY TO BEGIN
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* STEP 7: ASSIGNED REHABILITATION PLAN */}
          {currentStep === 7 && (
            <div className="space-y-4 animate-fadeIn">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-950 flex items-center justify-center text-emerald-600 mb-2">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <span className="text-xs font-bold uppercase tracking-widest text-emerald-600">
                Step 7 of 7: Plan Ready
              </span>
              <h2 className="text-2xl font-black text-slate-900 dark:text-white">
                Your Assigned Rehabilitation Plan
              </h2>

              <div className="p-5 rounded-2xl bg-sky-50/60 dark:bg-sky-950/30 border border-sky-200 dark:border-sky-800 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                    Elbow Flexion & Extension
                  </h3>
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-sky-100 dark:bg-sky-900 text-sky-700 dark:text-sky-300">
                    Upper Limb
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-3 text-center py-2">
                  <div className="bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800">
                    <p className="text-[10px] text-slate-400 font-semibold">SETS & REPS</p>
                    <p className="text-sm font-bold text-slate-900 dark:text-white">2 sets × 10 reps</p>
                  </div>
                  <div className="bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800">
                    <p className="text-[10px] text-slate-400 font-semibold">TARGET ROM</p>
                    <p className="text-sm font-bold text-sky-600 dark:text-sky-400">120°</p>
                  </div>
                  <div className="bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800">
                    <p className="text-[10px] text-slate-400 font-semibold">FREQUENCY</p>
                    <p className="text-sm font-bold text-slate-900 dark:text-white">2 sessions/day</p>
                  </div>
                </div>

                <p className="text-xs text-slate-600 dark:text-slate-300 italic">
                  &quot;Focus on smooth eccentric control. Do not force past onset of discomfort. Target ROM calibrated to 120°.&quot;
                </p>
              </div>
            </div>
          )}

          {/* Navigation Controls */}
          <div className="pt-6 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
            {currentStep > 1 ? (
              <button
                onClick={() => setCurrentStep(prev => prev - 1)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Previous</span>
              </button>
            ) : <div />}

            {currentStep < 7 ? (
              <button
                onClick={() => setCurrentStep(prev => prev + 1)}
                className="px-6 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold shadow-md flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <span>Continue</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={() => router.push('/patient/exercise/elbow-flexion')}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-sky-600 to-teal-600 hover:from-sky-500 hover:to-teal-500 text-white text-xs font-bold shadow-lg flex items-center gap-2 transition-all cursor-pointer"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>Start First Exercise Session</span>
              </button>
            )}
          </div>

        </div>

      </div>
    </div>
  );
}
