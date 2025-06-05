
import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowLeft, Plus, Minus, Move, Edit3, Save, Trash2, 
  Maximize2, Minimize2, Download, Bot, Zap
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { memoryService } from '@/services/memoryService';

interface MindMapNode {
  id: string;
  text: string;
  level: number;
  children: MindMapNode[];
  color: string;
  x: number;
  y: number;
  isEditing?: boolean;
}

interface InteractiveMindMapPageProps {
  onNavigateBack: () => void;
  initialTopic?: string;
  initialNodes?: MindMapNode[];
}

export const InteractiveMindMapPage: React.FC<InteractiveMindMapPageProps> = ({ 
  onNavigateBack, 
  initialTopic,
  initialNodes 
}) => {
  const [topic, setTopic] = useState(initialTopic || 'My Mind Map');
  const [nodes, setNodes] = useState<MindMapNode[]>(initialNodes || []);
  const [selectedNode, setSelectedNode] = useState<MindMapNode | null>(null);
  const [isEditingTopic, setIsEditingTopic] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const colors = [
    'bg-blue-100 text-blue-800 border-blue-300',
    'bg-green-100 text-green-800 border-green-300',
    'bg-purple-100 text-purple-800 border-purple-300',
    'bg-orange-100 text-orange-800 border-orange-300',
    'bg-pink-100 text-pink-800 border-pink-300',
    'bg-yellow-100 text-yellow-800 border-yellow-300',
    'bg-red-100 text-red-800 border-red-300',
    'bg-indigo-100 text-indigo-800 border-indigo-300'
  ];

  useEffect(() => {
    drawMindMap();
  }, [nodes, zoom, dragOffset]);

  const drawMindMap = () => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    const rect = container.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Apply zoom and drag transformations
    ctx.save();
    ctx.scale(zoom, zoom);
    ctx.translate(dragOffset.x, dragOffset.y);

    // Calculate positions if not set
    if (nodes.length > 0 && (!nodes[0].x || !nodes[0].y)) {
      positionNodes();
    }

    // Draw connections first
    nodes.forEach(node => {
      node.children.forEach(child => {
        drawConnection(ctx, node.x, node.y, child.x, child.y);
      });
    });

    // Draw nodes
    drawCentralTopic(ctx, canvas.width / 2 / zoom - dragOffset.x, canvas.height / 2 / zoom - dragOffset.y);
    nodes.forEach(node => drawNode(ctx, node));
    nodes.forEach(node => node.children.forEach(child => drawNode(ctx, child, true)));

    ctx.restore();
  };

  const positionNodes = () => {
    const centerX = (canvasRef.current?.width || 800) / 2;
    const centerY = (canvasRef.current?.height || 600) / 2;
    const radius = 200;

    const updatedNodes = nodes.map((node, index) => {
      const angle = (index * 2 * Math.PI) / nodes.length - Math.PI / 2;
      const x = centerX + Math.cos(angle) * radius;
      const y = centerY + Math.sin(angle) * radius;
      
      const updatedChildren = node.children.map((child, childIndex) => {
        const childAngle = angle + (childIndex - (node.children.length - 1) / 2) * 0.4;
        const childRadius = 120;
        return {
          ...child,
          x: x + Math.cos(childAngle) * childRadius,
          y: y + Math.sin(childAngle) * childRadius
        };
      });

      return { ...node, x, y, children: updatedChildren };
    });

    setNodes(updatedNodes);
  };

  const drawConnection = (ctx: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number) => {
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 2;
    ctx.setLineDash([]);

    ctx.beginPath();
    ctx.moveTo(x1, y1);
    
    const midX = (x1 + x2) / 2;
    const midY = (y1 + y2) / 2;
    const controlX = midX + (y2 - y1) * 0.1;
    const controlY = midY - (x2 - x1) * 0.1;
    
    ctx.quadraticCurveTo(controlX, controlY, x2, y2);
    ctx.stroke();

    // Draw arrowhead
    const angle = Math.atan2(y2 - controlY, x2 - controlX);
    const arrowLength = 8;
    ctx.beginPath();
    ctx.moveTo(x2, y2);
    ctx.lineTo(x2 - arrowLength * Math.cos(angle - Math.PI / 6), y2 - arrowLength * Math.sin(angle - Math.PI / 6));
    ctx.lineTo(x2 - arrowLength * Math.cos(angle + Math.PI / 6), y2 - arrowLength * Math.sin(angle + Math.PI / 6));
    ctx.fillStyle = '#cbd5e1';
    ctx.fill();
  };

  const drawCentralTopic = (ctx: CanvasRenderingContext2D, x: number, y: number) => {
    // Draw cloud shape for central topic
    ctx.fillStyle = '#3b82f6';
    ctx.strokeStyle = '#1e40af';
    ctx.lineWidth = 3;
    
    const radius = 80;
    ctx.beginPath();
    // Create cloud-like shape with multiple circles
    ctx.arc(x - radius * 0.3, y - radius * 0.2, radius * 0.4, 0, 2 * Math.PI);
    ctx.arc(x + radius * 0.3, y - radius * 0.2, radius * 0.4, 0, 2 * Math.PI);
    ctx.arc(x - radius * 0.2, y + radius * 0.1, radius * 0.3, 0, 2 * Math.PI);
    ctx.arc(x + radius * 0.2, y + radius * 0.1, radius * 0.3, 0, 2 * Math.PI);
    ctx.arc(x, y, radius * 0.5, 0, 2 * Math.PI);
    ctx.fill();
    ctx.stroke();

    // Draw topic text
    ctx.fillStyle = 'white';
    ctx.font = 'bold 16px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(topic, x, y);
  };

  const drawNode = (ctx: CanvasRenderingContext2D, node: MindMapNode, isChild: boolean = false) => {
    const radius = isChild ? 35 : 50;
    
    // Determine color
    const colorClass = node.color || colors[0];
    let fillColor = '#3b82f6';
    if (colorClass.includes('green')) fillColor = '#10b981';
    else if (colorClass.includes('purple')) fillColor = '#8b5cf6';
    else if (colorClass.includes('orange')) fillColor = '#f59e0b';
    else if (colorClass.includes('pink')) fillColor = '#ec4899';
    else if (colorClass.includes('yellow')) fillColor = '#eab308';
    else if (colorClass.includes('red')) fillColor = '#ef4444';
    else if (colorClass.includes('indigo')) fillColor = '#6366f1';

    // Draw cloud shape
    ctx.fillStyle = selectedNode?.id === node.id ? '#fbbf24' : fillColor;
    ctx.strokeStyle = selectedNode?.id === node.id ? '#f59e0b' : '#e2e8f0';
    ctx.lineWidth = 2;
    
    ctx.beginPath();
    ctx.arc(node.x - radius * 0.3, node.y - radius * 0.2, radius * 0.4, 0, 2 * Math.PI);
    ctx.arc(node.x + radius * 0.3, node.y - radius * 0.2, radius * 0.4, 0, 2 * Math.PI);
    ctx.arc(node.x - radius * 0.2, node.y + radius * 0.1, radius * 0.3, 0, 2 * Math.PI);
    ctx.arc(node.x + radius * 0.2, node.y + radius * 0.1, radius * 0.3, 0, 2 * Math.PI);
    ctx.arc(node.x, node.y, radius * 0.5, 0, 2 * Math.PI);
    ctx.fill();
    ctx.stroke();

    // Draw text
    ctx.fillStyle = 'white';
    ctx.font = `${isChild ? '12px' : '14px'} Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    // Wrap text if too long
    const maxWidth = radius * 1.5;
    const words = node.text.split(' ');
    let line = '';
    let y = node.y;
    
    if (words.length > 1) {
      const lines = [];
      for (const word of words) {
        const testLine = line + (line ? ' ' : '') + word;
        const metrics = ctx.measureText(testLine);
        if (metrics.width > maxWidth && line) {
          lines.push(line);
          line = word;
        } else {
          line = testLine;
        }
      }
      lines.push(line);
      
      const lineHeight = isChild ? 14 : 16;
      y = node.y - ((lines.length - 1) * lineHeight) / 2;
      
      lines.forEach((textLine, index) => {
        ctx.fillText(textLine, node.x, y + index * lineHeight);
      });
    } else {
      ctx.fillText(node.text, node.x, y);
    }
  };

  const handleCanvasClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = (event.clientX - rect.left) / zoom - dragOffset.x;
    const y = (event.clientY - rect.top) / zoom - dragOffset.y;

    // Check central topic
    const centerX = canvas.width / 2 / zoom - dragOffset.x;
    const centerY = canvas.height / 2 / zoom - dragOffset.y;
    const centerDistance = Math.sqrt((x - centerX) ** 2 + (y - centerY) ** 2);
    
    if (centerDistance < 80) {
      setIsEditingTopic(true);
      return;
    }

    // Check nodes
    const allNodes = [...nodes, ...nodes.flatMap(n => n.children)];
    let clicked = false;
    
    for (const node of allNodes) {
      if (node.x && node.y) {
        const distance = Math.sqrt((x - node.x) ** 2 + (y - node.y) ** 2);
        if (distance < 50) {
          setSelectedNode(selectedNode?.id === node.id ? null : node);
          clicked = true;
          break;
        }
      }
    }

    if (!clicked) {
      setSelectedNode(null);
    }
  };

  const addMainNode = () => {
    const newNode: MindMapNode = {
      id: `node_${Date.now()}`,
      text: 'New Topic',
      level: 1,
      children: [],
      color: colors[nodes.length % colors.length],
      x: 0,
      y: 0,
      isEditing: true
    };
    
    setNodes([...nodes, newNode]);
    setSelectedNode(newNode);
    toast({ title: "Node Added", description: "New main topic added to mind map" });
  };

  const addChildNode = () => {
    if (!selectedNode || selectedNode.level !== 1) {
      toast({ title: "Select Main Node", description: "Please select a main topic to add a subtopic" });
      return;
    }

    const newChild: MindMapNode = {
      id: `child_${Date.now()}`,
      text: 'New Subtopic',
      level: 2,
      children: [],
      color: selectedNode.color,
      x: 0,
      y: 0,
      isEditing: true
    };

    setNodes(prevNodes => 
      prevNodes.map(node => 
        node.id === selectedNode.id 
          ? { ...node, children: [...node.children, newChild] }
          : node
      )
    );
    
    setSelectedNode(newChild);
    toast({ title: "Subtopic Added", description: "New subtopic added to selected node" });
  };

  const deleteNode = () => {
    if (!selectedNode) return;

    if (selectedNode.level === 1) {
      setNodes(prevNodes => prevNodes.filter(node => node.id !== selectedNode.id));
    } else {
      setNodes(prevNodes => 
        prevNodes.map(node => ({
          ...node,
          children: node.children.filter(child => child.id !== selectedNode.id)
        }))
      );
    }
    
    setSelectedNode(null);
    toast({ title: "Node Deleted", description: "Selected node has been removed" });
  };

  const updateNodeText = (nodeId: string, newText: string) => {
    setNodes(prevNodes => 
      prevNodes.map(node => {
        if (node.id === nodeId) {
          return { ...node, text: newText, isEditing: false };
        }
        return {
          ...node,
          children: node.children.map(child => 
            child.id === nodeId 
              ? { ...child, text: newText, isEditing: false }
              : child
          )
        };
      })
    );
  };

  const saveMindMap = () => {
    memoryService.addMemory({
      type: 'mind_map',
      title: `Mind Map: ${topic}`,
      content: JSON.stringify({ topic, nodes }),
      metadata: { 
        mindMapTopic: topic,
        nodeCount: nodes.length + nodes.reduce((sum, node) => sum + node.children.length, 0)
      }
    });
    
    toast({ title: "Mind Map Saved", description: "Your mind map has been saved to memory" });
  };

  const createBotFromNode = (node: MindMapNode) => {
    const botPrompt = `You are an AI expert specialized in "${node.text}". Your role is to provide detailed, practical, and actionable advice about this topic. You have deep knowledge about:

${node.children.map(child => `- ${child.text}`).join('\n')}

When users ask questions, provide comprehensive answers that are:
- Practical and actionable
- Based on current best practices
- Tailored to different skill levels
- Include specific examples when helpful

Your personality is helpful, knowledgeable, and encouraging. You break down complex concepts into understandable steps.`;

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
  };

  // Handle mouse events for panning
  const handleMouseDown = (event: React.MouseEvent) => {
    if (event.button === 0) { // Left click
      setIsDragging(true);
      setDragStart({ x: event.clientX - dragOffset.x, y: event.clientY - dragOffset.y });
    }
  };

  const handleMouseMove = (event: React.MouseEvent) => {
    if (isDragging) {
      setDragOffset({
        x: event.clientX - dragStart.x,
        y: event.clientY - dragStart.y
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  return (
    <div className={`flex flex-col h-screen bg-gray-50 ${isFullscreen ? 'fixed inset-0 z-50' : ''}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-white border-b border-gray-200 shadow-sm">
        <div className="flex items-center space-x-3">
          <Button variant="ghost" size="sm" onClick={onNavigateBack}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center space-x-2">
            {isEditingTopic ? (
              <Input
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                onBlur={() => setIsEditingTopic(false)}
                onKeyPress={(e) => e.key === 'Enter' && setIsEditingTopic(false)}
                className="text-lg font-semibold"
                autoFocus
              />
            ) : (
              <h1 
                className="text-lg font-semibold text-gray-900 cursor-pointer hover:text-blue-600"
                onClick={() => setIsEditingTopic(true)}
              >
                {topic}
              </h1>
            )}
            <Button variant="ghost" size="sm" onClick={() => setIsEditingTopic(true)}>
              <Edit3 className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" onClick={() => setZoom(Math.max(0.5, zoom - 0.1))}>
            <Minus className="h-4 w-4" />
          </Button>
          <span className="text-sm text-gray-600">{Math.round(zoom * 100)}%</span>
          <Button variant="outline" size="sm" onClick={() => setZoom(Math.min(2, zoom + 0.1))}>
            <Plus className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={() => setIsFullscreen(!isFullscreen)}>
            {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </Button>
          <Button variant="outline" size="sm" onClick={saveMindMap}>
            <Save className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Main Canvas Area */}
        <div className="flex-1 relative" ref={containerRef}>
          <canvas
            ref={canvasRef}
            className="w-full h-full cursor-move bg-gradient-to-br from-blue-50 to-purple-50"
            onClick={handleCanvasClick}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          />
          
          {/* Zoom Controls */}
          <div className="absolute top-4 right-4 flex flex-col gap-2">
            <Button variant="outline" size="sm" onClick={() => setZoom(1)}>
              Reset View
            </Button>
            <Button variant="outline" size="sm" onClick={() => setDragOffset({ x: 0, y: 0 })}>
              <Move className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Right Panel - Node Controls */}
        <div className="w-80 bg-white border-l border-gray-200 p-4 space-y-4 overflow-y-auto">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Mind Map Controls</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button onClick={addMainNode} className="w-full">
                <Plus className="h-4 w-4 mr-2" />
                Add Main Topic
              </Button>
              <Button onClick={addChildNode} className="w-full" variant="outline" disabled={!selectedNode || selectedNode.level !== 1}>
                <Plus className="h-4 w-4 mr-2" />
                Add Subtopic
              </Button>
              <Button onClick={deleteNode} className="w-full" variant="destructive" disabled={!selectedNode}>
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Selected
              </Button>
            </CardContent>
          </Card>

          {selectedNode && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center justify-between">
                  Selected Node
                  <Badge className={selectedNode.color}>
                    {selectedNode.level === 1 ? 'Main' : 'Sub'}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <label className="text-sm font-medium">Text:</label>
                  <Input
                    value={selectedNode.text}
                    onChange={(e) => updateNodeText(selectedNode.id, e.target.value)}
                    className="mt-1"
                  />
                </div>
                
                <div>
                  <label className="text-sm font-medium">Color:</label>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {colors.map((color, index) => (
                      <button
                        key={index}
                        className={`w-6 h-6 rounded-full border-2 ${color} ${
                          selectedNode.color === color ? 'ring-2 ring-gray-400' : ''
                        }`}
                        onClick={() => {
                          setNodes(prevNodes => 
                            prevNodes.map(node => {
                              if (node.id === selectedNode.id) {
                                return { ...node, color };
                              }
                              return {
                                ...node,
                                children: node.children.map(child => 
                                  child.id === selectedNode.id ? { ...child, color } : child
                                )
                              };
                            })
                          );
                          setSelectedNode({ ...selectedNode, color });
                        }}
                      />
                    ))}
                  </div>
                </div>

                {selectedNode.level === 1 && (
                  <Button 
                    onClick={() => createBotFromNode(selectedNode)}
                    className="w-full"
                    variant="outline"
                  >
                    <Bot className="h-4 w-4 mr-2" />
                    Create AI Expert
                  </Button>
                )}

                {selectedNode.children && selectedNode.children.length > 0 && (
                  <div>
                    <label className="text-sm font-medium">Subtopics ({selectedNode.children.length}):</label>
                    <div className="space-y-1 mt-1">
                      {selectedNode.children.map((child) => (
                        <div key={child.id} className="text-xs p-2 bg-gray-50 rounded">
                          {child.text}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Mind Map Stats</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Main Topics:</span>
                  <Badge variant="secondary">{nodes.length}</Badge>
                </div>
                <div className="flex justify-between">
                  <span>Subtopics:</span>
                  <Badge variant="secondary">
                    {nodes.reduce((sum, node) => sum + node.children.length, 0)}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span>Total Nodes:</span>
                  <Badge variant="secondary">
                    {nodes.length + nodes.reduce((sum, node) => sum + node.children.length, 0)}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
