import React, { useRef, useEffect } from 'react';

const MatrixBackground = () => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    
    let width = window.innerWidth;
    let height = window.innerHeight;
    canvas.width = width;
    canvas.height = height;

    // Alphanumeric + subtle katakana
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789アァカサタナハマヤャラワガザダバパイィキシチニヒミリヰギジヂビピウゥクスツヌフムユュルグズブヅプエェケセテネヘメレゲゼデベペオォコソトノホモヨョロゴゾドボポヴッン'.split('');
    
    const fontSize = 18;
    const columns = Math.floor(width / fontSize);
    
    const drops = [];
    const activeColumns = new Set();
    
    // Initialize drops - low density
    for (let x = 0; x < columns; x++) {
      // Create empty space by only assigning active drops to 30% of columns
      if (Math.random() < 0.3) {
        drops[x] = Math.random() * -100; // random start above screen
        activeColumns.add(x);
      } else {
        drops[x] = height + 100; // hidden
      }
    }

    let animationFrameId;
    let lastDrawTime = 0;
    const fps = 24; // Medium-slow speed
    const interval = 1000 / fps;

    const draw = (currentTime) => {
      animationFrameId = requestAnimationFrame(draw);
      
      const deltaTime = currentTime - lastDrawTime;
      if (deltaTime > interval) {
        lastDrawTime = currentTime - (deltaTime % interval);

        // Smooth fade out
        ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
        ctx.fillRect(0, 0, width, height);

        ctx.font = `${fontSize}px "JetBrains Mono", monospace`;
        ctx.textAlign = 'center';

        for (let i = 0; i < columns; i++) {
          // If column is dormant, maybe wake it up (very rare)
          if (!activeColumns.has(i) && Math.random() < 0.002) {
            activeColumns.add(i);
            drops[i] = 0;
          }

          if (activeColumns.has(i)) {
            const y = drops[i] * fontSize;
            if (y > 0) {
              const text = characters[Math.floor(Math.random() * characters.length)];
              
              // Glow & color
              const isHead = Math.random() < 0.1;
              ctx.fillStyle = isHead ? '#ffffff' : 'rgba(0, 255, 136, 0.8)';
              ctx.shadowColor = 'rgba(0, 255, 136, 0.6)';
              ctx.shadowBlur = isHead ? 15 : 5;

              ctx.fillText(text, i * fontSize + fontSize/2, y);
              
              // Reset shadow for next operations
              ctx.shadowBlur = 0;
            }

            // Move drop down
            drops[i]++;

            // Reset drop randomly after it passes screen
            if (y > height && Math.random() > 0.95) {
              if (Math.random() < 0.5) {
                // Return to dormant
                activeColumns.delete(i);
              } else {
                // Restart at top
                drops[i] = 0;
              }
            }
          }
        }
      }
    };

    animationFrameId = requestAnimationFrame(draw);

    const handleResize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width;
      canvas.height = height;
      
      // Re-initialize columns and drops for new width
      const currentColumns = Math.floor(width / fontSize);
      drops.length = 0;
      activeColumns.clear();
      for (let x = 0; x < currentColumns; x++) {
        if (Math.random() < 0.3) {
          drops[x] = Math.random() * -100;
          activeColumns.add(x);
        } else {
          drops[x] = height + 100;
        }
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <>
      <div style={{
         position: 'fixed',
         top: 0,
         left: 0,
         width: '100%',
         height: '100%',
         background: '#000000',
         zIndex: -3
      }}></div>
      <canvas 
        ref={canvasRef} 
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          zIndex: -2,
          opacity: 0.8
        }}
      />
      {/* Overlay for readability */}
      <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          background: 'rgba(0, 0, 0, 0.5)',
          zIndex: -1,
          pointerEvents: 'none'
      }}></div>
    </>
  );
};

export default MatrixBackground;
