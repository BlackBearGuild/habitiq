"use client";

import { useState, useEffect } from 'react';
import { Clock, Bell, CheckCircle2, XCircle, Calendar, Zap, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';

interface Note {
  id: string;
  content: string;
  transcript?: string;
  timestamp: string;
  type: 'text' | 'voice';
  tags?: string[];
}

interface Reminder {
  id: string;
  noteId: string;
  text: string;
  extractedFrom: string;
  priority: 'high' | 'medium' | 'low';
  category: string;
  suggestedTime?: string;
  isCompleted: boolean;
  isDismissed: boolean;
  createdAt: string;
}

interface SmartRemindersProps {
  notes: Note[];
}

export function SmartReminders({ notes }: SmartRemindersProps) {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [showCompleted, setShowCompleted] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);

  useEffect(() => {
    const extractedReminders = extractRemindersFromNotes(notes);
    setReminders(prev => {
      // Merge new reminders with existing ones, preserving completion status
      const existingMap = new Map(prev.map(r => [r.noteId + r.text, r]));
      
      return extractedReminders.map(newReminder => {
        const key = newReminder.noteId + newReminder.text;
        const existing = existingMap.get(key);
        return existing ? { ...newReminder, isCompleted: existing.isCompleted, isDismissed: existing.isDismissed } : newReminder;
      });
    });
  }, [notes]);

  useEffect(() => {
    // Request notification permission on component mount
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().then(permission => {
        setNotificationsEnabled(permission === 'granted');
      });
    } else if ('Notification' in window && Notification.permission === 'granted') {
      setNotificationsEnabled(true);
    }
  }, []);

  const extractRemindersFromNotes = (notes: Note[]): Reminder[] => {
    const reminders: Reminder[] = [];
    
    notes.forEach(note => {
      const text = note.transcript || note.content;
      const lowerText = text.toLowerCase();
      
      // Patterns for reminder extraction
      const reminderPatterns = [
        /(?:remind me to|remember to|need to|have to|should|must|don't forget to)\s+(.+?)(?:\.|$|\n)/gi,
        /(?:tomorrow|today|later|this week|next week|this month).*?(exercise|workout|drink|water|call|meeting|appointment|task)/gi,
        /(exercise|workout|gym|run|walk|jog|stretch|yoga)(?:\s+(?:tomorrow|today|later|this week))?/gi,
        /(drink|water|hydrate)(?:\s+(?:more|enough|regularly))?/gi,
        /(sleep|bed|rest)(?:\s+(?:early|earlier|better|enough))?/gi,
        /(meditat|mindfulness|breathe)(?:\s+(?:daily|regularly))?/gi,
        /(read|study|learn)(?:\s+(?:more|daily|tonight))?/gi,
      ];

      reminderPatterns.forEach(pattern => {
        let match;
        while ((match = pattern.exec(text)) !== null) {
          const reminderText = match[1] || match[0];
          if (reminderText && reminderText.length > 3) {
            reminders.push({
              id: `${note.id}-${Date.now()}-${Math.random()}`,
              noteId: note.id,
              text: reminderText.trim(),
              extractedFrom: text.substring(Math.max(0, match.index - 20), match.index + match[0].length + 20),
              priority: determinePriority(reminderText),
              category: categorizeReminder(reminderText),
              suggestedTime: extractTimeHint(text),
              isCompleted: false,
              isDismissed: false,
              createdAt: note.timestamp
            });
          }
        }
      });
    });

    // Remove duplicates based on similarity
    const uniqueReminders = reminders.filter((reminder, index) => {
      return !reminders.slice(0, index).some(existing => 
        similarity(existing.text, reminder.text) > 0.7
      );
    });

    return uniqueReminders.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  };

  const similarity = (str1: string, str2: string): number => {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;
    const editDistance = levenshteinDistance(longer, shorter);
    return (longer.length - editDistance) / longer.length;
  };

  const levenshteinDistance = (str1: string, str2: string): number => {
    const matrix: number[][] = [];
    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }
    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }
    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }
    return matrix[str2.length][str1.length];
  };

  const determinePriority = (text: string): 'high' | 'medium' | 'low' => {
    const highPriorityWords = ['urgent', 'important', 'asap', 'immediately', 'critical', 'deadline'];
    const lowPriorityWords = ['maybe', 'eventually', 'someday', 'if possible'];
    
    const lowerText = text.toLowerCase();
    
    if (highPriorityWords.some(word => lowerText.includes(word))) return 'high';
    if (lowPriorityWords.some(word => lowerText.includes(word))) return 'low';
    
    return 'medium';
  };

  const categorizeReminder = (text: string): string => {
    const lowerText = text.toLowerCase();
    
    if (lowerText.match(/(exercise|workout|gym|run|walk|jog|stretch|yoga|fitness)/)) return 'fitness';
    if (lowerText.match(/(drink|water|hydrate)/)) return 'hydration';
    if (lowerText.match(/(sleep|bed|rest)/)) return 'sleep';
    if (lowerText.match(/(meditat|mindfulness|breathe)/)) return 'mindfulness';
    if (lowerText.match(/(read|study|learn)/)) return 'learning';
    if (lowerText.match(/(call|meeting|appointment|work)/)) return 'work';
    if (lowerText.match(/(eat|meal|food|cook)/)) return 'nutrition';
    
    return 'general';
  };

  const extractTimeHint = (text: string): string | undefined => {
    const timePatterns = [
      /tomorrow/i,
      /today/i,
      /tonight/i,
      /this morning/i,
      /this afternoon/i,
      /this evening/i,
      /this week/i,
      /next week/i,
      /this month/i,
    ];

    for (const pattern of timePatterns) {
      if (pattern.test(text)) {
        return pattern.source.replace(/[\/\\^$*+?.()|[\]{}]/g, '').replace('i', '');
      }
    }
    
    return undefined;
  };

  const completeReminder = (reminderId: string) => {
    setReminders(prev => 
      prev.map(r => 
        r.id === reminderId 
          ? { ...r, isCompleted: !r.isCompleted }
          : r
      )
    );
    
    if (notificationsEnabled) {
      new Notification('HabitIQ', {
        body: 'Great job! Reminder completed 🎉',
        icon: '/favicon.ico'
      });
    }
  };

  const dismissReminder = (reminderId: string) => {
    setReminders(prev => 
      prev.map(r => 
        r.id === reminderId 
          ? { ...r, isDismissed: true }
          : r
      )
    );
  };

  const activeReminders = reminders.filter(r => !r.isDismissed && (!r.isCompleted || showCompleted));
  const completedCount = reminders.filter(r => r.isCompleted && !r.isDismissed).length;

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-600 bg-red-50';
      case 'medium': return 'text-yellow-600 bg-yellow-50';
      case 'low': return 'text-green-600 bg-green-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'fitness': return '💪';
      case 'hydration': return '💧';
      case 'sleep': return '😴';
      case 'mindfulness': return '🧘';
      case 'learning': return '📚';
      case 'work': return '💼';
      case 'nutrition': return '🍎';
      default: return '📝';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with Controls */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-yellow-500" />
            <h2 className="text-lg font-semibold">Smart Reminders</h2>
          </div>
          <Badge variant="secondary" className="text-xs">
            {activeReminders.length} active
          </Badge>
          {completedCount > 0 && (
            <Badge variant="outline" className="text-xs text-green-600">
              {completedCount} completed
            </Badge>
          )}
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-sm">
            <Bell className="w-4 h-4" />
            <span>Notifications</span>
            <Switch 
              checked={notificationsEnabled}
              onCheckedChange={setNotificationsEnabled}
            />
          </div>
          <div className="flex items-center gap-2 text-sm">
            <span>Show completed</span>
            <Switch 
              checked={showCompleted}
              onCheckedChange={setShowCompleted}
            />
          </div>
        </div>
      </div>

      {/* Reminders List */}
      {activeReminders.length === 0 ? (
        <Card className="text-center py-12 bg-white/80 backdrop-blur border-0 shadow-lg">
          <CardContent>
            <AlertCircle className="w-12 h-12 mx-auto text-gray-400 mb-4" />
            <p className="text-lg font-medium text-gray-600 mb-2">No active reminders</p>
            <p className="text-gray-500">
              Add some notes above and I'll automatically detect reminders for you!
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {activeReminders.map((reminder) => (
            <Card 
              key={reminder.id} 
              className={`bg-white/80 backdrop-blur border-0 shadow-lg transition-all ${
                reminder.isCompleted ? 'opacity-60' : 'hover:shadow-xl'
              }`}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="p-1 hover:bg-green-100"
                    onClick={() => completeReminder(reminder.id)}
                  >
                    {reminder.isCompleted ? (
                      <CheckCircle2 className="w-5 h-5 text-green-600" />
                    ) : (
                      <div className="w-5 h-5 border-2 border-gray-300 rounded-full"></div>
                    )}
                  </Button>
                  
                  <div className="flex-1 space-y-2">
                    <div className="flex items-start justify-between">
                      <p className={`font-medium ${reminder.isCompleted ? 'line-through text-gray-500' : ''}`}>
                        {getCategoryIcon(reminder.category)} {reminder.text}
                      </p>
                      <div className="flex items-center gap-1">
                        <Badge 
                          variant="secondary" 
                          className={`text-xs ${getPriorityColor(reminder.priority)}`}
                        >
                          {reminder.priority}
                        </Badge>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="p-1 hover:bg-red-100"
                          onClick={() => dismissReminder(reminder.id)}
                        >
                          <XCircle className="w-4 h-4 text-gray-400 hover:text-red-500" />
                        </Button>
                      </div>
                    </div>
                    
                    {reminder.suggestedTime && (
                      <div className="flex items-center gap-1 text-sm text-blue-600">
                        <Clock className="w-3 h-3" />
                        <span className="capitalize">{reminder.suggestedTime}</span>
                      </div>
                    )}
                    
                    <details className="text-xs text-gray-500">
                      <summary className="cursor-pointer hover:text-gray-700">
                        View context
                      </summary>
                      <p className="mt-1 p-2 bg-gray-50 rounded text-xs">
                        "...{reminder.extractedFrom}..."
                      </p>
                    </details>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Stats Footer */}
      <div className="text-center text-sm text-gray-500">
        🤖 Automatically extracted from your {notes.length} notes using AI pattern recognition
      </div>
    </div>
  );
}