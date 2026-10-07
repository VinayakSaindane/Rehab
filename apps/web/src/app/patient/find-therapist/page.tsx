'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Search, MapPin, Star, ArrowLeft, UserCheck, Clock,
  Stethoscope, BadgeCheck, ChevronRight, IndianRupee, Filter
} from 'lucide-react';

const DEMO_THERAPISTS = [
  {
    id: 'tp-1',
    user_id: 'user-therapist-1',
    name: 'Dr. Ananya Sharma',
    title: 'Lead Musculoskeletal Physiotherapist',
    bio: '12 years specializing in post-operative upper and lower limb rehabilitation. Certified in manual therapy and McKenzie method.',
    specializations: ['Musculoskeletal', 'Post-operative', 'Upper Limb', 'Sports Injury'],
    years_experience: 12,
    per_program_rate: 8500,
    availability: 'Mon-Sat, 9 AM – 6 PM',
    clinic_name: 'Sharma Rehab Clinic, Bengaluru',
    active_patients_count: 14
  },
  {
    id: 'tp-2',
    user_id: 'user-therapist-2',
    name: 'Dr. Rohan Kapoor',
    title: 'Senior Physiotherapist',
    bio: '8 years of experience in neurological and orthopaedic rehabilitation. Special interest in geriatric mobility restoration.',
    specializations: ['Neurological', 'Orthopaedic', 'Geriatric', 'Knee & Hip'],
    years_experience: 8,
    per_program_rate: 6000,
    availability: 'Mon-Fri, 10 AM – 5 PM',
    clinic_name: 'Kapoor Physio Centre, Mumbai',
    active_patients_count: 9
  },
  {
    id: 'tp-3',
    user_id: 'user-therapist-3',
    name: 'Dr. Priya Nair',
    title: 'Sports & Trauma Rehab Specialist',
    bio: 'Former national-level athlete turned rehabilitation specialist. Expert in ACL recovery, rotator cuff injuries, and functional movement restoration.',
    specializations: ['Sports Injury', 'ACL Recovery', 'Shoulder & Rotator Cuff', 'Post-operative'],
    years_experience: 6,
    per_program_rate: 7200,
    availability: 'Tue-Sun, 8 AM – 4 PM',
    clinic_name: 'ActiveRehab, Chennai',
    active_patients_count: 11
  }
];

const ALL_SPECS = ['Musculoskeletal', 'Post-operative', 'Upper Limb', 'Sports Injury', 'Neurological', 'Orthopaedic', 'Geriatric', 'Knee & Hip', 'ACL Recovery', 'Shoulder & Rotator Cuff'];

export default function FindTherapistPage() {
  const [therapists, setTherapists] = useState(DEMO_THERAPISTS);
  const [filtered, setFiltered] = useState(DEMO_THERAPISTS);
  const [searchSpec, setSearchSpec] = useState('');
  const [maxRate, setMaxRate] = useState<number | ''>('');
  const [requesting, setRequesting] = useState<string | null>(null);
  const [requested, setRequested] = useState<Set<string>>(new Set());

  useEffect(() => {
    // Try to fetch live profiles; fall back to demo data
    const fetchProfiles = async () => {
      try {
        const token = typeof window !== 'undefined' ? localStorage.getItem('rehab_token') : null;
        const res = await fetch('http://localhost:8000/api/hospital/marketplace/therapists', {
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        });
        if (res.ok) {
          const data = await res.json();
          if (data.length > 0) { setTherapists(data); setFiltered(data); }
        }
      } catch { /* use demo fallback */ }
    };
    fetchProfiles();
  }, []);

  // Client-side filter
  useEffect(() => {
    let result = therapists;
    if (searchSpec) {
      result = result.filter(t =>
        t.specializations.some(s => s.toLowerCase().includes(searchSpec.toLowerCase())) ||
        t.name.toLowerCase().includes(searchSpec.toLowerCase())
      );
    }
    if (maxRate !== '') {
      result = result.filter(t => (t.per_program_rate ?? 0) <= Number(maxRate));
    }
    setFiltered(result);
  }, [searchSpec, maxRate, therapists]);

  const handleRequestQuote = async (therapistId: string, therapistUserId: string) => {
    setRequesting(therapistId);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('rehab_token') : null;
      const res = await fetch('http://localhost:8000/api/hospital/case-requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          therapist_id: therapistUserId,
          hospital_record_id: 'hosp-rec-demo-1',
          patient_notes: 'Requesting quote for post-operative rehabilitation.'
        })
      });
      // Success regardless of backend reachability (demo-safe)
      setRequested(prev => new Set([...Array.from(prev), therapistId]));
    } catch {
      setRequested(prev => new Set([...Array.from(prev), therapistId]));
    } finally {
      setRequesting(null);
    }
  };

  const specColors: Record<string, string> = {
    'Musculoskeletal': 'bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300',
    'Post-operative': 'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300',
    'Sports Injury': 'bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300',
    'Upper Limb': 'bg-teal-100 text-teal-700 dark:bg-teal-950 dark:text-teal-300',
    'Neurological': 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300',
    'Geriatric': 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300',
  };

  const getSpecColor = (spec: string) => specColors[spec] ?? 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400';

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-6">

        {/* Header */}
        <div className="glass-card-strong rounded-3xl border border-sky-500/20 p-6 shadow-xl">
          <Link href="/patient/dashboard" className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 mb-3">
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Dashboard
          </Link>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            Find Your Therapist
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Browse verified physiotherapists and request a personalised quote for your rehabilitation programme.
          </p>
        </div>

        {/* Filters */}
        <div className="glass-card rounded-2xl border border-slate-200/80 dark:border-slate-800/80 p-4 flex flex-col sm:flex-row gap-3 shadow-md">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              value={searchSpec}
              onChange={e => setSearchSpec(e.target.value)}
              placeholder="Search by specialization or name…"
              className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white/70 dark:bg-slate-800/60 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/50 backdrop-blur-xs"
            />
          </div>
          <div className="relative flex-none w-full sm:w-52">
            <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="number"
              value={maxRate}
              onChange={e => setMaxRate(e.target.value ? Number(e.target.value) : '')}
              placeholder="Max rate (₹) per programme"
              className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white/70 dark:bg-slate-800/60 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/50 backdrop-blur-xs"
            />
          </div>
          <button onClick={() => { setSearchSpec(''); setMaxRate(''); }} className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-500 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
            Clear
          </button>
        </div>

        {/* Results */}
        <div className="space-y-4">
          {filtered.length === 0 && (
            <div className="glass-card rounded-3xl border border-slate-200/80 dark:border-slate-800/80 p-12 text-center text-slate-500">
              <Search className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="font-semibold">No therapists match your filter</p>
              <button onClick={() => { setSearchSpec(''); setMaxRate(''); }} className="text-sky-500 text-sm mt-1 hover:underline">Clear filters</button>
            </div>
          )}

          {filtered.map(therapist => (
            <div key={therapist.id} className="glass-card rounded-3xl border border-slate-200/80 dark:border-slate-800/80 p-6 shadow-md hover:shadow-xl transition-all flex flex-col sm:flex-row gap-5 hover:border-sky-500/30">
              {/* Avatar */}
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-sky-400 to-indigo-500 flex items-center justify-center text-white font-black text-xl shrink-0">
                {therapist.name.charAt(3)}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div>
                    <h2 className="font-black text-slate-900 dark:text-white text-base">{therapist.name}</h2>
                    <p className="text-xs text-slate-500 mt-0.5">{therapist.title}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-lg font-black text-sky-600 dark:text-sky-400">
                      ₹{therapist.per_program_rate?.toLocaleString('en-IN')}
                    </p>
                    <p className="text-[10px] text-slate-400">per 4-week programme</p>
                  </div>
                </div>

                <p className="text-sm text-slate-600 dark:text-slate-300 mt-2 leading-relaxed">{therapist.bio}</p>

                {/* Specs */}
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {therapist.specializations.map(spec => (
                    <span key={spec} className={`text-[10px] font-semibold px-2.5 py-0.5 rounded-full ${getSpecColor(spec)}`}>
                      {spec}
                    </span>
                  ))}
                </div>

                {/* Meta row */}
                <div className="flex flex-wrap items-center gap-4 mt-3 text-xs text-slate-500">
                  <span className="flex items-center gap-1"><BadgeCheck className="w-3.5 h-3.5 text-emerald-500" />{therapist.years_experience} yrs experience</span>
                  <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{therapist.availability}</span>
                  <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{therapist.clinic_name}</span>
                  <span className="flex items-center gap-1"><UserCheck className="w-3.5 h-3.5 text-sky-500" />{therapist.active_patients_count} active patients</span>
                </div>
              </div>

              {/* CTA */}
              <div className="flex flex-col justify-center shrink-0">
                {requested.has(therapist.id) ? (
                  <div className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 text-xs font-bold">
                    <BadgeCheck className="w-4 h-4" />
                    Quote Requested
                  </div>
                ) : (
                  <button
                    id={`request-quote-${therapist.id}`}
                    onClick={() => handleRequestQuote(therapist.id, therapist.user_id)}
                    disabled={requesting === therapist.id}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-sky-600 hover:bg-sky-500 disabled:opacity-60 text-white text-xs font-bold transition-all"
                  >
                    {requesting === therapist.id ? 'Sending…' : 'Request Quote'}
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}
