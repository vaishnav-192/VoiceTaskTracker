import { VoiceCommand, TaskPriority } from '@/types';

/**
 * Parses a voice transcript into a structured command
 */
export function parseVoiceCommand(transcript: string): VoiceCommand {
  const lowerTranscript = transcript.toLowerCase().trim();

  // Detect action
  let action: VoiceCommand['action'] = 'unknown';
  let taskTitle = transcript.trim();

  // Add task patterns
  const addPatterns = [
    /^add\s+(?:a\s+)?(?:task\s+)?(?:to\s+)?(.+)/i,
    /^create\s+(?:a\s+)?(?:task\s+)?(.+)/i,
    /^new\s+task\s+(.+)/i,
    /^(?:i\s+need\s+to|remind\s+me\s+to)\s+(.+)/i,
  ];

  for (const pattern of addPatterns) {
    const match = transcript.match(pattern);
    if (match) {
      action = 'add';
      taskTitle = match[1].trim();
      break;
    }
  }

  // Complete task patterns
  const completePatterns = [
    /^(?:complete|finish|done|mark\s+(?:as\s+)?(?:done|complete))\s+(?:task\s+)?(.+)/i,
    /^(?:i\s+)?(?:finished|completed)\s+(.+)/i,
  ];

  if (action === 'unknown') {
    for (const pattern of completePatterns) {
      const match = transcript.match(pattern);
      if (match) {
        action = 'complete';
        taskTitle = match[1].trim();
        break;
      }
    }
  }

  // Delete task patterns
  const deletePatterns = [
    /^(?:delete|remove|cancel)\s+(?:task\s+)?(.+)/i,
  ];

  if (action === 'unknown') {
    for (const pattern of deletePatterns) {
      const match = transcript.match(pattern);
      if (match) {
        action = 'delete';
        taskTitle = match[1].trim();
        break;
      }
    }
  }

  // List tasks patterns
  const listPatterns = [
    /^(?:list|show|read|what\s+are)\s+(?:my\s+)?(?:all\s+)?tasks?/i,
    /^(?:what\s+do\s+i\s+(?:have|need)\s+to\s+do)/i,
  ];

  if (action === 'unknown') {
    for (const pattern of listPatterns) {
      if (pattern.test(lowerTranscript)) {
        action = 'list';
        taskTitle = '';
        break;
      }
    }
  }

  // If no specific action detected, default to add
  if (action === 'unknown' && transcript.trim().length > 0) {
    action = 'add';
  }

  // Detect priority
  let priority: TaskPriority = 'medium';
  const highPriorityKeywords = ['urgent', 'important', 'high priority', 'asap', 'immediately', 'critical'];
  const lowPriorityKeywords = ['low priority', 'not urgent', 'whenever', 'eventually', 'someday'];

  for (const keyword of highPriorityKeywords) {
    if (lowerTranscript.includes(keyword)) {
      priority = 'high';
      taskTitle = taskTitle.replace(new RegExp(keyword, 'gi'), '').trim();
      break;
    }
  }

  if (priority === 'medium') {
    for (const keyword of lowPriorityKeywords) {
      if (lowerTranscript.includes(keyword)) {
        priority = 'low';
        taskTitle = taskTitle.replace(new RegExp(keyword, 'gi'), '').trim();
        break;
      }
    }
  }

  // Clean up the title
  taskTitle = taskTitle
    .replace(/\s+/g, ' ')
    .replace(/^(the|a|an)\s+/i, '')
    .trim();

  // Capitalize first letter
  if (taskTitle.length > 0) {
    taskTitle = taskTitle.charAt(0).toUpperCase() + taskTitle.slice(1);
  }

  return {
    action,
    taskTitle: taskTitle || undefined,
    priority,
    originalTranscript: transcript,
  };
}

/**
 * Generates a response message based on the voice command
 */
export function generateVoiceResponse(command: VoiceCommand, success: boolean): string {
  if (!success) {
    return "Sorry, I couldn't process that command. Please try again.";
  }

  switch (command.action) {
    case 'add':
      return `Task "${command.taskTitle}" has been added with ${command.priority} priority.`;
    case 'complete':
      return `Task "${command.taskTitle}" has been marked as complete.`;
    case 'delete':
      return `Task "${command.taskTitle}" has been deleted.`;
    case 'list':
      return "Here are your tasks.";
    default:
      return "I didn't understand that command. Try saying 'add task' followed by your task.";
  }
}
