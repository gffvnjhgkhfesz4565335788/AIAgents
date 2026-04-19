import { useParams, useNavigate } from 'react-router-dom';
import { getAgentById } from '../data/agents';
import { useLiveAPI } from '../lib/useLiveAPI';
import { useEffect, useRef, useState } from 'react';
import { Mic, MicOff, Video, VideoOff, PhoneOff, ArrowLeft, Loader2, Info, Sparkles, SwitchCamera } from 'lucide-react';
import { motion } from 'motion/react';

export default function AgentRoom() {
  const { agentId } = useParams();
  const navigate = useNavigate();
  const agent = getAgentById(agentId || '');
  
  const { connect, disconnect, connected, error, videoRef, canvasRef, switchCamera, facingMode, transcription } = useLiveAPI({
    systemInstruction: agent?.systemPrompt || 'You are a helpful assistant.',
    tools: agent?.tools
  });

  const [hasStarted, setHasStarted] = useState(false);
  const [isVideoMuted, setIsVideoMuted] = useState(false);
  const [isAudioMuted, setIsAudioMuted] = useState(false);

  useEffect(() => {
    return () => {
      disconnect();
    };
  }, []);

  if (!agent) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8">
        <h2 className="text-2xl font-semibold mb-4 text-gray-900">Agent not found</h2>
        <button onClick={() => navigate('/')} className="text-blue-600 hover:underline">
          Go back home
        </button>
      </div>
    );
  }

  const handleStart = async () => {
    setHasStarted(true);
    await connect();
  };

  const handleEnd = () => {
    disconnect();
    navigate('/');
  };

  const toggleVideo = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getVideoTracks().forEach(track => {
        track.enabled = !track.enabled;
        setIsVideoMuted(!track.enabled);
      });
    }
  };

  const toggleAudio = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getAudioTracks().forEach(track => {
        track.enabled = !track.enabled;
        setIsAudioMuted(!track.enabled);
      });
    }
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-2 sm:p-4 md:p-8 relative bg-gray-50 overflow-hidden w-full h-[calc(100dvh-4rem)]">
      {/* Background decoration */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden hidden md:block">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-100 rounded-full blur-3xl opacity-50 mix-blend-multiply"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-100 rounded-full blur-3xl opacity-50 mix-blend-multiply"></div>
      </div>

      <div className="w-full max-w-5xl bg-white rounded-2xl md:rounded-3xl shadow-xl overflow-hidden flex flex-col md:flex-row relative z-10 md:border border-gray-100 flex-1 h-full">
        
        {/* Left Side: Info */}
        <div className="w-full md:w-1/3 p-4 md:p-8 border-t md:border-t-0 md:border-r border-gray-100 flex flex-col bg-gray-50/50 order-2 md:order-1 shrink-0 overflow-y-auto max-h-[35vh] md:max-h-none">
          <div className="flex items-center justify-between mb-3 md:mb-8">
            <button 
              onClick={() => navigate('/')}
              className="flex items-center text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors py-2"
            >
              <ArrowLeft className="w-4 h-4 mr-1" /> Back
            </button>
            <div className="md:hidden flex items-center justify-center shrink-0">
              <span className="text-3xl">{agent.emoji}</span>
            </div>
          </div>
          
          <div className="flex-1 flex flex-col">
            <div className="hidden md:flex items-center justify-center mb-6 shrink-0">
              <span className="text-6xl">{agent.emoji}</span>
            </div>
            
            <h1 className="text-xl md:text-2xl font-bold tracking-tight text-gray-900 mb-1 md:mb-2">
              {agent.name}
            </h1>
            <p className="text-sm md:text-base text-gray-600 mb-6 md:mb-8 line-clamp-2 md:line-clamp-none">
              {agent.specialty}
            </p>

            {/* Stats */}
            <div className="space-y-5 mb-8">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Agent Capabilities</h3>
              {agent.stats.map((stat) => (
                <div key={stat.label}>
                  <div className="flex justify-between items-center mb-1.5">
                    <span className="text-xs font-semibold text-gray-600 uppercase tracking-wider">{stat.label}</span>
                    <span className="text-xs font-bold text-blue-600">{stat.value}%</span>
                  </div>
                  <div className="h-1.5 w-full bg-gray-200 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${stat.value}%` }}
                      transition={{ duration: 1.2, ease: "easeOut" }}
                      className="h-full bg-blue-600 rounded-full shadow-[0_0_8px_rgba(37,99,235,0.4)]"
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-auto bg-blue-50 text-blue-800 text-xs md:text-sm p-3 md:p-4 rounded-xl flex items-start gap-2 md:gap-3">
              <Info className="w-4 h-4 md:w-5 md:h-5 shrink-0 mt-0.5" />
              <p>This agent uses AI Studio Live API. It can see your camera and hear your microphone in real-time.</p>
            </div>
          </div>
        </div>

        {/* Right Side: Camera & Controls */}
        <div className="w-full md:w-2/3 p-2 pt-4 md:p-8 flex flex-col relative bg-black order-1 md:order-2 flex-1 min-h-0">
          
          <div className="flex-1 rounded-xl md:rounded-2xl bg-gray-900 overflow-hidden relative shadow-inner">
            {!hasStarted ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center px-4 text-center">
                <div className="w-16 h-16 md:w-20 md:h-20 bg-gray-800 rounded-full flex items-center justify-center mb-4 md:mb-6 shadow-2xl">
                  <Video className="w-8 h-8 md:w-10 md:h-10 text-gray-400" />
                </div>
                <h3 className="text-lg md:text-xl font-medium text-white mb-2">Ready to start?</h3>
                <p className="text-sm md:text-base text-gray-400 mb-6 md:mb-8 max-w-sm">
                  Allow camera and microphone permissions to begin the live session with your agent.
                </p>
                <button
                  onClick={handleStart}
                  className="px-6 py-3 md:px-8 bg-white text-gray-900 rounded-full font-semibold hover:bg-gray-100 transition-transform active:scale-95 flex items-center gap-2 text-sm md:text-base"
                >
                  <Sparkles className="w-4 h-4 md:w-5 md:h-5" /> Start Live Session
                </button>
              </div>
            ) : (
              <>
                <video
                  ref={videoRef}
                  className={`absolute inset-0 w-full h-full object-cover ${facingMode === 'user' ? 'scale-x-[-1]' : ''}`}
                  autoPlay
                  playsInline
                  muted
                />
                
                {/* Transcription Overlay */}
                <div className="absolute inset-0 flex flex-col justify-end p-4 pointer-events-none">
                  <div className="max-w-2xl mx-auto w-full space-y-2 pb-6">
                    {transcription.map((entry) => (
                      <motion.div
                        key={entry.id}
                        initial={{ opacity: 0, scale: 0.95, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        className={`p-2 rounded-lg text-sm md:text-base font-medium backdrop-blur-md shadow-lg border ${
                          entry.role === 'user' 
                            ? 'bg-blue-500/20 text-blue-100 self-end border-blue-500/30' 
                            : 'bg-black/40 text-white self-start border-white/10'
                        } max-w-[85%]`}
                      >
                        {entry.text}
                      </motion.div>
                    ))}
                  </div>
                </div>
                {!connected && !error && (
                  <div className="absolute inset-0 bg-black/50 backdrop-blur-sm flex flex-col items-center justify-center">
                    <Loader2 className="w-8 h-8 md:w-10 md:h-10 text-white animate-spin mb-4" />
                    <p className="text-white text-sm md:text-base font-medium">Connecting to Agent...</p>
                  </div>
                )}
                {error && (
                  <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center p-4 md:p-6 text-center">
                    <div className="w-12 h-12 md:w-16 md:h-16 bg-red-500/20 text-red-500 rounded-full flex items-center justify-center mb-3 md:mb-4">
                      <Info className="w-6 h-6 md:w-8 md:h-8" />
                    </div>
                    <h3 className="text-lg md:text-xl font-medium text-white mb-2">Connection Error</h3>
                    <p className="text-sm md:text-base text-red-300 max-w-md">{error}</p>
                    <button
                      onClick={handleStart}
                      className="mt-4 md:mt-6 px-6 py-2 bg-white/10 text-white text-sm md:text-base rounded-full hover:bg-white/20 transition-colors border border-white/20"
                    >
                      Try Again
                    </button>
                  </div>
                )}
              </>
            )}
            
            {/* Hidden canvas for extracting frames */}
            <canvas ref={canvasRef} style={{ display: 'none' }} />
          </div>

          {/* Controls Bar */}
          {hasStarted && (
            <motion.div 
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="mt-4 md:mt-8 flex items-center justify-center gap-4 md:gap-6 pb-2 md:pb-0"
            >
              <button
                onClick={toggleAudio}
                className={`w-12 h-12 md:w-14 md:h-14 rounded-full flex items-center justify-center border-2 transition-colors ${
                  isAudioMuted 
                    ? 'bg-red-500 border-red-500 text-white hover:bg-red-600 hover:border-red-600' 
                    : 'bg-gray-800 border-gray-700 text-white hover:bg-gray-700'
                }`}
              >
                {isAudioMuted ? <MicOff className="w-5 h-5 md:w-6 md:h-6" /> : <Mic className="w-5 h-5 md:w-6 md:h-6" />}
              </button>
              
              <button
                onClick={handleEnd}
                className="w-14 h-14 md:w-16 md:h-16 rounded-full bg-red-600 hover:bg-red-700 flex items-center justify-center text-white shadow-lg shadow-red-600/20 transition-transform active:scale-95"
              >
                <PhoneOff className="w-6 h-6 md:w-7 md:h-7" />
              </button>

              <button
                onClick={toggleVideo}
                className={`w-12 h-12 md:w-14 md:h-14 rounded-full flex items-center justify-center border-2 transition-colors ${
                  isVideoMuted 
                    ? 'bg-red-500 border-red-500 text-white hover:bg-red-600 hover:border-red-600' 
                    : 'bg-gray-800 border-gray-700 text-white hover:bg-gray-700'
                }`}
              >
                {isVideoMuted ? <VideoOff className="w-5 h-5 md:w-6 md:h-6" /> : <Video className="w-5 h-5 md:w-6 md:h-6" />}
              </button>

              <button
                onClick={switchCamera}
                title="Switch Camera"
                className="w-12 h-12 md:w-14 md:h-14 rounded-full flex items-center justify-center border-2 bg-gray-800 border-gray-700 text-white hover:bg-gray-700 transition-colors"
              >
                <SwitchCamera className="w-5 h-5 md:w-6 md:h-6" />
              </button>
            </motion.div>
          )}

        </div>
      </div>
    </div>
  );
}
