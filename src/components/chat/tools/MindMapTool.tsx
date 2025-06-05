import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Brain, Sparkles, Save, Eye, Trash2, Calendar } from 'lucide-react';
import { MindMapVisual } from '@/components/MindMapVisual';
import { mindMapStorage, SavedMindMap } from '@/services/mindMapStorage';
import { memoryService } from '@/services/memoryService';
import { toast } from "sonner";

interface MindMapNode {
  id: string;
  text: string;
  level: number;
  children: MindMapNode[];
  color: string;
}

interface MindMapResponse {
  topic: string;
  nodes: MindMapNode[];
}

const generateMindMap = async (topic: string): Promise<MindMapResponse> => {
  // Mock data for now
  await new Promise(resolve => setTimeout(resolve, 1000));

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

  const numNodes = Math.floor(Math.random() * 4) + 3; // Random number between 3 and 6

  const nodes: MindMapNode[] = Array.from({ length: numNodes }, (_, i) => ({
    id: `node_${i}`,
    text: `Topic ${i + 1}`,
    level: 1,
    color: colors[i % colors.length],
    children: Array.from({ length: Math.floor(Math.random() * 3) }, (_, j) => ({
      id: `child_${i}_${j}`,
      text: `Subtopic ${j + 1}`,
      level: 2,
      color: colors[i % colors.length],
      children: []
    }))
  }));

  return {
    topic: topic,
    nodes: nodes
  };
};

export const MindMapTool: React.FC = () => {
  const [topic, setTopic] = useState('');
  const [mindMap, setMindMap] = useState<MindMapResponse | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [savedMindMaps, setSavedMindMaps] = useState<SavedMindMap[]>([]);

  useEffect(() => {
    loadSavedMindMaps();
  }, []);

  const loadSavedMindMaps = () => {
    const maps = mindMapStorage.getAllMindMaps();
    setSavedMindMaps(maps);
  };

  const handleGenerateMindMap = async () => {
    if (!topic.trim()) {
      toast.error('Please enter a topic');
      return;
    }

    setIsGenerating(true);
    try {
      const result = await generateMindMap(topic);
      setMindMap(result);
      
      // Save to memory
      memoryService.addMemory({
        type: 'mind_map',
        title: `Mind Map Generated: ${topic}`,
        content: `Generated mind map with ${result.nodes.length} main topics`,
        metadata: { mindMapTopic: topic }
      });
      
      toast.success('Mind map generated successfully!');
    } catch (error) {
      console.error('Error generating mind map:', error);
      toast.error('Failed to generate mind map');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveMindMap = () => {
    if (!mindMap) return;
    
    const saved = mindMapStorage.saveMindMap(topic, mindMap.nodes);
    setSavedMindMaps(prev => [saved, ...prev]);
    toast.success('Mind map saved!');
  };

  const handleViewMindMap = (savedMap: SavedMindMap) => {
    // Dispatch custom event to open interactive mind map
    const event = new CustomEvent('openInteractiveMindMap', {
      detail: {
        topic: savedMap.topic,
        nodes: savedMap.nodes
      }
    });
    window.dispatchEvent(event);
  };

  const handleDeleteMindMap = (id: string) => {
    mindMapStorage.deleteMindMap(id);
    setSavedMindMaps(prev => prev.filter(map => map.id !== id));
    toast.success('Mind map deleted');
  };

  const handleExtendMindMap = () => {
    if (!mindMap) return;
    
    // Dispatch custom event to open interactive mind map
    const event = new CustomEvent('openInteractiveMindMap', {
      detail: {
        topic,
        nodes: mindMap.nodes
      }
    });
    window.dispatchEvent(event);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-3">
        <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-600 rounded-lg flex items-center justify-center">
          <Brain className="h-5 w-5 text-white" />
        </div>
        <div>
          <h2 className="text-xl font-bold">Mind Map Generator</h2>
          <p className="text-gray-600 dark:text-gray-400">Create visual mind maps for any topic</p>
        </div>
      </div>

      {/* Input Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            Generate New Mind Map
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="Enter a topic (e.g., 'Artificial Intelligence', 'Healthy Living')"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleGenerateMindMap()}
              className="flex-1"
            />
            <Button 
              onClick={handleGenerateMindMap}
              disabled={isGenerating || !topic.trim()}
              className="bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700"
            >
              {isGenerating ? 'Generating...' : 'Generate'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Generated Mind Map */}
      {mindMap && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Generated Mind Map: {topic}</CardTitle>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={handleSaveMindMap}>
                  <Save className="h-4 w-4 mr-2" />
                  Save
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <MindMapVisual
              topic={topic}
              nodes={mindMap.nodes}
              onExtend={handleExtendMindMap}
              onCreateBot={(node) => {
                // Create bot logic here
                toast.success(`${node.text} Expert bot created!`);
              }}
            />
          </CardContent>
        </Card>
      )}

      {/* Saved Mind Maps */}
      {savedMindMaps.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5" />
              Saved Mind Maps
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {savedMindMaps.map((savedMap) => (
                <div key={savedMap.id} className="border rounded-lg p-4 space-y-3">
                  <div>
                    <h3 className="font-semibold">{savedMap.topic}</h3>
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                      <Calendar className="h-3 w-3" />
                      {new Date(savedMap.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                  
                  <div className="text-sm text-gray-600">
                    {savedMap.nodes.length} main topics
                  </div>
                  
                  <div className="flex gap-2">
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={() => handleViewMindMap(savedMap)}
                      className="flex-1"
                    >
                      <Eye className="h-3 w-3 mr-1" />
                      View
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={() => handleDeleteMindMap(savedMap.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
