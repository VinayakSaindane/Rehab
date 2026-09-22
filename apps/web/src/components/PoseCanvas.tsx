'use client';

import React, { useRef, useEffect } from 'react';
import { Point2D } from '@rehabsense/exercise-engine';

interface PoseCanvasProps {
  landmarks: Point2D[];
  activeJointIndices: number[];
  currentAngle: number;
  isGated: boolean;
  targetJointName?: string;
  width?: number;
  height?: number;
}

// MediaPipe Pose Skeleton Connections
const POSE_CONNECTIONS: [number, number][] = [
  // Torso
  [11, 12], [11, 23], [12, 24], [23, 24],
  // Left arm
  [11, 13], [13, 15],
  // Right arm
  [12, 14], [14, 16],
  // Left leg
  [23, 25], [25, 27],
  // Right leg
  [24, 26], [26, 28]
];

export default function PoseCanvas({
  landmarks,
  activeJointIndices,
  currentAngle,
  isGated,
  targetJointName = 'Elbow',
  width = 640,
  height = 480
}: PoseCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (!landmarks || landmarks.length === 0) return;

    // 1. Draw skeleton connection lines
    ctx.lineWidth = 3;
    ctx.strokeStyle = isGated ? 'rgba(245, 158, 11, 0.5)' : 'rgba(14, 165, 233, 0.75)';

    for (const [startIdx, endIdx] of POSE_CONNECTIONS) {
      const p1 = landmarks[startIdx];
      const p2 = landmarks[endIdx];

      if (p1 && p2 && (p1.visibility ?? 1) > 0.4 && (p2.visibility ?? 1) > 0.4) {
        ctx.beginPath();
        ctx.moveTo(p1.x * canvas.width, p1.y * canvas.height);
        ctx.lineTo(p2.x * canvas.width, p2.y * canvas.height);
        ctx.stroke();
      }
    }

    // 2. Draw standard landmarks
    for (let i = 0; i < landmarks.length; i++) {
      const p = landmarks[i];
      if (!p || (p.visibility ?? 1) < 0.4) continue;

      const x = p.x * canvas.width;
      const y = p.y * canvas.height;
      const isActive = activeJointIndices.includes(i);

      if (!isActive) {
        ctx.beginPath();
        ctx.arc(x, y, 4, 0, 2 * Math.PI);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        ctx.fill();
        ctx.strokeStyle = 'rgba(15, 23, 42, 0.6)';
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }
    }

    // 3. Highlight Active Exercise Joints (e.g. Shoulder, Elbow, Wrist)
    for (const idx of activeJointIndices) {
      const p = landmarks[idx];
      if (!p) continue;

      const x = p.x * canvas.width;
      const y = p.y * canvas.height;

      // Outer glowing ring
      ctx.beginPath();
      ctx.arc(x, y, 10, 0, 2 * Math.PI);
      ctx.fillStyle = isGated ? 'rgba(245, 158, 11, 0.3)' : 'rgba(16, 185, 129, 0.35)';
      ctx.fill();

      // Inner solid point
      ctx.beginPath();
      ctx.arc(x, y, 6, 0, 2 * Math.PI);
      ctx.fillStyle = isGated ? '#F59E0B' : '#10B981';
      ctx.fill();
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    // 4. Draw Joint Angle Arc & Degree Tag near vertex joint
    if (activeJointIndices.length >= 2 && currentAngle > 0 && !isGated) {
      // Vertex is typically the second active joint (e.g. elbow)
      const vertexIdx = activeJointIndices[1] ?? activeJointIndices[0];
      const vertex = landmarks[vertexIdx];

      if (vertex) {
        const vx = vertex.x * canvas.width;
        const vy = vertex.y * canvas.height;

        // Angle badge offset slightly to the side
        const badgeX = vx + 22;
        const badgeY = vy - 10;

        // Draw pill background
        ctx.save();
        ctx.shadowColor = 'rgba(0,0,0,0.4)';
        ctx.shadowBlur = 6;
        ctx.fillStyle = 'rgba(15, 23, 42, 0.88)';
        ctx.beginPath();
        ctx.roundRect(badgeX, badgeY - 14, 68, 26, 6);
        ctx.fill();
        ctx.strokeStyle = '#38BDF8';
        ctx.lineWidth = 1.5;
        ctx.stroke();
        ctx.restore();

        // Text
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 13px system-ui, -apple-system, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(`${Math.round(currentAngle)}°`, badgeX + 34, badgeY);

        // Subtext label
        ctx.fillStyle = '#94A3B8';
        ctx.font = '9px system-ui, -apple-system, sans-serif';
        ctx.fillText(targetJointName, badgeX + 34, badgeY + 18);
      }
    }
  }, [landmarks, activeJointIndices, currentAngle, isGated, targetJointName, width, height]);

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      className="absolute inset-0 w-full h-full object-contain pointer-events-none z-20"
    />
  );
}
