"use client";

import { useState } from 'react';
import { Search, Filter, Trash2, Edit3, Calendar, Mic, Type, Tag } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

interface Note {
  id: string;
  content: string;
  transcript?: string;
  timestamp: string;
  type: 'text' | 'voice';
  tags?: string[];
}

interface NotesManagerProps {
  notes: Note[];
  onUpdateNotes: (notes: Note[]) => void;
}

export function NotesManager({ notes, onUpdateNotes }: NotesManagerProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'text' | 'voice'>('all');
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [editContent, setEditContent] = useState('');

  const filteredNotes = notes.filter(note => {
    const matchesSearch = (
      note.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
      note.transcript?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    const matchesType = filterType === 'all' || note.type === filterType;
    return matchesSearch && matchesType;
  });

  const deleteNote = (noteId: string) => {
    const updatedNotes = notes.filter(note => note.id !== noteId);
    onUpdateNotes(updatedNotes);
  };

  const startEditing = (note: Note) => {
    setEditingNote(note);
    setEditContent(note.transcript || note.content);
  };

  const saveEdit = () => {
    if (!editingNote) return;
    
    const updatedNotes = notes.map(note => 
      note.id === editingNote.id 
        ? { 
            ...note, 
            content: editingNote.type === 'text' ? editContent : note.content,
            transcript: editingNote.type === 'voice' ? editContent : note.transcript
          }
        : note
    );
    
    onUpdateNotes(updatedNotes);
    setEditingNote(null);
    setEditContent('');
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const renderMarkdown = (text: string) => {
    return text
      .replace(/\*\*\*(.*?)\*\*\*/g, '<em><strong>$1</strong></em>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/^## (.*$)/gm, '<h2 class="text-lg font-semibold mt-4 mb-2">$1</h2>')
      .replace(/^- (.*$)/gm, '<li class="ml-4">$1</li>')
      .replace(/\n/g, '<br>');
  };

  return (
    <div className="space-y-6">
      {/* Search and Filter */}
      <div className="flex gap-4 flex-col sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Search notes and transcripts..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={filterType} onValueChange={(value: any) => setFilterType(value)}>
          <SelectTrigger className="w-full sm:w-48">
            <Filter className="w-4 h-4 mr-2" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Notes</SelectItem>
            <SelectItem value="text">Text Only</SelectItem>
            <SelectItem value="voice">Voice Only</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Notes Grid */}
      {filteredNotes.length === 0 ? (
        <Card className="text-center py-12 bg-white/80 backdrop-blur border-0 shadow-lg">
          <CardContent>
            <div className="text-gray-400 mb-4">
              {searchTerm ? (
                <Search className="w-12 h-12 mx-auto" />
              ) : (
                <Mic className="w-12 h-12 mx-auto" />
              )}
            </div>
            <p className="text-lg font-medium text-gray-600 mb-2">
              {searchTerm ? 'No matching notes found' : 'No notes yet'}
            </p>
            <p className="text-gray-500">
              {searchTerm 
                ? 'Try adjusting your search terms or filters' 
                : 'Start by adding your first note or voice recording above'
              }
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredNotes.map((note) => (
            <Card key={note.id} className="bg-white/80 backdrop-blur border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    {note.type === 'voice' ? (
                      <Mic className="w-4 h-4 text-blue-500" />
                    ) : (
                      <Type className="w-4 h-4 text-green-500" />
                    )}
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <Calendar className="w-3 h-3" />
                      {formatTimestamp(note.timestamp)}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="ghost" size="sm" onClick={() => startEditing(note)}>
                          <Edit3 className="w-3 h-3" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl">
                        <DialogHeader>
                          <DialogTitle>Edit Note</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <Textarea
                            value={editContent}
                            onChange={(e) => setEditContent(e.target.value)}
                            className="min-h-[200px]"
                            placeholder="Edit your note..."
                          />
                          <div className="flex justify-end gap-2">
                            <Button variant="outline" onClick={() => setEditingNote(null)}>
                              Cancel
                            </Button>
                            <Button onClick={saveEdit}>
                              Save Changes
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => deleteNote(note.id)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {note.transcript ? (
                    <div 
                      className="prose prose-sm max-w-none text-gray-700 leading-relaxed"
                      dangerouslySetInnerHTML={{ 
                        __html: renderMarkdown(note.transcript) 
                      }}
                    />
                  ) : (
                    <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                      {note.content}
                    </p>
                  )}
                  
                  {note.tags && note.tags.length > 0 && (
                    <div className="flex items-center gap-1 flex-wrap">
                      <Tag className="w-3 h-3 text-gray-400" />
                      {note.tags.map(tag => (
                        <Badge key={tag} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Stats */}
      <div className="text-center text-sm text-gray-500">
        Showing {filteredNotes.length} of {notes.length} notes
        {searchTerm && ` matching "${searchTerm}"`}
      </div>
    </div>
  );
}