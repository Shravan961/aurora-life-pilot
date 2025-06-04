
import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Map, Loader2, Plus, Bot, Brain, Zap } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { GROQ_API_KEY } from '@/utils/constants';

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
  const [selectedNode, setSelectedNode] = useState<MindMapNode | null>(null);
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
          model: 'mixtral-8x7b-32768',
          messages: [
            {
              role: 'system',
              content: `You are a mind mapping expert. Create a comprehensive mind map structure for any given topic. Return ONLY a valid JSON object with this exact structure:
{
  "topic": "Main Topic",
  "subtopics": [
    {
      "name": "Subtopic 1",
      "children": ["Detail 1", "Detail 2", "Detail 3"]
    },
    {
      "name": "Subtopic 2", 
      "children": ["Detail 1", "Detail 2", "Detail 3"]
    }
  ]
}

Make sure to include 4-6 main subtopics and 3-5 details for each subtopic. Focus on practical, actionable, and comprehensive coverage of the topic.`
            },
            {
              role: 'user',
              content: `Create a detailed mind map for: ${topic.trim()}`
            }
          ],
          temperature: 0.7,
          max_tokens: 1000
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
        // If JSON parsing fails, try to extract JSON from the content
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
      
      // Send to chat
      const mindMapText = `🧠 **Mind Map: ${generatedMap.topic}**\n\n${nodes.map(node => 
        `**${node.text}**\n${node.children.map(child => `  • ${child.text}`).join('\n')}`
      ).join('\n\n')}`;
      
      onSendToChat(mindMapText);
      
      toast({
        title: "Success",
        description: "Mind map generated successfully!"
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

  const createBotForNode = (node: MindMapNode) => {
    setSelectedNode(node);
    
    const botPrompt = `You are an AI expert specialized in "${node.text}". Your role is to provide detailed, practical, and actionable advice about this topic. You have deep knowledge about:

${node.children.map(child => `- ${child.text}`).join('\n')}

When users ask questions, provide comprehensive answers that are:
- Practical and actionable
- Based on current best practices
- Tailored to different skill levels
- Include specific examples when helpful

Your personality is helpful, knowledgeable, and encouraging. You break down complex concepts into understandable steps.`;

    // Save the bot configuration to localStorage
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

    toast({
      title: "Bot Created",
      description: `${node.text} Expert bot has been created and saved!`
    });

    onSendToChat(`🤖 **AI Bot Created**: "${node.text} Expert"\n\nThis bot is now available in your toolkit and specializes in providing expert advice about ${node.text}. It covers topics like:\n${node.children.map(child => `• ${child.text}`).join('\n')}`);
  };

  const renderNode = (node: MindMapNode, isRoot: boolean = false) => (
    <div key={node.id} className={`mb-3 ${isRoot ? 'ml-0' : 'ml-6'}`}>
      <div className="flex items-center gap-2 mb-2">
        <Badge 
          className={`${node.color} cursor-pointer hover:opacity-80 transition-opacity`}
          onClick={() => isRoot && createBotForNode(node)}
        >
          {node.text}
        </Badge>
        {isRoot && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => createBotForNode(node)}
            className="h-6 w-6 p-0"
          >
            <Bot className="h-3 w-3" />
          </Button>
        )}
      </div>
      {node.children.length > 0 && (
        <div className="border-l-2 border-gray-200 pl-4">
          {node.children.map(child => renderNode(child))}
        </div>
      )}
    </div>
  );

  return (
    <Card className="w-full h-full flex flex-col">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Map className="h-5 w-5" />
          Mind Map Generator
        </CardTitle>
        <CardDescription>
          Create interactive mind maps and generate specialized AI bots for each topic
        </CardDescription>
      </CardHeader>
      
      <CardContent className="flex-1 flex flex-col space-y-4">
        {/* Input Section */}
        <div className="flex gap-2">
          <Input
            placeholder="Enter a topic (e.g., 'Healthy Habits', 'Digital Marketing')"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            disabled={loading}
            onKeyPress={(e) => e.key === 'Enter' && !loading && generateMindMap()}
          />
          <Button 
            onClick={generateMindMap} 
            disabled={loading || !topic.trim()}
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

        {/* Mind Map Display */}
        {mindMap && (
          <div className="flex-1 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-lg">{mindMap.topic}</h3>
              <Badge variant="outline" className="text-xs">
                {mindMap.createdAt.toLocaleString()}
              </Badge>
            </div>

            <ScrollArea className="flex-1 border rounded-lg p-4">
              <div className="space-y-4">
                {/* Central Topic */}
                <div className="text-center mb-6">
                  <Badge className="bg-gradient-to-r from-blue-500 to-purple-500 text-white text-lg px-4 py-2">
                    {mindMap.topic}
                  </Badge>
                </div>

                {/* Subtopics */}
                <div className="space-y-4">
                  {mindMap.nodes.map(node => renderNode(node, true))}
                </div>
              </div>
            </ScrollArea>

            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <p className="text-sm text-blue-800 dark:text-blue-200 flex items-center gap-2">
                <Bot className="h-4 w-4" />
                <strong>Pro Tip:</strong> Click the bot icon next to any main topic to create a specialized AI expert for that area!
              </p>
            </div>
          </div>
        )}

        {!mindMap && (
          <div className="flex-1 flex items-center justify-center text-center text-muted-foreground">
            <div>
              <Map className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Enter a topic above to generate an interactive mind map</p>
              <p className="text-sm mt-2">Each main branch can become a specialized AI bot!</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
