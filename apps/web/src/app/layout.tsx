import type { Metadata } from 'next';
import './globals.css';
import { AccessibilityProvider } from '@/lib/accessibility-context';
import { AuthProvider } from '@/lib/auth-context';
import TopNavbar from '@/components/TopNavbar';
import { ShieldAlert, HeartHandshake } from 'lucide-react';

export const metadata: Metadata = {
  title: 'RehabSense — Camera-Assisted Home Rehabilitation Coach',
  description: 'Camera-assisted rehabilitation platform that empowers patients to practice prescribed exercises at home with confidence-gated computer vision while keeping clinicians in control.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen flex flex-col text-[#1c2620] antialiased selection:bg-emerald-600/20 selection:text-emerald-950">
        <AccessibilityProvider>
          <AuthProvider>
            <TopNavbar />
            
            <main className="flex-1">
              {children}
            </main>

            {/* Medical Disclaimer & Safety Floating Glass Footer */}
            <footer className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 mt-16 mb-8">
              <div className="glass-card-strong rounded-[28px] p-6 sm:p-8 border border-white/85 shadow-xl backdrop-blur-3xl text-[#435147]">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-6 border-b border-stone-200/60">
                  <div className="flex items-center gap-2">
                    <HeartHandshake className="w-5 h-5 text-[#244b38]" />
                    <span className="text-[#1a2620] font-black text-sm tracking-tight">RehabSense</span>
                    <span className="text-stone-300">|</span>
                    <span className="text-[#6d7b71] font-medium text-xs">Team TechHives (PS 05)</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[#7a3f22] bg-[#fbf1eb] px-3.5 py-1.5 rounded-full border border-[#ebd0c2] backdrop-blur-md text-xs font-semibold">
                    <ShieldAlert className="w-4 h-4 shrink-0 text-[#b86b45]" />
                    <span>Investigational Clinical Prototype — Not for Unsupervised Medical Diagnosis</span>
                  </div>
                </div>

                <div className="pt-6 space-y-2 text-[12px] leading-relaxed text-slate-600">
                  <p>
                    <strong className="text-slate-900 font-bold">Safety Notice:</strong> RehabSense is an assistive movement tracking and feedback tool designed to support home rehabilitation. It does not provide medical diagnoses, treatment prescriptions, or replace licensed physiotherapists.
                  </p>
                  <p>
                    <strong className="text-slate-900 font-bold">Clinician Guidance:</strong> Exercise targets and range-of-motion limits are configured directly by your care team. Always discontinue exercise immediately if you experience pain or discomfort, and consult your treating physiotherapist.
                  </p>
                  <p className="text-slate-500 pt-2">
                    Privacy by Design: Computer vision pose estimation runs directly in your browser. Raw camera imagery is never recorded or streamed to remote servers. Only structured session performance metrics are preserved.
                  </p>
                </div>
              </div>
            </footer>
          </AuthProvider>
        </AccessibilityProvider>
      </body>
    </html>
  );
}
