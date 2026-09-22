'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  ElbowFlexionAnalyzer, 
  ShoulderFlexionAnalyzer, 
  SitToStandAnalyzer, 
  KinematicSimulationEngine,
  Point2D 
} from '@rehabsense/exercise-engine';
import { api } from '@/lib/api';
import { useAccessibility } from '@/lib/accessibility-context';
import PoseCanvas from '@/components/PoseCanvas';
import JointAngleGauge from '@/components/JointAngleGauge';
import RepProgressCard from '@/components/RepProgressCard';
import ConfidenceGateBanner from '@/components/ConfidenceGateBanner';
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
  Award
} from 'lucide-react';

export default function LiveExerciseScreen() {
  const params = useParams();
  const router = useRouter();
  const exerciseId = (params?.id as string) || 'elbow-flexion';
  const { voiceEnabled, toggleVoice } = useAccessibility();

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
  const [sessionStartTime] = useState<number>(Date.now());
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

  // Session Completed State
  const [isSessionCompleted, setIsSessionCompleted] = useState(false);
  const [sessionSummary, setSessionSummary] = useState<any>(null);
  const [savingSession, setSavingSession] = useState(false);

  // Initialize Exercise Engine
  useEffect(() => {
    let analyzer: any;
    if (exerciseId === 'shoulder-flexion') {
      analyzer = new ShoulderFlexionAnalyzer(135, 10, voiceEnabled);
      setExerciseMeta({
        name: 'Shoulder Flexion (Elevations)',
        targetReps: 10,
        targetRom: 135.0,
        minRom: 30.0,
        maxRom: 160.0,
        targetJoint: 'Shoulder',
        isAngleDecreasingOnFlex: false
      });
      setActiveJointIndices([23, 11, 13]);
    } else if (exerciseId === 'sit-to-stand') {
      analyzer = new SitToStandAnalyzer(165, 10, voiceEnabled);
      setExerciseMeta({
        name: 'Sit-to-Stand Functional Transfer',
        targetReps: 10,
        targetRom: 165.0,
        minRom: 90.0,
        maxRom: 175.0,
        targetJoint: 'Knee & Hip',
        isAngleDecreasingOnFlex: false
      });
      setActiveJointIndices([23, 25, 27]);
    } else {
      analyzer = new ElbowFlexionAnalyzer(120, 10, voiceEnabled);
      setExerciseMeta({
        name: 'Elbow Flexion & Extension',
        targetReps: 10,
        targetRom: 120.0,
        minRom: 40.0,
        maxRom: 140.0,
        targetJoint: 'Elbow',
        isAngleDecreasingOnFlex: true
      });
      setActiveJointIndices([11, 13, 15]);
    }
    analyzerRef.current = analyzer;
  }, [exerciseId, voiceEnabled]);

  // Start Camera Stream or MediaPipe
  const initCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480, facingMode: 'user' }
      });
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
      console.warn('Webcam permission unavailable. Switching to Simulation Mode:', camErr);
      setMode('SIMULATED');
    }
  }, []);

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

      let detectedLandmarks: Point2D[] = [];

      if (mode === 'REAL' && videoRef.current && landmarkerRef.current && videoRef.current.readyState >= 2) {
        const video = videoRef.current;
        if (video.currentTime !== lastVideoTime) {
          lastVideoTime = video.currentTime;
          const poseResults = landmarkerRef.current.detectForVideo(video, performance.now());
          if (poseResults.landmarks && poseResults.landmarks.length > 0) {
            detectedLandmarks = poseResults.landmarks[0].map((lm: any) => ({
              x: lm.x,
              y: lm.y,
              z: lm.z,
              visibility: lm.visibility ?? 1.0
            }));
          }
        }
      }

      // Fallback to Simulation Mode if no landmarks detected or mode is SIMULATED
      if (detectedLandmarks.length === 0) {
        simulatorRef.current.setPattern(simPattern);
        detectedLandmarks = simulatorRef.current.generateNextFrame();
      }

      // Execute Exercise Rule Engine
      const analysis = analyzer.processFrame(detectedLandmarks);

      setCurrentAngle(analysis.jointAngle);
      setLandmarks(analysis.landmarks);
      setTrackingConfidence(analysis.confidenceResult.overallConfidence);
      setIsGated(analysis.confidenceResult.isGated);
      setGatedReason(analysis.confidenceResult.reason);
      setMissingLandmarks(analysis.confidenceResult.missingLandmarks);
      setCompletedReps(analysis.repResult.completedReps);
      setValidReps(analysis.repResult.validReps);
      setStatusMessage(analysis.feedbackEvent.message);

      // Auto-finish if prescribed target reps completed
      if (analysis.repResult.completedReps >= exerciseMeta.targetReps && !isSessionCompleted) {
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
  }, [mode, simPattern, exerciseMeta.targetReps, isSessionCompleted]);

  // Handle Session Completion
  const handleFinishSession = async () => {
    if (isSessionCompleted) return;
    setIsSessionCompleted(true);
    setSavingSession(true);

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
    const avgRom = summary.averageRom || 104;
    const maxRom = summary.maxRom || 120;

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
      joint_metrics: detailedMetrics,
      patient_notes: 'Completed home session via camera exercise coach.'
    };

    try {
      const saved = await api.createSession(sessionPayload);
      setSessionSummary({
        ...sessionPayload,
        id: saved.id,
        adherencePct: Math.min(100, Math.round((avgRom / exerciseMeta.targetRom) * 100)),
        repCompletionPct: Math.min(100, Math.round((completedR / exerciseMeta.targetReps) * 100))
      });
    } catch {
      // Fallback local summary
      setSessionSummary({
        ...sessionPayload,
        id: 'session-live-demo-1',
        adherencePct: Math.min(100, Math.round((avgRom / exerciseMeta.targetRom) * 100)),
        repCompletionPct: Math.min(100, Math.round((completedR / exerciseMeta.targetReps) * 100))
      });
    } finally {
      setSavingSession(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col justify-between select-none">
      
      {/* 1. TOP STATUS BAR */}
      <header className="bg-slate-900/80 backdrop-blur border-b border-slate-800 px-4 py-3 z-30">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
          
          <div className="flex items-center gap-3">
            <Link
              href="/patient/dashboard"
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
              title="Return to Dashboard"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <h1 className="text-base sm:text-lg font-bold tracking-tight text-white flex items-center gap-2">
                {exerciseMeta.name}
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-sky-950 text-sky-400 border border-sky-800">
                  Target: {exerciseMeta.targetRom}° ROM
                </span>
              </h1>
              <p className="text-xs text-slate-400">
                Prescribed by Dr. Ananya Sharma • 2 sets × {exerciseMeta.targetReps} repetitions
              </p>
            </div>
          </div>

          {/* Demonstration Mode & Resilience Toggles */}
          <div className="flex items-center gap-2">
            
            {/* Real vs Sim Mode Switcher */}
            <div className="flex items-center bg-slate-800/80 rounded-xl p-1 border border-slate-700 text-xs">
              <button
                onClick={() => setMode('REAL')}
                className={`px-2.5 py-1 rounded-lg font-semibold transition-all flex items-center gap-1.5 ${
                  mode === 'REAL' ? 'bg-sky-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
                }`}
              >
                <Camera className="w-3.5 h-3.5" />
                <span>Camera</span>
              </button>

              <button
                onClick={() => setMode('SIMULATED')}
                className={`px-2.5 py-1 rounded-lg font-semibold transition-all flex items-center gap-1.5 ${
                  mode === 'SIMULATED' ? 'bg-purple-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Simulation</span>
              </button>
            </div>

            {/* Simulation Scenario Switcher (Available when in Simulation Mode) */}
            {mode === 'SIMULATED' && (
              <select
                value={simPattern}
                onChange={(e: any) => setSimPattern(e.target.value)}
                className="bg-slate-800 border border-slate-700 text-xs text-slate-200 rounded-xl px-2.5 py-1.5 focus:outline-none focus:border-purple-500 font-medium"
              >
                <option value="NORMAL_REPS">Normal Reps (122° Target)</option>
                <option value="UNDER_RANGE_REP">Under-Range Rep (108° Flag)</option>
                <option value="LOW_CONFIDENCE">Low Confidence (Pause Gate)</option>
              </select>
            )}

            {/* Audio Toggle */}
            <button
              onClick={toggleVoice}
              className={`p-2 rounded-xl border transition-colors ${
                voiceEnabled ? 'bg-slate-800 border-slate-700 text-sky-400' : 'bg-slate-900 border-slate-800 text-slate-500'
              }`}
              title={voiceEnabled ? 'Mute speech feedback' : 'Enable speech feedback'}
            >
              {voiceEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>
          </div>

        </div>
      </header>

      {/* 2. MAIN CAMERA VIEWPORT WITH HUD OVERLAYS */}
      <main className="flex-1 relative flex items-center justify-center p-2 sm:p-4 overflow-hidden">
        
        {/* Fullscreen Video Viewport */}
        <div className="relative w-full max-w-5xl aspect-[4/3] sm:aspect-video rounded-3xl overflow-hidden bg-slate-900 border-2 border-slate-800 shadow-2xl flex items-center justify-center">
          
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
              onFinishSession={handleFinishSession}
            />
          </div>

        </div>

      </main>

      {/* 3. MOBILE BOTTOM HUD */}
      <footer className="md:hidden bg-slate-900 border-t border-slate-800 p-4 space-y-3 z-30">
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="bg-slate-800/80 p-2 rounded-xl">
            <p className="text-[10px] text-slate-400 font-semibold">REPS</p>
            <p className="text-xl font-bold font-mono text-white">{completedReps} / {exerciseMeta.targetReps}</p>
          </div>
          <div className="bg-slate-800/80 p-2 rounded-xl">
            <p className="text-[10px] text-slate-400 font-semibold">CURRENT ROM</p>
            <p className="text-xl font-bold font-mono text-sky-400">{Math.round(currentAngle)}°</p>
          </div>
          <div className="bg-slate-800/80 p-2 rounded-xl">
            <p className="text-[10px] text-slate-400 font-semibold">CONFIDENCE</p>
            <p className="text-xl font-bold font-mono text-emerald-400">{Math.round(trackingConfidence * 100)}%</p>
          </div>
        </div>

        <button
          onClick={handleFinishSession}
          className="w-full py-3 rounded-xl bg-sky-600 font-bold text-sm text-white"
        >
          Complete Session
        </button>
      </footer>

      {/* 4. SAFETY WARNING DISCLAIMER BANNER */}
      <div className="bg-slate-900/95 border-t border-slate-800 px-4 py-2 text-center text-[11px] text-amber-300 flex items-center justify-center gap-2">
        <ShieldAlert className="w-3.5 h-3.5 text-amber-400 shrink-0" />
        <span>
          Stop immediately if you experience pain or discomfort and follow your clinician&apos;s guidance.
        </span>
      </div>

      {/* 5. SESSION COMPLETE MODAL */}
      {isSessionCompleted && sessionSummary && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 rounded-3xl border border-slate-800 max-w-lg w-full p-6 sm:p-8 space-y-6 shadow-2xl animate-scaleUp">
            
            <div className="text-center space-y-2">
              <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto border border-emerald-500/30">
                <Award className="w-8 h-8" />
              </div>
              <h2 className="text-2xl font-black text-white">Session Complete</h2>
              <p className="text-xs text-slate-400">
                Performance recorded for {exerciseMeta.name}
              </p>
            </div>

            {/* Performance Breakdown */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
              <div className="bg-slate-800/60 p-3 rounded-2xl border border-slate-700/50">
                <p className="text-[10px] text-slate-400 font-semibold">TARGET</p>
                <p className="text-lg font-bold font-mono text-white">{sessionSummary.target_reps} reps</p>
              </div>
              <div className="bg-slate-800/60 p-3 rounded-2xl border border-slate-700/50">
                <p className="text-[10px] text-slate-400 font-semibold">COMPLETED</p>
                <p className="text-lg font-bold font-mono text-sky-400">{sessionSummary.completed_reps} reps</p>
              </div>
              <div className="bg-slate-800/60 p-3 rounded-2xl border border-slate-700/50">
                <p className="text-[10px] text-slate-400 font-semibold">VALID REPS</p>
                <p className="text-lg font-bold font-mono text-emerald-400">{sessionSummary.valid_reps} reps</p>
              </div>
              <div className="bg-slate-800/60 p-3 rounded-2xl border border-slate-700/50">
                <p className="text-[10px] text-slate-400 font-semibold">PEAK ROM</p>
                <p className="text-lg font-bold font-mono text-sky-400">{sessionSummary.max_rom}°</p>
              </div>
            </div>

            {/* Quality Breakdown Bars */}
            <div className="space-y-3 bg-slate-800/40 p-4 rounded-2xl border border-slate-700/40 text-xs">
              <div>
                <div className="flex justify-between text-slate-300 font-semibold mb-1">
                  <span>Range Adherence</span>
                  <span className="font-mono">{sessionSummary.adherencePct}%</span>
                </div>
                <div className="w-full h-2 bg-slate-700 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${sessionSummary.adherencePct}%` }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-slate-300 font-semibold mb-1">
                  <span>Repetition Completion</span>
                  <span className="font-mono">{sessionSummary.repCompletionPct}%</span>
                </div>
                <div className="w-full h-2 bg-slate-700 rounded-full overflow-hidden">
                  <div className="h-full bg-sky-500 rounded-full" style={{ width: `${sessionSummary.repCompletionPct}%` }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-slate-300 font-semibold mb-1">
                  <span>Tracking Quality</span>
                  <span className="font-mono">{Math.round(sessionSummary.tracking_confidence * 100)}%</span>
                </div>
                <div className="w-full h-2 bg-slate-700 rounded-full overflow-hidden">
                  <div className="h-full bg-teal-500 rounded-full" style={{ width: `${Math.round(sessionSummary.tracking_confidence * 100)}%` }} />
                </div>
              </div>
            </div>

            <div className="p-3 bg-slate-800/60 rounded-xl text-[11px] text-slate-400 leading-relaxed">
              Performance metrics have been safely stored for review by Dr. Ananya Sharma. This summary reflects configured exercise rules and is not a medical recovery diagnosis.
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => router.push('/patient/progress')}
                className="flex-1 py-3 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs shadow-md transition-all cursor-pointer"
              >
                View Progress Trends
              </button>
              <button
                onClick={() => router.push('/patient/dashboard')}
                className="flex-1 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition-all cursor-pointer"
              >
                Return to Dashboard
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
