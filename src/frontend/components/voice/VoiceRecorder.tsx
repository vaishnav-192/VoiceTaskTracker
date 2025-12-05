'use client';

import { Mic, MicOff, Loader2, AlertCircle } from 'lucide-react';
import { useSpeechRecognition } from '@/backend/hooks/useSpeechRecognition';
import { useSpeechSynthesis } from '@/backend/hooks/useSpeechSynthesis';
import { parseVoiceCommand, parseTaskFromVoice, generateVoiceResponse } from '@/backend/utils/taskParser';
import { useToast } from '@/frontend/components/ui/Toast';
import { useTasks } from '@/backend/hooks/useTasks';
import { Task, ParsedTaskData } from '@/shared/types';
import { useState, useEffect, useCallback } from 'react';
import { getErrorMessage, logError } from '@/backend/errors';
import { TaskReviewModal } from './TaskReviewModal';

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
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [parsedTask, setParsedTask] = useState<ParsedTaskData | null>(null);

  // Handle task creation after review
  const handleConfirmTask = useCallback(async (task: ParsedTaskData) => {
    setShowReviewModal(false);
    setIsProcessing(true);
    
    try {
      await createTask({
        title: task.title,
        priority: task.priority,
        status: task.status,
        dueDate: task.dueDate,
        dueTime: task.dueTime,
        voiceTranscript: task.originalTranscript,
      });
      
      const actionMessage = `Added: ${task.title}`;
      setLastAction(actionMessage);
      speak(`Task "${task.title}" has been added.`);
      showSuccess(actionMessage);
      onTaskAction?.();
    } catch (err) {
      const errorMessage = getErrorMessage(err);
      logError(err, { context: 'handleConfirmTask', task });
      speak('Sorry, there was an error creating the task. Please try again.');
      showError(errorMessage);
    } finally {
      setIsProcessing(false);
      setParsedTask(null);
      resetTranscript();
    }
  }, [createTask, speak, showSuccess, showError, onTaskAction, resetTranscript]);

  const handleCancelReview = useCallback(() => {
    setShowReviewModal(false);
    setParsedTask(null);
    resetTranscript();
  }, [resetTranscript]);

  // Process transcript when user stops speaking
  const processVoiceCommand = useCallback(async (text: string) => {
    if (!text.trim()) return;

    setLastAction(null);
    
    const command = parseVoiceCommand(text);

    try {
      switch (command.action) {
        case 'add':
          if (command.taskTitle) {
            // Parse the task and show review modal
            const parsed = parseTaskFromVoice(text);
            setParsedTask(parsed);
            setShowReviewModal(true);
          } else {
            speak("I couldn't understand the task title. Please try again.");
            resetTranscript();
          }
          break;

        case 'list':
          const taskCount = tasks.length;
          const pendingCount = tasks.filter(t => t.status !== 'completed').length;
          const message = `You have ${taskCount} task${taskCount !== 1 ? 's' : ''}, ${pendingCount} ${pendingCount !== 1 ? 'are' : 'is'} pending.`;
          speak(message);
          setLastAction(`Listed ${taskCount} tasks`);
          resetTranscript();
          break;

        default:
          speak("I didn't understand that command. Try saying 'add task' followed by your task name, or 'list my tasks'.");
          resetTranscript();
          break;
      }
    } catch (err) {
      const errorMessage = getErrorMessage(err);
      logError(err, { context: 'processVoiceCommand', command });
      speak('Sorry, there was an error processing your command. Please try again.');
      showError(errorMessage);
      resetTranscript();
    }
  }, [tasks, speak, showError, resetTranscript]);

  // Process transcript when user stops speaking
  useEffect(() => {
    if (!isListening && transcript && !isProcessing && !showReviewModal) {
      processVoiceCommand(transcript);
    }
  }, [isListening, transcript, isProcessing, showReviewModal, processVoiceCommand]);

  const handleToggleListening = useCallback(() => {
    if (isProcessing || showReviewModal) return;
    
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
      <div className="glass-card rounded-xl p-4" role="alert">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-medium text-yellow-800">Voice recognition not supported</h3>
            <p className="text-sm text-yellow-700 mt-1">
              Your browser doesn&apos;t support voice recognition. 
              Please use Chrome, Edge, or Safari for voice features.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="glass-indigo rounded-2xl p-4 h-full">
      {/* Task Review Modal */}
      {parsedTask && (
        <TaskReviewModal
          isOpen={showReviewModal}
          parsedTask={parsedTask}
          onConfirm={handleConfirmTask}
          onCancel={handleCancelReview}
        />
      )}

      {/* Section Header */}
      <div className="flex items-center gap-2 mb-3">
        <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-500/30">
          <Mic className="w-4 h-4 text-white" aria-hidden="true" />
        </div>
        <h3 className="font-semibold text-gray-800">Voice Input</h3>
      </div>
      
      <div className="flex items-center gap-4">
        {/* Microphone Button - Smaller */}
        <button
          onClick={handleToggleListening}
          onKeyDown={handleKeyDown}
          disabled={isProcessing}
          aria-label={isListening ? 'Stop listening' : 'Start voice command'}
          aria-pressed={isListening}
          className={`
            relative w-16 h-16 rounded-full flex items-center justify-center flex-shrink-0
            transition-all duration-300 transform hover:scale-105
            focus:outline-none focus:ring-4 focus:ring-offset-2
            ${isListening 
              ? 'bg-gradient-to-br from-red-500 to-rose-600 shadow-lg shadow-red-500/40 focus:ring-red-300' 
              : 'bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg shadow-indigo-500/40 focus:ring-indigo-300'
            }
            ${isProcessing ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
          `}
        >
          {isProcessing ? (
            <Loader2 className="w-6 h-6 text-white animate-spin" aria-hidden="true" />
          ) : isListening ? (
            <MicOff className="w-6 h-6 text-white" aria-hidden="true" />
          ) : (
            <Mic className="w-6 h-6 text-white" aria-hidden="true" />
          )}
          
          {/* Pulsing animation when listening */}
          {isListening && !isProcessing && (
            <>
              <span className="absolute w-full h-full rounded-full bg-red-500 animate-ping opacity-30" aria-hidden="true" />
            </>
          )}
        </button>

        {/* Status & Transcript - Compact */}
        <div className="flex-1 min-w-0" aria-live="polite" aria-atomic="true">
          <p className="text-sm font-medium text-gray-800">
            {isProcessing 
              ? 'Processing...' 
              : isListening 
                ? '🎤 Listening... Speak now' 
                : 'Tap mic to speak'}
          </p>
          <p className="text-xs text-gray-500 mt-0.5 truncate">
            Try: &ldquo;Add task buy groceries tomorrow&rdquo;
          </p>
          
          {/* Inline Transcript */}
          {(transcript || interimTranscript) && (
            <div className="mt-2 p-2 bg-white/60 rounded-lg text-sm">
              <span className="text-gray-700">{transcript}</span>
              <span className="text-gray-400 italic">{interimTranscript}</span>
            </div>
          )}

          {/* Last Action - Inline */}
          {lastAction && !transcript && !interimTranscript && (
            <div className="mt-2 text-xs text-green-700 font-medium">
              ✓ {lastAction}
            </div>
          )}

          {/* Error - Inline with better messages */}
          {voiceError && (
            <div className="mt-2 text-xs text-red-600 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              <span>{voiceError}</span>
            </div>
          )}
        </div>
      </div>

      {/* Voice Commands Help - Collapsible */}
      <details className="mt-3">
        <summary className="text-xs text-indigo-600 cursor-pointer hover:text-indigo-800 font-medium">
          Voice commands help
        </summary>
        <div className="mt-2 text-xs text-gray-600 bg-white/50 rounded-lg p-2 space-y-0.5">
          <p><strong>&ldquo;Add task [name]&rdquo;</strong> - New task</p>
          <p><strong>&ldquo;Add urgent task [name]&rdquo;</strong> - High priority</p>
          <p><strong>&ldquo;... by tomorrow/Friday&rdquo;</strong> - With due date</p>
        </div>
      </details>
    </div>
  );
}
