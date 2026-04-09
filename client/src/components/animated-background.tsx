import { motion } from "framer-motion";
import { useEffect, useState } from "react";

export function AnimatedBackground() {
  const [windowDimensions, setWindowDimensions] = useState({ width: 0, height: 0 });

  useEffect(() => {
    // Only access window on the client side
    setWindowDimensions({
      width: window.innerWidth,
      height: window.innerHeight,
    });

    const handleResize = () => {
      setWindowDimensions({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  if (windowDimensions.width === 0) return null;

  // Generate random particles
  const particles = Array.from({ length: 30 }).map((_, i) => ({
    id: i,
    size: Math.random() * 3 + 1,
    initialX: Math.random() * windowDimensions.width,
    initialY: Math.random() * windowDimensions.height,
    duration: Math.random() * 20 + 15,
    delay: Math.random() * 10,
  }));

  return (
    <div className="fixed inset-0 pointer-events-none z-[-1] overflow-hidden bg-[#0B0C10]">
      <div className="absolute inset-0 stars-bg z-0 opacity-40 mix-blend-screen" />
      <div className="absolute inset-0 bg-mesh z-0 opacity-60 mix-blend-screen" />
      
      {/* Dynamic Glow Orbs */}
      <motion.div 
        animate={{ 
          y: [-50, 50, -50], 
          x: [-50, 50, -50],
          scale: [1, 1.2, 1],
          opacity: [0.15, 0.25, 0.15]
        }} 
        transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] min-w-[500px] min-h-[500px] bg-cyan-700/30 rounded-full blur-[150px]"
      />
      <motion.div 
        animate={{ 
          y: [50, -50, 50], 
          x: [50, -50, 50],
          scale: [1, 1.3, 1],
          opacity: [0.15, 0.2, 0.15]
        }} 
        transition={{ duration: 24, repeat: Infinity, ease: "easeInOut" }}
        className="absolute bottom-[-10%] right-[-10%] w-[60vw] h-[60vw] min-w-[600px] min-h-[600px] bg-purple-700/30 rounded-full blur-[150px]"
      />
      <motion.div 
        animate={{ 
          y: [-30, 60, -30], 
          x: [60, -30, 60],
          scale: [0.8, 1.1, 0.8],
          opacity: [0.1, 0.2, 0.1]
        }} 
        transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-[30%] right-[20%] w-[35vw] h-[35vw] min-w-[300px] min-h-[300px] bg-teal-600/20 rounded-full blur-[120px]"
      />

      {/* Floating Light Particles */}
      {particles.map((particle) => (
        <motion.div
          key={particle.id}
          initial={{ 
            x: particle.initialX, 
            y: windowDimensions.height + 100,
            opacity: 0
          }}
          animate={{ 
            y: -100,
            opacity: [0, 0.8, 0]
          }}
          transition={{ 
            duration: particle.duration,
            repeat: Infinity,
            delay: particle.delay,
            ease: "linear"
          }}
          className="absolute bg-white rounded-full shadow-[0_0_15px_rgba(255,255,255,1)]"
          style={{
            width: particle.size,
            height: particle.size,
          }}
        />
      ))}
    </div>
  );
}
