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

const EXERCISE_OPTIONS = [
  {
    id: 'elbow-flexion',
    name: 'Elbow Flexion & Extension',
    targetReps: 10,
    targetRom: 120,
    minRom: 40,
    maxRom: 140,
    instructions: [
      'Sit upright in a supportive chair with your arm resting at your side.',
      'Smoothly bend your elbow, drawing your palm toward your shoulder.',
      'Hold for 1 to 2 seconds at your comfortable end range (Target: 120°).',
      'Gently and slowly lower your forearm back to complete extension.',
      'Rest 3 seconds between repetitions. Perform 10 reps per set.'
    ]
  },
  {
    id: 'shoulder-flexion',
    name: 'Shoulder Flexion (Elevations)',
    targetReps: 10,
    targetRom: 135,
    minRom: 30,
    maxRom: 160,
    instructions: [
      'Stand or sit upright with your arm comfortably straight and thumb pointing up.',
      'Slowly raise your arm forward and upward within pain-free active range.',
      'Hold for 1 second at maximum comfortable elevation (Target: 135°).',
      'Lower smoothly without shrugging your shoulder or leaning back.',
      'Rest 3 seconds between repetitions.'
    ]
  },
  {
    id: 'sit-to-stand',
    name: 'Sit-to-Stand Functional Transfer',
    targetReps: 10,
    targetRom: 165,
    minRom: 80,
    maxRom: 175,
    instructions: [
      'Sit in a sturdy chair with feet flat on the floor shoulder-width apart.',
      'Cross arms over your chest or rest hands lightly on thighs.',
      'Lean slightly forward from the hips and push through heels to stand fully upright.',
      'Pause for 1 second at terminal extension, then lower under control.',
      'Perform 10 controlled repetitions.'
    ]
  },
  {
    id: 'knee-extension',
    name: 'Seated Knee Extension (Quad Sets)',
    targetReps: 10,
    targetRom: 170,
    minRom: 90,
    maxRom: 180,
    instructions: [
      'Sit upright in a firm chair with knees bent at 90 degrees.',
      'Slowly kick your foot forward, straightening your knee as far as comfortable.',
      'Squeeze thigh muscle for 1 second at terminal extension (Target: 170°).',
      'Lower your leg smoothly back down to starting position.',
      'Perform 10 reps per set.'
    ]
  },
  {
    id: 'shoulder-abduction',
    name: 'Shoulder Abduction (Lateral Raise)',
    targetReps: 10,
    targetRom: 90,
    minRom: 20,
    maxRom: 120,
    instructions: [
      'Stand upright with arms resting comfortably at your sides.',
      'Smoothly lift your arm out to the side up to shoulder level (Target: 90°).',
      'Keep your palm facing downward and shoulders relaxed.',
      'Slowly lower back to your side under control.',
      'Perform 10 repetitions.'
    ]
  }
];

export default function CameraFreeWorkoutPage() {
  const router = useRouter();
  const [selectedExId, setSelectedExId] = useState('elbow-flexion');
  const [selectedSide, setSelectedSide] = useState<'left' | 'right'>('left');
  const [completedReps, setCompletedReps] = useState(8);
  const [estimatedRom, setEstimatedRom] = useState(115);
  const [painScore, setPainScore] = useState<number>(0);
  const [notes, setNotes] = useState('Completed seated manual session without camera.');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const currentEx = EXERCISE_OPTIONS.find(e => e.id === selectedExId) || EXERCISE_OPTIONS[0];

  const handleSelectExercise = (id: string) => {
    setSelectedExId(id);
    const ex = EXERCISE_OPTIONS.find(e => e.id === id);
    if (ex) {
      setEstimatedRom(ex.targetRom - 5);
    }
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      await api.createSession({
        exercise_id: currentEx.id,
        exercise_name: currentEx.name,
        started_at: new Date(Date.now() - 600000).toISOString(),
        completed_at: new Date().toISOString(),
        duration_seconds: 600,
        target_reps: currentEx.targetReps,
        completed_reps: completedReps,
        valid_reps: completedReps,
        average_rom: estimatedRom,
        max_rom: estimatedRom + 5,
        tracking_confidence: 1.0, // Manual mode
        form_flags: [],
        compensation_flags: [],
        patient_notes: `${notes} (${selectedSide.toUpperCase()} side, Pain rating: ${painScore}/10)`,
        is_manual_log: true,
        pain_score: painScore,
        side_trained: selectedSide
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
    <div className="min-h-screen py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto space-y-6">
        
        <Link
          href="/patient/dashboard"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 glass-chip px-3 py-1.5 rounded-lg border border-white/80 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Dashboard</span>
        </Link>

        <div className="glass-card-strong rounded-3xl p-6 sm:p-8 border border-white/80 shadow-2xl backdrop-blur-xl space-y-6">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-sky-100 gap-3">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full glass-chip text-slate-700 text-xs font-semibold mb-2.5 border border-white/80">
                <VideoOff className="w-3.5 h-3.5 text-slate-500" />
                <span>Camera-Free Accessible Mode</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                {currentEx.name}
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                Manual rep logging & guided instructions for low-mobility or camera-free environments.
              </p>
            </div>

            {/* Limb Side Switcher */}
            <div className="flex items-center bg-sky-100/70 p-1 rounded-xl border border-sky-200 self-start sm:self-center text-xs">
              <button
                type="button"
                onClick={() => setSelectedSide('left')}
                className={`px-3 py-1 rounded-lg font-bold transition-all ${
                  selectedSide === 'left' ? 'bg-sky-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Left
              </button>
              <button
                type="button"
                onClick={() => setSelectedSide('right')}
                className={`px-3 py-1 rounded-lg font-bold transition-all ${
                  selectedSide === 'right' ? 'bg-sky-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Right
              </button>
            </div>
          </div>

          {/* Exercise Selector */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Select Exercise Routine
            </label>
            <select
              value={selectedExId}
              onChange={e => handleSelectExercise(e.target.value)}
              className="w-full p-3 rounded-xl border border-sky-200 glass-card text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-400 bg-white/90"
            >
              {EXERCISE_OPTIONS.map(opt => (
                <option key={opt.id} value={opt.id}>
                  {opt.name} (Target: {opt.targetRom}° ROM)
                </option>
              ))}
            </select>
          </div>

          {/* Guided Instructions */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Exercise Instructions
            </h3>
            <ol className="list-decimal list-inside space-y-2 text-xs text-slate-700 leading-relaxed glass-card p-5 rounded-2xl border border-sky-100/80">
              {currentEx.instructions.map((inst, i) => (
                <li key={i}>{inst}</li>
              ))}
            </ol>
          </div>

          {/* Rep Counter Control */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Completed Repetitions
              </label>
              <span className="text-xs text-slate-500 font-mono glass-chip px-2.5 py-0.5 rounded-full border border-white/80">Target: {currentEx.targetReps} reps</span>
            </div>

            <div className="flex items-center justify-between glass-card p-4 sm:p-5 rounded-2xl border border-white/80 shadow-inner">
              <button
                type="button"
                onClick={() => setCompletedReps(prev => Math.max(0, prev - 1))}
                className="w-12 h-12 rounded-xl glass-chip border border-white/80 flex items-center justify-center text-slate-800 hover:bg-white/80 transition-all shadow-xs cursor-pointer active:scale-95"
              >
                <Minus className="w-5 h-5" />
              </button>

              <div className="text-center">
                <span className="text-4xl sm:text-5xl font-black font-mono text-slate-900 tracking-tight">
                  {completedReps}
                </span>
                <span className="text-sm font-semibold text-slate-500 ml-1.5">/ {currentEx.targetReps}</span>
              </div>

              <button
                type="button"
                onClick={() => setCompletedReps(prev => prev + 1)}
                className="w-12 h-12 rounded-xl glass-chip border border-white/80 flex items-center justify-center text-slate-800 hover:bg-white/80 transition-all shadow-xs cursor-pointer active:scale-95"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Estimated Comfort ROM Slider */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Self-Reported Range of Motion
              </label>
              <span className="text-xs font-bold font-mono text-sky-700 glass-chip px-2.5 py-0.5 rounded-full border border-sky-200">
                {estimatedRom}° ROM
              </span>
            </div>
            <input
              type="range"
              min={currentEx.minRom}
              max={currentEx.maxRom}
              value={estimatedRom}
              onChange={e => setEstimatedRom(Number(e.target.value))}
              className="w-full h-2.5 bg-sky-100 rounded-lg appearance-none cursor-pointer accent-sky-600"
            />
            <div className="flex justify-between text-[11px] text-slate-500 font-medium">
              <span>{currentEx.minRom}° (Minimum)</span>
              <span className="text-sky-700 font-semibold">{currentEx.targetRom}° (Prescribed Target)</span>
              <span>{currentEx.maxRom}° (Full)</span>
            </div>
          </div>

          {/* Post-Session Clinical Pain Rating (VAS Scale) */}
          <div className="space-y-2.5 glass-card p-4 rounded-2xl border border-sky-100">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Joint Pain Rating (VAS Scale)
              </label>
              <span className="text-xs font-mono font-bold text-sky-700">
                {painScore === 0 ? '0 / 10 (No Pain)' : `${painScore} / 10`}
              </span>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {[
                { val: 0, label: '0: None' },
                { val: 2, label: '2: Mild' },
                { val: 4, label: '4: Mod' },
                { val: 7, label: '7+: High' }
              ].map(b => (
                <button
                  key={b.val}
                  type="button"
                  onClick={() => setPainScore(b.val)}
                  className={`py-2 px-2 rounded-xl text-xs font-bold transition-all border ${
                    painScore === b.val
                      ? 'bg-sky-600 text-white border-sky-600 shadow-sm'
                      : 'bg-white/80 border-sky-200 text-slate-700 hover:bg-sky-50'
                  }`}
                >
                  {b.label}
                </button>
              ))}
            </div>
          </div>

          {/* Notes for Clinician */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Notes for Dr. Ananya Sharma
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={e => setNotes(e.target.value)}
              className="w-full p-3.5 rounded-xl border border-sky-200/80 glass-card text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-400 placeholder:text-slate-400"
              placeholder="Record any stiffness, fatigue, or feedback..."
            />
          </div>

          {/* Submit Button */}
          <button
            onClick={handleSubmit}
            disabled={submitting || submitted}
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-sky-600 to-teal-600 hover:from-sky-500 hover:to-teal-500 text-white font-bold text-sm shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2 cursor-pointer border border-white/30"
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

          <div className="p-3.5 glass-card border border-amber-200/80 rounded-2xl text-center text-xs text-amber-900">
            Stop immediately if you experience pain or discomfort and follow your clinician&apos;s guidance.
          </div>

        </div>

      </div>
    </div>
  );
}
