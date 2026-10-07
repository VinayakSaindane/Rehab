'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  ElbowFlexionAnalyzer, 
  ShoulderFlexionAnalyzer, 
  SitToStandAnalyzer, 
  KneeExtensionAnalyzer,
  ShoulderAbductionAnalyzer,
  KinematicSimulationEngine,
  Point2D 
} from '@rehabsense/exercise-engine';
import { api } from '@/lib/api';
import { useAccessibility } from '@/lib/accessibility-context';
import PoseCanvas from '@/components/PoseCanvas';
import JointAngleGauge from '@/components/JointAngleGauge';
import RepProgressCard from '@/components/RepProgressCard';
import ConfidenceGateBanner from '@/components/ConfidenceGateBanner';
import CompensationWarningBanner from '@/components/CompensationWarningBanner';
import { audioCoach } from '@/lib/audio-coach';
import { spatialAudio } from '@/lib/spatial-audio';
import { 
  Camera, 
  Volume2, 
  VolumeX, 
  RotateCcw, 
  Sparkles, 
  ShieldAlert, 
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  Play,
  Pause,
  Award,
  Activity,
  Smile,
  Headphones,
  Globe
} from 'lucide-react';
import ProtectedRoute from '@/components/ProtectedRoute';

export default function LiveExerciseScreen() {
  const params = useParams();
  const router = useRouter();
  const exerciseId = (params?.id as string) || 'elbow-flexion';
  const { 
    voiceEnabled, 
    toggleVoice, 
    language, 
    setLanguage, 
    earphoneMode, 
    toggleEarphoneMode, 
    activePanSide, 
    testEarphone, 
    playSuccessChime 
  } = useAccessibility();

  // Engine & Video References
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const animFrameIdRef = useRef<number | null>(null);
  const analyzerRef = useRef<any>(null);
  const simulatorRef = useRef<KinematicSimulationEngine>(new KinematicSimulationEngine('NORMAL_REPS'));
  const landmarkerRef = useRef<any>(null);

  // Exercise Session State
  const [exerciseMeta, setExerciseMeta] = useState<any>({
    name: 'Elbow Flexion & Extension',
    targetReps: 10,
    targetRom: 120.0,
    minRom: 40.0,
    maxRom: 140.0,
    targetJoint: 'Elbow',
    isAngleDecreasingOnFlex: true
  });

  const [mode, setMode] = useState<'REAL' | 'SIMULATED'>('REAL');
  const [simPattern, setSimPattern] = useState<'NORMAL_REPS' | 'UNDER_RANGE_REP' | 'LOW_CONFIDENCE'>('NORMAL_REPS');
  const [cameraActive, setCameraActive] = useState(false);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [activeSide, setActiveSide] = useState<'left' | 'right'>('left');
  const [distanceStatus, setDistanceStatus] = useState<{ status: 'optimal' | 'close' | 'far' | 'checking'; message: string }>({
    status: 'optimal',
    message: 'Framing: Optimal (6–10 ft) ✓'
  });
  const [countdown, setCountdown] = useState<number | null>(null);
  const [painScore, setPainScore] = useState<number>(0);
  const [sessionStartTime, setSessionStartTime] = useState<number>(Date.now());
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  // Live Kinetic Feedback State
  const [currentAngle, setCurrentAngle] = useState(155.0);
  const [completedReps, setCompletedReps] = useState(0);
  const [validReps, setValidReps] = useState(0);
  const [trackingConfidence, setTrackingConfidence] = useState(0.94);
  const [isGated, setIsGated] = useState(false);
  const [gatedReason, setGatedReason] = useState<string | null>(null);
  const [missingLandmarks, setMissingLandmarks] = useState<string[]>([]);
  const [statusMessage, setStatusMessage] = useState('Maintain starting posture to calibrate');
  const [landmarks, setLandmarks] = useState<Point2D[]>([]);
  const [activeJointIndices, setActiveJointIndices] = useState<number[]>([11, 13, 15]);

  // Compensation detection state
  const [hasCompensation, setHasCompensation] = useState(false);
  const [compensationFlags, setCompensationFlags] = useState<string[]>([]);
  const [compensationReasons, setCompensationReasons] = useState<string[]>([]);
  const [faultSide, setFaultSide] = useState<'left' | 'right' | null>(null);
  // Aggregated compensation flags across this session (sent in payload)
  const sessionCompensationFlagsRef = React.useRef<Set<string>>(new Set());

  // Developer / Clinician Kinematic Debug Telemetry State
  const [debugMode, setDebugMode] = useState(false);
  const [debugTelemetry, setDebugTelemetry] = useState<any>(null);

  // Session Completed State
  const [isSessionCompleted, setIsSessionCompleted] = useState(false);
  // B15: Ref mirrors state to prevent stale closure in rAF loop (React state is async)
  const isSessionCompletedRef = React.useRef(false);
  const sessionFinishedLockRef = React.useRef(false);
  const [sessionSummary, setSessionSummary] = useState<any>(null);
  const [savingSession, setSavingSession] = useState(false);

  // B15: Keep ref in sync with state
  useEffect(() => {
    isSessionCompletedRef.current = isSessionCompleted;
  }, [isSessionCompleted]);

  // Initialize Exercise Engine
  useEffect(() => {
    // B21: Reset old analyzer state before replacing — prevents stale ROM/rep state
    //      from a previous exercise/side leaking into the new instance.
    if (analyzerRef.current?.reset) {
      analyzerRef.current.reset();
    }
    let analyzer: any;
    if (exerciseId === 'shoulder-flexion') {
      analyzer = new ShoulderFlexionAnalyzer(135, 10, voiceEnabled, activeSide, language);
      setExerciseMeta({
        name: 'Shoulder Flexion (Elevations)',
        targetReps: 10,
        targetRom: 135.0,
        minRom: 30.0,
        maxRom: 160.0,
        targetJoint: 'Shoulder',
        isAngleDecreasingOnFlex: false
      });
      setActiveJointIndices(activeSide === 'right' ? [24, 12, 14] : [23, 11, 13]);
    } else if (exerciseId === 'sit-to-stand') {
      analyzer = new SitToStandAnalyzer(165, 10, voiceEnabled, activeSide, language);
      setExerciseMeta({
        name: 'Sit-to-Stand Functional Transfer',
        targetReps: 10,
        targetRom: 165.0,
        minRom: 90.0,
        maxRom: 175.0,
        targetJoint: 'Knee & Hip',
        isAngleDecreasingOnFlex: false
      });
      setActiveJointIndices(activeSide === 'right' ? [24, 26, 28] : [23, 25, 27]);
    } else if (exerciseId === 'knee-extension') {
      analyzer = new KneeExtensionAnalyzer(170, 10, voiceEnabled, activeSide, language);
      setExerciseMeta({
        name: 'Seated Knee Extension (Quad Sets)',
        targetReps: 10,
        targetRom: 170.0,
        minRom: 90.0,
        maxRom: 180.0,
        targetJoint: 'Knee',
        isAngleDecreasingOnFlex: false
      });
      setActiveJointIndices(activeSide === 'right' ? [24, 26, 28] : [23, 25, 27]);
    } else if (exerciseId === 'shoulder-abduction') {
      analyzer = new ShoulderAbductionAnalyzer(90, 10, voiceEnabled, activeSide, language);
      setExerciseMeta({
        name: 'Shoulder Abduction (Lateral Raise)',
        targetReps: 10,
        targetRom: 90.0,
        minRom: 20.0,
        maxRom: 120.0,
        targetJoint: 'Shoulder',
        isAngleDecreasingOnFlex: false
      });
      setActiveJointIndices(activeSide === 'right' ? [24, 12, 14] : [23, 11, 13]);
    } else {
      analyzer = new ElbowFlexionAnalyzer(120, 10, voiceEnabled, activeSide, language);
      setExerciseMeta({
        name: 'Elbow Flexion & Extension',
        targetReps: 10,
        targetRom: 120.0,
        minRom: 40.0,
        maxRom: 140.0,
        targetJoint: 'Elbow',
        isAngleDecreasingOnFlex: true
      });
      setActiveJointIndices(activeSide === 'right' ? [12, 14, 16] : [11, 13, 15]);
    }
    analyzerRef.current = analyzer;
  }, [exerciseId, voiceEnabled, activeSide, language]);

  // Start Camera Stream or MediaPipe (supports smartphone front/rear camera flipping)
  const initCamera = useCallback(async (desiredFacing?: 'user' | 'environment') => {
    const targetFacing = desiredFacing || facingMode;
    try {
      if (videoRef.current && videoRef.current.srcObject) {
        const currentStream = videoRef.current.srcObject as MediaStream;
        currentStream.getTracks().forEach(t => t.stop());
      }
      const constraints: MediaStreamConstraints = {
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: targetFacing === 'environment' ? { ideal: 'environment' } : 'user'
        }
      };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setCameraActive(true);
      setMode('REAL');

      // Initialize MediaPipe Vision Pose Landmarker if supported
      try {
        const vision = await import('@mediapipe/tasks-vision');
        const wasmFileset = await vision.FilesetResolver.forVisionTasks(
          'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
        );
        landmarkerRef.current = await vision.PoseLandmarker.createFromOptions(wasmFileset, {
          baseOptions: {
            modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task',
            delegate: 'GPU'
          },
          runningMode: 'VIDEO',
          numPoses: 1,
          minPoseDetectionConfidence: 0.6,
          minPosePresenceConfidence: 0.6,
          minTrackingConfidence: 0.6
        });
      } catch (mpErr) {
        console.warn('MediaPipe CDN loader fallback:', mpErr);
      }
    } catch (camErr) {
      console.warn('Webcam permission unavailable or lens toggle error. Switching to Simulation Mode:', camErr);
      setMode('SIMULATED');
    }
  }, [facingMode]);

  const toggleCameraFacing = async () => {
    const next = facingMode === 'user' ? 'environment' : 'user';
    setFacingMode(next);
    await initCamera(next);
  };

  const handleToggleSide = (newSide: 'left' | 'right') => {
    setActiveSide(newSide);
    if (analyzerRef.current?.setSide) {
      analyzerRef.current.setSide(newSide);
    }
    if (exerciseId === 'shoulder-flexion' || exerciseId === 'shoulder-abduction') {
      setActiveJointIndices(newSide === 'right' ? [24, 12, 14] : [23, 11, 13]);
    } else if (exerciseId === 'sit-to-stand' || exerciseId === 'knee-extension') {
      setActiveJointIndices(newSide === 'right' ? [24, 26, 28] : [23, 25, 27]);
    } else {
      setActiveJointIndices(newSide === 'right' ? [12, 14, 16] : [11, 13, 15]);
    }
  };

  const startCountdown = () => {
    setCountdown(3);
    audioCoach.speak(audioCoach.getPhrase('countdown_3'));
    const interval = setInterval(() => {
      setCountdown(prev => {
        if (prev === null || prev <= 1) {
          clearInterval(interval);
          audioCoach.speak(audioCoach.getPhrase('countdown_begin'));
          return null;
        }
        const next = prev - 1;
        if (next === 2) audioCoach.speak(audioCoach.getPhrase('countdown_2'));
        if (next === 1) audioCoach.speak(audioCoach.getPhrase('countdown_1'));
        return next;
      });
    }, 1000);
  };

  useEffect(() => {
    initCamera();
    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(t => t.stop());
      }
      if (animFrameIdRef.current) {
        cancelAnimationFrame(animFrameIdRef.current);
      }
    };
  }, [initCamera]);

  // Timer Tick
  useEffect(() => {
    if (isSessionCompleted) return;
    const interval = setInterval(() => {
      setElapsedSeconds(Math.floor((Date.now() - sessionStartTime) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [sessionStartTime, isSessionCompleted]);

  // Real-Time Computer Vision Frame Analysis Loop
  useEffect(() => {
    if (isSessionCompleted) return;

    let lastVideoTime = -1;

    const processLoop = () => {
      const analyzer = analyzerRef.current;
      if (!analyzer) {
        animFrameIdRef.current = requestAnimationFrame(processLoop);
        return;
      }

      // B2 + B10: Revamped frame acquisition.
      // - B2: Only process frames when video.currentTime advances. If unchanged (rAF
      //        fires at 60fps but camera is 30fps), skip the tick entirely — previously
      //        we fell through to simulation, mixing fake data with live camera data.
      // - B10: Pass video.currentTime*1000 (media timestamp) to detectForVideo — NOT
      //         performance.now() (wall-clock). MediaPipe requires monotonically increasing
      //         media timestamps; wall-clock caused sporadic landmark dropouts.
      let detectedLandmarks: Point2D[] = [];
      let frameDecoded = false;

      if (mode === 'REAL' && videoRef.current && landmarkerRef.current && videoRef.current.readyState >= 2) {
        const video = videoRef.current;
        if (video.currentTime !== lastVideoTime) {
          lastVideoTime = video.currentTime;
          frameDecoded = true;
          // B10: media timestamp, not wall-clock
          const poseResults = landmarkerRef.current.detectForVideo(video, video.currentTime * 1000);
          if (poseResults.landmarks && poseResults.landmarks.length > 0) {
            detectedLandmarks = poseResults.landmarks[0].map((lm: any) => ({
              x: lm.x,
              y: lm.y,
              z: lm.z,
              visibility: lm.visibility ?? 1.0
            }));
          }
        }
        // B2: No new video frame — skip tick, do NOT inject simulation data
        if (!frameDecoded) {
          animFrameIdRef.current = requestAnimationFrame(processLoop);
          return;
        }
      } else if (mode === 'SIMULATED') {
        simulatorRef.current.setPattern(simPattern);
        detectedLandmarks = simulatorRef.current.generateNextFrame();
      }

      // Distance & Framing Heuristic (real mode only, skip for simulation)
      if (mode === 'REAL' && detectedLandmarks.length >= 25) {
        const leftShoulder = detectedLandmarks[11];
        const rightShoulder = detectedLandmarks[12];
        if (leftShoulder && rightShoulder) {
          const span = Math.abs(leftShoulder.x - rightShoulder.x);
          if (span > 0.45) {
            setDistanceStatus({ status: 'close', message: 'Step back slightly (optimal 6–10 ft)' });
          } else if (span < 0.08) {
            setDistanceStatus({ status: 'far', message: 'Move slightly closer' });
          } else {
            setDistanceStatus({ status: 'optimal', message: 'Framing: Optimal (6–10 ft) ✓' });
          }
        }
      }

      // B1: Pass performance.now() so velocity/timing calculations use accurate timestamps
      //     (previously processFrame() used Date.now() internally as fallback)
      const analysis = analyzer.processFrame(detectedLandmarks, performance.now());

      setCurrentAngle(analysis.jointAngle);
      setLandmarks(analysis.landmarks);
      setTrackingConfidence(analysis.confidenceResult.overallConfidence);
      setIsGated(analysis.confidenceResult.isGated);
      setGatedReason(analysis.confidenceResult.reason);
      setMissingLandmarks(analysis.confidenceResult.missingLandmarks);
      setCompletedReps(analysis.repResult.completedReps);
      setValidReps(analysis.repResult.validReps);
      setStatusMessage(analysis.feedbackEvent.message);
      if (analysis.debug) {
        setDebugTelemetry(analysis.debug);
      }

      // Update compensation HUD state
      const comp = analysis.compensationResult;
      setHasCompensation(comp.hasCompensation);
      setCompensationFlags(comp.compensation_flags);
      setCompensationReasons(comp.reasons);
      const activeFault = comp.faultSide || (comp.hasCompensation ? activeSide : null);
      setFaultSide(activeFault);

      // Trigger Directional Earphone Buzz if compensation is detected and confidence passes
      if (comp.hasCompensation && !analysis.confidenceResult.isGated && activeFault) {
        const flagKey = (comp.compensation_flags[0] as any) || 'general';
        audioCoach.triggerDirectionalCorrection(activeFault, flagKey);
      }

      // Accumulate unique flags for session payload
      comp.compensation_flags.forEach((f: string) => sessionCompensationFlagsRef.current.add(f));

      // Auto-finish if prescribed target reps completed
      // B15: Use ref not state to avoid race condition and duplicate saves
      if (analysis.repResult.completedReps >= exerciseMeta.targetReps && !sessionFinishedLockRef.current) {
        sessionFinishedLockRef.current = true;
        handleFinishSession();
        return;
      }

      animFrameIdRef.current = requestAnimationFrame(processLoop);
    };

    animFrameIdRef.current = requestAnimationFrame(processLoop);

    return () => {
      if (animFrameIdRef.current) {
        cancelAnimationFrame(animFrameIdRef.current);
      }
    };
  }, [mode, simPattern, exerciseMeta.targetReps, isSessionCompleted, activeSide, exerciseId]);

  // Handle Session Completion
  const handleFinishSession = async (userSelectedPain?: number) => {
    sessionFinishedLockRef.current = true;
    if (isSessionCompleted) return;
    setIsSessionCompleted(true);
    isSessionCompletedRef.current = true;
    setSavingSession(true);

    try {
      playSuccessChime();
      audioCoach.speak(audioCoach.getPhrase('target_completed', { targetReps: exerciseMeta.targetReps }));
    } catch {}

    const effectivePain = typeof userSelectedPain === 'number' ? userSelectedPain : painScore;

    const analyzer = analyzerRef.current;
    const summary = analyzer ? analyzer.getSummary() : {
      completedReps,
      validReps,
      averageRom: Math.round(currentAngle),
      maxRom: 122,
      flags: completedReps < exerciseMeta.targetReps ? ['incomplete_target_reps'] : []
    };
    const detailedMetrics = analyzer ? analyzer.getDetailedMetrics() : [];

    const durationSeconds = Math.max(15, elapsedSeconds);
    const completedR = summary.completedReps || completedReps;
    const validR = summary.validReps || validReps;
    const avgRom = summary.averageRom || Math.round(currentAngle);
    const maxRom = summary.maxRom || Math.round(currentAngle);

    const sessionPayload = {
      exercise_id: exerciseId,
      exercise_name: exerciseMeta.name,
      started_at: new Date(sessionStartTime).toISOString(),
      completed_at: new Date().toISOString(),
      duration_seconds: durationSeconds,
      target_reps: exerciseMeta.targetReps,
      completed_reps: completedR,
      valid_reps: validR,
      average_rom: avgRom,
      max_rom: maxRom,
      tracking_confidence: trackingConfidence,
      form_flags: summary.flags,
      compensation_flags: Array.from(sessionCompensationFlagsRef.current),
      joint_metrics: detailedMetrics,
      patient_notes: `Completed home session (${activeSide.toUpperCase()} side) via camera coach. Pain rating: ${effectivePain}/10.`,
      pain_score: effectivePain,
      side_trained: activeSide
    };

    // Immediately create and set sessionSummary so the progress report modal pops up right away
    const initialSummary = {
      ...sessionPayload,
      id: 'session-pending',
      adherencePct: Math.min(100, Math.round((avgRom / exerciseMeta.targetRom) * 100)),
      repCompletionPct: Math.min(100, Math.round((completedR / exerciseMeta.targetReps) * 100))
    };
    setSessionSummary(initialSummary);

    try {
      const saved = await api.createSession(sessionPayload);
      if (saved?.id) {
        setSessionSummary((prev: any) => ({
          ...(prev || initialSummary),
          id: saved.id
        }));
      }
    } catch {
      // Retain initial local summary in offline/demo mode
    } finally {
      setSavingSession(false);
    }
  };

  // Restart / Practice Again Handler
  const handleRestartSession = () => {
    if (analyzerRef.current?.reset) {
      analyzerRef.current.reset();
    }
    setCompletedReps(0);
    setValidReps(0);
    setCurrentAngle(0);
    setSessionSummary(null);
    setIsSessionCompleted(false);
    isSessionCompletedRef.current = false;
    sessionFinishedLockRef.current = false;
    sessionCompensationFlagsRef.current.clear();
    setElapsedSeconds(0);
    setSessionStartTime(Date.now());
  };

  return (
    <ProtectedRoute allowedRoles={['PATIENT']}>
      <div className="min-h-screen bg-slate-950/60 backdrop-blur-2xl text-white flex flex-col justify-between select-none">
      
      {/* 1. TOP STATUS BAR (Requirement 12: Level 1 Glass Ribbon) */}
      <header className="glass-card-dark border-b border-white/15 px-4 py-3 z-30 backdrop-blur-2xl">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
          
          <div className="flex items-center gap-3">
            <Link
              href="/patient/dashboard"
              className="p-2 rounded-xl glass-chip hover:bg-white/20 text-slate-200 transition-colors border border-white/20"
              title="Return to Dashboard"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <h1 className="text-base sm:text-lg font-bold tracking-tight text-white flex items-center gap-2">
                {exerciseMeta.name}
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-sky-950 text-sky-400 border border-sky-700">
                  Target: {exerciseMeta.targetRom}° ROM
                </span>
              </h1>
              <p className="text-xs text-slate-400">
                Prescribed by Dr. Ananya Sharma • 2 sets × {exerciseMeta.targetReps} repetitions
              </p>
            </div>
          </div>

          {/* Demonstration Mode & Resilience Toggles */}
          <div className="flex flex-wrap items-center gap-2">
            
            {/* Active Limb Side Selector (Crucial for bilateral rehabilitation) */}
            <div className="flex items-center bg-white/10 rounded-xl p-1 border border-white/10 text-xs">
              <button
                type="button"
                onClick={() => handleToggleSide('left')}
                className={`px-2.5 py-1 rounded-lg font-semibold transition-all ${
                  activeSide === 'left' ? 'bg-sky-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
                }`}
                title="Track left limb"
              >
                Left
              </button>
              <button
                type="button"
                onClick={() => handleToggleSide('right')}
                className={`px-2.5 py-1 rounded-lg font-semibold transition-all ${
                  activeSide === 'right' ? 'bg-sky-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
                }`}
                title="Track right limb"
              >
                Right
              </button>
            </div>

            {/* Camera Lens Flip Button (For Smartphone Rear or Front Camera) */}
            <button
              type="button"
              onClick={toggleCameraFacing}
              className="px-2.5 py-1.5 rounded-xl bg-white/10 border border-white/10 text-xs text-slate-300 hover:text-white flex items-center gap-1.5 transition-colors"
              title={facingMode === 'user' ? 'Switch to smartphone rear camera' : 'Switch to front camera'}
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{facingMode === 'user' ? 'Rear Cam' : 'Front Cam'}</span>
            </button>

            {/* Hands-Free Ready Countdown Button */}
            <button
              type="button"
              onClick={startCountdown}
              disabled={countdown !== null}
              className="px-2.5 py-1.5 rounded-xl bg-teal-600/90 hover:bg-teal-500 disabled:opacity-50 text-xs text-white font-bold flex items-center gap-1.5 transition-colors shadow-xs"
              title="Hands-free 3-second preparation countdown"
            >
              <Play className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Ready (3s)</span>
            </button>

            {/* Developer / Clinician Kinematic Diagnostic Telemetry Toggle */}
            <button
              type="button"
              onClick={() => setDebugMode(!debugMode)}
              className={`px-2.5 py-1.5 rounded-xl border text-xs flex items-center gap-1.5 transition-all ${
                debugMode
                  ? 'bg-amber-500/25 border-amber-400 text-amber-300 font-bold shadow-sm shadow-amber-500/20'
                  : 'bg-white/10 border-white/10 text-slate-300 hover:text-white'
              }`}
              title="Toggle Kinematic Telemetry & Biomechanical Diagnostics"
            >
              <Activity className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Debug</span>
            </button>

            {/* Real vs Sim Mode Switcher */}
            <div className="flex items-center bg-white/10 rounded-xl p-1 border border-white/10 text-xs">
              <button
                type="button"
                onClick={() => setMode('REAL')}
                className={`px-2.5 py-1 rounded-lg font-semibold transition-all flex items-center gap-1.5 ${
                  mode === 'REAL' ? 'bg-sky-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
                }`}
              >
                <Camera className="w-3.5 h-3.5" />
                <span>Live</span>
              </button>

              <button
                type="button"
                onClick={() => setMode('SIMULATED')}
                className={`px-2.5 py-1 rounded-lg font-semibold transition-all flex items-center gap-1.5 ${
                  mode === 'SIMULATED' ? 'bg-purple-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Sim</span>
              </button>
            </div>

            {/* Simulation Scenario Switcher (Available when in Simulation Mode) */}
            {mode === 'SIMULATED' && (
              <select
                value={simPattern}
                onChange={(e: any) => setSimPattern(e.target.value)}
                className="bg-slate-900 border border-purple-500/40 text-xs text-purple-200 rounded-xl px-2.5 py-1.5 focus:outline-none focus:border-purple-400 font-medium"
              >
                <option value="NORMAL_REPS">Normal Reps (122° Target)</option>
                <option value="UNDER_RANGE_REP">Under-Range Rep (108° Flag)</option>
                <option value="LOW_CONFIDENCE">Low Confidence (Pause Gate)</option>
              </select>
            )}

            {/* Audio Language Selector */}
            <div className="flex items-center bg-white/10 rounded-xl p-0.5 border border-white/10 text-xs">
              <button
                type="button"
                onClick={() => setLanguage('en')}
                className={`px-2 py-1 rounded-lg font-bold transition-all ${
                  language === 'en' ? 'bg-sky-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
                }`}
                title="Audio Language: English"
              >
                EN
              </button>
              <button
                type="button"
                onClick={() => setLanguage('hi')}
                className={`px-2 py-1 rounded-lg font-bold transition-all ${
                  language === 'hi' ? 'bg-sky-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
                }`}
                title="Audio Language: हिन्दी (Hindi)"
              >
                हिन्दी
              </button>
              <button
                type="button"
                onClick={() => setLanguage('mr')}
                className={`px-2 py-1 rounded-lg font-bold transition-all ${
                  language === 'mr' ? 'bg-sky-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
                }`}
                title="Audio Language: मराठी (Marathi)"
              >
                मराठी
              </button>
            </div>

            {/* Binaural Earphone Posture Coach Toggle & Quick Test */}
            <div className="flex items-center bg-white/10 rounded-xl p-0.5 border border-white/10 text-xs">
              <button
                type="button"
                onClick={toggleEarphoneMode}
                className={`p-1.5 rounded-lg transition-all relative ${
                  earphoneMode ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
                }`}
                title={earphoneMode ? 'Spatial Earphone Feedback: ON (Left/Right Buzz)' : 'Earphones: OFF'}
              >
                <Headphones className="w-3.5 h-3.5" />
                {earphoneMode && (
                  <span className={`absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full ${activePanSide !== 'center' ? 'bg-amber-400 animate-ping' : 'bg-emerald-400 animate-pulse'}`} />
                )}
              </button>

              {earphoneMode && (
                <div className="flex items-center gap-0.5 px-1">
                  <button
                    type="button"
                    onClick={() => testEarphone('left')}
                    className={`px-1.5 py-0.5 text-[10px] rounded font-bold transition-all ${
                      activePanSide === 'left' ? 'bg-amber-400 text-slate-950 animate-pulse font-black' : 'text-slate-300 hover:bg-white/10'
                    }`}
                    title="Test Left Earphone (Buzz Left)"
                  >
                    L ⬅️
                  </button>
                  <button
                    type="button"
                    onClick={() => testEarphone('right')}
                    className={`px-1.5 py-0.5 text-[10px] rounded font-bold transition-all ${
                      activePanSide === 'right' ? 'bg-amber-400 text-slate-950 animate-pulse font-black' : 'text-slate-300 hover:bg-white/10'
                    }`}
                    title="Test Right Earphone (Buzz Right)"
                  >
                    ➡️ R
                  </button>
                </div>
              )}
            </div>

            {/* Audio Toggle */}
            <button
              type="button"
              onClick={toggleVoice}
              className={`p-2 rounded-xl border transition-colors ${
                voiceEnabled ? 'bg-sky-950/80 border-sky-700 text-sky-400' : 'bg-white/10 border-white/10 text-slate-400'
              }`}
              title={voiceEnabled ? 'Mute speech feedback' : 'Enable speech feedback'}
            >
              {voiceEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>
          </div>

        </div>
      </header>

      {/* 2. MAIN CAMERA VIEWPORT WITH HUD OVERLAYS */}
      <main className="flex-1 relative flex items-center justify-center p-2 sm:p-4 overflow-hidden dark-surface">
        
        {/* Fullscreen Video Viewport */}
        <div className="relative w-full max-w-5xl aspect-[4/3] sm:aspect-video rounded-3xl overflow-hidden bg-black/75 border border-white/25 shadow-2xl flex items-center justify-center backdrop-blur-2xl">
          
          {/* Real-Time Distance & Framing Guidance Badge */}
          {mode === 'REAL' && (
            <div 
              className="absolute top-4 left-4 z-20 flex items-center gap-2 px-3 py-1.5 rounded-full backdrop-blur-md text-xs font-semibold border shadow-md transition-all"
              style={{
                backgroundColor: distanceStatus.status === 'optimal' ? 'rgba(16, 185, 129, 0.25)' : distanceStatus.status === 'close' ? 'rgba(245, 158, 11, 0.3)' : 'rgba(30, 41, 59, 0.8)',
                borderColor: distanceStatus.status === 'optimal' ? 'rgba(16, 185, 129, 0.5)' : distanceStatus.status === 'close' ? 'rgba(245, 158, 11, 0.6)' : 'rgba(71, 85, 105, 0.5)',
                color: distanceStatus.status === 'optimal' ? '#34d399' : distanceStatus.status === 'close' ? '#fbbf24' : '#cbd5e1'
              }}
            >
              <span className={`w-2 h-2 rounded-full ${distanceStatus.status === 'optimal' ? 'bg-emerald-400' : distanceStatus.status === 'close' ? 'bg-amber-400 animate-pulse' : 'bg-slate-400'}`} />
              <span>{distanceStatus.message}</span>
              <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-black/40 text-slate-300">
                {activeSide.toUpperCase()} LIMB
              </span>
            </div>
          )}

          {/* Hands-Free Countdown Overlay */}
          {countdown !== null && (
            <div className="absolute inset-0 bg-slate-950/75 backdrop-blur-xs flex flex-col items-center justify-center z-40 pointer-events-none">
              <span className="text-8xl font-black text-sky-400 animate-bounce font-mono drop-shadow-lg">{countdown}</span>
              <p className="text-sm font-bold text-slate-200 mt-4 tracking-wide uppercase">
                Step into position • Tracking {activeSide.toUpperCase()} side
              </p>
            </div>
          )}

          {/* Actual Camera Feed */}
          <video
            ref={videoRef}
            playsInline
            autoPlay
            muted
            className={`w-full h-full object-cover transform -scale-x-100 ${mode === 'SIMULATED' ? 'opacity-30' : 'opacity-90'}`}
          />

          {/* Computer Vision Pose Skeleton & Angle Canvas */}
          <PoseCanvas
            landmarks={landmarks}
            activeJointIndices={activeJointIndices}
            currentAngle={currentAngle}
            isGated={isGated}
            targetJointName={exerciseMeta.targetJoint}
            width={640}
            height={480}
          />

          {/* Confidence Gate Alert Banner (Appears when tracking confidence drops) */}
          <ConfidenceGateBanner
            isGated={isGated}
            confidenceScore={trackingConfidence}
            reason={gatedReason}
            missingLandmarks={missingLandmarks}
          />

          {/* Biomechanical Diagnostic HUD Overlay (Requirement 13) */}
          {debugMode && (
            <div className="absolute left-4 top-16 z-30 max-w-xs w-80 bg-slate-950/92 border border-amber-500/40 rounded-2xl p-3.5 shadow-2xl backdrop-blur-xl text-xs font-mono text-slate-200 pointer-events-auto">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800 mb-2">
                <div className="flex items-center gap-1.5 text-amber-400 font-bold tracking-wider uppercase text-[11px]">
                  <Activity className="w-3.5 h-3.5 animate-pulse" />
                  <span>Kinematic Engine</span>
                </div>
                <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${
                  debugTelemetry?.currentState === 'TARGET_ZONE' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                  debugTelemetry?.currentState === 'MOVING' ? 'bg-sky-500/20 text-sky-400 border border-sky-500/30' :
                  debugTelemetry?.currentState === 'RETURNING' ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30' :
                  debugTelemetry?.currentState === 'COOLDOWN' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
                  'bg-slate-800 text-slate-300 border border-slate-700'
                }`}>
                  {debugTelemetry?.currentState || 'READY'}
                </span>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-slate-400">Angle (Raw / Filtered):</span>
                  <span className="font-bold text-white">
                    {debugTelemetry?.rawAngle ?? Math.round(currentAngle)}° / <span className="text-sky-400 font-black">{debugTelemetry?.smoothedAngle ?? Math.round(currentAngle)}°</span>
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-slate-400">Angular Velocity:</span>
                  <span className={`font-bold ${
                    (debugTelemetry?.angularVelocity ?? 0) > 0 ? 'text-emerald-400' :
                    (debugTelemetry?.angularVelocity ?? 0) < 0 ? 'text-cyan-400' : 'text-slate-400'
                  }`}>
                    {(debugTelemetry?.angularVelocity ?? 0) > 0 ? '+' : ''}{debugTelemetry?.angularVelocity ?? 0}°/s
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-slate-400">Movement Direction:</span>
                  <span className={`font-bold ${
                    debugTelemetry?.motionState === 'FLEXING' ? 'text-emerald-300' :
                    debugTelemetry?.motionState === 'EXTENDING' ? 'text-purple-300' : 'text-slate-400'
                  }`}>
                    {debugTelemetry?.motionState || 'STATIONARY'}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-slate-400">Excursion / Min ROM:</span>
                  <span className="font-bold text-white">
                    {debugTelemetry?.excursionThisRep ?? 0}° / <span className="text-purple-300">{debugTelemetry?.minRomRequired ?? 28}° min</span>
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-slate-400">Pose Confidence:</span>
                  <span className={`font-bold ${trackingConfidence >= 0.75 ? 'text-emerald-400' : 'text-amber-400'}`}>
                    {Math.round(trackingConfidence * 100)}% {isGated ? '(PAUSED)' : '(ACTIVE)'}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-slate-400">Duration / Reps:</span>
                  <span className="font-bold text-white">
                    {((debugTelemetry?.repDurationMs ?? 0) / 1000).toFixed(1)}s • Reps: <span className="text-emerald-400">{completedReps}</span>
                  </span>
                </div>

                <div className="pt-2 border-t border-slate-800/80 mt-2">
                  <div className="text-[10px] text-slate-400 uppercase font-bold mb-0.5">Validation Audit Log:</div>
                  {debugTelemetry?.repAcceptedReason && (
                    <div className="text-[11px] text-emerald-400 font-medium bg-emerald-950/40 border border-emerald-500/30 rounded px-2 py-1 mb-1">
                      ✓ {debugTelemetry.repAcceptedReason}
                    </div>
                  )}
                  {debugTelemetry?.repRejectionReason && (
                    <div className="text-[11px] text-amber-300 font-medium bg-amber-950/40 border border-amber-500/30 rounded px-2 py-1">
                      ⚠ {debugTelemetry.repRejectionReason}
                    </div>
                  )}
                  {!debugTelemetry?.repAcceptedReason && !debugTelemetry?.repRejectionReason && (
                    <div className="text-[10px] text-slate-500 italic">
                      Tracking active • Awaiting validated movement cycle
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}


          {/* Compensation Warning Banner (Appears when compensatory movement is detected) */}
          <CompensationWarningBanner
            hasCompensation={hasCompensation && !isGated}
            compensationFlags={compensationFlags}
            reasons={compensationReasons}
            faultSide={faultSide}
          />

          {/* Floating HUD Side Panel (Desktop Overlay) */}
          <div className="absolute right-4 top-4 bottom-4 w-72 hidden md:flex flex-col justify-between pointer-events-auto z-30">
            <JointAngleGauge
              currentAngle={currentAngle}
              targetAngle={exerciseMeta.targetRom}
              minAngle={exerciseMeta.minRom}
              maxAngle={exerciseMeta.maxRom}
              isAngleDecreasingOnFlex={exerciseMeta.isAngleDecreasingOnFlex}
            />

            <RepProgressCard
              completedReps={completedReps}
              targetReps={exerciseMeta.targetReps}
              validReps={validReps}
              trackingConfidence={trackingConfidence}
              sessionTimeSeconds={elapsedSeconds}
              statusMessage={statusMessage}
              isGated={isGated}
              onFinishSession={() => handleFinishSession()}
            />
          </div>

        </div>

      </main>

      {/* 3. MOBILE BOTTOM HUD */}
      <footer className="md:hidden glass-card-dark dark-hud border-t border-white/10 p-4 space-y-3 z-30">
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="bg-white/10 p-2 rounded-xl border border-white/10">
            <p className="text-[10px] text-slate-400 font-semibold">REPS</p>
            <p className="text-xl font-bold font-mono text-white">{completedReps} / {exerciseMeta.targetReps}</p>
          </div>
          <div className="bg-white/10 p-2 rounded-xl border border-white/10">
            <p className="text-[10px] text-slate-400 font-semibold">CURRENT ROM</p>
            <p className="text-xl font-bold font-mono text-sky-400">{Math.round(currentAngle)}°</p>
          </div>
          <div className="bg-white/10 p-2 rounded-xl border border-white/10">
            <p className="text-[10px] text-slate-400 font-semibold">CONFIDENCE</p>
            <p className="text-xl font-bold font-mono text-emerald-400">{Math.round(trackingConfidence * 100)}%</p>
          </div>
        </div>

        <button
          onClick={() => handleFinishSession()}
          className="w-full py-3 rounded-xl bg-gradient-to-r from-sky-600 to-teal-600 font-bold text-sm text-white shadow-lg cursor-pointer"
        >
          Complete Session
        </button>
      </footer>

      {/* 4. SAFETY WARNING DISCLAIMER BANNER */}
      <div className="glass-card-dark dark-hud border-t border-white/10 px-4 py-2 text-center text-[11px] text-amber-300 flex items-center justify-center gap-2">
        <ShieldAlert className="w-3.5 h-3.5 text-amber-400 shrink-0" />
        <span>
          Stop immediately if you experience pain or discomfort and follow your clinician&apos;s guidance.
        </span>
      </div>

      {/* 5. SESSION COMPLETE PROGRESS REPORT MODAL */}
      {isSessionCompleted && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="glass-card-dark dark-hud rounded-3xl border border-white/20 max-w-lg w-full p-6 sm:p-8 space-y-5 shadow-2xl animate-scaleUp">
            
            <div className="text-center space-y-2">
              <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto border border-emerald-500/30 shadow-lg shadow-emerald-500/10">
                <Award className="w-8 h-8" />
              </div>
              <h2 className="text-2xl font-black text-white tracking-tight">Session Complete!</h2>
              <p className="text-xs text-slate-300">
                Progress report for <span className="font-semibold text-white">{exerciseMeta.name}</span>
              </p>
              {savingSession ? (
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-950/60 border border-sky-800 text-[11px] text-sky-400 font-semibold animate-pulse">
                  <span>Saving progress to clinical chart...</span>
                </div>
              ) : (
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-950/60 border border-emerald-800 text-[11px] text-emerald-400 font-semibold">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Progress recorded & saved successfully</span>
                </div>
              )}
            </div>

            {/* Performance Breakdown Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
              <div className="bg-slate-800/60 p-3 rounded-2xl border border-slate-700/50">
                <p className="text-[10px] text-slate-400 font-semibold">TARGET</p>
                <p className="text-lg font-bold font-mono text-white">
                  {sessionSummary?.target_reps ?? exerciseMeta.targetReps} reps
                </p>
              </div>
              <div className="bg-slate-800/60 p-3 rounded-2xl border border-slate-700/50">
                <p className="text-[10px] text-slate-400 font-semibold">COMPLETED</p>
                <p className="text-lg font-bold font-mono text-sky-400">
                  {sessionSummary?.completed_reps ?? completedReps} reps
                </p>
              </div>
              <div className="bg-slate-800/60 p-3 rounded-2xl border border-slate-700/50">
                <p className="text-[10px] text-slate-400 font-semibold">VALID REPS</p>
                <p className="text-lg font-bold font-mono text-emerald-400">
                  {sessionSummary?.valid_reps ?? validReps} reps
                </p>
              </div>
              <div className="bg-slate-800/60 p-3 rounded-2xl border border-slate-700/50">
                <p className="text-[10px] text-slate-400 font-semibold">PEAK ROM</p>
                <p className="text-lg font-bold font-mono text-sky-400">
                  {sessionSummary?.max_rom ?? Math.round(currentAngle)}°
                </p>
              </div>
            </div>

            {/* Quality Breakdown Bars */}
            <div className="space-y-3 bg-slate-800/40 p-4 rounded-2xl border border-slate-700/40 text-xs">
              <div>
                <div className="flex justify-between text-slate-300 font-semibold mb-1">
                  <span>Range Adherence</span>
                  <span className="font-mono">
                    {sessionSummary?.adherencePct ?? Math.min(100, Math.round(((sessionSummary?.average_rom ?? currentAngle) / exerciseMeta.targetRom) * 100))}%
                  </span>
                </div>
                <div className="w-full h-2 bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                    style={{ width: `${sessionSummary?.adherencePct ?? Math.min(100, Math.round(((sessionSummary?.average_rom ?? currentAngle) / exerciseMeta.targetRom) * 100))}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-slate-300 font-semibold mb-1">
                  <span>Repetition Completion</span>
                  <span className="font-mono">
                    {sessionSummary?.repCompletionPct ?? Math.min(100, Math.round((completedReps / exerciseMeta.targetReps) * 100))}%
                  </span>
                </div>
                <div className="w-full h-2 bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-sky-500 rounded-full transition-all duration-500"
                    style={{ width: `${sessionSummary?.repCompletionPct ?? Math.min(100, Math.round((completedReps / exerciseMeta.targetReps) * 100))}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-slate-300 font-semibold mb-1">
                  <span>Tracking Quality</span>
                  <span className="font-mono">
                    {Math.round((sessionSummary?.tracking_confidence ?? trackingConfidence) * 100)}%
                  </span>
                </div>
                <div className="w-full h-2 bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-teal-500 rounded-full transition-all duration-500"
                    style={{ width: `${Math.round((sessionSummary?.tracking_confidence ?? trackingConfidence) * 100)}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Clinical Post-Session Pain Assessment (VAS 0-10) */}
            <div className="bg-slate-800/60 p-3.5 rounded-2xl border border-slate-700/60 space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-slate-200">
                <span className="uppercase tracking-wider text-[11px] text-slate-400">Joint Pain Rating (VAS Scale)</span>
                <span className="font-mono text-sky-400">
                  {painScore === 0 ? '0 / 10 (No Pain)' : `${painScore} / 10`}
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Did you experience any discomfort or pain during this routine?
              </p>
              <div className="grid grid-cols-4 gap-1.5 pt-1">
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
                    className={`py-1.5 px-2 rounded-xl text-xs font-semibold transition-all border cursor-pointer ${
                      painScore === b.val
                        ? 'bg-sky-600 border-sky-400 text-white shadow-xs'
                        : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    {b.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="p-3 bg-slate-800/60 rounded-xl text-[11px] text-slate-400 leading-relaxed">
              Performance metrics have been safely stored for clinical review. This summary reflects configured exercise rules and is not a medical recovery diagnosis.
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row items-center gap-2.5">
              <button
                type="button"
                onClick={() => router.push('/patient/progress')}
                className="w-full sm:flex-1 py-3 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs shadow-md transition-all cursor-pointer text-center"
              >
                View Progress Trends
              </button>
              <button
                type="button"
                onClick={handleRestartSession}
                className="w-full sm:flex-1 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs border border-white/10 transition-all cursor-pointer flex items-center justify-center gap-1.5 text-center"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Practice Again</span>
              </button>
              <button
                type="button"
                onClick={() => router.push('/patient/dashboard')}
                className="w-full sm:flex-1 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 font-bold text-xs border border-white/10 transition-all cursor-pointer text-center"
              >
                Dashboard
              </button>
            </div>

          </div>
        </div>
      )}

      </div>
    </ProtectedRoute>
  );
}
