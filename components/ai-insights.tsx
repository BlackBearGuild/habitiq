"use client";

import { useState, useEffect, useMemo } from 'react';
import { TrendingUp, Brain, Target, Calendar, Clock, Award, BarChart3, Lightbulb } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface Note {
  id: string;
  content: string;
  transcript?: string;
  timestamp: string;
  type: 'text' | 'voice';
  tags?: string[];
}

interface AIInsightsProps {
  notes: Note[];
}

interface Pattern {
  type: string;
  frequency: number;
  trend: 'up' | 'down' | 'stable';
  lastSeen: string;
  confidence: number;
}

interface Suggestion {
  id: string;
  type: 'habit' | 'optimization' | 'motivation' | 'reminder';
  title: string;
  description: string;
  confidence: number;
  basedOn: string[];
  actionable: boolean;
}

export function AIInsights({ notes }: AIInsightsProps) {
  const [insights, setInsights] = useState<{
    patterns: Pattern[];
    suggestions: Suggestion[];
    habitScore: number;
    consistency: number;
    weeklyActivity: number[];
  }>({
    patterns: [],
    suggestions: [],
    habitScore: 0,
    consistency: 0,
    weeklyActivity: [0, 0, 0, 0, 0, 0, 0]
  });

  const analyzePatterns = useMemo(() => {
    if (notes.length === 0) return null;

    // Analyze patterns
    const patterns: Pattern[] = [];
    const suggestions: Suggestion[] = [];
    
    // Time-based analysis
    const notesByHour = notes.reduce((acc, note) => {
      const hour = new Date(note.timestamp).getHours();
      acc[hour] = (acc[hour] || 0) + 1;
      return acc;
    }, {} as Record<number, number>);

    const peakHours = Object.entries(notesByHour)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([hour]) => parseInt(hour));

    // Category frequency analysis
    const categoryFreq = notes.reduce((acc, note) => {
      note.tags?.forEach(tag => {
        acc[tag] = (acc[tag] || 0) + 1;
      });
      return acc;
    }, {} as Record<string, number>);

    // Convert to patterns
    Object.entries(categoryFreq).forEach(([category, count]) => {
      if (count >= 2) {
        patterns.push({
          type: category,
          frequency: count,
          trend: 'stable',
          lastSeen: notes.find(n => n.tags?.includes(category))?.timestamp || '',
          confidence: Math.min(count / notes.length * 100, 95)
        });
      }
    });

    // Generate suggestions based on patterns
    if (categoryFreq.fitness >= 2) {
      suggestions.push({
        id: 'fitness-consistency',
        type: 'habit',
        title: 'Build a consistent fitness routine',
        description: `You've mentioned fitness ${categoryFreq.fitness} times. Consider setting a specific time for workouts to build consistency.`,
        confidence: 85,
        basedOn: ['fitness pattern detected'],
        actionable: true
      });
    }

    if (categoryFreq.hydration >= 1) {
      suggestions.push({
        id: 'hydration-reminder',
        type: 'reminder',
        title: 'Stay hydrated throughout the day',
        description: 'Set up regular water breaks every 2 hours to maintain optimal hydration.',
        confidence: 75,
        basedOn: ['hydration mentions'],
        actionable: true
      });
    }

    if (peakHours.includes(22) || peakHours.includes(23) || peakHours.includes(0)) {
      suggestions.push({
        id: 'evening-routine',
        type: 'optimization',
        title: 'Optimize your evening routine',
        description: 'You seem most active in the evening. Consider winding down earlier for better sleep.',
        confidence: 70,
        basedOn: ['late night activity pattern'],
        actionable: true
      });
    }

    if (notes.length >= 5 && categoryFreq.sleep) {
      suggestions.push({
        id: 'sleep-tracking',
        type: 'habit',
        title: 'Track your sleep patterns',
        description: 'You\'re thinking about sleep quality. Consider keeping a sleep journal for better insights.',
        confidence: 80,
        basedOn: ['sleep-related notes'],
        actionable: true
      });
    }

    // Motivational suggestions
    suggestions.push({
      id: 'progress-celebration',
      type: 'motivation',
      title: 'Celebrate your progress!',
      description: `You've captured ${notes.length} thoughts and habits. You're building great self-awareness!`,
      confidence: 90,
      basedOn: ['overall activity'],
      actionable: false
    });

    // Calculate habit score (0-100)
    const habitScore = Math.min(
      (notes.length * 10) + 
      (Object.keys(categoryFreq).length * 15) + 
      (patterns.length * 20), 
      100
    );

    // Calculate consistency (based on daily activity)
    const last7Days = Array.from({length: 7}, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - i);
      return date.toDateString();
    });

    const dailyActivity = last7Days.map(date => 
      notes.filter(note => new Date(note.timestamp).toDateString() === date).length
    ).reverse();

    const consistency = dailyActivity.filter(day => day > 0).length / 7 * 100;

    return {
      patterns: patterns.sort((a, b) => b.confidence - a.confidence),
      suggestions: suggestions.sort((a, b) => b.confidence - a.confidence),
      habitScore,
      consistency,
      weeklyActivity: dailyActivity
    };
  }, [notes]);

  useEffect(() => {
    if (analyzePatterns) {
      setInsights(analyzePatterns);
    }
  }, [analyzePatterns]);

  const getPatternIcon = (type: string) => {
    switch (type) {
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

  const getSuggestionIcon = (type: string) => {
    switch (type) {
      case 'habit': return <Target className="w-4 h-4" />;
      case 'optimization': return <TrendingUp className="w-4 h-4" />;
      case 'motivation': return <Award className="w-4 h-4" />;
      case 'reminder': return <Clock className="w-4 h-4" />;
      default: return <Lightbulb className="w-4 h-4" />;
    }
  };

  const getSuggestionColor = (type: string) => {
    switch (type) {
      case 'habit': return 'bg-blue-50 border-blue-200 text-blue-800';
      case 'optimization': return 'bg-green-50 border-green-200 text-green-800';
      case 'motivation': return 'bg-purple-50 border-purple-200 text-purple-800';
      case 'reminder': return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      default: return 'bg-gray-50 border-gray-200 text-gray-800';
    }
  };

  if (notes.length === 0) {
    return (
      <Card className="text-center py-12 bg-white/80 backdrop-blur border-0 shadow-lg">
        <CardContent>
          <Brain className="w-12 h-12 mx-auto text-gray-400 mb-4" />
          <p className="text-lg font-medium text-gray-600 mb-2">No insights yet</p>
          <p className="text-gray-500">
            Add some notes and I'll start analyzing your patterns to provide personalized insights!
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Brain className="w-6 h-6 text-purple-600" />
        <h2 className="text-xl font-semibold">AI Insights & Analysis</h2>
        <Badge variant="outline" className="text-xs">
          Based on {notes.length} notes
        </Badge>
      </div>

      {/* Score Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-0 shadow-lg">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Target className="w-4 h-4" />
              Habit Score
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="text-2xl font-bold text-blue-700">
                {insights.habitScore}/100
              </div>
              <Progress value={insights.habitScore} className="h-2" />
              <p className="text-xs text-blue-600">
                {insights.habitScore >= 80 ? 'Excellent!' : 
                 insights.habitScore >= 60 ? 'Good progress' : 'Building momentum'}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-0 shadow-lg">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Consistency
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="text-2xl font-bold text-green-700">
                {Math.round(insights.consistency)}%
              </div>
              <Progress value={insights.consistency} className="h-2" />
              <p className="text-xs text-green-600">
                Last 7 days activity
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-0 shadow-lg">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Weekly Trend
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-end gap-1 h-8">
                {insights.weeklyActivity.map((activity, i) => (
                  <div
                    key={i}
                    className="bg-purple-400 rounded-sm flex-1"
                    style={{ height: `${Math.max(activity * 10, 4)}px` }}
                    title={`Day ${i + 1}: ${activity} notes`}
                  />
                ))}
              </div>
              <p className="text-xs text-purple-600">
                {insights.weeklyActivity.reduce((a, b) => a + b, 0)} notes this week
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="patterns" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2 bg-white/80 backdrop-blur">
          <TabsTrigger value="patterns">Detected Patterns</TabsTrigger>
          <TabsTrigger value="suggestions">AI Suggestions</TabsTrigger>
        </TabsList>

        <TabsContent value="patterns" className="space-y-4">
          {insights.patterns.length === 0 ? (
            <Card className="text-center py-8 bg-white/80 backdrop-blur border-0 shadow-lg">
              <CardContent>
                <TrendingUp className="w-8 h-8 mx-auto text-gray-400 mb-3" />
                <p className="text-gray-600">No patterns detected yet</p>
                <p className="text-sm text-gray-500">Add more notes to see patterns emerge</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-3">
              {insights.patterns.map((pattern, index) => (
                <Card key={index} className="bg-white/80 backdrop-blur border-0 shadow-lg">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-xl">{getPatternIcon(pattern.type)}</span>
                        <div>
                          <p className="font-medium capitalize">{pattern.type} Pattern</p>
                          <p className="text-sm text-gray-600">
                            Mentioned {pattern.frequency} times
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge variant="secondary" className="text-xs">
                          {Math.round(pattern.confidence)}% confidence
                        </Badge>
                        <p className="text-xs text-gray-500 mt-1">
                          {pattern.trend === 'up' ? '📈' : pattern.trend === 'down' ? '📉' : '📊'} {pattern.trend}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="suggestions" className="space-y-4">
          {insights.suggestions.length === 0 ? (
            <Card className="text-center py-8 bg-white/80 backdrop-blur border-0 shadow-lg">
              <CardContent>
                <Lightbulb className="w-8 h-8 mx-auto text-gray-400 mb-3" />
                <p className="text-gray-600">No suggestions available yet</p>
                <p className="text-sm text-gray-500">Keep adding notes to get personalized suggestions</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {insights.suggestions.map((suggestion) => (
                <Card 
                  key={suggestion.id} 
                  className={`border-2 ${getSuggestionColor(suggestion.type)} shadow-lg`}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="mt-1">
                        {getSuggestionIcon(suggestion.type)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-medium">{suggestion.title}</h3>
                          <Badge variant="outline" className="text-xs capitalize">
                            {suggestion.type}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-700 mb-2">
                          {suggestion.description}
                        </p>
                        <div className="flex items-center justify-between text-xs text-gray-500">
                          <span>Based on: {suggestion.basedOn.join(', ')}</span>
                          <span>{suggestion.confidence}% confidence</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}