import { useEffect, useRef } from 'react';

interface Point {
  x: number;
  y: number;
}

interface Trace {
  startX: number;
  startY: number;
  segments: Point[];
  pulseProgress: number;
  pulseSpeed: number;
  color: string;
  width: number;
}

export default function CircuitCanvas({
  opacity = 0.6,
  interactive = true,
}: {
  opacity?: number;
  interactive?: boolean;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const mouseRef = useRef<{ x: number; y: number }>({ x: -1000, y: -1000 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = canvas.parentElement?.clientWidth || window.innerWidth);
    let height = (canvas.height = canvas.parentElement?.clientHeight || window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = canvas.parentElement?.clientWidth || window.innerWidth;
      height = canvas.height = canvas.parentElement?.clientHeight || window.innerHeight;
      initTraces();
    };

    window.addEventListener('resize', handleResize);

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouseRef.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };
    };

    if (interactive) {
      window.addEventListener('mousemove', handleMouseMove);
    }

    // Generate circuit traces
    const traces: Trace[] = [];
    const colors = [
      'rgba(16, 185, 129, 0.45)', // Emerald
      'rgba(6, 182, 212, 0.45)',  // Cyan / Teal
      'rgba(245, 158, 11, 0.45)', // Amber
      'rgba(132, 204, 22, 0.4)',  // Lime
    ];

    function initTraces() {
      traces.length = 0;
      const count = Math.min(32, Math.floor(width / 45));

      for (let i = 0; i < count; i++) {
        const startX = Math.random() * width;
        const startY = Math.random() * height;
        const segments: Point[] = [];
        let currX = startX;
        let currY = startY;

        const numSegments = 3 + Math.floor(Math.random() * 4);
        for (let s = 0; s < numSegments; s++) {
          const isHorizontal = s % 2 === 0;
          const length = (Math.random() * 90 + 40) * (Math.random() > 0.5 ? 1 : -1);
          if (isHorizontal) {
            currX += length;
          } else {
            currY += length;
          }
          segments.push({ x: currX, y: currY });
        }

        traces.push({
          startX,
          startY,
          segments,
          pulseProgress: Math.random(),
          pulseSpeed: 0.003 + Math.random() * 0.004,
          color: colors[i % colors.length],
          width: Math.random() > 0.7 ? 1.5 : 1,
        });
      }
    }

    initTraces();

    // Render loop
    const render = () => {
      ctx.clearRect(0, 0, width, height);

      const mouse = mouseRef.current;

      traces.forEach(trace => {
        // Draw static PCB trace
        ctx.beginPath();
        ctx.moveTo(trace.startX, trace.startY);
        trace.segments.forEach(seg => {
          ctx.lineTo(seg.x, seg.y);
        });
        ctx.strokeStyle = 'rgba(16, 185, 129, 0.09)';
        ctx.lineWidth = trace.width;
        ctx.stroke();

        // Draw solder pads at ends
        ctx.beginPath();
        ctx.arc(trace.startX, trace.startY, 2.5, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(16, 185, 129, 0.25)';
        ctx.fill();

        const lastSeg = trace.segments[trace.segments.length - 1];
        if (lastSeg) {
          ctx.beginPath();
          ctx.arc(lastSeg.x, lastSeg.y, 2.5, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(6, 182, 212, 0.25)';
          ctx.fill();
        }

        // Advance energized pulse along the polyline
        trace.pulseProgress += trace.pulseSpeed;
        if (trace.pulseProgress > 1) trace.pulseProgress = 0;

        // Calculate current position of traveling electron / energy pulse
        const totalPoints = [
          { x: trace.startX, y: trace.startY },
          ...trace.segments,
        ];
        
        let totalLength = 0;
        const segmentLengths: number[] = [];
        for (let i = 0; i < totalPoints.length - 1; i++) {
          const dx = totalPoints[i + 1].x - totalPoints[i].x;
          const dy = totalPoints[i + 1].y - totalPoints[i].y;
          const dist = Math.hypot(dx, dy);
          segmentLengths.push(dist);
          totalLength += dist;
        }

        const targetDist = trace.pulseProgress * totalLength;
        let accumulated = 0;
        let pulseX = trace.startX;
        let pulseY = trace.startY;

        for (let i = 0; i < segmentLengths.length; i++) {
          const segDist = segmentLengths[i];
          if (accumulated + segDist >= targetDist) {
            const ratio = (targetDist - accumulated) / (segDist || 1);
            pulseX = totalPoints[i].x + (totalPoints[i + 1].x - totalPoints[i].x) * ratio;
            pulseY = totalPoints[i].y + (totalPoints[i + 1].y - totalPoints[i].y) * ratio;
            break;
          }
          accumulated += segDist;
        }

        // Mouse proximity boost: if near cursor, pulse brightens and enlarges!
        const distToMouse = Math.hypot(pulseX - mouse.x, pulseY - mouse.y);
        const isNear = distToMouse < 140;
        const radius = isNear ? 4.5 : 2.5;

        // Draw energized glowing electron
        ctx.beginPath();
        ctx.arc(pulseX, pulseY, radius, 0, Math.PI * 2);
        ctx.fillStyle = isNear ? '#34D399' : trace.color;
        ctx.shadowColor = isNear ? '#10B981' : trace.color;
        ctx.shadowBlur = isNear ? 14 : 7;
        ctx.fill();
        ctx.shadowBlur = 0; // reset
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      if (interactive) {
        window.removeEventListener('mousemove', handleMouseMove);
      }
    };
  }, [interactive]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        opacity,
        zIndex: 0,
      }}
    />
  );
}
