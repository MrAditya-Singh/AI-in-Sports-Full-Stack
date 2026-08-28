/**
 * ATHLETIX — Ultra-Scalable Client-Side AI Live Pose & Voice Coach
 * components/LiveAICoachEngine.tsx
 *
 * 100% Client-Side GPU MediaPipe Pose Estimation:
 *  - Zero WebRTC STUN/TURN bottlenecks
 *  - Real-time 60 FPS skeleton tracking on user's device
 *  - Proactive Web Speech API & Audio Chime Voice Coach
 *  - Instant camera start on any mobile phone or browser
 */

import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Colors } from '../constants/colors';

const EXERCISES = [
  { key: 'squat', label: '🏋️‍♂️ Squats', targetAngle: 'Knee < 100°' },
  { key: 'pushup', label: '💪 Push-ups', targetAngle: 'Elbow < 90°' },
  { key: 'biceps_curl', label: '🦾 Biceps Curls', targetAngle: 'Elbow < 50°' },
  { key: 'shoulder_press', label: '🏋️ Overhead Press', targetAngle: 'Elbow > 160°' },
  { key: 'lunges', label: '🦵 Lunges', targetAngle: 'Knee < 100°' },
];

interface Props {
  athleteName?: string;
  onWorkoutComplete?: (summary: { exercise: string; reps: number; sets: number; timeSec: number }) => void;
}

export default function LiveAICoachEngine({ athleteName = 'Athlete', onWorkoutComplete }: Props) {
  const [selectedExercise, setSelectedExercise] = useState('squat');
  const [targetSets, setTargetSets] = useState(3);
  const [targetReps, setTargetReps] = useState(10);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isLoadingModel, setIsLoadingModel] = useState(false);
  const [repCount, setRepCount] = useState(0);
  const [currentSet, setCurrentSet] = useState(1);
  const [formFeedback, setFormFeedback] = useState('Position yourself in view');
  const [depthStatus, setDepthStatus] = useState<string>('READY');
  const [currentAngle, setCurrentAngle] = useState<number>(0);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [voiceEnabled, setVoiceEnabled] = useState(true);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const poseRef = useRef<any>(null);
  const cameraRef = useRef<any>(null);
  const stateRef = useRef<{
    stage: 'up' | 'down' | null;
    reps: number;
    sets: number;
    lastSpoken: string;
    lastSpeakTime: number;
  }>({
    stage: null,
    reps: 0,
    sets: 1,
    lastSpoken: '',
    lastSpeakTime: 0,
  });

  // Timer
  useEffect(() => {
    let timer: any = null;
    if (isCameraActive) {
      timer = setInterval(() => {
        setElapsedSeconds((prev) => prev + 1);
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isCameraActive]);

  // Audio / Speech Helper
  const speakFeedback = (text: string, force = false) => {
    if (!voiceEnabled || typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    const now = Date.now();
    if (!force && now - stateRef.current.lastSpeakTime < 2500) return;
    if (!force && stateRef.current.lastSpoken === text && now - stateRef.current.lastSpeakTime < 4000) return;

    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.05;
      utterance.pitch = 1.0;
      window.speechSynthesis.speak(utterance);
      stateRef.current.lastSpoken = text;
      stateRef.current.lastSpeakTime = now;
    } catch {
      // Audio fallback silent
    }
  };

  const playChime = (highPitch = true) => {
    try {
      const AudioContext = (window as any).AudioContext || (window as any).webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(highPitch ? 880 : 440, ctx.currentTime);
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.3);
    } catch {
      // audio context fallback
    }
  };

  // Angle math
  const calculateAngle = (a: { x: number; y: number }, b: { x: number; y: number }, c: { x: number; y: number }) => {
    const radians = Math.atan2(c.y - b.y, c.x - b.x) - Math.atan2(a.y - b.y, a.x - b.x);
    let angle = Math.abs((radians * 180.0) / Math.PI);
    if (angle > 180.0) {
      angle = 360 - angle;
    }
    return Math.round(angle);
  };

  // Start Camera and Load MediaPipe
  const startCamera = async () => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') return;
    setIsLoadingModel(true);

    try {
      // Stop old stream
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: facingMode,
          width: { ideal: 640, max: 1280 },
          height: { ideal: 480, max: 720 },
          frameRate: { ideal: 30, max: 60 },
        },
        audio: false,
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      // Load MediaPipe scripts dynamically if not loaded
      await loadMediaPipeScripts();

      const PoseConstructor = (window as any).Pose;
      if (!PoseConstructor) {
        throw new Error('MediaPipe Pose failed to initialize.');
      }

      const pose = new PoseConstructor({
        locateFile: (file: string) => `https://cdn.jsdelivr.net/npm/@mediapipe/pose@0.5.1675469404/${file}`,
      });

      pose.setOptions({
        modelComplexity: 1,
        smoothLandmarks: true,
        enableSegmentation: false,
        smoothSegmentation: false,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5,
      });

      pose.onResults(onPoseResults);
      poseRef.current = pose;

      // Frame Processing Loop via requestAnimationFrame / MediaPipe Camera
      const CameraConstructor = (window as any).Camera;
      if (CameraConstructor && videoRef.current) {
        const camera = new CameraConstructor(videoRef.current, {
          onFrame: async () => {
            if (videoRef.current && poseRef.current) {
              await poseRef.current.send({ image: videoRef.current });
            }
          },
          width: 640,
          height: 480,
        });
        camera.start();
        cameraRef.current = camera;
      }

      setIsCameraActive(true);
      speakFeedback(`Let's start ${selectedExercise.replace('_', ' ')}. Get in position!`, true);
    } catch (err: any) {
      alert(`Camera Error: ${err?.message || 'Could not access camera device.'}`);
    } finally {
      setIsLoadingModel(false);
    }
  };

  const stopCamera = () => {
    if (cameraRef.current?.stop) {
      cameraRef.current.stop();
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
    setDepthStatus('PAUSED');
  };

  // Helper script loader
  const loadMediaPipeScripts = async () => {
    if ((window as any).Pose && (window as any).Camera) return;

    const loadScript = (src: string) => {
      return new Promise<void>((resolve, reject) => {
        if (document.querySelector(`script[src="${src}"]`)) {
          resolve();
          return;
        }
        const script = document.createElement('script');
        script.src = src;
        script.crossOrigin = 'anonymous';
        script.onload = () => resolve();
        script.onerror = () => reject(new Error(`Failed to load ${src}`));
        document.head.appendChild(script);
      });
    };

    await loadScript('https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils@0.3.1675466862/camera_utils.js');
    await loadScript('https://cdn.jsdelivr.net/npm/@mediapipe/pose@0.5.1675469404/pose.js');
  };

  // Pose Detection Frame Processor
  const onPoseResults = (results: any) => {
    if (!canvasRef.current || !videoRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = videoRef.current.videoWidth || 640;
    canvas.height = videoRef.current.videoHeight || 480;

    ctx.save();
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw background video if needed (canvas overlay is transparent over video)
    if (results.poseLandmarks) {
      const lm = results.poseLandmarks;

      // Draw glowing skeleton connections
      const CONNECTIONS = [
        [11, 12], [11, 13], [13, 15], [12, 14], [14, 16], // Upper body
        [11, 23], [12, 24], [23, 24], // Torso
        [23, 25], [24, 26], [25, 27], [26, 28], // Legs
      ];

      ctx.lineWidth = 4;
      ctx.strokeStyle = '#00E5FF';
      ctx.shadowColor = '#00E5FF';
      ctx.shadowBlur = 8;

      CONNECTIONS.forEach(([i, j]) => {
        const p1 = lm[i];
        const p2 = lm[j];
        if (p1 && p2 && (p1.visibility ?? 1) > 0.4 && (p2.visibility ?? 1) > 0.4) {
          ctx.beginPath();
          ctx.moveTo(p1.x * canvas.width, p1.y * canvas.height);
          ctx.lineTo(p2.x * canvas.width, p2.y * canvas.height);
          ctx.stroke();
        }
      });

      // Draw Keypoints
      lm.forEach((point: any, idx: number) => {
        if ([11, 12, 13, 14, 15, 16, 23, 24, 25, 26, 27, 28].includes(idx)) {
          if ((point.visibility ?? 1) > 0.4) {
            ctx.beginPath();
            ctx.arc(point.x * canvas.width, point.y * canvas.height, 6, 0, 2 * Math.PI);
            ctx.fillStyle = '#39FF14';
            ctx.shadowColor = '#39FF14';
            ctx.shadowBlur = 10;
            ctx.fill();
          }
        }
      });

      // Exercise Logic
      processExerciseLogic(lm, ctx, canvas.width, canvas.height);
    } else {
      setFormFeedback('Step back so full body is visible');
    }

    ctx.restore();
  };

  const processExerciseLogic = (lm: any[], ctx: CanvasRenderingContext2D, w: number, h: number) => {
    const leftHip = lm[23];
    const rightHip = lm[24];
    const leftKnee = lm[25];
    const rightKnee = lm[26];
    const leftAnkle = lm[27];
    const rightAnkle = lm[28];
    const leftShoulder = lm[11];
    const rightShoulder = lm[12];
    const leftElbow = lm[13];
    const rightElbow = lm[14];
    const leftWrist = lm[15];
    const rightWrist = lm[16];

    if (selectedExercise === 'squat') {
      const leftVis = leftKnee?.visibility ?? 0;
      const rightVis = rightKnee?.visibility ?? 0;
      const useLeft = leftVis >= rightVis;
      const hip = useLeft ? leftHip : rightHip;
      const knee = useLeft ? leftKnee : rightKnee;
      const ankle = useLeft ? leftAnkle : rightAnkle;
      const shoulder = useLeft ? leftShoulder : rightShoulder;

      if (hip && knee && ankle) {
        const kneeAngle = calculateAngle(hip, knee, ankle);
        setCurrentAngle(kneeAngle);

        // Draw angle text on knee
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 16px sans-serif';
        ctx.fillText(`${kneeAngle}°`, knee.x * w + 10, knee.y * h);

        if (kneeAngle < 100) {
          if (stateRef.current.stage !== 'down') {
            stateRef.current.stage = 'down';
            setDepthStatus('GOOD DEPTH 🔥');
            setFormFeedback('Good depth! Now push up smoothly');
          }
        }

        if (kneeAngle > 160 && stateRef.current.stage === 'down') {
          stateRef.current.stage = 'up';
          stateRef.current.reps += 1;
          const newReps = stateRef.current.reps;
          setRepCount(newReps);
          setDepthStatus('STANDING');
          playChime(true);

          if (newReps % targetReps === 0) {
            stateRef.current.sets += 1;
            setCurrentSet(stateRef.current.sets);
            speakFeedback(`Set complete! ${newReps} reps total. Take a breath!`, true);
          } else {
            speakFeedback(`${newReps}`, true);
          }
        } else if (kneeAngle > 160 && stateRef.current.stage !== 'down') {
          setDepthStatus('READY');
        }
      }
    } else if (selectedExercise === 'pushup') {
      const elbow = (leftElbow?.visibility ?? 0) > (rightElbow?.visibility ?? 0) ? leftElbow : rightElbow;
      const shoulder = (leftShoulder?.visibility ?? 0) > (rightShoulder?.visibility ?? 0) ? leftShoulder : rightShoulder;
      const wrist = (leftWrist?.visibility ?? 0) > (rightWrist?.visibility ?? 0) ? leftWrist : rightWrist;

      if (elbow && shoulder && wrist) {
        const elbowAngle = calculateAngle(shoulder, elbow, wrist);
        setCurrentAngle(elbowAngle);

        if (elbowAngle < 90) {
          if (stateRef.current.stage !== 'down') {
            stateRef.current.stage = 'down';
            setDepthStatus('DOWN POSITION');
            setFormFeedback('Good bottom position! Push up');
          }
        }

        if (elbowAngle > 160 && stateRef.current.stage === 'down') {
          stateRef.current.stage = 'up';
          stateRef.current.reps += 1;
          const newReps = stateRef.current.reps;
          setRepCount(newReps);
          playChime(true);
          speakFeedback(`${newReps}`, true);
        }
      }
    } else if (selectedExercise === 'biceps_curl') {
      const elbow = (leftElbow?.visibility ?? 0) > (rightElbow?.visibility ?? 0) ? leftElbow : rightElbow;
      const shoulder = (leftShoulder?.visibility ?? 0) > (rightShoulder?.visibility ?? 0) ? leftShoulder : rightShoulder;
      const wrist = (leftWrist?.visibility ?? 0) > (rightWrist?.visibility ?? 0) ? leftWrist : rightWrist;

      if (elbow && shoulder && wrist) {
        const armAngle = calculateAngle(shoulder, elbow, wrist);
        setCurrentAngle(armAngle);

        if (armAngle < 50) {
          if (stateRef.current.stage !== 'up') {
            stateRef.current.stage = 'up';
            setDepthStatus('FULL CURL 🔥');
            setFormFeedback('Squeeze bicep, lower with control');
          }
        }

        if (armAngle > 160 && stateRef.current.stage === 'up') {
          stateRef.current.stage = 'down';
          stateRef.current.reps += 1;
          const newReps = stateRef.current.reps;
          setRepCount(newReps);
          playChime(true);
          speakFeedback(`${newReps}`, true);
        }
      }
    } else if (selectedExercise === 'shoulder_press') {
      const elbow = (leftElbow?.visibility ?? 0) > (rightElbow?.visibility ?? 0) ? leftElbow : rightElbow;
      const shoulder = (leftShoulder?.visibility ?? 0) > (rightShoulder?.visibility ?? 0) ? leftShoulder : rightShoulder;
      const wrist = (leftWrist?.visibility ?? 0) > (rightWrist?.visibility ?? 0) ? leftWrist : rightWrist;

      if (elbow && shoulder && wrist) {
        const pressAngle = calculateAngle(shoulder, elbow, wrist);
        setCurrentAngle(pressAngle);

        if (pressAngle > 160) {
          if (stateRef.current.stage !== 'up') {
            stateRef.current.stage = 'up';
            setDepthStatus('LOCKED OUT ⚡');
          }
        }

        if (pressAngle < 90 && stateRef.current.stage === 'up') {
          stateRef.current.stage = 'down';
          stateRef.current.reps += 1;
          const newReps = stateRef.current.reps;
          setRepCount(newReps);
          playChime(true);
          speakFeedback(`${newReps}`, true);
        }
      }
    } else if (selectedExercise === 'lunges') {
      const leftVis = leftKnee?.visibility ?? 0;
      const rightVis = rightKnee?.visibility ?? 0;
      const useLeft = leftVis <= rightVis;
      const hip = useLeft ? leftHip : rightHip;
      const knee = useLeft ? leftKnee : rightKnee;
      const ankle = useLeft ? leftAnkle : rightAnkle;

      if (hip && knee && ankle) {
        const lungeAngle = calculateAngle(hip, knee, ankle);
        setCurrentAngle(lungeAngle);

        if (lungeAngle < 100) {
          if (stateRef.current.stage !== 'down') {
            stateRef.current.stage = 'down';
            setDepthStatus('DEEP LUNGE 🎯');
          }
        }

        if (lungeAngle > 160 && stateRef.current.stage === 'down') {
          stateRef.current.stage = 'up';
          stateRef.current.reps += 1;
          const newReps = stateRef.current.reps;
          setRepCount(newReps);
          playChime(true);
          speakFeedback(`${newReps}`, true);
        }
      }
    }
  };

  const resetWorkout = () => {
    stateRef.current.reps = 0;
    stateRef.current.stage = null;
    stateRef.current.sets = 1;
    setRepCount(0);
    setCurrentSet(1);
    setElapsedSeconds(0);
    setDepthStatus('READY');
  };

  const toggleCameraFacing = () => {
    setFacingMode((prev) => (prev === 'user' ? 'environment' : 'user'));
    if (isCameraActive) {
      stopCamera();
      setTimeout(() => void startCamera(), 300);
    }
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <View style={styles.container}>
      {/* ── Exercise Selector & Controls ── */}
      <View style={styles.controlBar}>
        <View style={styles.exerciseList}>
          {EXERCISES.map((ex) => (
            <Pressable
              key={ex.key}
              onPress={() => {
                setSelectedExercise(ex.key);
                resetWorkout();
              }}
              style={[
                styles.exerciseChip,
                selectedExercise === ex.key && styles.exerciseChipActive,
              ]}
            >
              <Text
                style={[
                  styles.exerciseChipText,
                  selectedExercise === ex.key && styles.exerciseChipTextActive,
                ]}
              >
                {ex.label}
              </Text>
            </Pressable>
          ))}
        </View>

        <View style={styles.subControlRow}>
          <Pressable
            onPress={() => setVoiceEnabled(!voiceEnabled)}
            style={[styles.smallBtn, voiceEnabled && styles.voiceActiveBtn]}
          >
            <Text style={styles.smallBtnText}>{voiceEnabled ? '🔊 AI Voice ON' : '🔇 Muted'}</Text>
          </Pressable>

          <Pressable onPress={toggleCameraFacing} style={styles.smallBtn}>
            <Text style={styles.smallBtnText}>🔄 Flip Cam</Text>
          </Pressable>

          <Pressable onPress={resetWorkout} style={styles.smallBtn}>
            <Text style={styles.smallBtnText}>↺ Reset</Text>
          </Pressable>
        </View>
      </View>

      {/* ── Viewport / Canvas ── */}
      <View style={styles.viewportWrapper}>
        {Platform.OS === 'web' && (
          <>
            <video
              ref={videoRef as any}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                transform: facingMode === 'user' ? 'scaleX(-1)' : 'none',
                position: 'absolute',
                top: 0,
                left: 0,
                borderRadius: 16,
              }}
              playsInline
              muted
            />
            <canvas
              ref={canvasRef as any}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                transform: facingMode === 'user' ? 'scaleX(-1)' : 'none',
                position: 'absolute',
                top: 0,
                left: 0,
                borderRadius: 16,
                pointerEvents: 'none',
              }}
            />
          </>
        )}

        {/* HUD Overlay */}
        <View style={styles.hudOverlay}>
          <View style={styles.hudTopRow}>
            <View style={styles.hudCard}>
              <Text style={styles.hudLabel}>REPS</Text>
              <Text style={styles.hudBigValue}>{repCount}</Text>
              <Text style={styles.hudSubLabel}>/ {targetReps} Target</Text>
            </View>

            <View style={styles.hudCard}>
              <Text style={styles.hudLabel}>SET</Text>
              <Text style={styles.hudBigValue}>{currentSet}</Text>
              <Text style={styles.hudSubLabel}>/ {targetSets} Total</Text>
            </View>

            <View style={styles.hudCard}>
              <Text style={styles.hudLabel}>ANGLE</Text>
              <Text style={styles.hudAngleValue}>{currentAngle}°</Text>
              <Text style={styles.hudSubLabel}>Live Joint</Text>
            </View>

            <View style={styles.hudCard}>
              <Text style={styles.hudLabel}>TIME</Text>
              <Text style={styles.hudValue}>{formatTime(elapsedSeconds)}</Text>
              <Text style={styles.hudSubLabel}>Workout</Text>
            </View>
          </View>

          {/* Form Banner */}
          <View style={styles.hudBottomBanner}>
            <View style={styles.depthTag}>
              <Text style={styles.depthText}>{depthStatus}</Text>
            </View>
            <Text style={styles.formFeedbackText}>{formFeedback}</Text>
          </View>
        </View>

        {/* Start / Stop CTA overlay if inactive */}
        {!isCameraActive && (
          <View style={styles.startOverlay}>
            <Text style={styles.startTitle}>⚡ Real-Time 60 FPS Pose Coach</Text>
            <Text style={styles.startDesc}>
              Runs 100% on your device camera with MediaPipe GPU tracking & AI Voice Coaching.
            </Text>
            <Pressable
              onPress={startCamera}
              disabled={isLoadingModel}
              style={styles.startBigBtn}
            >
              {isLoadingModel ? (
                <ActivityIndicator color="#000" />
              ) : (
                <Text style={styles.startBigBtnText}>START LIVE CAMERA 🎥</Text>
              )}
            </Pressable>
          </View>
        )}
      </View>

      {/* ── Active Action Bar ── */}
      {isCameraActive && (
        <View style={styles.activeBar}>
          <Pressable onPress={stopCamera} style={styles.stopBtn}>
            <Text style={styles.stopBtnText}>⏹ STOP WORKOUT</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: '#070B14',
  },
  controlBar: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#0D1424',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 212, 255, 0.2)',
  },
  exerciseList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 8,
  },
  exerciseChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  exerciseChipActive: {
    backgroundColor: 'rgba(0, 212, 255, 0.2)',
    borderColor: '#00D4FF',
  },
  exerciseChipText: {
    color: '#8A99AD',
    fontSize: 12,
    fontWeight: '700',
  },
  exerciseChipTextActive: {
    color: '#00D4FF',
    fontWeight: '900',
  },
  subControlRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  smallBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  voiceActiveBtn: {
    backgroundColor: 'rgba(57, 255, 20, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(57, 255, 20, 0.4)',
  },
  smallBtnText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '700',
  },
  viewportWrapper: {
    flex: 1,
    position: 'relative',
    margin: 12,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#000',
    borderWidth: 2,
    borderColor: 'rgba(0, 212, 255, 0.4)',
    minHeight: 400,
  },
  hudOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'space-between',
    padding: 12,
    pointerEvents: 'none',
  },
  hudTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 6,
  },
  hudCard: {
    flex: 1,
    backgroundColor: 'rgba(7, 11, 20, 0.85)',
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0, 212, 255, 0.3)',
    backdropFilter: 'blur(8px)',
  },
  hudLabel: {
    color: '#8A99AD',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  hudBigValue: {
    color: '#39FF14',
    fontSize: 22,
    fontWeight: '900',
    marginVertical: 2,
  },
  hudAngleValue: {
    color: '#00D4FF',
    fontSize: 18,
    fontWeight: '900',
    marginVertical: 2,
  },
  hudValue: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '900',
    marginVertical: 2,
  },
  hudSubLabel: {
    color: '#8A99AD',
    fontSize: 9,
  },
  hudBottomBanner: {
    backgroundColor: 'rgba(7, 11, 20, 0.9)',
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(0, 212, 255, 0.4)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  depthTag: {
    backgroundColor: '#00D4FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  depthText: {
    color: '#000',
    fontSize: 11,
    fontWeight: '900',
  },
  formFeedbackText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '700',
    flex: 1,
  },
  startOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(7, 11, 20, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    gap: 16,
  },
  startTitle: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: '900',
    textAlign: 'center',
  },
  startDesc: {
    color: '#8A99AD',
    fontSize: 13,
    textAlign: 'center',
    maxWidth: 320,
    lineHeight: 18,
  },
  startBigBtn: {
    backgroundColor: '#00D4FF',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
    shadowColor: '#00D4FF',
    shadowOpacity: 0.8,
    shadowRadius: 15,
    elevation: 8,
  },
  startBigBtnText: {
    color: '#000',
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 1,
  },
  activeBar: {
    padding: 12,
    backgroundColor: '#0D1424',
    alignItems: 'center',
  },
  stopBtn: {
    backgroundColor: '#FF3B30',
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 10,
  },
  stopBtnText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 1,
  },
});
