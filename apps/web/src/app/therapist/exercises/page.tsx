'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  ArrowLeft, 
  Sliders, 
  Plus, 
  Check, 
  Save, 
  Settings, 
  ShieldCheck, 
  Camera, 
  Volume2,
  FileText
} from 'lucide-react';

export default function TherapistExercisesPage() {
  const [exercises, setExercises] = useState<any[]>([
    {
      id: 'elbow-flexion',
      name: 'Elbow Flexion & Extension',
      region: 'Upper Limb',
      targetJoint: 'Elbow',
      targetRom: 120,
      minRom: 40,
      maxRom: 140,
      targetReps: 10,
      cameraView: 'Frontal (Full Body)',
      feedbackEnabled: true,
      tempo: '2s concentric / 2s eccentric'
    },
    {
      id: 'shoulder-flexion',
      name: 'Shoulder Flexion (Elevations)',
      region: 'Upper Limb',
      targetJoint: 'Shoulder',
      targetRom: 135,
      minRom: 30,
      maxRom: 160,
      targetReps: 10,
      cameraView: 'Sagittal (Side Profile)',
      feedbackEnabled: true,
      tempo: '2s up / 1s hold / 2s down'
    },
    {
      id: 'sit-to-stand',
      name: 'Sit-to-Stand Functional Transfer',
      region: 'Lower Limb',
      targetJoint: 'Knee & Hip',
      targetRom: 165,
      minRom: 90,
      maxRom: 175,
      targetReps: 10,
      cameraView: 'Frontal (Full Body)',
      feedbackEnabled: true,
      tempo: 'Controlled rise / 3s return'
    }
  ]);

  const [selectedExercise, setSelectedExercise] = useState<any>(exercises[0]);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleUpdate = () => {
    setExercises(prev => prev.map(ex => ex.id === selectedExercise.id ? selectedExercise : ex));
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Back Link */}
        <Link
          href="/therapist/dashboard"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Clinical Census</span>
        </Link>

        {/* Header */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-50 dark:bg-teal-950 text-teal-700 dark:text-teal-300 text-xs font-semibold mb-2">
              <Sliders className="w-3.5 h-3.5 text-teal-600" />
              <span>Clinical Parameter Engine</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
              Exercise Library & Threshold Configuration
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Clinician-controlled kinematic parameters, joint angle targets, and confidence thresholds.
            </p>
          </div>
        </div>

        {/* Main 2-Column Config Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Column: Exercise Selector List */}
          <div className="lg:col-span-4 space-y-3">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Exercise Protocols
            </h2>

            {exercises.map((ex) => (
              <button
                key={ex.id}
                onClick={() => setSelectedExercise(ex)}
                className={`w-full text-left p-4 rounded-2xl border transition-all cursor-pointer ${
                  selectedExercise.id === ex.id
                    ? 'bg-teal-50 dark:bg-teal-950/40 border-teal-500 shadow-sm'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                    {ex.region}
                  </span>
                  <span className="text-xs font-mono font-bold text-teal-600 dark:text-teal-400">
                    {ex.targetRom}° ROM
                  </span>
                </div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                  {ex.name}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Target: {ex.targetReps} reps • {ex.cameraView}
                </p>
              </button>
            ))}
          </div>

          {/* Right Column: Active Exercise Configuration Panel */}
          <div className="lg:col-span-8 bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-200 dark:border-slate-800 shadow-xl space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                  {selectedExercise.name}
                </h2>
                <p className="text-xs text-slate-500">
                  Joint Analyzed: <strong>{selectedExercise.targetJoint}</strong>
                </p>
              </div>

              {savedSuccess && (
                <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1.5 animate-fadeIn">
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span>Protocol saved!</span>
                </span>
              )}
            </div>

            {/* Threshold Settings Form */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase text-slate-600 dark:text-slate-400">
                  Target Range of Motion (ROM)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={selectedExercise.targetRom}
                    onChange={e => setSelectedExercise({ ...selectedExercise, targetRom: Number(e.target.value) })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold font-mono text-slate-900 dark:text-white focus:outline-none focus:border-teal-500"
                  />
                  <span className="text-xs font-semibold text-slate-400">degrees</span>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase text-slate-600 dark:text-slate-400">
                  Prescribed Repetitions
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={selectedExercise.targetReps}
                    onChange={e => setSelectedExercise({ ...selectedExercise, targetReps: Number(e.target.value) })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold font-mono text-slate-900 dark:text-white focus:outline-none focus:border-teal-500"
                  />
                  <span className="text-xs font-semibold text-slate-400">reps/set</span>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase text-slate-600 dark:text-slate-400">
                  Required Camera Orientation
                </label>
                <select
                  value={selectedExercise.cameraView}
                  onChange={e => setSelectedExercise({ ...selectedExercise, cameraView: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:border-teal-500"
                >
                  <option value="Frontal (Full Body)">Frontal (Full Body)</option>
                  <option value="Sagittal (Side Profile)">Sagittal (Side Profile)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase text-slate-600 dark:text-slate-400">
                  Movement Tempo Cadence
                </label>
                <input
                  type="text"
                  value={selectedExercise.tempo}
                  onChange={e => setSelectedExercise({ ...selectedExercise, tempo: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:border-teal-500"
                />
              </div>
            </div>

            {/* Feedback Toggle */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-900 dark:text-white">Real-Time Rule-Based Form Feedback</p>
                <p className="text-[11px] text-slate-500">Provide in-flight visual and speech feedback cues to patient.</p>
              </div>
              <input
                type="checkbox"
                checked={selectedExercise.feedbackEnabled}
                onChange={e => setSelectedExercise({ ...selectedExercise, feedbackEnabled: e.target.checked })}
                className="w-4 h-4 accent-teal-600 cursor-pointer"
              />
            </div>

            {/* Save Button */}
            <button
              onClick={handleUpdate}
              className="w-full py-3.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>Save Clinical Protocol Targets</span>
            </button>
          </div>

        </div>

      </div>
    </div>
  );
}
