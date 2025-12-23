import React, { useEffect, useRef, useState } from 'react';
import type { Hands, Results } from '@mediapipe/hands';
import { useStore } from '../store';
import { HandGesture, AppMode } from '../types';
import { fallbackToNonSimd, getHandsSingleton } from '../lib/mediapipeHands';

const GESTURE_STABLE_FRAMES = 3;

const HandTracker: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { setGesture, setHandPosition, setMode, mode, setAiReady, isAiReady } = useStore();
  const [cameraAllowed, setCameraAllowed] = useState(false);
  const requestRef = useRef<number>(0);
  const modeRef = useRef(mode);
  const stableGestureRef = useRef({ gesture: HandGesture.NONE, frames: 0 });
  const committedGestureRef = useRef<HandGesture>(HandGesture.NONE);
  const handsRef = useRef<Hands | null>(null);
  const inFlightRef = useRef(false);
  const isActiveRef = useRef(true);

  useEffect(() => {
    modeRef.current = mode;
  }, [mode]);

  useEffect(() => {
    isActiveRef.current = true;
    if (!videoRef.current || !canvasRef.current) return;

    const setupHands = async () => {
      try {
        const hands = await getHandsSingleton();
        if (!isActiveRef.current) return;
        handsRef.current = hands;
        hands.onResults(onResults);
      } catch (error) {
        console.error('Failed to initialize MediaPipe Hands:', error);
      }
    };

    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 640, height: 480 }
        });

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          // Wait for metadata to load to ensure dimensions are correct
          videoRef.current.onloadedmetadata = () => {
            if (videoRef.current) {
                videoRef.current.play();
                setCameraAllowed(true);
                setAiReady(true); // Signal that AI is ready to receive frames
                // Start the prediction loop
                requestRef.current = requestAnimationFrame(predict);
            }
          };
        }
      } catch (err) {
        console.error("Error accessing camera:", err);
        setCameraAllowed(false);
      }
    };

    const predict = async () => {
      if (!isActiveRef.current) return;

      const video = videoRef.current;
      const hands = handsRef.current;
      if (!video || !hands || video.readyState !== 4 || inFlightRef.current) {
        requestRef.current = requestAnimationFrame(predict);
        return;
      }

      inFlightRef.current = true;
      try {
        await hands.send({ image: video });
      } catch (e) {
        console.error('Prediction error:', e);
        try {
          const fallbackHands = await fallbackToNonSimd();
          if (!isActiveRef.current) return;
          handsRef.current = fallbackHands;
          fallbackHands.onResults(onResults);
        } catch (fallbackError) {
          console.error('Failed to fallback to non-SIMD WASM:', fallbackError);
        }
      } finally {
        inFlightRef.current = false;
        requestRef.current = requestAnimationFrame(predict);
      }
    };

    setupHands();
    startCamera();

    return () => {
      isActiveRef.current = false;
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
      if (handsRef.current) {
        handsRef.current.onResults(() => {});
      }
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onResults = (results: Results) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.save();
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw image for feedback
    ctx.drawImage(results.image, 0, 0, canvas.width, canvas.height);

    if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
      const landmarks = results.multiHandLandmarks[0];
      
      // 1. Draw Landmarks (Visual Feedback)
      drawLandmarks(ctx, landmarks);

      // 2. Logic Analysis
      analyzeGesture(landmarks);
    } else {
      stableGestureRef.current = { gesture: HandGesture.NONE, frames: 0 };
      if (committedGestureRef.current !== HandGesture.NONE) {
        committedGestureRef.current = HandGesture.NONE;
        setGesture(HandGesture.NONE);
      }
    }
    ctx.restore();
  };

  const drawLandmarks = (ctx: CanvasRenderingContext2D, landmarks: any[]) => {
    ctx.fillStyle = '#00FF00';
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 2;

    for (const point of landmarks) {
      const x = point.x * canvasRef.current!.width;
      const y = point.y * canvasRef.current!.height;
      ctx.beginPath();
      ctx.arc(x, y, 4, 0, 2 * Math.PI);
      ctx.fill();
    }
  };

  const commitGesture = (gesture: HandGesture) => {
    if (committedGestureRef.current === gesture) return;
    committedGestureRef.current = gesture;
    setGesture(gesture);
  };

  const applyGesture = (detectedGesture: HandGesture) => {
    if (detectedGesture === stableGestureRef.current.gesture) {
      stableGestureRef.current.frames += 1;
    } else {
      stableGestureRef.current = { gesture: detectedGesture, frames: 1 };
    }

    const shouldCommit =
      detectedGesture === HandGesture.NONE ||
      stableGestureRef.current.frames >= GESTURE_STABLE_FRAMES;

    if (!shouldCommit) return;

    commitGesture(detectedGesture);

    const currentMode = modeRef.current;
    if (detectedGesture === HandGesture.FIST) {
       if (currentMode !== AppMode.TREE) setMode(AppMode.TREE);
    } else if (detectedGesture === HandGesture.OPEN) {
       if (currentMode !== AppMode.EXPLODED) setMode(AppMode.EXPLODED);
    } else if (detectedGesture === HandGesture.PINCH) {
       // Only allow focusing if we are already in exploded mode to avoid conflict with tree formation
       if (currentMode === AppMode.EXPLODED) {
          setMode(AppMode.FOCUS);
       }
    }
  };

  const analyzeGesture = (landmarks: any[]) => {
    // Landmarks: 0=wrist, 4=thumb_tip, 8=index_tip, 12=middle_tip, 16=ring_tip, 20=pinky_tip
    // 9 = middle_mcp (center of palm area)

    // A. Detect Hand Position (normalized 0-1)
    // Invert X because camera is mirrored
    const handX = 1 - landmarks[9].x; 
    const handY = landmarks[9].y;
    setHandPosition(handX, handY);

    // B. Detect Open Hand vs Fist
    // Simple algorithm: check if finger tips are above (y-axis) their PIP joints or distance from palm
    const fingerTips = [8, 12, 16, 20];
    const fingerPips = [6, 10, 14, 18];
    
    let extendedFingers = 0;
    for (let i = 0; i < 4; i++) {
        // Distance from wrist (0) to tip vs wrist to pip
        const distTip = Math.hypot(landmarks[fingerTips[i]].x - landmarks[0].x, landmarks[fingerTips[i]].y - landmarks[0].y);
        const distPip = Math.hypot(landmarks[fingerPips[i]].x - landmarks[0].x, landmarks[fingerPips[i]].y - landmarks[0].y);
        if (distTip > distPip) extendedFingers++;
    }

    // Thumb check
    const thumbTip = landmarks[4];
    // Check if thumb is extended away from palm center
    if (Math.hypot(thumbTip.x - landmarks[9].x, thumbTip.y - landmarks[9].y) > 0.15) {
       extendedFingers++;
    }

    // Pinch Detection (Thumb tip close to Index tip)
    const pinchDist = Math.hypot(landmarks[4].x - landmarks[8].x, landmarks[4].y - landmarks[8].y);
    const isPinching = pinchDist < 0.05;

    let detectedGesture = HandGesture.NONE;

    if (isPinching) {
      detectedGesture = HandGesture.PINCH;
    } else if (extendedFingers >= 4) {
      detectedGesture = HandGesture.OPEN;
    } else if (extendedFingers <= 1) {
      detectedGesture = HandGesture.FIST;
    }

    applyGesture(detectedGesture);
  };

  return (
    <div className={`absolute top-4 left-4 z-50 transition-opacity duration-1000 ${isAiReady ? 'opacity-100' : 'opacity-0'}`}>
       {/* Visual feedback container */}
       <div className="relative w-32 h-24 bg-black/50 rounded-lg overflow-hidden border border-gold-500/30 shadow-[0_0_15px_rgba(255,215,0,0.3)]">
         <video 
           ref={videoRef} 
           className="absolute top-0 left-0 w-full h-full object-cover opacity-50"
           playsInline 
           muted
         />
         <canvas 
           ref={canvasRef} 
           width={320} 
           height={240} 
           className="absolute top-0 left-0 w-full h-full object-cover transform scale-x-[-1]" 
         />
         {!cameraAllowed && (
           <div className="absolute inset-0 flex items-center justify-center text-xs text-white text-center p-2">
             Allow Camera Access
           </div>
         )}
       </div>
       <div className="mt-1 text-[10px] text-yellow-500 uppercase font-bold tracking-widest text-center">
         Hand Tracking
       </div>
    </div>
  );
};

export default HandTracker;
