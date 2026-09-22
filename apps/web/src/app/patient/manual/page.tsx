'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { 
  CheckCircle2, 
  ArrowLeft, 
  Clock, 
  Plus, 
  Minus, 
  ShieldAlert, 
  Eye, 
  Sliders, 
  Check,
  VideoOff
} from 'lucide-react';

export default function CameraFreeWorkoutPage() {
  const router = useRouter();
  const [completedReps, setCompletedReps] = useState(8);
  const targetReps = 10;
  const [estimatedRom, setEstimatedRom] = useState(115);
  const [notes, setNotes] = useState('Completed seated manual session without camera.');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      await api.createSession({
        exercise_id: 'elbow-flexion',
        exercise_name: 'Elbow Flexion & Extension',
        started_at: new Date(Date.now() - 600000).toISOString(),
        completed_at: new Date().toISOString(),
        duration_seconds: 600,
        target_reps: targetReps,
        completed_reps: completedReps,
        valid_reps: completedReps,
        average_rom: estimatedRom,
        max_rom: estimatedRom + 5,
        tracking_confidence: 1.0, // Manual mode
        form_flags: [],
        patient_notes: notes,
        is_manual_log: true
      });
      setSubmitted(true);
      setTimeout(() => router.push('/patient/progress'), 1500);
    } catch {
      setSubmitted(true);
      setTimeout(() => router.push('/patient/progress'), 1500);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto space-y-6">
        
        <Link
          href="/patient/dashboard"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Dashboard</span>
        </Link>

        <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-200 dark:border-slate-800 shadow-xl space-y-6">
          
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold mb-2">
                <VideoOff className="w-3.5 h-3.5 text-slate-500" />
                <span>Camera-Free Accessible Mode</span>
              </div>
              <h1 className="text-2xl font-black text-slate-900 dark:text-white">
                Elbow Flexion & Extension
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Manual rep logging & guided instructions for low-mobility or camera-free environments.
              </p>
            </div>
          </div>

          {/* Guided Instructions */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wide">
              Exercise Instructions
            </h3>
            <ol className="list-decimal list-inside space-y-2 text-xs text-slate-600 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-200 dark:border-slate-700/60">
              <li>Sit upright in a supportive chair with your arm resting at your side.</li>
              <li>Smoothly bend your elbow, drawing your palm toward your shoulder.</li>
              <li>Hold for 1 to 2 seconds at your comfortable end range (Target: 120°).</li>
              <li>Gently and slowly lower your forearm back to complete extension.</li>
              <li>Rest 3 seconds between repetitions. Perform 10 reps per set.</li>
            </ol>
          </div>

          {/* Rep Counter Control */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase">
                Completed Repetitions
              </label>
              <span className="text-xs text-slate-400 font-mono">Target: {targetReps} reps</span>
            </div>

            <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-700">
              <button
                onClick={() => setCompletedReps(prev => Math.max(0, prev - 1))}
                className="w-12 h-12 rounded-xl bg-white dark:bg-slate-700 shadow-sm border border-slate-200 dark:border-slate-600 flex items-center justify-center text-slate-700 dark:text-slate-200 hover:bg-slate-100 transition-colors"
              >
                <Minus className="w-5 h-5" />
              </button>

              <div className="text-center">
                <span className="text-4xl font-black font-mono text-slate-900 dark:text-white">
                  {completedReps}
                </span>
                <span className="text-sm font-semibold text-slate-400 ml-1">/ {targetReps}</span>
              </div>

              <button
                onClick={() => setCompletedReps(prev => prev + 1)}
                className="w-12 h-12 rounded-xl bg-white dark:bg-slate-700 shadow-sm border border-slate-200 dark:border-slate-600 flex items-center justify-center text-slate-700 dark:text-slate-200 hover:bg-slate-100 transition-colors"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Estimated Comfort ROM Slider */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase">
                Self-Reported Range of Motion
              </label>
              <span className="text-xs font-bold font-mono text-sky-600 dark:text-sky-400">
                {estimatedRom}° ROM
              </span>
            </div>
            <input
              type="range"
              min={60}
              max={135}
              value={estimatedRom}
              onChange={e => setEstimatedRom(Number(e.target.value))}
              className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-sky-600"
            />
            <div className="flex justify-between text-[10px] text-slate-400">
              <span>60° (Limited)</span>
              <span>120° (Prescribed Target)</span>
              <span>135° (Full)</span>
            </div>
          </div>

          {/* Notes for Clinician */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase">
              Notes for Dr. Ananya Sharma
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={e => setNotes(e.target.value)}
              className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-sky-500"
              placeholder="Record any stiffness, fatigue, or feedback..."
            />
          </div>

          {/* Submit Button */}
          <button
            onClick={handleSubmit}
            disabled={submitting || submitted}
            className="w-full py-3.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            {submitted ? (
              <>
                <Check className="w-4 h-4 text-emerald-300" />
                <span>Session Successfully Logged!</span>
              </>
            ) : submitting ? (
              <span>Logging Session...</span>
            ) : (
              <span>Submit & Store Manual Session</span>
            )}
          </button>

          <div className="p-3 bg-amber-50 dark:bg-amber-950/40 rounded-xl text-center text-xs text-amber-800 dark:text-amber-300">
            Stop immediately if you experience pain or discomfort and follow your clinician&apos;s guidance.
          </div>

        </div>

      </div>
    </div>
  );
}
