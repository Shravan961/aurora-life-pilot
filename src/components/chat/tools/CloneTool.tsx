
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trash2, Plus, MessageCircle } from 'lucide-react';
import { toast } from "sonner";

interface Clone {
  id: string;
  name: string;
  personality: string;
  role: string;
  style: string;
  systemPrompt: string;
}

interface CloneToolProps {
  onSendToChat: (message: string) => void;
}

export const CloneTool: React.FC<CloneToolProps> = ({ onSendToChat }) => {
  const [clones, setClones] = useState<Clone[]>([]);
  const [activeClone, setActiveClone] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    personality: '',
    role: '',
    style: 'friendly'
  });

  useEffect(() => {
    const stored = localStorage.getItem('aiClones');
    if (stored) {
      setClones(JSON.parse(stored));
    }
  }, []);

  const saveClones = (updatedClones: Clone[]) => {
    setClones(updatedClones);
    localStorage.setItem('aiClones', JSON.stringify(updatedClones));
  };

  const createClone = () => {
    if (!formData.name || !formData.role) {
      toast.error('Name and role are required');
      return;
    }

    const newClone: Clone = {
      id: Date.now().toString(),
      name: formData.name,
      personality: formData.personality,
      role: formData.role,
      style: formData.style,
      systemPrompt: `You are ${formData.name}, a ${formData.role}. ${formData.personality ? `Your personality: ${formData.personality}.` : ''} Your communication style is ${formData.style}. Always stay in character and be helpful in your role.`
    };

    const updatedClones = [...clones, newClone];
    saveClones(updatedClones);
    setFormData({ name: '', personality: '', role: '', style: 'friendly' });
    setShowCreateForm(false);
    toast.success(`${newClone.name} clone created!`);
  };

  const deleteClone = (id: string) => {
    const updatedClones = clones.filter(clone => clone.id !== id);
    saveClones(updatedClones);
    if (activeClone === id) {
      setActiveClone(null);
    }
    toast.success('Clone deleted');
  };

  const activateClone = (clone: Clone) => {
    setActiveClone(clone.id);
    localStorage.setItem('activeClone', JSON.stringify(clone));
    onSendToChat(`I want to chat with ${clone.name}, my ${clone.role}. ${clone.systemPrompt}`);
    toast.success(`Now chatting with ${clone.name}`);
  };

  return (
    <div className="p-4 space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">AI Clones</h3>
        <Button onClick={() => setShowCreateForm(!showCreateForm)} size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Create Clone
        </Button>
      </div>

      {showCreateForm && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Create New AI Clone</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Input
              placeholder="Clone name (e.g., StudyBuddy, FitnessCoach)"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
            <Input
              placeholder="Role (e.g., Fitness Coach, Writing Tutor, Study Partner)"
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
            />
            <Textarea
              placeholder="Personality traits (optional)"
              value={formData.personality}
              onChange={(e) => setFormData({ ...formData, personality: e.target.value })}
              rows={2}
            />
            <Select value={formData.style} onValueChange={(value) => setFormData({ ...formData, style: value })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="friendly">Friendly</SelectItem>
                <SelectItem value="professional">Professional</SelectItem>
                <SelectItem value="casual">Casual</SelectItem>
                <SelectItem value="motivational">Motivational</SelectItem>
                <SelectItem value="humorous">Humorous</SelectItem>
                <SelectItem value="formal">Formal</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex space-x-2">
              <Button onClick={createClone} className="flex-1">Create</Button>
              <Button onClick={() => setShowCreateForm(false)} variant="outline">Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="space-y-2">
        {clones.map((clone) => (
          <Card key={clone.id} className={`${activeClone === clone.id ? 'ring-2 ring-blue-500' : ''}`}>
            <CardContent className="p-3">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h4 className="font-medium">{clone.name}</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{clone.role}</p>
                  <p className="text-xs text-gray-500">{clone.style} style</p>
                </div>
                <div className="flex space-x-2">
                  <Button
                    size="sm"
                    onClick={() => activateClone(clone)}
                    className={activeClone === clone.id ? 'bg-blue-500' : ''}
                  >
                    <MessageCircle className="h-4 w-4 mr-1" />
                    {activeClone === clone.id ? 'Active' : 'Chat'}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => deleteClone(clone.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        {clones.length === 0 && (
          <p className="text-center text-gray-500 py-4">No clones created yet</p>
        )}
      </div>
    </div>
  );
};
