'use client';

import { Mic, MicOff, Loader2, AlertCircle } from 'lucide-react';
import { useSpeechRecognition } from '@/lib/hooks/useSpeechRecognition';
import { useSpeechSynthesis } from '@/lib/hooks/useSpeechSynthesis';
import { parseVoiceCommand, generateVoiceResponse } from '@/lib/utils/taskParser';
import { useToast } from '@/components/ui/Toast';
import { useTasks } from '@/lib/hooks/useTasks';
import { Task } from '@/types';
import { useState, useEffect, useCallback } from 'react';
import { getErrorMessage, logError } from '@/lib/errors';

interface VoiceRecorderProps {
  tasks: Task[];
  onTaskAction?: () => void;
}

export function VoiceRecorder({ tasks, onTaskAction }: VoiceRecorderProps) {
  const { speak } = useSpeechSynthesis();
  const { success: showSuccess, error: showError } = useToast();
  const { createTask } = useTasks();
  
  const {
    isListening,
    transcript,
    interimTranscript,
    startListening,
    stopListening,
    resetTranscript,
    error: voiceError,
    isSupported,
  } = useSpeechRecognition();
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastAction, setLastAction] = useState<string | null>(null);

  // Process transcript when user stops speaking
  const processVoiceCommand = useCallback(async (text: string) => {
    if (!text.trim()) return;

    setIsProcessing(true);
    setLastAction(null);
    
    const command = parseVoiceCommand(text);
    let success = false;
    let actionMessage = '';

    try {
      switch (command.action) {
        case 'add':
          if (command.taskTitle) {
            await createTask({
              title: command.taskTitle,
              priority: command.priority || 'medium',
              voiceTranscript: command.originalTranscript
            });
            success = true;
            actionMessage = `Added: ${command.taskTitle}`;
          } else {
            speak("I couldn't understand the task title. Please try again.");
          }
          break;

        case 'list':
          success = true;
          const taskCount = tasks.length;
          const pendingCount = tasks.filter(t => t.status !== 'completed').length;
          const message = `You have ${taskCount} task${taskCount !== 1 ? 's' : ''}, ${pendingCount} ${pendingCount !== 1 ? 'are' : 'is'} pending.`;
          speak(message);
          actionMessage = `Listed ${taskCount} tasks`;
          break;

        default:
          speak("I didn't understand that command. Try saying 'add task' followed by your task name, or 'list my tasks'.");
          break;
      }

      if (success) {
        setLastAction(actionMessage);
        
        if (command.action !== 'list') {
          const response = generateVoiceResponse(command, true);
          speak(response);
          showSuccess(actionMessage);
        }
        
        onTaskAction?.();
      }
    } catch (err) {
      const errorMessage = getErrorMessage(err);
      logError(err, { context: 'processVoiceCommand', command });
      speak('Sorry, there was an error processing your command. Please try again.');
      showError(errorMessage);
    } finally {
      setIsProcessing(false);
      resetTranscript();
    }
  }, [createTask, tasks, speak, showSuccess, showError, onTaskAction, resetTranscript]);

  // Process transcript when user stops speaking
  useEffect(() => {
    if (!isListening && transcript && !isProcessing) {
      processVoiceCommand(transcript);
    }
  }, [isListening, transcript, isProcessing, processVoiceCommand]);

  const handleToggleListening = useCallback(() => {
    if (isProcessing) return;
    
    if (isListening) {
      stopListening();
    } else {
      setLastAction(null);
      startListening();
    }
  }, [isListening, isProcessing, startListening, stopListening]);

  // Handle keyboard shortcut (Space to toggle when focused)
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      handleToggleListening();
    }
  }, [handleToggleListening]);

  if (!isSupported) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4" role="alert">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-medium text-yellow-800">Voice recognition not supported</h3>
            <p className="text-sm text-yellow-700 mt-1">
              Your browser doesn&apos;t support voice recognition. 
              Please use Chrome, Edge, or Safari for voice features.
              You can still add tasks manually using the form below.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl shadow-lg p-6 border border-indigo-100">
      {/* Section Header */}
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
          <Mic className="w-4 h-4 text-white" aria-hidden="true" />
        </div>
        <h3 className="font-semibold text-gray-900">Voice Input</h3>
      </div>
      
      <div className="flex flex-col items-center gap-4">
        {/* Microphone Button */}
        <button
          onClick={handleToggleListening}
          onKeyDown={handleKeyDown}
          disabled={isProcessing}
          aria-label={isListening ? 'Stop listening' : 'Start voice command'}
          aria-pressed={isListening}
          className={`
            relative w-20 h-20 rounded-full flex items-center justify-center
            transition-all duration-300 transform hover:scale-105
            focus:outline-none focus:ring-4 focus:ring-offset-2
            ${isListening 
              ? 'bg-red-500 hover:bg-red-600 shadow-lg shadow-red-500/50 focus:ring-red-300' 
              : 'bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-500/50 focus:ring-indigo-300'
            }
            ${isProcessing ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
          `}
        >
          {isProcessing ? (
            <Loader2 className="w-8 h-8 text-white animate-spin" aria-hidden="true" />
          ) : isListening ? (
            <MicOff className="w-8 h-8 text-white" aria-hidden="true" />
          ) : (
            <Mic className="w-8 h-8 text-white" aria-hidden="true" />
          )}
          
          {/* Pulsing animation when listening */}
          {isListening && !isProcessing && (
            <>
              <span className="absolute w-full h-full rounded-full bg-red-500 animate-ping opacity-30" aria-hidden="true" />
              <span className="absolute w-24 h-24 rounded-full border-2 border-red-500 animate-pulse" aria-hidden="true" />
            </>
          )}
        </button>

        {/* Status Text */}
        <div className="text-center" aria-live="polite" aria-atomic="true">
          <p className="text-lg font-medium text-gray-800">
            {isProcessing 
              ? 'Processing your command...' 
              : isListening 
                ? 'Listening... Speak now' 
                : 'Tap to start voice command'}
          </p>
          <p className="text-sm text-gray-500 mt-1">
            Try: &ldquo;Add task buy groceries&rdquo; or &ldquo;List my tasks&rdquo;
          </p>
        </div>

        {/* Transcript Display */}
        {(transcript || interimTranscript) && (
          <div className="w-full bg-gray-50 rounded-lg p-4 mt-2" aria-live="polite">
            <p className="text-sm text-gray-500 mb-1">You said:</p>
            <p className="text-gray-800">
              {transcript}
              <span className="text-gray-400 italic">{interimTranscript}</span>
            </p>
          </div>
        )}

        {/* Last Action */}
        {lastAction && !transcript && !interimTranscript && (
          <div className="w-full bg-green-50 border border-green-200 rounded-lg p-3 mt-2" role="status">
            <p className="text-sm text-green-700 text-center font-medium">✓ {lastAction}</p>
          </div>
        )}

        {/* Error Display */}
        {voiceError && (
          <div className="w-full bg-red-50 border border-red-200 rounded-lg p-3 mt-2" role="alert">
            <p className="text-sm text-red-600 text-center">
              {voiceError === 'not-allowed' 
                ? 'Microphone access denied. Please enable microphone permissions in your browser settings.'
                : voiceError === 'no-speech'
                  ? 'No speech detected. Please try speaking again.'
                  : `Error: ${voiceError}. Please try again.`
              }
            </p>
          </div>
        )}

        {/* Voice Commands Help */}
        <details className="w-full mt-2">
          <summary className="text-sm text-indigo-600 cursor-pointer hover:text-indigo-800 font-medium">
            Available voice commands
          </summary>
          <div className="mt-2 text-sm text-gray-700 bg-white rounded-lg p-3 space-y-1 border border-gray-100">
            <p><strong className="text-indigo-600">&ldquo;Add task [name]&rdquo;</strong> - Create a new task</p>
            <p><strong className="text-indigo-600">&ldquo;Add urgent task [name]&rdquo;</strong> - Create high priority task</p>
            <p><strong className="text-indigo-600">&ldquo;List my tasks&rdquo;</strong> - Hear task summary</p>
          </div>
        </details>
      </div>
    </div>
  );
}
