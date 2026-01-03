'use client';

import { useState, useCallback } from 'react';
import { Mic, MicOff, Loader2 } from 'lucide-react';

interface MicButtonProps {
  onRecordingComplete: (audioBlob: Blob) => void;
  isProcessing?: boolean;
  disabled?: boolean;
}

export default function MicButton({ 
  onRecordingComplete, 
  isProcessing = false,
  disabled = false 
}: MicButtonProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [showShockwave, setShowShockwave] = useState(false);

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100,
        } 
      });
      
      const recorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported('audio/webm;codecs=opus') 
          ? 'audio/webm;codecs=opus' 
          : 'audio/webm',
      });
      
      const chunks: Blob[] = [];
      
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunks.push(e.data);
        }
      };
      
      recorder.onstop = () => {
        const audioBlob = new Blob(chunks, { type: 'audio/webm' });
        onRecordingComplete(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };
      
      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);
      
      // Animation onde de choc
      setShowShockwave(true);
      setTimeout(() => setShowShockwave(false), 600);
    } catch (error) {
      console.error('Erreur accès micro:', error);
      alert('Impossible d\'accéder au microphone. Vérifiez les permissions.');
    }
  }, [onRecordingComplete]);

  const stopRecording = useCallback(() => {
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      mediaRecorder.stop();
      setIsRecording(false);
      setMediaRecorder(null);
      
      // Animation onde de choc
      setShowShockwave(true);
      setTimeout(() => setShowShockwave(false), 600);
    }
  }, [mediaRecorder]);

  const handleClick = () => {
    if (disabled || isProcessing) return;
    
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  return (
    <div className="relative flex flex-col items-center gap-4">
      {/* Bouton principal */}
      <button
        onClick={handleClick}
        disabled={disabled || isProcessing}
        className={`
          relative w-24 h-24 rounded-full 
          flex items-center justify-center
          transition-all duration-300 ease-out
          ${isRecording 
            ? 'bg-red-500 pulse-recording' 
            : 'bg-white hover:bg-gray-100'
          }
          ${disabled || isProcessing ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
          ${showShockwave ? 'shockwave-active' : ''}
        `}
        aria-label={isRecording ? 'Arrêter l\'enregistrement' : 'Démarrer l\'enregistrement'}
      >
        {isProcessing ? (
          <Loader2 className="w-10 h-10 text-black animate-spin" />
        ) : isRecording ? (
          <MicOff className="w-10 h-10 text-white" />
        ) : (
          <Mic className="w-10 h-10 text-black" />
        )}
        
        {/* Cercles d'animation pour l'onde de choc */}
        {showShockwave && (
          <>
            <span className="absolute inset-0 rounded-full bg-white/30 animate-ping" />
            <span className="absolute inset-[-10px] rounded-full border-2 border-white/50 animate-ping" style={{ animationDelay: '0.1s' }} />
          </>
        )}
      </button>

      {/* Indicateur visuel d'enregistrement */}
      {isRecording && (
        <div className="flex items-center gap-1">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="w-1 bg-red-500 rounded-full audio-bar"
              style={{ 
                animationDelay: `${i * 0.1}s`,
                height: '4px',
              }}
            />
          ))}
        </div>
      )}

      {/* Texte d'état */}
      <p className="text-sm text-gray-400 text-center">
        {isProcessing 
          ? 'Traitement en cours...' 
          : isRecording 
            ? 'Parlez maintenant...' 
            : 'Cliquez pour dicter'
        }
      </p>
    </div>
  );
}
