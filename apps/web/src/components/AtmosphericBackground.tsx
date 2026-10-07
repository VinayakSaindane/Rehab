'use client';

import React from 'react';

/**
 * AtmosphericBackground
 * 
 * Sets 1.png as the fixed, high-definition background image
 * throughout the entire RehabSense application. Frosted glass surfaces
 * placed over this layer refract and blur its flowing blue curves,
 * creating authentic, premium glassmorphism.
 */
export default function AtmosphericBackground() {
  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 pointer-events-none -z-20 overflow-hidden select-none"
    >
      {/* 1. Primary Fixed Background Image */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat bg-fixed transform-gpu"
        style={{
          backgroundImage: `url('/1.png')`,
        }}
      />

      {/* 2. Soft Ambient Lighting Vignette (enhances blue tones without clouding glass) */}
      <div
        className="absolute inset-0 bg-gradient-to-b from-blue-900/[0.03] via-transparent to-sky-950/[0.05]"
      />

      {/* 3. Subtle Crystal Glow on top-left to complement the blue swirl */}
      <div
        className="absolute -top-32 -left-20 w-[600px] h-[600px] rounded-full bg-blue-400/[0.08] blur-[120px]"
      />
    </div>
  );
}
