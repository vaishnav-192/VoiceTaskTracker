import { VoiceCommand, TaskPriority, TaskStatus, ParsedTaskData } from '@/types';

/**
 * Parses relative date expressions into actual dates
 */
function parseRelativeDate(text: string): { date?: Date; time?: string; cleanedText: string } {
  const lowerText = text.toLowerCase();
  let date: Date | undefined;
  let time: string | undefined;
  let cleanedText = text;

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  // Time patterns (must be checked before date patterns)
  const timePatterns = [
    { pattern: /\bat\s+(\d{1,2})(?::(\d{2}))?\s*(am|pm)\b/i, handler: (m: RegExpMatchArray) => {
      let hours = parseInt(m[1]);
      const minutes = m[2] ? parseInt(m[2]) : 0;
      const period = m[3].toLowerCase();
      if (period === 'pm' && hours !== 12) hours += 12;
      if (period === 'am' && hours === 12) hours = 0;
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    }},
    { pattern: /\bat\s+(\d{1,2}):(\d{2})\b/i, handler: (m: RegExpMatchArray) => {
      const hours = parseInt(m[1]);
      const minutes = parseInt(m[2]);
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    }},
    { pattern: /\b(in the morning|this morning)\b/i, handler: () => '09:00' },
    { pattern: /\b(in the afternoon|this afternoon)\b/i, handler: () => '14:00' },
    { pattern: /\b(in the evening|this evening)\b/i, handler: () => '18:00' },
    { pattern: /\b(at night|tonight)\b/i, handler: () => '21:00' },
    { pattern: /\b(at noon|by noon)\b/i, handler: () => '12:00' },
    { pattern: /\b(morning)\b/i, handler: () => '09:00' },
    { pattern: /\b(afternoon)\b/i, handler: () => '14:00' },
    { pattern: /\b(evening)\b/i, handler: () => '18:00' },
    { pattern: /\b(noon)\b/i, handler: () => '12:00' },
  ];

  for (const { pattern, handler } of timePatterns) {
    const match = lowerText.match(pattern);
    if (match) {
      time = handler(match);
      cleanedText = cleanedText.replace(pattern, '').trim();
      break;
    }
  }

  // "Next [day]" patterns - must be checked before regular day patterns
  const nextDayOfWeekPatterns = [
    { pattern: /\b(?:by\s+)?next\s+monday\b/i, day: 1 },
    { pattern: /\b(?:by\s+)?next\s+tuesday\b/i, day: 2 },
    { pattern: /\b(?:by\s+)?next\s+wednesday\b/i, day: 3 },
    { pattern: /\b(?:by\s+)?next\s+thursday\b/i, day: 4 },
    { pattern: /\b(?:by\s+)?next\s+friday\b/i, day: 5 },
    { pattern: /\b(?:by\s+)?next\s+saturday\b/i, day: 6 },
    { pattern: /\b(?:by\s+)?next\s+sunday\b/i, day: 0 },
  ];

  // Check "next [day]" patterns first
  for (const { pattern, day } of nextDayOfWeekPatterns) {
    if (pattern.test(lowerText)) {
      const currentDay = today.getDay();
      let daysUntil = day - currentDay;
      if (daysUntil <= 0) daysUntil += 7; // Next week
      // Always go to next week for "next [day]"
      if (daysUntil < 7) daysUntil += 7;
      date = new Date(today.getTime() + daysUntil * 24 * 60 * 60 * 1000);
      cleanedText = cleanedText.replace(pattern, '').trim();
      break;
    }
  }

  // Date patterns (if no date found yet)
  if (!date) {
    const datePatterns = [
      { pattern: /\b(?:by\s+)?(today)\b/i, days: 0 },
      { pattern: /\b(?:by\s+)?(tonight)\b/i, days: 0 },
      { pattern: /\b(?:by\s+)?(tomorrow)\b/i, days: 1 },
      { pattern: /\b(?:by\s+)?(day after tomorrow)\b/i, days: 2 },
      { pattern: /\b(?:by\s+)?next\s+week\b/i, days: 7 },
      { pattern: /\b(?:by\s+)?next\s+month\b/i, days: 30 },
      { pattern: /\b(?:with)?in\s+(\d+)\s+days?\b/i, handler: (m: RegExpMatchArray) => parseInt(m[1]) },
      { pattern: /\b(?:with)?in\s+(\d+)\s+weeks?\b/i, handler: (m: RegExpMatchArray) => parseInt(m[1]) * 7 },
      { pattern: /\b(?:with)?in\s+(\d+)\s+hours?\b/i, handler: (m: RegExpMatchArray) => {
        const hours = parseInt(m[1]);
        const futureDate = new Date(now.getTime() + hours * 60 * 60 * 1000);
        return { exactDate: futureDate };
      }},
      { pattern: /\bend\s+of\s+(?:the\s+)?day\b/i, days: 0 },
      { pattern: /\bend\s+of\s+(?:the\s+)?week\b/i, handler: () => {
        const daysUntilFriday = (5 - today.getDay() + 7) % 7 || 7;
        return daysUntilFriday;
      }},
    ];

    for (const item of datePatterns) {
      const match = lowerText.match(item.pattern);
      if (match) {
        if ('handler' in item && item.handler) {
          const result = item.handler(match);
          if (typeof result === 'object' && 'exactDate' in result) {
            date = result.exactDate;
          } else {
            date = new Date(today.getTime() + result * 24 * 60 * 60 * 1000);
          }
        } else if ('days' in item) {
          date = new Date(today.getTime() + item.days * 24 * 60 * 60 * 1000);
        }
        cleanedText = cleanedText.replace(item.pattern, '').trim();
        break;
      }
    }
  }

  // Day of week patterns (if no date found yet)
  if (!date) {
    const dayOfWeekPatterns = [
      { pattern: /\b(?:by\s+|on\s+)?this\s+monday\b/i, day: 1, thisWeek: true },
      { pattern: /\b(?:by\s+|on\s+)?this\s+tuesday\b/i, day: 2, thisWeek: true },
      { pattern: /\b(?:by\s+|on\s+)?this\s+wednesday\b/i, day: 3, thisWeek: true },
      { pattern: /\b(?:by\s+|on\s+)?this\s+thursday\b/i, day: 4, thisWeek: true },
      { pattern: /\b(?:by\s+|on\s+)?this\s+friday\b/i, day: 5, thisWeek: true },
      { pattern: /\b(?:by\s+|on\s+)?this\s+saturday\b/i, day: 6, thisWeek: true },
      { pattern: /\b(?:by\s+|on\s+)?this\s+sunday\b/i, day: 0, thisWeek: true },
      { pattern: /\b(?:by\s+|on\s+)?monday\b/i, day: 1, thisWeek: false },
      { pattern: /\b(?:by\s+|on\s+)?tuesday\b/i, day: 2, thisWeek: false },
      { pattern: /\b(?:by\s+|on\s+)?wednesday\b/i, day: 3, thisWeek: false },
      { pattern: /\b(?:by\s+|on\s+)?thursday\b/i, day: 4, thisWeek: false },
      { pattern: /\b(?:by\s+|on\s+)?friday\b/i, day: 5, thisWeek: false },
      { pattern: /\b(?:by\s+|on\s+)?saturday\b/i, day: 6, thisWeek: false },
      { pattern: /\b(?:by\s+|on\s+)?sunday\b/i, day: 0, thisWeek: false },
    ];

    for (const { pattern, day, thisWeek } of dayOfWeekPatterns) {
      if (pattern.test(lowerText)) {
        const currentDay = today.getDay();
        let daysUntil = day - currentDay;
        if (thisWeek) {
          // "this [day]" means this week, could be in the past
          if (daysUntil < 0) daysUntil += 7;
        } else {
          // Regular "[day]" means next occurrence
          if (daysUntil <= 0) daysUntil += 7;
        }
        date = new Date(today.getTime() + daysUntil * 24 * 60 * 60 * 1000);
        cleanedText = cleanedText.replace(pattern, '').trim();
        break;
      }
    }
  }

  // Check for specific date formats (MM/DD, Month DD, etc.)
  if (!date) {
    const specificDatePatterns = [
      { pattern: /\b(?:by\s+|on\s+)?(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?\b/i, handler: (m: RegExpMatchArray) => {
        const month = parseInt(m[1]) - 1;
        const day = parseInt(m[2]);
        const year = m[3] ? (m[3].length === 2 ? 2000 + parseInt(m[3]) : parseInt(m[3])) : now.getFullYear();
        return new Date(year, month, day);
      }},
      { pattern: /\b(?:by\s+|on\s+)?(january|february|march|april|may|june|july|august|september|october|november|december)\s+(\d{1,2})(?:st|nd|rd|th)?(?:\s*,?\s*(\d{4}))?\b/i, handler: (m: RegExpMatchArray) => {
        const months: { [key: string]: number } = {
          january: 0, february: 1, march: 2, april: 3, may: 4, june: 5,
          july: 6, august: 7, september: 8, october: 9, november: 10, december: 11
        };
        const month = months[m[1].toLowerCase()];
        const day = parseInt(m[2]);
        const year = m[3] ? parseInt(m[3]) : now.getFullYear();
        return new Date(year, month, day);
      }},
      { pattern: /\b(?:by\s+|on\s+)?(\d{1,2})(?:st|nd|rd|th)?\s+(?:of\s+)?(january|february|march|april|may|june|july|august|september|october|november|december)(?:\s*,?\s*(\d{4}))?\b/i, handler: (m: RegExpMatchArray) => {
        const months: { [key: string]: number } = {
          january: 0, february: 1, march: 2, april: 3, may: 4, june: 5,
          july: 6, august: 7, september: 8, october: 9, november: 10, december: 11
        };
        const day = parseInt(m[1]);
        const month = months[m[2].toLowerCase()];
        const year = m[3] ? parseInt(m[3]) : now.getFullYear();
        return new Date(year, month, day);
      }},
    ];

    for (const { pattern, handler } of specificDatePatterns) {
      const match = lowerText.match(pattern);
      if (match) {
        date = handler(match);
        cleanedText = cleanedText.replace(pattern, '').trim();
        break;
      }
    }
  }

  return { date, time, cleanedText };
}

/**
 * Parses priority from natural language - more comprehensive
 */
function parsePriority(text: string): { priority: TaskPriority; cleanedText: string } {
  const lowerText = text.toLowerCase();
  let priority: TaskPriority = 'medium';
  let cleanedText = text;

  // High priority patterns (order matters - check longer patterns first)
  const highPriorityPatterns = [
    /\b(?:it'?s?\s+)?(?:a\s+)?high\s+priority\b/gi,
    /\b(?:it'?s?\s+)?(?:very\s+)?urgent\b/gi,
    /\b(?:it'?s?\s+)?(?:very\s+)?important\b/gi,
    /\b(?:it'?s?\s+)?critical\b/gi,
    /\basap\b/gi,
    /\bimmediately\b/gi,
    /\bright\s+away\b/gi,
    /\b(?:top|highest)\s+priority\b/gi,
    /\bmust\s+(?:be\s+)?(?:done|do|finish|complete)/gi,
    /\bpriority\s*:\s*high\b/gi,
  ];

  // Low priority patterns
  const lowPriorityPatterns = [
    /\b(?:it'?s?\s+)?(?:a\s+)?low\s+priority\b/gi,
    /\b(?:it'?s?\s+)?not\s+(?:that\s+)?urgent\b/gi,
    /\b(?:it'?s?\s+)?not\s+(?:that\s+)?important\b/gi,
    /\bwhenever\s+(?:you\s+)?(?:can|possible)\b/gi,
    /\beventually\b/gi,
    /\bsomeday\b/gi,
    /\bno\s+rush\b/gi,
    /\bwhen\s+(?:you\s+)?(?:have|get)\s+(?:a\s+)?(?:chance|time)\b/gi,
    /\bpriority\s*:\s*low\b/gi,
  ];

  for (const pattern of highPriorityPatterns) {
    if (pattern.test(lowerText)) {
      priority = 'high';
      cleanedText = cleanedText.replace(pattern, '').trim();
      break;
    }
  }

  if (priority === 'medium') {
    for (const pattern of lowPriorityPatterns) {
      if (pattern.test(lowerText)) {
        priority = 'low';
        cleanedText = cleanedText.replace(pattern, '').trim();
        break;
      }
    }
  }

  return { priority, cleanedText };
}

/**
 * Parses status from natural language
 */
function parseStatus(text: string): { status: TaskStatus; cleanedText: string } {
  const lowerText = text.toLowerCase();
  let status: TaskStatus = 'pending';
  let cleanedText = text;

  const statusPatterns: { pattern: RegExp; status: TaskStatus }[] = [
    { pattern: /\b(in progress|in-progress|working on|started|currently working)\b/i, status: 'in-progress' },
    { pattern: /\b(completed|done|finished|already done)\b/i, status: 'completed' },
    { pattern: /\b(pending|to do|todo|not started|needs to be done)\b/i, status: 'pending' },
  ];

  for (const { pattern, status: s } of statusPatterns) {
    if (pattern.test(lowerText)) {
      status = s;
      cleanedText = cleanedText.replace(pattern, '').trim();
      break;
    }
  }

  return { status, cleanedText };
}

/**
 * Extracts a clean task title from natural language
 */
function extractTaskTitle(text: string): string {
  let title = text;

  // Remove common filler phrases at the beginning
  const prefixPatterns = [
    /^(?:i\s+)?(?:need\s+to|have\s+to|should|must|want\s+to|going\s+to|gonna)\s+/i,
    /^(?:please\s+)?(?:remind\s+me\s+to|don't\s+forget\s+to|remember\s+to)\s+/i,
    /^(?:i\s+)?(?:gotta|got\s+to|wanna)\s+/i,
    /^make\s+sure\s+(?:to\s+)?/i,
    /^be\s+sure\s+(?:to\s+)?/i,
  ];

  for (const pattern of prefixPatterns) {
    title = title.replace(pattern, '').trim();
  }

  // Remove trailing filler phrases
  const suffixPatterns = [
    /[,\s]+(?:please|thanks|thank\s+you)\.?$/i,
    /[,\s]+(?:if\s+(?:you\s+)?(?:can|could|would))\.?$/i,
    /[,\s]+(?:when\s+(?:you\s+)?(?:can|get\s+(?:a\s+)?chance))\.?$/i,
  ];

  for (const pattern of suffixPatterns) {
    title = title.replace(pattern, '').trim();
  }

  // Clean up extra whitespace and punctuation
  title = title
    .replace(/\s+/g, ' ')
    .replace(/^[,.\s]+|[,.\s]+$/g, '')
    .trim();

  // Capitalize first letter
  if (title.length > 0) {
    title = title.charAt(0).toUpperCase() + title.slice(1);
  }

  return title;
}

/**
 * Parses a voice transcript into a structured command
 */
export function parseVoiceCommand(transcript: string): VoiceCommand {
  const lowerTranscript = transcript.toLowerCase().trim();

  // Detect action
  let action: VoiceCommand['action'] = 'unknown';
  let taskTitle = transcript.trim();

  // Add task patterns - more comprehensive
  const addPatterns = [
    /^add\s+(?:a\s+)?(?:new\s+)?(?:task\s+)?(?:to\s+)?(.+)/i,
    /^create\s+(?:a\s+)?(?:new\s+)?(?:task\s+)?(.+)/i,
    /^new\s+task\s+(.+)/i,
    /^(?:please\s+)?(?:remind\s+me\s+to|don't\s+forget\s+to|remember\s+to)\s+(.+)/i,
    /^(?:i\s+)?(?:need\s+to|have\s+to|should|must|want\s+to|gotta|got\s+to)\s+(.+)/i,
    /^(?:make|be)\s+sure\s+(?:to\s+)?(.+)/i,
    /^(?:schedule|plan)\s+(?:to\s+)?(.+)/i,
    /^(?:put|set)\s+(?:a\s+)?(?:reminder\s+(?:to\s+)?)?(.+)/i,
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
    /^(?:complete|finish|done|mark\s+(?:as\s+)?(?:done|complete|finished))\s+(?:the\s+)?(?:task\s+)?(.+)/i,
    /^(?:i\s+)?(?:finished|completed|done\s+with)\s+(.+)/i,
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
    /^(?:delete|remove|cancel|get\s+rid\s+of)\s+(?:the\s+)?(?:task\s+)?(.+)/i,
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
    /^(?:list|show|read|what\s+are|tell\s+me)\s+(?:my\s+)?(?:all\s+)?tasks?/i,
    /^(?:what\s+do\s+i\s+(?:have|need)\s+to\s+do)/i,
    /^(?:show|list|read)\s+(?:me\s+)?(?:my\s+)?(?:to-?do|todo)\s*(?:list)?/i,
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

  // Parse priority using the new function
  const { priority, cleanedText: afterPriorityParse } = parsePriority(taskTitle);
  taskTitle = afterPriorityParse;

  // Parse date and time
  const { date: dueDate, time: dueTime, cleanedText: afterDateParse } = parseRelativeDate(taskTitle);
  taskTitle = afterDateParse;

  // Parse status
  const { status, cleanedText: afterStatusParse } = parseStatus(taskTitle);
  taskTitle = afterStatusParse;

  // Extract and clean up the title
  taskTitle = extractTaskTitle(taskTitle);

  // Remove trailing prepositions and conjunctions
  taskTitle = taskTitle
    .replace(/\s+(by|due|for|at|on|and|but|or|so|,)\s*$/i, '')
    .replace(/\s+it'?s?\s*$/i, '')
    .trim();

  // Final cleanup and capitalization
  if (taskTitle.length > 0) {
    taskTitle = taskTitle.charAt(0).toUpperCase() + taskTitle.slice(1);
  }

  return {
    action,
    taskTitle: taskTitle || undefined,
    priority,
    status,
    dueDate,
    dueTime,
    originalTranscript: transcript,
  };
}

/**
 * Extracts structured task data from natural language for review
 */
export function parseTaskFromVoice(transcript: string): ParsedTaskData {
  const command = parseVoiceCommand(transcript);
  
  return {
    title: command.taskTitle || transcript.trim(),
    priority: command.priority || 'medium',
    status: command.status || 'pending',
    dueDate: command.dueDate,
    dueTime: command.dueTime,
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
