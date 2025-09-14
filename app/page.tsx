"use client";

import { useState, useEffect } from 'react';
import { Brain, Plus, Mic, MicOff, Lightbulb, Clock, Target } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { VoiceInput } from '@/components/voice-input';
import { NotesManager } from '@/components/notes-manager';
import { SmartReminders } from '@/components/smart-reminders';
import { AIInsights } from '@/components/ai-insights';

export default function HabitIQ() {
  const [quickNote, setQuickNote] = useState('');
  const [notes, setNotes] = useState<Array<{
    id: string;
    content: string;
    transcript?: string;
    timestamp: string;
    type: 'text' | 'voice';
    tags?: string[];
  }>>([]);

  useEffect(() => {
    const savedNotes = localStorage.getItem('habitiq-notes');
    if (savedNotes) {
      setNotes(JSON.parse(savedNotes));
    }
  }, []);

  const saveNotes = (updatedNotes: typeof notes) => {
    setNotes(updatedNotes);
    localStorage.setItem('habitiq-notes', JSON.stringify(updatedNotes));
  };

  const addQuickNote = () => {
    if (!quickNote.trim()) return;
    
    const newNote = {
      id: Date.now().toString(),
      content: quickNote,
      timestamp: new Date().toISOString(),
      type: 'text' as const,
      tags: extractTags(quickNote)
    };
    
    const updatedNotes = [newNote, ...notes];
    saveNotes(updatedNotes);
    setQuickNote('');
  };

  const extractTags = (content: string): string[] => {
    const tags: string[] = [];
    if (content.toLowerCase().includes('exercise') || content.toLowerCase().includes('workout')) tags.push('fitness');
    if (content.toLowerCase().includes('water') || content.toLowerCase().includes('drink')) tags.push('hydration');
    if (content.toLowerCase().includes('sleep') || content.toLowerCase().includes('bed')) tags.push('sleep');
    if (content.toLowerCase().includes('read') || content.toLowerCase().includes('book')) tags.push('learning');
    if (content.toLowerCase().includes('meditat')) tags.push('mindfulness');
    return tags;
  };

  const onVoiceTranscript = (transcript: string) => {
    const newNote = {
      id: Date.now().toString(),
      content: '',
      transcript: transcript,
      timestamp: new Date().toISOString(),
      type: 'voice' as const,
      tags: extractTags(transcript)
    };
    
    const updatedNotes = [newNote, ...notes];
    saveNotes(updatedNotes);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Brain className="w-8 h-8 text-indigo-600" />
            <h1 className="text-3xl font-bold text-gray-900">HabitIQ</h1>
          </div>
          <p className="text-gray-600">Your intelligent habit companion that learns from your patterns</p>
        </div>

        {/* Quick Capture */}
        <Card className="mb-6 shadow-lg border-0 bg-white/80 backdrop-blur">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="w-5 h-5" />
              Quick Capture
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Textarea
                placeholder="Brain dump anything here... I'll organize it for you!"
                value={quickNote}
                onChange={(e) => setQuickNote(e.target.value)}
                className="min-h-[100px] resize-none"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && e.ctrlKey) {
                    addQuickNote();
                  }
                }}
              />
            </div>
            <div className="flex items-center justify-between">
              <VoiceInput onTranscript={onVoiceTranscript} />
              <Button onClick={addQuickNote} disabled={!quickNote.trim()}>
                <Plus className="w-4 h-4 mr-2" />
                Add Note
              </Button>
            </div>
            <p className="text-sm text-gray-500">
              💡 Press Ctrl+Enter to quick-add, or click the mic for voice input
            </p>
          </CardContent>
        </Card>

        {/* Main Content Tabs */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 bg-white/80 backdrop-blur">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <Target className="w-4 h-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="notes" className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Notes
            </TabsTrigger>
            <TabsTrigger value="reminders" className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Reminders
            </TabsTrigger>
            <TabsTrigger value="insights" className="flex items-center gap-2">
              <Lightbulb className="w-4 h-4" />
              AI Insights
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <Card className="bg-white/80 backdrop-blur border-0 shadow-lg">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Total Notes</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-indigo-600">{notes.length}</p>
                  <p className="text-sm text-gray-500">
                    {notes.filter(n => n.type === 'voice').length} voice, {notes.filter(n => n.type === 'text').length} text
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-white/80 backdrop-blur border-0 shadow-lg">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Smart Reminders</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-green-600">
                    {notes.filter(n => 
                      n.content?.toLowerCase().includes('tomorrow') ||
                      n.content?.toLowerCase().includes('remind') ||
                      n.transcript?.toLowerCase().includes('tomorrow') ||
                      n.transcript?.toLowerCase().includes('remind')
                    ).length}
                  </p>
                  <p className="text-sm text-gray-500">Auto-detected</p>
                </CardContent>
              </Card>

              <Card className="bg-white/80 backdrop-blur border-0 shadow-lg">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Top Categories</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-1">
                    {['fitness', 'hydration', 'sleep', 'learning', 'mindfulness'].map(tag => {
                      const count = notes.filter(n => n.tags?.includes(tag)).length;
                      return count > 0 ? (
                        <Badge key={tag} variant="secondary" className="text-xs">
                          {tag} ({count})
                        </Badge>
                      ) : null;
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="notes">
            <NotesManager notes={notes} onUpdateNotes={saveNotes} />
          </TabsContent>

          <TabsContent value="reminders">
            <SmartReminders notes={notes} />
          </TabsContent>

          <TabsContent value="insights">
            <AIInsights notes={notes} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
