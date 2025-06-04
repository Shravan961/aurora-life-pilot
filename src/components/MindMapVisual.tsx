
import React, { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Bot, Maximize2, Minimize2 } from 'lucide-react';

interface MindMapNode {
  id: string;
  text: string;
  level: number;
  children: MindMapNode[];
  color: string;
  x?: number;
  y?: number;
}

interface MindMapVisualProps {
  topic: string;
  nodes: MindMapNode[];
  onCreateBot: (node: MindMapNode) => void;
}

export const MindMapVisual: React.FC<MindMapVisualProps> = ({ topic, nodes, onCreateBot }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [selectedNode, setSelectedNode] = useState<MindMapNode | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const colors = {
    'bg-blue-100 text-blue-800': '#3B82F6',
    'bg-green-100 text-green-800': '#10B981',
    'bg-purple-100 text-purple-800': '#8B5CF6',
    'bg-orange-100 text-orange-800': '#F59E0B',
    'bg-pink-100 text-pink-800': '#EC4899',
    'bg-yellow-100 text-yellow-800': '#EAB308',
    'bg-red-100 text-red-800': '#EF4444',
    'bg-indigo-100 text-indigo-800': '#6366F1'
  };

  useEffect(() => {
    drawMindMap();
  }, [nodes, isFullscreen]);

  const drawMindMap = () => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    const rect = container.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = Math.max(600, rect.height);

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Calculate positions
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = Math.min(canvas.width, canvas.height) * 0.3;

    // Draw central topic
    drawCloudShape(ctx, centerX, centerY, 120, 60, '#6366F1', topic, '#FFFFFF', true);

    // Position and draw main nodes in a circle
    nodes.forEach((node, index) => {
      const angle = (index * 2 * Math.PI) / nodes.length - Math.PI / 2;
      const x = centerX + Math.cos(angle) * radius;
      const y = centerY + Math.sin(angle) * radius;
      
      node.x = x;
      node.y = y;

      // Draw connection line
      drawCurvedLine(ctx, centerX, centerY, x, y, '#94A3B8');

      // Draw main node
      const nodeColor = colors[node.color as keyof typeof colors] || '#6366F1';
      drawCloudShape(ctx, x, y, 100, 50, nodeColor, node.text, '#FFFFFF');

      // Draw child nodes
      node.children.forEach((child, childIndex) => {
        const childAngle = angle + (childIndex - (node.children.length - 1) / 2) * 0.3;
        const childRadius = 150;
        const childX = x + Math.cos(childAngle) * childRadius;
        const childY = y + Math.sin(childAngle) * childRadius;

        child.x = childX;
        child.y = childY;

        // Draw connection
        drawCurvedLine(ctx, x, y, childX, childY, '#CBD5E1');

        // Draw child node
        drawCloudShape(ctx, childX, childY, 80, 35, nodeColor, child.text, '#FFFFFF', false, 12);
      });
    });
  };

  const drawCloudShape = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    height: number,
    fillColor: string,
    text: string,
    textColor: string,
    isCentral: boolean = false,
    fontSize: number = 14
  ) => {
    ctx.save();

    // Draw cloud shape
    ctx.beginPath();
    const radiusX = width / 2;
    const radiusY = height / 2;
    
    // Create cloud-like shape with multiple circles
    ctx.arc(x - radiusX * 0.3, y - radiusY * 0.2, radiusX * 0.4, 0, 2 * Math.PI);
    ctx.arc(x + radiusX * 0.3, y - radiusY * 0.2, radiusX * 0.4, 0, 2 * Math.PI);
    ctx.arc(x - radiusX * 0.2, y + radiusY * 0.1, radiusX * 0.3, 0, 2 * Math.PI);
    ctx.arc(x + radiusX * 0.2, y + radiusY * 0.1, radiusX * 0.3, 0, 2 * Math.PI);
    ctx.arc(x, y, radiusX * 0.5, 0, 2 * Math.PI);

    ctx.fillStyle = fillColor;
    ctx.fill();

    // Add border
    ctx.strokeStyle = isCentral ? '#FFFFFF' : '#E2E8F0';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Add shadow
    ctx.shadowColor = 'rgba(0, 0, 0, 0.1)';
    ctx.shadowBlur = 5;
    ctx.shadowOffsetX = 2;
    ctx.shadowOffsetY = 2;

    // Draw text
    ctx.fillStyle = textColor;
    ctx.font = `${isCentral ? 'bold ' : ''}${fontSize}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    // Wrap text if too long
    const words = text.split(' ');
    const maxWidth = width * 0.8;
    let line = '';
    let lineY = y;
    
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
      
      const lineHeight = fontSize * 1.2;
      lineY = y - ((lines.length - 1) * lineHeight) / 2;
      
      lines.forEach((textLine, index) => {
        ctx.fillText(textLine, x, lineY + index * lineHeight);
      });
    } else {
      ctx.fillText(text, x, y);
    }

    ctx.restore();
  };

  const drawCurvedLine = (
    ctx: CanvasRenderingContext2D,
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    color: string
  ) => {
    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.setLineDash([]);

    ctx.beginPath();
    ctx.moveTo(x1, y1);
    
    // Create curved line
    const midX = (x1 + x2) / 2;
    const midY = (y1 + y2) / 2;
    const controlX = midX + (y2 - y1) * 0.1;
    const controlY = midY - (x2 - x1) * 0.1;
    
    ctx.quadraticCurveTo(controlX, controlY, x2, y2);
    ctx.stroke();

    // Add arrowhead
    const angle = Math.atan2(y2 - controlY, x2 - controlX);
    const arrowLength = 10;
    ctx.beginPath();
    ctx.moveTo(x2, y2);
    ctx.lineTo(x2 - arrowLength * Math.cos(angle - Math.PI / 6), y2 - arrowLength * Math.sin(angle - Math.PI / 6));
    ctx.lineTo(x2 - arrowLength * Math.cos(angle + Math.PI / 6), y2 - arrowLength * Math.sin(angle + Math.PI / 6));
    ctx.fillStyle = color;
    ctx.fill();

    ctx.restore();
  };

  const handleCanvasClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    // Check if click is on any node
    const allNodes = [{ text: topic, x: canvas.width / 2, y: canvas.height / 2, level: 0 }, ...nodes, ...nodes.flatMap(n => n.children)];
    
    for (const node of allNodes) {
      if (node.x && node.y) {
        const distance = Math.sqrt((x - node.x) ** 2 + (y - node.y) ** 2);
        if (distance < 50) {
          setSelectedNode(node as MindMapNode);
          break;
        }
      }
    }
  };

  return (
    <div 
      ref={containerRef}
      className={`relative border rounded-lg bg-gradient-to-br from-blue-50 to-purple-50 ${
        isFullscreen ? 'fixed inset-0 z-50 bg-white' : 'h-96'
      }`}
    >
      <div className="absolute top-2 right-2 flex gap-2 z-10">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsFullscreen(!isFullscreen)}
        >
          {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
        </Button>
      </div>

      <canvas
        ref={canvasRef}
        onClick={handleCanvasClick}
        className="w-full h-full cursor-pointer"
      />

      {selectedNode && (
        <div className="absolute bottom-4 left-4 bg-white p-3 rounded-lg shadow-lg border max-w-xs">
          <div className="flex items-center justify-between mb-2">
            <Badge className={selectedNode.color}>
              {selectedNode.text}
            </Badge>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onCreateBot(selectedNode)}
              className="h-6 w-6 p-0"
            >
              <Bot className="h-3 w-3" />
            </Button>
          </div>
          {selectedNode.children && selectedNode.children.length > 0 && (
            <div className="text-xs text-gray-600">
              <p>Subtopics: {selectedNode.children.map(c => c.text).join(', ')}</p>
            </div>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSelectedNode(null)}
            className="mt-2 w-full text-xs"
          >
            Close
          </Button>
        </div>
      )}
    </div>
  );
};
