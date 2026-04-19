import { useState, useEffect, useRef } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality, ThinkingLevel } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export type TranscriptionEntry = {
  text: string;
  role: 'user' | 'model';
  id: string;
};

// Using ScriptProcessorNode for simplicity of inline definition in Vite
export function useLiveAPI({ systemInstruction, tools }: { systemInstruction: string, tools?: any[] }) {
  const [session, setSession] = useState<any>(null);
  const [connected, setConnected] = useState(false);
  const connectedRef = useRef(false);
  const [transcription, setTranscription] = useState<TranscriptionEntry[]>([]);
  const transcriptionRef = useRef<TranscriptionEntry[]>([]);
  
  useEffect(() => {
    connectedRef.current = connected;
  }, [connected]);

  const [error, setError] = useState<string | null>(null);

  const audioContextRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const audioQueueRef = useRef<Float32Array[]>([]);
  const isPlayingRef = useRef(false);
  const nextPlayTimeRef = useRef(0);
  
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const videoIntervalRef = useRef<number | null>(null);
  
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');

  const addTranscription = (text: string, role: 'user' | 'model') => {
    const newEntry = { text, role, id: Math.random().toString(36).substring(7) };
    const updated = [...transcriptionRef.current, newEntry].slice(-6); // Keep last 6 lines
    transcriptionRef.current = updated;
    setTranscription(updated);
  };
  
  const connect = async () => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      audioContextRef.current = audioContext;

      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: true, 
        video: { facingMode: facingMode } 
      });
      streamRef.current = stream;

      const source = audioContext.createMediaStreamSource(stream);
      const processor = audioContext.createScriptProcessor(4096, 1, 1);
      processorRef.current = processor;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }

      processor.onaudioprocess = (e) => {
        const inputData = e.inputBuffer.getChannelData(0);
        // Convert Float32Array to PCM16
        const pcm16 = new Int16Array(inputData.length);
        for (let i = 0; i < inputData.length; i++) {
          pcm16[i] = Math.max(-1, Math.min(1, inputData[i])) * 0x7FFF;
        }
        // Convert to base64
        const buffer = new ArrayBuffer(pcm16.length * 2);
        const view = new DataView(buffer);
        for (let i = 0; i < pcm16.length; i++) {
          view.setInt16(i * 2, pcm16[i], true);
        }
        const bytes = new Uint8Array(buffer);
        let binary = '';
        for (let i = 0; i < bytes.byteLength; i++) {
          binary += String.fromCharCode(bytes[i]);
        }
        const base64Data = btoa(binary);

        sessionPromise.then((session) => {
          if (connectedRef.current) {
             session.sendRealtimeInput({
               audio: { data: base64Data, mimeType: 'audio/pcm;rate=16000' }
             });
          }
        }).catch(()=> {});
      };
      
      const sessionPromise = ai.live.connect({
        model: "gemini-3.1-flash-live-preview",
        callbacks: {
          onopen: () => {
             setConnected(true);
             setError(null);
             source.connect(processor);
             processor.connect(audioContext.destination);

             // Start video interval
             videoIntervalRef.current = window.setInterval(() => {
               if (!videoRef.current || !canvasRef.current || !connectedRef.current) return;
               const video = videoRef.current;
               const canvas = canvasRef.current;
               if (video.videoWidth === 0 || video.videoHeight === 0) return;
               
               Object.assign(canvas, { width: video.videoWidth, height: video.videoHeight });
               const ctx = canvas.getContext('2d');
               if (ctx) {
                  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                  const dataUrl = canvas.toDataURL('image/jpeg', 0.5); // reduced quality for speed
                  const base64Data = dataUrl.split(',')[1];
                  
                  // Wrap in session.sendRealtimeInput
                  sessionPromise.then(s => {
                    s.sendRealtimeInput({
                      video: { data: base64Data, mimeType: 'image/jpeg' }
                     });
                  });
               }
             }, 1000); // Send 1 frame per second
          },
          onmessage: async (message: LiveServerMessage) => {
            const content = message.serverContent;
            
            // Handle model turn and parts (can have multiple parts in one event in 3.1)
            if (content?.modelTurn?.parts) {
              for (const part of content.modelTurn.parts) {
                if (part.text) {
                  addTranscription(part.text, 'model');
                }
                if (part.inlineData?.data) {
                  playAudio(part.inlineData.data);
                }
              }
            }

            // Handle transcriptions
            if (content?.inputTranscription) {
              addTranscription(content.inputTranscription.text, 'user');
            }

            // Handle interruption
            if (content?.interrupted) {
               audioQueueRef.current = [];
               isPlayingRef.current = false;
               // Reset next play time to allow immediate new audio
               if (audioContextRef.current) {
                 nextPlayTimeRef.current = audioContextRef.current.currentTime;
               }
            }
          },
          onclose: () => {
            setConnected(false);
          },
          onerror: (err: any) => {
            setError(err.message || 'Connection error');
          }
        },
        config: {
          responseModalities: [Modality.AUDIO],
          outputAudioTranscription: {},
          inputAudioTranscription: {},
          thinkingConfig: {
            thinkingLevel: ThinkingLevel.LOW,
            includeThoughts: true,
          },
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: "Aoede" } },
          },
          systemInstruction,
          tools: tools || [{ googleSearch: {} }]
        },
      });

      sessionPromise.then(s => setSession(s));

    } catch (err: any) {
      setError(err.message);
      setConnected(false);
    }
  };

  const playAudio = (base64Data: string) => {
     if (!audioContextRef.current) return;
     const binaryString = atob(base64Data);
     const bytes = new Uint8Array(binaryString.length);
     for (let i = 0; i < binaryString.length; i++) {
       bytes[i] = binaryString.charCodeAt(i);
     }
     const pcm16 = new Int16Array(bytes.buffer);
     const float32 = new Float32Array(pcm16.length);
     for (let i = 0; i < pcm16.length; i++) {
       float32[i] = pcm16[i] / 0x8000;
     }
     
     const audioBuffer = audioContextRef.current.createBuffer(1, float32.length, 24000); // Output is 24000Hz PCM
     audioBuffer.getChannelData(0).set(float32);
     
     const source = audioContextRef.current.createBufferSource();
     source.buffer = audioBuffer;
     source.connect(audioContextRef.current.destination);
     
     const currentTime = audioContextRef.current.currentTime;
     if (nextPlayTimeRef.current < currentTime) {
       nextPlayTimeRef.current = currentTime;
     }
     source.start(nextPlayTimeRef.current);
     nextPlayTimeRef.current += audioBuffer.duration;
  };

  const disconnect = () => {
    if (session) {
       session.close();
    }
    setConnected(false);
    
    if (streamRef.current) {
       streamRef.current.getTracks().forEach(track => track.stop());
    }
    if (processorRef.current) {
       processorRef.current.disconnect();
    }
    if (audioContextRef.current) {
       audioContextRef.current.close();
    }
    if (videoIntervalRef.current) {
       clearInterval(videoIntervalRef.current);
    }
  };

  const switchCamera = async () => {
    if (!streamRef.current) return;
    
    try {
      const newMode = facingMode === 'user' ? 'environment' : 'user';
      const newStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: newMode }
      });
      
      const oldVideoTrack = streamRef.current.getVideoTracks()[0];
      const newVideoTrack = newStream.getVideoTracks()[0];
      
      if (oldVideoTrack) {
        streamRef.current.removeTrack(oldVideoTrack);
        oldVideoTrack.stop();
      }
      
      streamRef.current.addTrack(newVideoTrack);
      
      if (videoRef.current) {
        videoRef.current.srcObject = streamRef.current;
        await videoRef.current.play();
      }
      
      setFacingMode(newMode);
    } catch (err) {
      console.error("Failed to switch camera", err);
    }
  };

  useEffect(() => {
    return () => {
      disconnect();
    };
  }, []);

  return {
    connect,
    disconnect,
    switchCamera,
    facingMode,
    connected,
    error,
    videoRef,
    canvasRef,
    transcription
  };
}
