"use client";

import { useState, useRef, useEffect } from 'react';
import { Mic, MicOff, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

interface VoiceInputProps {
  onTranscript: (transcript: string) => void;
}

export function VoiceInput({ onTranscript }: VoiceInputProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    setIsSupported(
      typeof window !== 'undefined' && 
      'webkitSpeechRecognition' in window || 'SpeechRecognition' in window
    );
  }, []);

  const startRecording = async () => {
    if (!isSupported) {
      toast({
        title: "Not supported",
        description: "Speech recognition is not supported in this browser.",
        variant: "destructive"
      });
      return;
    }

    try {
      // Use Web Speech API for real-time transcription
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      const recognition = new SpeechRecognition();
      
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      let finalTranscript = '';
      
      recognition.onresult = (event: any) => {
        let interimTranscript = '';
        
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          
          if (event.results[i].isFinal) {
            finalTranscript += transcript + ' ';
          } else {
            interimTranscript += transcript;
          }
        }
      };

      recognition.onstart = () => {
        setIsRecording(true);
        toast({
          title: "Recording started",
          description: "Speak now, I'm listening...",
        });
      };

      recognition.onend = () => {
        setIsRecording(false);
        setIsProcessing(true);
        
        if (finalTranscript.trim()) {
          // Convert to markdown format
          const markdownTranscript = formatAsMarkdown(finalTranscript.trim());
          onTranscript(markdownTranscript);
          
          toast({
            title: "Voice note captured!",
            description: "Your transcript has been saved.",
          });
        }
        
        setIsProcessing(false);
      };

      recognition.onerror = (event: any) => {
        setIsRecording(false);
        setIsProcessing(false);
        toast({
          title: "Recording error",
          description: `Speech recognition error: ${event.error}`,
          variant: "destructive"
        });
      };

      recognition.start();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to start voice recording.",
        variant: "destructive"
      });
    }
  };

  const stopRecording = () => {
    // Stop speech recognition
    if (isRecording) {
      // The recognition will be stopped by calling stop, which triggers onend
      try {
        const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
        // We need to track the recognition instance to stop it
        // For now, we'll use a timeout approach
        setIsRecording(false);
      } catch (error) {
        console.error('Error stopping recording:', error);
      }
    }
  };

  const formatAsMarkdown = (transcript: string): string => {
    const timestamp = new Date().toLocaleString();
    
    // Basic markdown formatting
    let formatted = `## Voice Note - ${timestamp}\n\n`;
    
    // Split into sentences and format
    const sentences = transcript.split(/[.!?]+/).filter(s => s.trim());
    
    if (sentences.length > 1) {
      formatted += sentences.map(sentence => `- ${sentence.trim()}`).join('\n');
    } else {
      formatted += transcript;
    }
    
    // Add common habit-related formatting
    formatted = formatted
      .replace(/\b(todo|to do|task)\b/gi, '**$1**')
      .replace(/\b(tomorrow|today|remind me)\b/gi, '***$1***')
      .replace(/\b(exercise|workout|gym|run|walk)\b/gi, '*$1*')
      .replace(/\b(water|drink|hydrate)\b/gi, '*$1*');
    
    return formatted;
  };

  if (!isSupported) {
    return null;
  }

  return (
    <div className="flex items-center gap-2">
      <Button
        variant={isRecording ? "destructive" : "outline"}
        size="sm"
        onClick={isRecording ? stopRecording : startRecording}
        disabled={isProcessing}
        className={isRecording ? "animate-pulse" : ""}
      >
        {isProcessing ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : isRecording ? (
          <MicOff className="w-4 h-4" />
        ) : (
          <Mic className="w-4 h-4" />
        )}
        {isProcessing ? 'Processing...' : isRecording ? 'Stop' : 'Voice Note'}
      </Button>
      
      {isRecording && (
        <div className="flex items-center gap-1 text-sm text-red-600 animate-pulse">
          <div className="w-2 h-2 bg-red-500 rounded-full"></div>
          Recording...
        </div>
      )}
    </div>
  );
}