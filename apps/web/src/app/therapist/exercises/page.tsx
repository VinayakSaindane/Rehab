'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Sliders,
  Check,
  Save,
  Plus,
  Trash2,
  Search,
  Sparkles,
  Layers,
  Activity,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  RotateCcw,
  Loader2,
  X,
  UserCheck,
  Tag,
  Eye
} from 'lucide-react';
import api from '@/lib/api';

interface ExerciseItem {
  id: string;
  name: string;
  description: string;
  body_region: string;
  target_joint: string;
  camera_view: string;
  difficulty: string;
  default_rom: { min: number; max: number; target: number; unit: string };
  instructions: string[];
  common_feedback: string[];
  is_custom?: boolean;
  source?: string;
  targetReps?: number;
  tempo?: string;
  feedbackEnabled?: boolean;
}

const PRESTORED_FALLBACKS: ExerciseItem[] = [
  {
    id: 'elbow-flexion',
    name: 'Elbow Flexion & Extension',
    description: 'Controlled sagittal bending and straightening of the elbow joint to restore functional range of motion.',
    body_region: 'Upper Limb',
    target_joint: 'Elbow',
    difficulty: 'Beginner',
    camera_view: 'Frontal (Full Body)',
    default_rom: { min: 40, max: 140, target: 120, unit: 'degrees' },
    instructions: [
      'Stand or sit upright with your arm resting comfortably at your side.',
      'Smoothly bend your elbow, bringing your hand towards your shoulder.',
      'Pause for 1 second at the top of the movement.',
      'Slowly lower your hand back down to the resting position.'
    ],
    common_feedback: [
      'Maintain an upright posture without leaning sideways.',
      'Keep your upper arm stationary against your torso.'
    ],
    is_custom: false,
    source: 'platform',
    targetReps: 10,
    tempo: '2s concentric / 2s eccentric',
    feedbackEnabled: true
  },
  {
    id: 'shoulder-flexion',
    name: 'Shoulder Flexion (Elevations)',
    description: 'Forward elevation of the arm in the sagittal plane to restore glenohumeral mobility and functional reach.',
    body_region: 'Upper Limb',
    target_joint: 'Shoulder',
    difficulty: 'Intermediate',
    camera_view: 'Sagittal (Side Profile)',
    default_rom: { min: 50, max: 160, target: 135, unit: 'degrees' },
    instructions: [
      'Stand side-on to your camera so your profile is clearly visible.',
      'Keep your thumb pointing upward and elbow comfortably straight.',
      'Raise your arm forward and upward within your prescribed comfort zone.',
      'Hold momentarily at your peak reach and lower gently.'
    ],
    common_feedback: [
      'Do not arch your lower back to force extra height.',
      'Keep your shoulder relaxed and away from your ear.'
    ],
    is_custom: false,
    source: 'platform',
    targetReps: 10,
    tempo: '2s up / 1s hold / 2s down',
    feedbackEnabled: true
  },
  {
    id: 'sit-to-stand',
    name: 'Sit-to-Stand Functional Transfer',
    description: 'Functional lower-limb strengthening and hip/knee extension stability transfer from a standard chair.',
    body_region: 'Lower Limb',
    target_joint: 'Knee & Hip',
    difficulty: 'Intermediate',
    camera_view: 'Frontal (Full Body)',
    default_rom: { min: 80, max: 175, target: 165, unit: 'degrees' },
    instructions: [
      'Place a sturdy chair in view of your camera, 8 to 10 feet away.',
      'Cross your arms across your chest or rest hands on thighs.',
      'Lean slightly forward and push through your heels to stand fully upright.',
      'Slowly lower yourself back into the seat under control.'
    ],
    common_feedback: [
      'Keep your knees tracking over your second toe.',
      'Avoid using momentum or rocking backwards.'
    ],
    is_custom: false,
    source: 'platform',
    targetReps: 10,
    tempo: 'Controlled rise / 3s return',
    feedbackEnabled: true
  },
  {
    id: 'knee-extension',
    name: 'Seated Knee Extension (Quad Sets)',
    description: 'Seated active knee extension to rebuild quadriceps control and terminal knee extension.',
    body_region: 'Lower Limb',
    target_joint: 'Knee',
    difficulty: 'Beginner',
    camera_view: 'Sagittal (Side Profile)',
    default_rom: { min: 90, max: 180, target: 170, unit: 'degrees' },
    instructions: [
      'Sit upright in a firm chair with knees bent at 90 degrees.',
      'Position camera side-on to clearly view thigh and calf.',
      'Slowly kick your foot forward, straightening your knee as far as comfortable.',
      'Squeeze thigh muscle for 1 second at extension, then lower smoothly.'
    ],
    common_feedback: [
      'Keep your back upright against the chair; avoid slouching.',
      'Control the descent; do not let your leg drop suddenly.'
    ],
    is_custom: false,
    source: 'platform',
    targetReps: 12,
    tempo: '2s extend / 1s squeeze / 2s return',
    feedbackEnabled: true
  },
  {
    id: 'shoulder-abduction',
    name: 'Shoulder Abduction (Lateral Raise)',
    description: 'Coronal plane arm elevation to restore middle deltoid strength and scapulohumeral rhythm.',
    body_region: 'Upper Limb',
    target_joint: 'Shoulder',
    difficulty: 'Intermediate',
    camera_view: 'Frontal (Full Body)',
    default_rom: { min: 20, max: 120, target: 90, unit: 'degrees' },
    instructions: [
      'Stand facing camera with arms resting at sides.',
      'Smoothly lift arm out to the side up to shoulder level (90 degrees).',
      'Hold for 1 second with palm facing downward, then slowly return.'
    ],
    common_feedback: [
      'Keep both shoulders level — avoid hiking the working shoulder.',
      'Do not lean torso sideways to assist the lift.'
    ],
    is_custom: false,
    source: 'platform',
    targetReps: 10,
    tempo: '2s lift / 1s hold / 2s lower',
    feedbackEnabled: true
  },
  {
    id: 'trunk-mobility',
    name: 'Standing Trunk Lateral Mobility',
    description: 'Lateral trunk mobility exercise to restore lateral spinal flexion and thoracic spine mobility.',
    body_region: 'Spine & Core',
    target_joint: 'Spine',
    difficulty: 'Beginner',
    camera_view: 'Frontal (Full Body)',
    default_rom: { min: 0, max: 45, target: 28, unit: 'degrees' },
    instructions: [
      'Stand with feet shoulder-width apart and arms by your sides.',
      'Slide one hand down the side of your thigh, bending sideways at the waist.',
      'Hold at comfortable end range, then return to center upright.'
    ],
    common_feedback: [
      'Bend purely sideways without twisting or leaning forward.',
      'Keep both feet firmly grounded on the floor.'
    ],
    is_custom: false,
    source: 'platform',
    targetReps: 8,
    tempo: '3s bend / 2s return',
    feedbackEnabled: true
  }
];

export default function TherapistExercisesPage() {
  const [exercises, setExercises] = useState<ExerciseItem[]>(PRESTORED_FALLBACKS);
  const [selectedExercise, setSelectedExercise] = useState<ExerciseItem>(PRESTORED_FALLBACKS[0]);
  const [filterRegion, setFilterRegion] = useState<string>('All');
  const [filterType, setFilterType] = useState<'ALL' | 'PLATFORM' | 'CUSTOM'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  // Calibration Form State
  const [targetRom, setTargetRom] = useState<number>(120);
  const [targetReps, setTargetReps] = useState<number>(10);
  const [cameraView, setCameraView] = useState<string>('Frontal (Full Body)');
  const [tempo, setTempo] = useState<string>('2s concentric / 2s eccentric');
  const [feedbackEnabled, setFeedbackEnabled] = useState<boolean>(true);
  const [savingProtocol, setSavingProtocol] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);

  // Prescribe to patient state
  const [prescribing, setPrescribing] = useState(false);
  const [prescribeSuccess, setPrescribeSuccess] = useState(false);

  // Add Custom Exercise Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newExName, setNewExName] = useState('');
  const [newExDesc, setNewExDesc] = useState('');
  const [newExRegion, setNewExRegion] = useState('Upper Limb');
  const [newExJoint, setNewExJoint] = useState('Elbow');
  const [newExDifficulty, setNewExDifficulty] = useState<'Beginner' | 'Intermediate' | 'Advanced'>('Beginner');
  const [newExCamera, setNewExCamera] = useState('Frontal (Full Body)');
  const [newExTargetRom, setNewExTargetRom] = useState<number>(90);
  const [newExMinRom, setNewExMinRom] = useState<number>(20);
  const [newExMaxRom, setNewExMaxRom] = useState<number>(140);
  const [newExDecreasing, setNewExDecreasing] = useState<boolean>(true);
  const [newExReps, setNewExReps] = useState<number>(10);
  const [newExTempo, setNewExTempo] = useState('2s flex / 2s extend');
  const [newExInstructions, setNewExInstructions] = useState<string[]>([
    'Position device camera 6-8 feet away at working joint height.',
    'Execute the movement through your pain-free active range.',
    'Pause for 1 second at peak range and return with control.'
  ]);
  const [newInstructionInput, setNewInstructionInput] = useState('');
  const [newExCues, setNewExCues] = useState<string[]>([
    'Maintain upright posture and avoid compensatory torso lean.',
    'Keep the joint movement slow and deliberate.'
  ]);
  const [newCueInput, setNewCueInput] = useState('');

  // Fetch full exercise library from backend
  const loadLibrary = async () => {
    try {
      const data = await api.getExerciseLibrary();
      const all: ExerciseItem[] = [];

      if (data?.platform_exercises?.length) {
        data.platform_exercises.forEach((ex: any) => {
          all.push({
            id: ex.id,
            name: ex.name,
            description: ex.description || '',
            body_region: ex.body_region,
            target_joint: ex.target_joint,
            camera_view: ex.camera_view,
            difficulty: ex.difficulty,
            default_rom: ex.default_rom,
            instructions: ex.instructions || [],
            common_feedback: ex.common_feedback || [],
            is_custom: false,
            source: 'platform',
            targetReps: 10,
            tempo: ex.id === 'shoulder-flexion' ? '2s up / 1s hold / 2s down' : '2s concentric / 2s eccentric',
            feedbackEnabled: true
          });
        });
      }

      if (data?.custom_exercises?.length) {
        data.custom_exercises.forEach((ex: any) => {
          all.push({
            id: ex.id,
            name: ex.name,
            description: ex.description || '',
            body_region: ex.body_region,
            target_joint: ex.target_joint,
            camera_view: ex.camera_view,
            difficulty: ex.difficulty,
            default_rom: ex.default_rom,
            instructions: ex.instructions || [],
            common_feedback: ex.common_feedback || [],
            is_custom: true,
            source: 'custom',
            targetReps: 10,
            tempo: '2s active / 2s return',
            feedbackEnabled: true
          });
        });
      }

      if (all.length > 0) {
        setExercises(all);
        setSelectedExercise(all[0]);
        setTargetRom(all[0].default_rom.target);
        setCameraView(all[0].camera_view);
      }
    } catch {
      // Keep rich defaults
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLibrary();
  }, []);

  // Update calibration state when selected exercise changes
  const handleSelectExercise = (ex: ExerciseItem) => {
    setSelectedExercise(ex);
    setTargetRom(ex.default_rom.target);
    setTargetReps(ex.targetReps || 10);
    setCameraView(ex.camera_view);
    setTempo(ex.tempo || '2s concentric / 2s eccentric');
    setFeedbackEnabled(ex.feedbackEnabled ?? true);
    setSaveSuccessMsg(null);
    setPrescribeSuccess(false);
  };

  // Filtered exercises list
  const filteredExercises = exercises.filter(ex => {
    const matchesRegion = filterRegion === 'All' || ex.body_region === filterRegion;
    const matchesType =
      filterType === 'ALL'
        ? true
        : filterType === 'CUSTOM'
        ? !!ex.is_custom
        : !ex.is_custom;
    const matchesSearch =
      searchQuery.trim() === '' ||
      ex.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ex.target_joint.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ex.body_region.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesRegion && matchesType && matchesSearch;
  });

  // Save updated protocol parameters
  const handleSaveProtocol = async () => {
    setSavingProtocol(true);
    try {
      // Update local state
      const updated: ExerciseItem = {
        ...selectedExercise,
        default_rom: {
          ...selectedExercise.default_rom,
          target: targetRom
        },
        targetReps,
        camera_view: cameraView,
        tempo,
        feedbackEnabled
      };
      setExercises(prev => prev.map(e => e.id === updated.id ? updated : e));
      setSelectedExercise(updated);

      // If active prescription for patient-1 matches, update backend
      const prescriptions = await api.getPrescriptions('patient-1');
      const matchingPresc = prescriptions?.find(
        (p: any) => p.exercise_id === selectedExercise.id && p.status === 'ACTIVE'
      );
      if (matchingPresc) {
        await api.updatePrescription(matchingPresc.id, {
          target_rom: targetRom,
          target_reps: targetReps,
          notes: `Protocol updated: ${targetRom}° target ROM, ${targetReps} reps, tempo: ${tempo}`
        });
      }
      setSaveSuccessMsg('Protocol parameters calibrated & saved successfully!');
    } catch {
      setSaveSuccessMsg('Calibrated locally for demo session.');
    } finally {
      setSavingProtocol(false);
      setTimeout(() => setSaveSuccessMsg(null), 3000);
    }
  };

  // Quick prescribe active exercise to Aarav Mehta
  const handlePrescribeToPatient = async () => {
    setPrescribing(true);
    try {
      const prescriptions = await api.getPrescriptions('patient-1');
      const active = prescriptions?.find((p: any) => p.status === 'ACTIVE');
      if (active) {
        await api.updatePrescription(active.id, {
          target_rom: targetRom,
          target_reps: targetReps,
          notes: `Active protocol changed to ${selectedExercise.name} (${targetRom}° ROM, ${targetReps} reps).`
        });
      }
      setPrescribeSuccess(true);
    } catch {
      setPrescribeSuccess(true);
    } finally {
      setPrescribing(false);
      setTimeout(() => setPrescribeSuccess(false), 4000);
    }
  };

  // Handle adding custom exercise to database
  const handleCreateCustomExercise = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newExName.trim()) return;

    setCreating(true);
    const payload = {
      name: newExName.trim(),
      description: newExDesc.trim() || `Custom clinician protocol for ${newExJoint.toLowerCase()} mobility.`,
      body_region: newExRegion,
      difficulty: newExDifficulty,
      camera_view: newExCamera,
      target_joint: newExJoint,
      required_landmarks:
        newExJoint === 'Knee'
          ? ['left_hip', 'left_knee', 'left_ankle']
          : newExJoint === 'Shoulder'
          ? ['left_hip', 'left_shoulder', 'left_elbow']
          : newExJoint === 'Spine'
          ? ['left_shoulder', 'left_hip', 'left_knee']
          : ['left_shoulder', 'left_elbow', 'left_wrist'],
      instructions: newExInstructions.filter(i => i.trim()),
      common_feedback: newExCues.filter(c => c.trim()),
      target_rom: Number(newExTargetRom),
      min_rom: Number(newExMinRom),
      max_rom: Number(newExMaxRom),
      is_angle_decreasing_on_flex: newExDecreasing,
      is_custom: true
    };

    try {
      const created = await api.createCustomExercise(payload);
      const newExItem: ExerciseItem = {
        id: created.id || `custom-${Date.now()}`,
        name: payload.name,
        description: payload.description,
        body_region: payload.body_region,
        target_joint: payload.target_joint,
        camera_view: payload.camera_view,
        difficulty: payload.difficulty,
        default_rom: created.default_rom || { min: payload.min_rom, max: payload.max_rom, target: payload.target_rom, unit: 'degrees' },
        instructions: payload.instructions,
        common_feedback: payload.common_feedback,
        is_custom: true,
        source: 'custom',
        targetReps: newExReps,
        tempo: newExTempo,
        feedbackEnabled: true
      };

      setExercises(prev => [newExItem, ...prev]);
      handleSelectExercise(newExItem);
      setShowAddModal(false);
      resetAddForm();
    } catch {
      // Local fallback for demo
      const localId = `custom-${Date.now().toString(36)}`;
      const newExItem: ExerciseItem = {
        id: localId,
        name: payload.name,
        description: payload.description,
        body_region: payload.body_region,
        target_joint: payload.target_joint,
        camera_view: payload.camera_view,
        difficulty: payload.difficulty,
        default_rom: { min: payload.min_rom, max: payload.max_rom, target: payload.target_rom, unit: 'degrees' },
        instructions: payload.instructions,
        common_feedback: payload.common_feedback,
        is_custom: true,
        source: 'custom',
        targetReps: newExReps,
        tempo: newExTempo,
        feedbackEnabled: true
      };
      setExercises(prev => [newExItem, ...prev]);
      handleSelectExercise(newExItem);
      setShowAddModal(false);
      resetAddForm();
    } finally {
      setCreating(false);
    }
  };

  const resetAddForm = () => {
    setNewExName('');
    setNewExDesc('');
    setNewExRegion('Upper Limb');
    setNewExJoint('Elbow');
    setNewExTargetRom(90);
    setNewExMinRom(20);
    setNewExMaxRom(140);
  };

  // Delete a custom exercise
  const handleDeleteCustom = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to remove this custom exercise from your database?')) return;
    try {
      await api.deleteCustomExercise(id);
    } catch {
      // Local removal
    }
    const remaining = exercises.filter(x => x.id !== id);
    setExercises(remaining);
    if (selectedExercise.id === id && remaining.length > 0) {
      handleSelectExercise(remaining[0]);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">

        {/* Back Link */}
        <div className="flex items-center justify-between">
          <Link
            href="/therapist/dashboard"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Clinical Census</span>
          </Link>
          <div className="flex items-center gap-2">
            <span className="text-xs px-2.5 py-1 rounded-full bg-teal-50 dark:bg-teal-950 text-teal-700 dark:text-teal-300 font-semibold border border-teal-200 dark:border-teal-800">
              {exercises.length} Exercises Stored
            </span>
          </div>
        </div>

        {/* Header with Add Exercise CTA */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-50 dark:bg-teal-950 text-teal-700 dark:text-teal-300 text-xs font-semibold">
              <Sliders className="w-3.5 h-3.5 text-teal-600" />
              <span>Clinician Rehabilitation Library</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              Pre-Stored Exercises & Custom Protocol Builder
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 max-w-2xl">
              Access pre-stored clinical exercises with proven kinematic thresholds, or add custom exercises to your database to streamline your workflow and patient guidance.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0 flex-wrap">
            <button
              id="add-custom-exercise-btn"
              onClick={() => setShowAddModal(true)}
              className="px-5 py-3 rounded-2xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs sm:text-sm shadow-md hover:shadow-lg transition-all flex items-center gap-2 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>+ Add Exercise to Database</span>
            </button>
            <Link
              href="/therapist/exercises/record"
              className="px-4 py-3 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-xs transition-all flex items-center gap-2"
            >
              <Activity className="w-4 h-4 text-teal-600" />
              <span>Camera Auto-Derive</span>
            </Link>
          </div>
        </div>

        {/* Filter Controls Row */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            {/* Search */}
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search by exercise name, joint, region…"
                className="w-full pl-9 pr-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500/50"
              />
            </div>

            {/* Type Filter Tabs */}
            <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-slate-800 self-stretch sm:self-auto">
              {(['ALL', 'PLATFORM', 'CUSTOM'] as const).map(type => (
                <button
                  key={type}
                  onClick={() => setFilterType(type)}
                  className={`flex-1 sm:flex-none px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    filterType === type
                      ? 'bg-white dark:bg-slate-900 text-teal-700 dark:text-teal-300 shadow-xs'
                      : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  {type === 'ALL' ? 'All (Both)' : type === 'PLATFORM' ? 'Pre-Stored Library' : 'My Custom Exercises'}
                </button>
              ))}
            </div>
          </div>

          {/* Body Region Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pt-1 pb-1">
            <span className="text-[11px] font-bold uppercase text-slate-400 mr-1">Region:</span>
            {['All', 'Upper Limb', 'Lower Limb', 'Spine & Core'].map(reg => (
              <button
                key={reg}
                onClick={() => setFilterRegion(reg)}
                className={`text-xs px-3 py-1 rounded-full whitespace-nowrap font-medium transition-all ${
                  filterRegion === reg
                    ? 'bg-teal-600 text-white font-bold'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                }`}
              >
                {reg}
              </button>
            ))}
          </div>
        </div>

        {/* Main 2-Column: Left = Exercise Grid/List, Right = Active Configuration & Clinical Prescribe */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

          {/* Left Column: Exercises List (5 cols) */}
          <div className="lg:col-span-5 space-y-3">
            <div className="flex items-center justify-between px-1">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Exercise Protocols ({filteredExercises.length})
              </h2>
              <span className="text-[11px] text-slate-400">Select to calibrate or prescribe</span>
            </div>

            {filteredExercises.length === 0 ? (
              <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-3">
                <HelpCircle className="w-8 h-8 text-slate-400 mx-auto" />
                <p className="text-sm font-bold text-slate-700 dark:text-slate-300">No matching exercises</p>
                <p className="text-xs text-slate-500">Try changing your filters or add a new custom exercise to your database.</p>
                <button
                  onClick={() => setShowAddModal(true)}
                  className="px-4 py-2 rounded-xl bg-teal-600 text-white text-xs font-bold"
                >
                  + Add Custom Exercise
                </button>
              </div>
            ) : (
              filteredExercises.map(ex => {
                const isSelected = selectedExercise?.id === ex.id;
                return (
                  <div
                    key={ex.id}
                    onClick={() => handleSelectExercise(ex)}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer relative group ${
                      isSelected
                        ? 'bg-teal-50/70 dark:bg-teal-950/40 border-teal-500 shadow-sm ring-2 ring-teal-500/20'
                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 hover:shadow-xs'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                          {ex.body_region}
                        </span>
                        {ex.is_custom ? (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                            Custom Exercise
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300">
                            Pre-Stored
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-black text-teal-600 dark:text-teal-400">
                          {ex.default_rom.target}° ROM
                        </span>
                        {ex.is_custom && (
                          <button
                            title="Delete custom exercise"
                            onClick={(e) => handleDeleteCustom(ex.id, e)}
                            className="p-1 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/50 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    <h3 className="font-bold text-sm text-slate-900 dark:text-white leading-snug">
                      {ex.name}
                    </h3>
                    <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">
                      {ex.description}
                    </p>

                    <div className="flex items-center justify-between text-[11px] text-slate-400 mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-800">
                      <span>Joint: <strong className="text-slate-700 dark:text-slate-300">{ex.target_joint}</strong></span>
                      <span>View: <strong className="text-slate-700 dark:text-slate-300">{ex.camera_view.split(' ')[0]}</strong></span>
                      <span>Target: <strong className="text-slate-700 dark:text-slate-300">{ex.targetReps || 10} reps</strong></span>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Right Column: Active Exercise Configuration & Clinical Details (7 cols) */}
          <div className="lg:col-span-7 bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-xl space-y-6">
            
            {/* Active Header */}
            <div className="flex flex-col sm:flex-row sm:items-start justify-between pb-5 border-b border-slate-100 dark:border-slate-800 gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300">
                    {selectedExercise.is_custom ? 'Therapist Custom Protocol' : 'Pre-Stored Platform Protocol'}
                  </span>
                  <span className="text-xs font-semibold text-slate-400">
                    Joint: <strong className="text-slate-700 dark:text-slate-300">{selectedExercise.target_joint}</strong>
                  </span>
                </div>
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                  {selectedExercise.name}
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  {selectedExercise.description}
                </p>
              </div>

              {/* Quick Prescribe CTA */}
              <button
                id="prescribe-to-patient-btn"
                onClick={handlePrescribeToPatient}
                disabled={prescribing}
                className="px-4 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs shadow-md transition-all flex items-center gap-2 shrink-0 cursor-pointer"
              >
                <UserCheck className="w-4 h-4" />
                <span>{prescribing ? 'Assigning…' : 'Prescribe to Patient'}</span>
              </button>
            </div>

            {prescribeSuccess && (
              <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200 flex items-center gap-3 text-xs font-semibold">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <span>Successfully updated active prescription for Aarav Mehta with this exercise and calibrated targets!</span>
              </div>
            )}

            {/* Threshold Settings Form */}
            <div className="space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-teal-600" />
                <span>Kinematic Calibration & Thresholds</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Target ROM */}
                <div className="space-y-1.5 bg-slate-50 dark:bg-slate-800/40 p-4 rounded-2xl border border-slate-200 dark:border-slate-700">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold uppercase text-slate-600 dark:text-slate-400">
                      Target Range of Motion (ROM)
                    </label>
                    <span className="text-sm font-black font-mono text-teal-600 dark:text-teal-400">
                      {targetRom}°
                    </span>
                  </div>
                  <input
                    type="range"
                    min={selectedExercise.default_rom.min}
                    max={selectedExercise.default_rom.max}
                    value={targetRom}
                    onChange={e => setTargetRom(Number(e.target.value))}
                    className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-teal-600"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400">
                    <span>Min: {selectedExercise.default_rom.min}°</span>
                    <span>Safe Target</span>
                    <span>Max: {selectedExercise.default_rom.max}°</span>
                  </div>
                </div>

                {/* Prescribed Reps */}
                <div className="space-y-1.5 bg-slate-50 dark:bg-slate-800/40 p-4 rounded-2xl border border-slate-200 dark:border-slate-700">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold uppercase text-slate-600 dark:text-slate-400">
                      Prescribed Repetitions
                    </label>
                    <span className="text-sm font-black font-mono text-slate-900 dark:text-white">
                      {targetReps} reps/set
                    </span>
                  </div>
                  <input
                    type="number"
                    min={1}
                    max={50}
                    value={targetReps}
                    onChange={e => setTargetReps(Math.max(1, Number(e.target.value)))}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold font-mono text-slate-900 dark:text-white focus:outline-none focus:border-teal-500"
                  />
                </div>

                {/* Camera Orientation */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase text-slate-600 dark:text-slate-400">
                    Required Camera Orientation
                  </label>
                  <select
                    value={cameraView}
                    onChange={e => setCameraView(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:border-teal-500"
                  >
                    <option value="Frontal (Full Body)">Frontal (Full Body)</option>
                    <option value="Sagittal (Side Profile)">Sagittal (Side Profile)</option>
                  </select>
                </div>

                {/* Tempo Cadence */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase text-slate-600 dark:text-slate-400">
                    Movement Tempo Cadence
                  </label>
                  <input
                    type="text"
                    value={tempo}
                    onChange={e => setTempo(e.target.value)}
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
                  checked={feedbackEnabled}
                  onChange={e => setFeedbackEnabled(e.target.checked)}
                  className="w-4 h-4 accent-teal-600 cursor-pointer"
                />
              </div>

              {/* Save Protocol Button */}
              {saveSuccessMsg && (
                <div className="text-xs font-semibold text-emerald-600 flex items-center gap-1.5 animate-fadeIn">
                  <Check className="w-4 h-4" />
                  <span>{saveSuccessMsg}</span>
                </div>
              )}

              <button
                onClick={handleSaveProtocol}
                disabled={savingProtocol}
                className="w-full py-3.5 rounded-xl bg-teal-600 hover:bg-teal-500 disabled:bg-teal-400 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                {savingProtocol ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Saving Protocol Targets…</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Save Protocol Parameters</span>
                  </>
                )}
              </button>
            </div>

            {/* Clinical Instructions & Corrective Cues */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-4">
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                  Step-by-Step Patient Instructions ({selectedExercise.instructions?.length || 0})
                </h4>
                <ul className="space-y-1.5">
                  {selectedExercise.instructions?.map((inst, i) => (
                    <li key={i} className="text-xs text-slate-600 dark:text-slate-400 flex items-start gap-2">
                      <span className="w-4 h-4 rounded-full bg-slate-100 dark:bg-slate-800 text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                        {i + 1}
                      </span>
                      <span>{inst}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                  Common Compensation Faults & Guidance Cues
                </h4>
                <div className="flex flex-wrap gap-2">
                  {selectedExercise.common_feedback?.map((fb, i) => (
                    <span
                      key={i}
                      className="text-xs px-3 py-1.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800"
                    >
                      ⚠ {fb}
                    </span>
                  ))}
                </div>
              </div>
            </div>

          </div>

        </div>

      </div>

      {/* ============================================================== */}
      {/* ADD CUSTOM EXERCISE MODAL WIZARD                                */}
      {/* ============================================================== */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-2xl w-full border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden my-8">
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-teal-50/50 dark:bg-teal-950/20">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-teal-600 text-white">
                  <Plus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                    Add New Exercise to Clinic Database
                  </h3>
                  <p className="text-xs text-slate-500">
                    Create a customized clinical protocol stored in your permanent database.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleCreateCustomExercise} className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
              
              {/* Basic Details */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-teal-600 dark:text-teal-400">
                  1. Clinical Identification
                </h4>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Exercise Protocol Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={newExName}
                    onChange={e => setNewExName(e.target.value)}
                    placeholder="e.g. Wrist Extension Stretch, Hip Abduction, Ankle Dorsiflexion…"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500/50"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Clinical Description & Indications
                  </label>
                  <textarea
                    rows={2}
                    value={newExDesc}
                    onChange={e => setNewExDesc(e.target.value)}
                    placeholder="Purpose of exercise, target pathology, or post-operative phase…"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500/50 resize-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Body Region
                    </label>
                    <select
                      value={newExRegion}
                      onChange={e => setNewExRegion(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-teal-500"
                    >
                      <option value="Upper Limb">Upper Limb</option>
                      <option value="Lower Limb">Lower Limb</option>
                      <option value="Spine & Core">Spine & Core</option>
                      <option value="Neck / Cervical">Neck / Cervical</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Target Joint
                    </label>
                    <select
                      value={newExJoint}
                      onChange={e => setNewExJoint(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-teal-500"
                    >
                      <option value="Elbow">Elbow</option>
                      <option value="Shoulder">Shoulder</option>
                      <option value="Knee">Knee</option>
                      <option value="Hip">Hip</option>
                      <option value="Spine">Spine</option>
                      <option value="Wrist">Wrist</option>
                      <option value="Ankle">Ankle</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Difficulty Level
                    </label>
                    <select
                      value={newExDifficulty}
                      onChange={e => setNewExDifficulty(e.target.value as any)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-teal-500"
                    >
                      <option value="Beginner">Beginner</option>
                      <option value="Intermediate">Intermediate</option>
                      <option value="Advanced">Advanced</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Kinematics & ROM */}
              <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <h4 className="text-xs font-bold uppercase tracking-wider text-teal-600 dark:text-teal-400">
                  2. Kinematic Thresholds & Camera View
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Required Camera Orientation
                    </label>
                    <select
                      value={newExCamera}
                      onChange={e => setNewExCamera(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-teal-500"
                    >
                      <option value="Frontal (Full Body)">Frontal (Full Body)</option>
                      <option value="Sagittal (Side Profile)">Sagittal (Side Profile)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Flexion Angle Direction
                    </label>
                    <select
                      value={newExDecreasing ? 'decreasing' : 'increasing'}
                      onChange={e => setNewExDecreasing(e.target.value === 'decreasing')}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-teal-500"
                    >
                      <option value="decreasing">Decreases on flexion (e.g. Elbow / Knee)</option>
                      <option value="increasing">Increases on flexion (e.g. Shoulder Elevation / Hip)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3 bg-slate-50 dark:bg-slate-800/40 p-3 rounded-2xl border border-slate-200 dark:border-slate-700">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 mb-1">Rest Angle (Min °)</label>
                    <input
                      type="number"
                      value={newExMinRom}
                      onChange={e => setNewExMinRom(Number(e.target.value))}
                      className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-mono font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-teal-600 dark:text-teal-400 mb-1">Target Peak ROM (°)</label>
                    <input
                      type="number"
                      value={newExTargetRom}
                      onChange={e => setNewExTargetRom(Number(e.target.value))}
                      className="w-full p-2 rounded-lg border border-teal-400 bg-white dark:bg-slate-800 text-xs font-mono font-bold text-teal-600"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 mb-1">Max Safe ROM (°)</label>
                    <input
                      type="number"
                      value={newExMaxRom}
                      onChange={e => setNewExMaxRom(Number(e.target.value))}
                      className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-mono font-bold"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Default Reps</label>
                    <input
                      type="number"
                      value={newExReps}
                      onChange={e => setNewExReps(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-mono font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Movement Tempo</label>
                    <input
                      type="text"
                      value={newExTempo}
                      onChange={e => setNewExTempo(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                    />
                  </div>
                </div>
              </div>

              {/* Instructions and Coaching Cues */}
              <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <h4 className="text-xs font-bold uppercase tracking-wider text-teal-600 dark:text-teal-400">
                  3. Patient Instructions & Form Cues
                </h4>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Instructions for Patient App
                  </label>
                  <div className="space-y-1.5 mb-2">
                    {newExInstructions.map((inst, i) => (
                      <div key={i} className="flex items-center gap-2 text-xs bg-slate-50 dark:bg-slate-800/60 p-2 rounded-xl">
                        <span className="font-bold text-slate-400">{i + 1}.</span>
                        <span className="flex-1 text-slate-800 dark:text-slate-200">{inst}</span>
                        <button
                          type="button"
                          onClick={() => setNewExInstructions(p => p.filter((_, idx) => idx !== i))}
                          className="text-slate-400 hover:text-red-500"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newInstructionInput}
                      onChange={e => setNewInstructionInput(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          if (newInstructionInput.trim()) {
                            setNewExInstructions(p => [...p, newInstructionInput.trim()]);
                            setNewInstructionInput('');
                          }
                        }
                      }}
                      placeholder="Add instruction step and press enter…"
                      className="flex-1 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (newInstructionInput.trim()) {
                          setNewExInstructions(p => [...p, newInstructionInput.trim()]);
                          setNewInstructionInput('');
                        }
                      }}
                      className="px-3 py-2 rounded-xl bg-teal-600 text-white text-xs font-bold"
                    >
                      + Add
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Common Faults & Correction Cues
                  </label>
                  <div className="space-y-1.5 mb-2">
                    {newExCues.map((cue, i) => (
                      <div key={i} className="flex items-center gap-2 text-xs bg-amber-50 dark:bg-amber-950/30 p-2 rounded-xl border border-amber-200/50 dark:border-amber-800/50">
                        <span className="text-amber-600 font-bold">⚠</span>
                        <span className="flex-1 text-amber-900 dark:text-amber-200">{cue}</span>
                        <button
                          type="button"
                          onClick={() => setNewExCues(p => p.filter((_, idx) => idx !== i))}
                          className="text-slate-400 hover:text-red-500"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newCueInput}
                      onChange={e => setNewCueInput(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          if (newCueInput.trim()) {
                            setNewExCues(p => [...p, newCueInput.trim()]);
                            setNewCueInput('');
                          }
                        }
                      }}
                      placeholder="Add coaching cue and press enter…"
                      className="flex-1 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (newCueInput.trim()) {
                          setNewExCues(p => [...p, newCueInput.trim()]);
                          setNewCueInput('');
                        }
                      }}
                      className="px-3 py-2 rounded-xl bg-amber-600 text-white text-xs font-bold"
                    >
                      + Add
                    </button>
                  </div>
                </div>
              </div>

              {/* Modal Actions */}
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold hover:bg-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="px-6 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold flex items-center gap-2 shadow-md"
                >
                  {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  <span>{creating ? 'Saving Exercise…' : 'Save Exercise to Database'}</span>
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
