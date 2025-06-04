
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Bot, Plus, Trash2, Play, Square, Edit } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface BotsToolProps {
  onSendToChat: (message: string) => void;
}

interface BotPersona {
  id: string;
  name: string;
  topic: string;
  systemPrompt: string;
  createdAt: Date;
  isActive: boolean;
}

export const BotsTool: React.FC<BotsToolProps> = ({ onSendToChat }) => {
  const [bots, setBots] = useState<BotPersona[]>([]);
  const [newBotName, setNewBotName] = useState('');
  const [newBotTopic, setNewBotTopic] = useState('');
  const [newBotPrompt, setNewBotPrompt] = useState('');
  const [editingBot, setEditingBot] = useState<BotPersona | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadBots();
  }, []);

  const loadBots = () => {
    const stored = localStorage.getItem('botPersonas');
    if (stored) {
      const parsedBots = JSON.parse(stored).map((bot: any) => ({
        ...bot,
        createdAt: new Date(bot.createdAt)
      }));
      setBots(parsedBots);
    }
  };

  const saveBots = (updatedBots: BotPersona[]) => {
    localStorage.setItem('botPersonas', JSON.stringify(updatedBots));
    setBots(updatedBots);
  };

  const createBot = () => {
    if (!newBotName.trim() || !newBotTopic.trim()) {
      toast({
        title: "Error",
        description: "Please enter both name and topic for the bot",
        variant: "destructive"
      });
      return;
    }

    const systemPrompt = newBotPrompt.trim() || `You are an AI assistant specialized in ${newBotTopic}. You provide helpful, accurate, and detailed information about this topic. Your responses are professional, friendly, and tailored to the user's level of understanding.`;

    const newBot: BotPersona = {
      id: `bot_${Date.now()}`,
      name: newBotName.trim(),
      topic: newBotTopic.trim(),
      systemPrompt,
      createdAt: new Date(),
      isActive: false
    };

    const updatedBots = [...bots, newBot];
    saveBots(updatedBots);

    setNewBotName('');
    setNewBotTopic('');
    setNewBotPrompt('');

    toast({
      title: "Success",
      description: `Bot "${newBot.name}" created successfully!`
    });

    onSendToChat(`🤖 **New Bot Created**: "${newBot.name}"\n\nSpecialty: ${newBot.topic}\n\nThis bot is now available in your toolkit and ready to assist with ${newBot.topic}-related questions.`);
  };

  const activateBot = (bot: BotPersona) => {
    // Deactivate all other bots
    const updatedBots = bots.map(b => ({
      ...b,
      isActive: b.id === bot.id
    }));
    
    saveBots(updatedBots);
    localStorage.setItem('activeClone', JSON.stringify({
      id: bot.id,
      name: bot.name,
      system_prompt: bot.systemPrompt,
      is_active: true
    }));

    toast({
      title: "Bot Activated",
      description: `${bot.name} is now active in your chat`
    });

    onSendToChat(`🤖 **Bot Activated**: "${bot.name}" is now handling your conversations!\n\nI'm specialized in ${bot.topic} and ready to help. You can ask me to stop anytime by saying "stop" or "be normal again".`);
  };

  const deactivateBot = (bot: BotPersona) => {
    const updatedBots = bots.map(b => ({
      ...b,
      isActive: false
    }));
    
    saveBots(updatedBots);
    localStorage.removeItem('activeClone');

    toast({
      title: "Bot Deactivated",
      description: `${bot.name} has been deactivated`
    });

    onSendToChat(`🤖 **Bot Deactivated**: "${bot.name}" has been deactivated. I'm back to normal mode!`);
  };

  const deleteBot = (bot: BotPersona) => {
    const updatedBots = bots.filter(b => b.id !== bot.id);
    saveBots(updatedBots);

    if (bot.isActive) {
      localStorage.removeItem('activeClone');
    }

    toast({
      title: "Bot Deleted",
      description: `${bot.name} has been deleted`
    });
  };

  const startEditing = (bot: BotPersona) => {
    setEditingBot(bot);
    setNewBotName(bot.name);
    setNewBotTopic(bot.topic);
    setNewBotPrompt(bot.systemPrompt);
  };

  const saveEdit = () => {
    if (!editingBot) return;

    const updatedBot = {
      ...editingBot,
      name: newBotName.trim(),
      topic: newBotTopic.trim(),
      systemPrompt: newBotPrompt.trim() || editingBot.systemPrompt
    };

    const updatedBots = bots.map(b => 
      b.id === editingBot.id ? updatedBot : b
    );

    saveBots(updatedBots);

    if (editingBot.isActive) {
      localStorage.setItem('activeClone', JSON.stringify({
        id: updatedBot.id,
        name: updatedBot.name,
        system_prompt: updatedBot.systemPrompt,
        is_active: true
      }));
    }

    setEditingBot(null);
    setNewBotName('');
    setNewBotTopic('');
    setNewBotPrompt('');

    toast({
      title: "Success",
      description: `Bot "${updatedBot.name}" updated successfully!`
    });
  };

  const cancelEdit = () => {
    setEditingBot(null);
    setNewBotName('');
    setNewBotTopic('');
    setNewBotPrompt('');
  };

  return (
    <Card className="w-full h-full flex flex-col">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bot className="h-5 w-5" />
          AI Bot Manager
        </CardTitle>
        <CardDescription>
          Create, manage, and activate specialized AI personalities for different topics
        </CardDescription>
      </CardHeader>
      
      <CardContent className="flex-1 flex flex-col space-y-4">
        <Tabs defaultValue="bots" className="flex-1 flex flex-col">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="bots">My Bots ({bots.length})</TabsTrigger>
            <TabsTrigger value="create">
              {editingBot ? 'Edit Bot' : 'Create Bot'}
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="bots" className="flex-1 flex flex-col space-y-4">
            {bots.length === 0 ? (
              <div className="flex-1 flex items-center justify-center text-center text-muted-foreground">
                <div>
                  <Bot className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No bots created yet</p>
                  <p className="text-sm mt-2">Create your first AI bot to get started!</p>
                </div>
              </div>
            ) : (
              <ScrollArea className="flex-1">
                <div className="space-y-3">
                  {bots.map((bot) => (
                    <div
                      key={bot.id}
                      className={`p-4 border rounded-lg ${
                        bot.isActive ? 'bg-green-50 border-green-200' : 'bg-white'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-medium">{bot.name}</h3>
                            {bot.isActive && (
                              <Badge className="bg-green-500 text-white">Active</Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">
                            Topic: {bot.topic}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Created: {bot.createdAt.toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => startEditing(bot)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => bot.isActive ? deactivateBot(bot) : activateBot(bot)}
                            className={bot.isActive ? 'text-red-600' : 'text-green-600'}
                          >
                            {bot.isActive ? <Square className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteBot(bot)}
                            className="text-red-600"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      <div className="text-xs text-muted-foreground bg-gray-50 p-2 rounded max-h-20 overflow-y-auto">
                        {bot.systemPrompt.substring(0, 150)}...
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </TabsContent>
          
          <TabsContent value="create" className="flex-1 flex flex-col space-y-4">
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Bot Name</label>
                <Input
                  placeholder="e.g., Fitness Coach, Marketing Expert"
                  value={newBotName}
                  onChange={(e) => setNewBotName(e.target.value)}
                />
              </div>
              
              <div>
                <label className="text-sm font-medium mb-2 block">Specialty Topic</label>
                <Input
                  placeholder="e.g., Health & Fitness, Digital Marketing"
                  value={newBotTopic}
                  onChange={(e) => setNewBotTopic(e.target.value)}
                />
              </div>
              
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Custom Instructions (Optional)
                </label>
                <Textarea
                  placeholder="Describe the bot's personality, expertise, and how it should respond..."
                  value={newBotPrompt}
                  onChange={(e) => setNewBotPrompt(e.target.value)}
                  className="min-h-32 resize-none"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Leave empty for a default personality based on the topic
                </p>
              </div>
              
              <div className="flex gap-2">
                {editingBot ? (
                  <>
                    <Button onClick={saveEdit} className="flex-1">
                      Save Changes
                    </Button>
                    <Button variant="outline" onClick={cancelEdit}>
                      Cancel
                    </Button>
                  </>
                ) : (
                  <Button
                    onClick={createBot}
                    disabled={!newBotName.trim() || !newBotTopic.trim()}
                    className="flex-1"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Create Bot
                  </Button>
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <p className="text-sm text-blue-800 dark:text-blue-200">
            <strong>💡 Tip:</strong> Activate a bot to change your chat personality. Only one bot can be active at a time. Say "stop" in chat to deactivate.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
