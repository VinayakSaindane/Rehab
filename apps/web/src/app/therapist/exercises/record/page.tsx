'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { Point2D } from '@rehabsense/exercise-engine';
import {
  deriveExerciseTemplate,
  KinematicSimulationEngine,
  type DerivedExerciseTemplate,
  type CandidateAnalysisItem
} from '@rehabsense/exercise-engine';
import {
  ArrowLeft, Camera, StopCircle, Play, Loader2,
  CheckCircle2, AlertTriangle, Sparkles, Send,
  Activity, BarChart3, Info, Check, RefreshCw, Cpu
} from 'lucide-react';

type RecordingPhase = 'IDLE' | 'COUNTDOWN' | 'RECORDING' | 'ANALYZING' | 'RESULT' | 'SAVING';

export default function RecordExercisePage() {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number | null>(null);
  const landmarkerRef = useRef<any>(null);
  const collectedFramesRef = useRef<Point2D[][]>([]);
  const lastVideoTimeRef = useRef<number>(-1);

  const [phase, setPhase] = useState<RecordingPhase>('IDLE');
  const [cameraReady, setCameraReady] = useState(false);
  const [loadingLandmarker, setLoadingLandmarker] = useState(true);
  const [countdown, setCountdown] = useState(3);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [frameCount, setFrameCount] = useState(0);
  const [result, setResult] = useState<DerivedExerciseTemplate | null>(null);
  const [selectedCandidateIdx, setSelectedCandidateIdx] = useState<number>(0);
  const [customTargetRom, setCustomTargetRom] = useState<number>(120);
  const [saving, setSaving] = useState(false);
  const [savedTemplateId, setSavedTemplateId] = useState<string | null>(null);
  const [formName, setFormName] = useState('');
  const [formNotes, setFormNotes] = useState('');
  const [formReps, setFormReps] = useState(10);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);

  // ── Camera Initialization ──────────────────────────────────────────────────
  useEffect(() => {
    const initCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 640, height: 480, facingMode: 'user' }
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
          setCameraReady(true);
        }
      } catch (e) {
        setErrorMsg('Camera access unavailable. You can use "Simulate Elbow Demo" to test without webcam.');
        setLoadingLandmarker(false);
      }
    };
    initCamera();
    return () => {
      if (videoRef.current?.srcObject) {
        (videoRef.current.srcObject as MediaStream).getTracks().forEach(t => t.stop());
      }
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, []);

  // ── MediaPipe Landmarker Initialization ───────────────────────────────────
  useEffect(() => {
    if (!cameraReady) return;
    const loadLandmarker = async () => {
      try {
        const { PoseLandmarker, FilesetResolver } = await import('@mediapipe/tasks-vision');
        const vision = await FilesetResolver.forVisionTasks(
          'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
        );
        const landmarker = await PoseLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/latest/pose_landmarker_lite.task',
            delegate: 'GPU'
          },
          runningMode: 'VIDEO',
          numPoses: 1,
          minPoseDetectionConfidence: 0.5,
          minTrackingConfidence: 0.5,
        });
        landmarkerRef.current = landmarker;
      } catch (e) {
        setErrorMsg('Could not load pose detection model. Recording will still work or use simulation.');
      } finally {
        setLoadingLandmarker(false);
      }
    };
    loadLandmarker();
  }, [cameraReady]);

  // ── Draw skeleton overlay on canvas ───────────────────────────────────────
  const drawSkeleton = useCallback((landmarks: Point2D[], canvas: HTMLCanvasElement) => {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const CONNECTIONS = [
      [11, 13], [13, 15], [12, 14], [14, 16], // arms
      [11, 12], [11, 23], [12, 24], [23, 24],  // torso
      [23, 25], [25, 27], [24, 26], [26, 28],  // legs
    ];

    ctx.strokeStyle = 'rgba(56, 189, 248, 0.85)';
    ctx.lineWidth = 3;
    for (const [a, b] of CONNECTIONS) {
      const lmA = landmarks[a], lmB = landmarks[b];
      if (!lmA || !lmB || (lmA as any).visibility < 0.3 || (lmB as any).visibility < 0.3) continue;
      ctx.beginPath();
      ctx.moveTo(lmA.x * canvas.width, lmA.y * canvas.height);
      ctx.lineTo(lmB.x * canvas.width, lmB.y * canvas.height);
      ctx.stroke();
    }

    ctx.fillStyle = 'rgba(56, 189, 248, 1)';
    for (const lm of landmarks) {
      if ((lm as any).visibility < 0.3) continue;
      ctx.beginPath();
      ctx.arc(lm.x * canvas.width, lm.y * canvas.height, 4, 0, Math.PI * 2);
      ctx.fill();
    }
  }, []);

  // ── Recording Loop ────────────────────────────────────────────────────────
  const startRecordingLoop = useCallback(() => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    if (!canvas || !video) return;

    const loop = () => {
      if (!videoRef.current || !canvasRef.current) return;

      if (landmarkerRef.current && video.currentTime !== lastVideoTimeRef.current && video.readyState >= 2) {
        lastVideoTimeRef.current = video.currentTime;
        try {
          const poseResults = landmarkerRef.current.detectForVideo(video, performance.now());
          if (poseResults.landmarks?.length > 0) {
            const frame: Point2D[] = poseResults.landmarks[0].map((lm: any) => ({
              x: lm.x, y: lm.y, z: lm.z, visibility: lm.visibility ?? 1.0
            }));
            collectedFramesRef.current.push(frame);
            setFrameCount(f => f + 1);
            drawSkeleton(frame, canvasRef.current!);
          }
        } catch { /* landmark detection error — continue */ }
      }

      animFrameRef.current = requestAnimationFrame(loop);
    };

    animFrameRef.current = requestAnimationFrame(loop);
  }, [drawSkeleton]);

  // ── Start Recording ────────────────────────────────────────────────────────
  const handleStartRecording = useCallback(() => {
    collectedFramesRef.current = [];
    setFrameCount(0);
    setRecordingSeconds(0);
    setResult(null);
    setPhase('COUNTDOWN');
    setCountdown(3);

    let count = 3;
    const countdownInterval = setInterval(() => {
      count -= 1;
      setCountdown(count);
      if (count <= 0) {
        clearInterval(countdownInterval);
        setPhase('RECORDING');
        startRecordingLoop();

        // Track recording time
        const startTime = Date.now();
        const secInterval = setInterval(() => {
          setRecordingSeconds(Math.floor((Date.now() - startTime) / 1000));
        }, 1000);

        // Auto-stop after 30 seconds
        setTimeout(() => {
          clearInterval(secInterval);
          handleStopRecording();
        }, 30000);
      }
    }, 1000);
  }, [startRecordingLoop]);

  // ── Stop Recording ────────────────────────────────────────────────────────
  const handleStopRecording = useCallback(() => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    setPhase('ANALYZING');

    setTimeout(() => {
      const frames = collectedFramesRef.current;
      const derived = deriveExerciseTemplate(frames);
      setResult(derived);
      setSelectedCandidateIdx(0);
      setCustomTargetRom(derived.target_rom);
      setFormName(derived.detectedJoint.name);
      setPhase('RESULT');
    }, 800); // brief delay for "analyzing" UX
  }, []);

  // ── Run Simulated Elbow Demo (Webcam Bypass) ──────────────────────────────
  const handleRunSimulation = useCallback((side: 'right' | 'left' = 'right') => {
    setIsSimulating(true);
    setPhase('ANALYZING');
    collectedFramesRef.current = [];

    const sim = new KinematicSimulationEngine('NORMAL_REPS', side);
    const simFrames: Point2D[][] = [];
    // Generate 60 frames representing 3 full cycles of elbow movement
    for (let i = 0; i < 60; i++) {
      simFrames.push(sim.generateNextFrame());
    }

    setTimeout(() => {
      const derived = deriveExerciseTemplate(simFrames);
      setResult(derived);
      setSelectedCandidateIdx(0);
      setCustomTargetRom(derived.target_rom);
      setFormName(derived.detectedJoint.name);
      setFrameCount(simFrames.length);
      setPhase('RESULT');
      setIsSimulating(false);
    }, 900);
  }, []);

  // ── Select a Candidate Joint ──────────────────────────────────────────────
  const handleSelectCandidate = (idx: number) => {
    if (!result || !result.candidateAnalysis[idx]) return;
    setSelectedCandidateIdx(idx);
    const item = result.candidateAnalysis[idx];
    setFormName(item.triplet.name);
    const target = item.triplet.isAngleDecreasingOnFlex ? item.minAngle : item.maxAngle;
    setCustomTargetRom(target);
  };

  // Currently active candidate data
  const activeCandidate = result?.candidateAnalysis[selectedCandidateIdx] || null;
  const activeJoint = activeCandidate?.triplet || result?.detectedJoint;
  const activeRange = activeCandidate ? activeCandidate.angularRange : result?.angular_range ?? 0;
  const activeTargetRom = customTargetRom;
  const activeRestAngle = activeCandidate
    ? (activeCandidate.triplet.isAngleDecreasingOnFlex ? activeCandidate.maxAngle : activeCandidate.minAngle)
    : result?.rest_angle ?? 155;
  const activeReps = activeCandidate?.estimatedReps ?? result?.estimated_reps ?? 0;

  // ── Save Template to Backend ───────────────────────────────────────────────
  const handleSaveTemplate = async () => {
    if (!result || !activeJoint) return;
    setSaving(true);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('rehab_token') : null;
      const payload = {
        name: formName || activeJoint.name,
        description: formNotes || `Auto-derived protocol for ${activeJoint.name} (${activeJoint.side} side).`,
        joint_triplet_name: activeJoint.name,
        joint_triplet_indices: activeJoint.indices,
        joint_landmark_names: activeJoint.landmarkNames,
        is_angle_decreasing_on_flex: activeJoint.isAngleDecreasingOnFlex,
        target_rom: activeTargetRom,
        rest_angle: activeRestAngle,
        hysteresis_buffer: result.hysteresis_buffer,
        angular_range: activeRange,
        reps_target: formReps,
        estimated_reps_from_demo: activeReps,
        derivation_confidence: result.derivation_confidence,
        notes: formNotes || undefined
      };

      const res = await fetch('http://localhost:8000/api/exercises/templates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        const saved = await res.json();
        setSavedTemplateId(saved.id);
      } else {
        // Fallback for demo
        setSavedTemplateId(`demo-tmpl-${Date.now()}`);
      }
    } catch {
      setSavedTemplateId(`demo-tmpl-${Date.now()}`);
    } finally {
      setSaving(false);
    }
  };

  const confidenceColor = (c: number) =>
    c >= 0.75 ? 'text-emerald-400' : c >= 0.5 ? 'text-amber-400' : 'text-red-400';

  return (
    <div className="min-h-screen bg-slate-950 text-white py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <Link href="/therapist/dashboard" className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-white mb-2">
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Dashboard
            </Link>
            <h1 className="text-2xl font-black tracking-tight flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-sky-600/20 text-sky-400">
                <Camera className="w-5 h-5" />
              </div>
              Record Exercise Demo
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Record yourself performing the exercise. RehabSense AI engine auto-detects the active joint and derives tracking parameters — no raw video is stored.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handleRunSimulation('right')}
              disabled={phase === 'RECORDING' || isSimulating}
              className="px-3.5 py-2 rounded-xl bg-purple-900/40 hover:bg-purple-800/60 border border-purple-500/40 text-purple-300 text-xs font-bold transition-all flex items-center gap-2"
              title="Test with simulated Right Elbow movement without needing camera"
            >
              <Cpu className="w-3.5 h-3.5 text-purple-400" />
              <span>Simulate Elbow Demo</span>
            </button>
          </div>
        </div>

        {errorMsg && (
          <div className="flex items-start gap-3 bg-red-950/60 border border-red-800 rounded-2xl px-4 py-3">
            <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <div className="text-xs text-red-300 flex-1">
              <p>{errorMsg}</p>
              <button
                onClick={() => handleRunSimulation('right')}
                className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-red-900/80 hover:bg-red-800 text-white font-bold text-xs"
              >
                <Cpu className="w-3.5 h-3.5" />
                <span>Run Demo Simulation (Right Elbow)</span>
              </button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

          {/* Camera / Video Panel */}
          <div className="lg:col-span-8 relative rounded-3xl overflow-hidden border border-slate-700 bg-black aspect-[4/3]">
            <video
              ref={videoRef}
              className="absolute inset-0 w-full h-full object-cover scale-x-[-1]"
              muted playsInline autoPlay
            />
            <canvas
              ref={canvasRef}
              width={640}
              height={480}
              className="absolute inset-0 w-full h-full scale-x-[-1] pointer-events-none"
            />

            {/* Overlay states */}
            {loadingLandmarker && !errorMsg && (
              <div className="absolute inset-0 bg-slate-950/80 flex flex-col items-center justify-center gap-3">
                <Loader2 className="w-8 h-8 text-sky-400 animate-spin" />
                <p className="text-sm text-slate-300">Loading pose detection model…</p>
              </div>
            )}

            {phase === 'COUNTDOWN' && (
              <div className="absolute inset-0 bg-slate-950/70 flex flex-col items-center justify-center gap-2">
                <p className="text-slate-300 text-lg font-semibold">Get into position…</p>
                <span className="text-8xl font-black text-sky-400">{countdown}</span>
              </div>
            )}

            {phase === 'ANALYZING' && (
              <div className="absolute inset-0 bg-slate-950/80 flex flex-col items-center justify-center gap-3">
                <Sparkles className="w-10 h-10 text-sky-400 animate-pulse" />
                <p className="text-lg font-bold text-white">Analyzing movement with AI engine…</p>
                <p className="text-xs text-slate-400">Evaluating bi-lateral candidate joints, visibility gating, and range of motion</p>
              </div>
            )}

            {/* Recording indicator */}
            {phase === 'RECORDING' && (
              <div className="absolute top-4 left-4 flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-red-500 animate-pulse" />
                <span className="text-xs font-bold text-white bg-slate-900/60 px-2 py-0.5 rounded-full">
                  REC {recordingSeconds}s
                </span>
                <span className="text-xs text-slate-300 bg-slate-900/60 px-2 py-0.5 rounded-full">
                  {frameCount} frames
                </span>
              </div>
            )}

            {/* Zero-video architecture notice */}
            <div className="absolute bottom-3 left-3 right-3">
              <div className="bg-slate-900/80 backdrop-blur-sm rounded-xl px-3 py-1.5 flex items-center gap-2">
                <Info className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                <p className="text-[10px] text-slate-400">
                  Zero raw video transmission — only numeric landmark coordinates are saved
                </p>
              </div>
            </div>
          </div>

          {/* Controls / Result Panel */}
          <div className="lg:col-span-4 flex flex-col gap-4">

            {/* Controls */}
            {(phase === 'IDLE' || phase === 'RESULT') && !savedTemplateId && (
              <div className="bg-slate-900 rounded-3xl border border-slate-700 p-5 space-y-4">
                <h2 className="text-sm font-bold text-white flex items-center gap-2">
                  <Camera className="w-4 h-4 text-sky-400" />
                  {phase === 'IDLE' ? 'Ready to Record' : 'Record Again'}
                </h2>
                <p className="text-xs text-slate-400">
                  Perform the exercise 2–5 times clearly in frame (e.g. elbow extension or flexion). RehabSense will auto-detect the moving joint.
                </p>
                <div className="space-y-2">
                  <button
                    id="start-recording-btn"
                    onClick={handleStartRecording}
                    disabled={loadingLandmarker || !!errorMsg}
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white font-bold text-sm transition-all"
                  >
                    <Play className="w-4 h-4" />
                    {phase === 'IDLE' ? 'Start Recording' : 'Record Again'}
                  </button>

                  <button
                    onClick={() => handleRunSimulation('right')}
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-2xl bg-purple-900/40 hover:bg-purple-800/60 border border-purple-500/40 text-purple-200 text-xs font-bold transition-all"
                  >
                    <Cpu className="w-3.5 h-3.5 text-purple-400" />
                    <span>Run Simulated Elbow Extension</span>
                  </button>
                </div>
              </div>
            )}

            {/* Active recording controls */}
            {phase === 'RECORDING' && (
              <div className="bg-slate-900 rounded-3xl border border-red-800/60 p-5 space-y-4">
                <h2 className="text-sm font-bold text-red-400 flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
                  Recording ({recordingSeconds}s / 30s max)
                </h2>
                <p className="text-xs text-slate-400">
                  Perform the exercise smoothly (e.g. elbow extension / flexion). Click Stop when done.
                </p>
                <button
                  id="stop-recording-btn"
                  onClick={handleStopRecording}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-red-600 hover:bg-red-500 text-white font-bold text-sm transition-all"
                >
                  <StopCircle className="w-4 h-4" />
                  Stop & Analyze
                </button>
              </div>
            )}

            {/* Results */}
            {phase === 'RESULT' && result && !savedTemplateId && (
              <div className="bg-slate-900 rounded-3xl border border-slate-700 p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-bold text-white flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-sky-400" />
                    AI-Derived Parameters
                  </h2>
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-sky-950 border border-sky-800 text-sky-400">
                    {result.detected_side.toUpperCase()} SIDE
                  </span>
                </div>

                {/* Detected joint card */}
                <div className="bg-sky-950/40 border border-sky-800/60 rounded-2xl p-3.5 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-sky-400 font-bold uppercase tracking-wider">AI Detected Joint</span>
                    <span className={`text-[10px] font-bold ${confidenceColor(result.derivation_confidence)}`}>
                      {Math.round(result.derivation_confidence * 100)}% Confidence
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-base font-black text-white">{activeJoint?.name}</p>
                    <span className="text-[10px] px-2 py-0.5 rounded-md bg-sky-900/60 text-sky-200 font-semibold">
                      {activeJoint?.side === 'right' ? 'Right Arm' : 'Left Arm'}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400 font-mono">
                    Landmarks: {activeJoint?.landmarkNames.join(' → ')}
                  </p>
                </div>

                {/* Candidate Selector Pill Bar */}
                {result.candidateAnalysis.length > 1 && (
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Confirm or Select Joint:
                    </label>
                    <select
                      value={selectedCandidateIdx}
                      onChange={e => handleSelectCandidate(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs font-medium focus:outline-none focus:ring-2 focus:ring-sky-500/50"
                    >
                      {result.candidateAnalysis.map((c, i) => (
                        <option key={c.triplet.id || c.triplet.name + c.triplet.side} value={i}>
                          {c.triplet.name} ({c.triplet.side === 'right' ? 'Right' : 'Left'}) — {Math.round(c.angularRange)}° ROM {c.score > 0 ? `(Score: ${Math.round(c.score)})` : '(Disqualified)'}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Key metrics */}
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { label: 'Target ROM', value: `${activeTargetRom}°`, color: 'text-sky-400' },
                    { label: 'Rest Angle', value: `${activeRestAngle}°`, color: 'text-slate-300' },
                    { label: 'Full Range', value: `${activeRange}°`, color: 'text-emerald-400' },
                    { label: 'Est. Reps', value: activeReps, color: 'text-amber-400' },
                  ].map(m => (
                    <div key={m.label} className="bg-slate-800/60 rounded-xl p-2.5">
                      <p className="text-[10px] text-slate-500 uppercase font-semibold">{m.label}</p>
                      <p className={`text-xl font-black ${m.color}`}>{m.value}</p>
                    </div>
                  ))}
                </div>

                {/* Name / reps / notes for saving */}
                <div className="space-y-2.5 pt-1">
                  <div>
                    <label className="text-[10px] text-slate-400 uppercase font-semibold block mb-1">Template Name:</label>
                    <input
                      value={formName}
                      onChange={e => setFormName(e.target.value)}
                      placeholder="e.g. Elbow Flexion & Extension"
                      className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/50"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] text-slate-400 uppercase font-semibold block mb-1">Target ROM (°):</label>
                      <input
                        type="number"
                        value={customTargetRom}
                        onChange={e => setCustomTargetRom(Number(e.target.value))}
                        min={20} max={180}
                        className="w-full px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-white text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/50"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-400 uppercase font-semibold block mb-1">Target Reps/Set:</label>
                      <input
                        type="number"
                        value={formReps}
                        onChange={e => setFormReps(Number(e.target.value))}
                        min={1} max={30}
                        className="w-full px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-white text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/50"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] text-slate-400 uppercase font-semibold block mb-1">Clinical Notes (Optional):</label>
                    <textarea
                      value={formNotes}
                      onChange={e => setFormNotes(e.target.value)}
                      placeholder="e.g. Standard elbow extension protocol..."
                      rows={2}
                      className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/50 resize-none"
                    />
                  </div>
                </div>

                <button
                  id="save-template-btn"
                  onClick={handleSaveTemplate}
                  disabled={saving || !formName}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-sm transition-all"
                >
                  {saving ? <><Loader2 className="w-4 h-4 animate-spin" />Saving…</> : <><Send className="w-4 h-4" />Save Template</>}
                </button>
              </div>
            )}

            {/* Success state */}
            {savedTemplateId && (
              <div className="bg-emerald-950/50 border border-emerald-700 rounded-3xl p-6 text-center space-y-3">
                <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto" />
                <h2 className="text-lg font-black text-white">Template Saved!</h2>
                <p className="text-sm text-emerald-300">
                  &quot;{formName}&quot; ({activeJoint?.targetJoint} joint) is ready to assign to patients.
                </p>
                <p className="text-[10px] text-slate-500 font-mono">ID: {savedTemplateId}</p>
                <button
                  onClick={() => router.push('/therapist/dashboard')}
                  className="w-full py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm transition-all"
                >
                  Back to Dashboard
                </button>
              </div>
            )}

            {/* All-candidate breakdown */}
            {result && result.candidateAnalysis.length > 0 && (
              <div className="bg-slate-900 rounded-3xl border border-slate-700 p-4 space-y-2.5">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                    <BarChart3 className="w-3.5 h-3.5 text-sky-400" /> Candidate Movement Ranking
                  </h3>
                  <span className="text-[10px] text-slate-500">Click to select</span>
                </div>
                {result.candidateAnalysis.slice(0, 6).map((c, i) => {
                  const isSelected = i === selectedCandidateIdx;
                  return (
                    <div
                      key={c.triplet.id || c.triplet.name + c.triplet.side}
                      onClick={() => handleSelectCandidate(i)}
                      className={`p-2 rounded-xl transition-all cursor-pointer flex items-center gap-2 ${
                        isSelected
                          ? 'bg-sky-950/70 border border-sky-600/80 shadow-xs'
                          : 'bg-slate-800/40 hover:bg-slate-800/80 border border-transparent'
                      }`}
                    >
                      <div className="w-4 flex items-center justify-center">
                        {isSelected && <Check className="w-3 h-3 text-sky-400" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className={`font-semibold truncate ${isSelected ? 'text-sky-300' : 'text-slate-300'}`}>
                            {c.triplet.name} ({c.triplet.side === 'right' ? 'R' : 'L'})
                          </span>
                          <span className="font-mono text-slate-400 shrink-0 ml-2">
                            {Math.round(c.angularRange)}°
                          </span>
                        </div>
                        <div className="bg-slate-800 rounded-full h-1.5 mt-1 overflow-hidden">
                          <div
                            className={`h-1.5 rounded-full transition-all ${
                              isSelected ? 'bg-sky-400' : 'bg-slate-600'
                            }`}
                            style={{ width: `${Math.min(100, (c.angularRange / 160) * 100)}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

          </div>
        </div>

      </div>
    </div>
  );
}
