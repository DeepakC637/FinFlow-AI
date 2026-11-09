import { useEffect, useRef } from 'react';

const InteractiveBackground = () => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    // Particle state
    const particles = [];
    const particleCount = Math.min(Math.floor(width / 18), 85);
    const connectionDistance = 115;
    const mouse = { x: null, y: null, radius: 160 };
    const ripples = [];

    // Spawning 3D volumetric particles with curated color combos
    for (let i = 0; i < particleCount; i++) {
      const z = Math.random() * 1.4 + 0.6; // depth level (scale)
      const colorSelect = i % 3;
      let baseColor, highlightColor;

      if (colorSelect === 0) {
        baseColor = '6, 182, 212'; // Bright Neon Cyan / Cyan-500
        highlightColor = '207, 250, 254'; // Bright cyan-white
      } else if (colorSelect === 1) {
        baseColor = '168, 85, 247'; // Neon Purple / Purple-500
        highlightColor = '243, 232, 255'; // Bright purple-white
      } else {
        baseColor = '99, 102, 241'; // Glowing Indigo / Indigo-500
        highlightColor = '238, 242, 255'; // Bright indigo-white
      }

      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.35,
        vy: (Math.random() - 0.5) * 0.35,
        radius: Math.random() * 2.5 + 3.0, // base radius
        alpha: Math.random() * 0.25 + 0.15,
        z,
        baseColor,
        highlightColor
      });
    }

    const handleResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    const handleMouseMove = (e) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
    };

    const handleMouseLeave = () => {
      mouse.x = null;
      mouse.y = null;
    };

    const handleMouseDown = (e) => {
      // Spawns ripple
      ripples.push({
        x: e.clientX,
        y: e.clientY,
        radius: 0,
        maxRadius: 220,
        speed: 3.5,
        alpha: 0.6,
        color: '99, 102, 241'
      });
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseleave', handleMouseLeave);
    window.addEventListener('mousedown', handleMouseDown);

    const animate = () => {
      ctx.clearRect(0, 0, width, height);

      // 1. Draw and update expanding click ripples
      for (let i = ripples.length - 1; i >= 0; i--) {
        const r = ripples[i];
        r.radius += r.speed;
        r.alpha = 1 - r.radius / r.maxRadius;

        if (r.radius >= r.maxRadius) {
          ripples.splice(i, 1);
          continue;
        }

        // Draw primary ring
        ctx.beginPath();
        ctx.arc(r.x, r.y, r.radius, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(${r.color}, ${r.alpha})`;
        ctx.lineWidth = 1.8;
        ctx.stroke();

        // Draw double inner ring for depth
        ctx.beginPath();
        ctx.arc(r.x, r.y, r.radius * 0.75, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(${r.color}, ${r.alpha * 0.4})`;
        ctx.lineWidth = 1.0;
        ctx.stroke();
      }

      // 2. Draw and update particles with 3D Z-depth parallax and sphere shading
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        const scale = p.z; // depth multiplier

        // Move particle ambiently, scaled by depth factor for parallax
        p.x += p.vx * scale;
        p.y += p.vy * scale;

        // Boundary bounce check (with offscreen margins)
        if (p.x < -20 || p.x > width + 20) p.vx *= -1;
        if (p.y < -20 || p.y > height + 20) p.vy *= -1;

        // Interactive mouse deflection scaled by Z-depth
        if (mouse.x !== null && mouse.y !== null) {
          const dx = p.x - mouse.x;
          const dy = p.y - mouse.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < mouse.radius) {
            const force = (mouse.radius - dist) / mouse.radius;
            const rx = dx / dist;
            const ry = dy / dist;
            // Foreground particles deflect faster than background ones
            p.x += rx * force * 2.8 * scale;
            p.y += ry * force * 2.8 * scale;
          }
        }

        const r = p.radius * scale;
        
        // 3D Spherical Radial Gradient with sharp edges & dark core shadow
        const grad = ctx.createRadialGradient(
          p.x - r * 0.35, p.y - r * 0.35, r * 0.08, // highlight center shifted top-left
          p.x, p.y, r // outer edge bounds
        );
        grad.addColorStop(0, `rgba(${p.highlightColor}, ${p.alpha * 1.4})`); // bright reflection
        grad.addColorStop(0.4, `rgba(${p.baseColor}, ${p.alpha * 1.1})`);  // color body
        grad.addColorStop(0.85, `rgba(15, 23, 42, ${p.alpha * 0.95})`);     // dark curvature shadow
        grad.addColorStop(1, `rgba(15, 23, 42, ${p.alpha * 0.95})`);

        ctx.beginPath();
        ctx.arc(p.x, p.y, r, 0, Math.PI * 2); // draw exact circle (sharp edge, no bleed)
        ctx.fillStyle = grad;
        ctx.fill();

        // Draw a light outline to enhance the glass/spherical border definition
        ctx.strokeStyle = `rgba(${p.highlightColor}, ${p.alpha * 0.22})`;
        ctx.lineWidth = 0.55;
        ctx.stroke();
      }

      // 3. Draw connecting plexus network lines (only when depth plane difference is small)
      for (let i = 0; i < particles.length; i++) {
        const p1 = particles[i];
        for (let j = i + 1; j < particles.length; j++) {
          const p2 = particles[j];
          
          // Verify Z-depth similarity to ensure realistic volumetric space connections
          const dz = Math.abs(p1.z - p2.z);
          if (dz > 0.45) continue; 

          const dx = p1.x - p2.x;
          const dy = p1.y - p2.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < connectionDistance) {
            // connection opacity drops if particles are far apart in Z-depth
            const alpha = (1 - dist / connectionDistance) * (1 - dz / 0.45) * 0.14 * Math.min(p1.z, p2.z);
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.strokeStyle = `rgba(148, 163, 184, ${alpha})`;
            ctx.lineWidth = 0.5 * Math.min(p1.z, p2.z); // connections thicker in foreground
            ctx.stroke();
          }
        }
      }

      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseleave', handleMouseLeave);
      window.removeEventListener('mousedown', handleMouseDown);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 w-full h-full pointer-events-none z-0"
      style={{ mixBlendMode: 'screen' }}
    />
  );
};

export default InteractiveBackground;
