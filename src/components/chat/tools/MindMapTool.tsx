
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Map, Loader2, Brain, Bot, Maximize2, Clock, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { GROQ_API_KEY, GROQ_MODEL } from '@/utils/constants';
import { MindMapVisual } from '@/components/MindMapVisual';
import { memoryService } from '@/services/memoryService';
import { mindMapStorage, SavedMindMap } from '@/services/mindMapStorage';

interface MindMapToolProps {
  onSendToChat: (message: string) => void;
}

interface MindMapNode {
  id: string;
  text: string;
  level: number;
  children: MindMapNode[];
  color: string;
}

interface GeneratedMindMap {
  topic: string;
  nodes: MindMapNode[];
  createdAt: Date;
}

export const MindMapTool: React.FC<MindMapToolProps> = ({ onSendToChat }) => {
  const [topic, setTopic] = useState('');
  const [loading, setLoading] = useState(false);
  const [mindMap, setMindMap] = useState<GeneratedMindMap | null>(null);
  const [savedMindMaps, setSavedMindMaps] = useState<SavedMindMap[]>([]);
  const [showSaved, setShowSaved] = useState(true);
  const { toast } = useToast();

  const colors = [
    'bg-blue-100 text-blue-800',
    'bg-green-100 text-green-800',
    'bg-purple-100 text-purple-800',
    'bg-orange-100 text-orange-800',
    'bg-pink-100 text-pink-800',
    'bg-yellow-100 text-yellow-800',
    'bg-red-100 text-red-800',
    'bg-indigo-100 text-indigo-800'
  ];

  useEffect(() => {
    loadSavedMindMaps();
  }, []);

  const loadSavedMindMaps = () => {
    const maps = mindMapStorage.getAllMindMaps();
    setSavedMindMaps(maps);
  };

  const generateMindMap = async () => {
    if (!topic.trim()) {
      toast({
        title: "Error",
        description: "Please enter a topic for the mind map",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${GROQ_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: GROQ_MODEL,
          messages: [
            {
              role: 'system',
              content: `You are a mind mapping expert. Create a comprehensive mind map structure for any given topic. Return ONLY a valid JSON object with this exact structure:
{
  "topic": "Main Topic",
  "subtopics": [
    {
      "name": "Subtopic 1",
      "children": ["Detail 1", "Detail 2", "Detail 3", "Detail 4"]
    },
    {
      "name": "Subtopic 2", 
      "children": ["Detail 1", "Detail 2", "Detail 3", "Detail 4"]
    }
  ]
}

Create 5-7 main subtopics and 4-6 details for each subtopic. Focus on comprehensive coverage with practical, actionable, and educational content.`
            },
            {
              role: 'user',
              content: `Create a detailed mind map for: ${topic.trim()}`
            }
          ],
          temperature: 0.7,
          max_tokens: 1500
        })
      });

      if (!response.ok) {
        throw new Error('Failed to generate mind map');
      }

      const data = await response.json();
      const content = data.choices[0]?.message?.content;

      if (!content) {
        throw new Error('No content received');
      }

      // Parse the JSON response
      let mindMapData;
      try {
        mindMapData = JSON.parse(content);
      } catch (parseError) {
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          mindMapData = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error('Invalid JSON response');
        }
      }

      // Convert to our internal format
      const nodes: MindMapNode[] = mindMapData.subtopics.map((subtopic: any, index: number) => ({
        id: `node_${index}`,
        text: subtopic.name,
        level: 1,
        color: colors[index % colors.length],
        children: subtopic.children.map((child: string, childIndex: number) => ({
          id: `node_${index}_${childIndex}`,
          text: child,
          level: 2,
          color: colors[index % colors.length],
          children: []
        }))
      }));

      const generatedMap: GeneratedMindMap = {
        topic: mindMapData.topic || topic.trim(),
        nodes,
        createdAt: new Date()
      };

      setMindMap(generatedMap);
      
      // Save to storage
      mindMapStorage.saveMindMap(generatedMap.topic, generatedMap.nodes);
      loadSavedMindMaps();
      
      // Save to memory
      memoryService.addMemory({
        type: 'mind_map',
        title: `Mind Map: ${generatedMap.topic}`,
        content: JSON.stringify(generatedMap),
        metadata: { mindMapTopic: generatedMap.topic }
      });
      
      // Send to chat
      const mindMapText = `🧠 **Interactive Mind Map Created: ${generatedMap.topic}**\n\n${nodes.map(node => 
        `**${node.text}**\n${node.children.map(child => `  • ${child.text}`).join('\n')}`
      ).join('\n\n')}\n\n*Mind map saved! Click "Interactive View" to edit and explore.*`;
      
      onSendToChat(mindMapText);
      
      toast({
        title: "Success",
        description: "Interactive mind map generated and saved!"
      });

    } catch (error) {
      console.error('Mind map generation error:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to generate mind map",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const loadSavedMindMap = (savedMap: SavedMindMap) => {
    setMindMap({
      topic: savedMap.topic,
      nodes: savedMap.nodes,
      createdAt: new Date(savedMap.createdAt)
    });
    setShowSaved(false);
  };

  const deleteSavedMindMap = (id: string) => {
    mindMapStorage.deleteMindMap(id);
    loadSavedMindMaps();
    toast({
      title: "Deleted",
      description: "Mind map removed from saved collection"
    });
  };

  const createBotForNode = (node: MindMapNode) => {
    const botPrompt = `You are an AI expert specialized in "${node.text}". Your role is to provide detailed, practical, and actionable advice about this topic. You have deep knowledge about:

${node.children.map(child => `- ${child.text}`).join('\n')}

When users ask questions, provide comprehensive answers that are:
- Practical and actionable
- Based on current best practices
- Tailored to different skill levels
- Include specific examples when helpful

Your personality is helpful, knowledgeable, and encouraging. You break down complex concepts into understandable steps.`;

    // Save the bot configuration
    const botConfig = {
      id: `bot_${Date.now()}`,
      name: `${node.text} Expert`,
      topic: node.text,
      systemPrompt: botPrompt,
      createdAt: new Date(),
      isActive: false
    };

    const existingBots = JSON.parse(localStorage.getItem('botPersonas') || '[]');
    existingBots.push(botConfig);
    localStorage.setItem('botPersonas', JSON.stringify(existingBots));

    // Save to memory
    memoryService.addMemory({
      type: 'bot_interaction',
      title: `AI Bot Created: ${node.text} Expert`,
      content: `Created specialized bot for ${node.text} with expertise in: ${node.children.map(c => c.text).join(', ')}`,
      metadata: { botName: `${node.text} Expert`, botTopic: node.text }
    });

    toast({
      title: "Bot Created",
      description: `${node.text} Expert bot has been created and saved!`
    });

    onSendToChat(`🤖 **AI Expert Bot Created**: "${node.text} Expert"\n\nThis specialized bot is now available in your toolkit with deep knowledge about:\n${node.children.map(child => `• ${child.text}`).join('\n')}\n\n*The bot has been saved and can provide expert guidance on this topic anytime!*`);
  };

  const openFullscreen = () => {
    if (!mindMap) {
      toast({
        title: "No Mind Map",
        description: "Please generate or select a mind map first",
        variant: "destructive"
      });
      return;
    }

    // Store mind map data for the interactive page
    localStorage.setItem('currentMindMap', JSON.stringify({
      topic: mindMap.topic,
      nodes: mindMap.nodes
    }));
    
    // Trigger navigation to interactive page
    window.dispatchEvent(new CustomEvent('openInteractiveMindMap', {
      detail: { topic: mindMap.topic, nodes: mindMap.nodes }
    }));
    
    toast({
      title: "Opening Interactive Editor",
      description: "Launching full-screen mind map editor..."
    });
  };

  return (
    <Card className="w-full h-full flex flex-col">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Map className="h-5 w-5" />
          Enhanced Mind Map Generator
        </CardTitle>
        <CardDescription>
          Create interactive visual mind maps with AI bot creation for each topic
        </CardDescription>
      </CardHeader>
      
      <CardContent className="flex-1 flex flex-col space-y-4">
        {/* Input Section */}
        <div className="flex gap-2">
          <Input
            placeholder="Enter a topic (e.g., 'Machine Learning', 'Sustainable Living')"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            disabled={loading}
            onKeyPress={(e) => e.key === 'Enter' && !loading && generateMindMap()}
            className="rounded-xl"
          />
          <Button 
            onClick={generateMindMap} 
            disabled={loading || !topic.trim()}
            className="rounded-xl"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <Brain className="h-4 w-4 mr-2" />
                Generate
              </>
            )}
          </Button>
        </div>

        {/* Saved Mind Maps */}
        {showSaved && savedMindMaps.length > 0 && (
          <div className="space-y-3">
            <h4 className="font-medium text-sm flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Saved Mind Maps ({savedMindMaps.length})
            </h4>
            <div className="grid gap-2 max-h-40 overflow-y-auto">
              {savedMindMaps.map((savedMap) => (
                <div
                  key={savedMap.id}
                  className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{savedMap.topic}</p>
                    <p className="text-xs text-gray-500">
                      {new Date(savedMap.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => loadSavedMindMap(savedMap)}
                      className="text-xs"
                    >
                      Open
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => deleteSavedMindMap(savedMap.id)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Mind Map Display */}
        {mindMap && (
          <div className="flex-1 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-lg">{mindMap.topic}</h3>
                {showSaved && (
                  <Button
                    variant="link"
                    size="sm"
                    onClick={() => setShowSaved(false)}
                    className="text-xs p-0 h-auto"
                  >
                    Hide saved maps
                  </Button>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={openFullscreen}
                  className="flex items-center gap-2 rounded-xl"
                >
                  <Maximize2 className="h-4 w-4" />
                  Interactive View
                </Button>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Bot className="h-4 w-4" />
                  Click nodes to create AI experts
                </div>
              </div>
            </div>

            <MindMapVisual
              topic={mindMap.topic}
              nodes={mindMap.nodes}
              onCreateBot={createBotForNode}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
                <p className="text-sm text-blue-800 dark:text-blue-200 flex items-center gap-2">
                  <Bot className="h-4 w-4" />
                  <strong>Interactive Features:</strong> Click on any node in the visual mind map to create a specialized AI expert bot for that topic!
                </p>
              </div>
              
              <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-xl">
                <p className="text-sm text-green-800 dark:text-green-200 flex items-center gap-2">
                  <Maximize2 className="h-4 w-4" />
                  <strong>Full Editor:</strong> Click "Interactive View" to open the full mind map editor with editing capabilities!
                </p>
              </div>
            </div>
          </div>
        )}

        {!mindMap && !showSaved && (
          <div className="flex-1 flex items-center justify-center text-center text-muted-foreground">
            <div>
              <Map className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Enter a topic above to generate an interactive visual mind map</p>
              <p className="text-sm mt-2">Features: Cloud shapes, curved arrows, and AI bot creation!</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
