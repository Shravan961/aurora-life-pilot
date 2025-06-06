
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Plus, Calendar as CalendarIcon, Clock, CheckCircle, Trash2 } from 'lucide-react';
import { useLocalTasks } from '@/hooks/useLocalTasks';
import { generateId, getTimestamp, formatDate } from '@/utils/helpers';
import { toast } from "sonner";
import { format } from 'date-fns';

interface CalendarPlannerProps {
  onSendToChat: (message: string) => void;
}

export const CalendarPlanner: React.FC<CalendarPlannerProps> = ({ onSendToChat }) => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [showAddTask, setShowAddTask] = useState(false);
  
  const { 
    tasks, 
    addTask, 
    updateTask, 
    deleteTask, 
    getTasksForDate 
  } = useLocalTasks();

  const selectedDateString = format(selectedDate, 'yyyy-MM-dd');
  const tasksForSelectedDate = getTasksForDate(selectedDateString);

  const handleAddTask = () => {
    if (!newTaskTitle.trim()) {
      toast.error('Please enter a task title');
      return;
    }

    const newTask = {
      id: generateId(),
      title: newTaskTitle.trim(),
      dueDate: selectedDateString,
      completed: false,
      timestamp: getTimestamp(),
    };

    addTask(newTask);
    setNewTaskTitle('');
    setShowAddTask(false);
    toast.success('Task added to calendar!');
    
    // Send to chat
    onSendToChat(`Added new task: "${newTask.title}" for ${format(selectedDate, 'EEEE, MMMM do, yyyy')}`);
  };

  const handleToggleTask = (taskId: string, completed: boolean, title: string) => {
    updateTask(taskId, { completed });
    toast.success(completed ? 'Task completed!' : 'Task marked as incomplete');
    
    // Send to chat
    onSendToChat(`${completed ? 'Completed' : 'Reopened'} task: "${title}" on ${format(selectedDate, 'EEEE, MMMM do, yyyy')}`);
  };

  const handleDeleteTask = (taskId: string, title: string) => {
    if (window.confirm(`Delete "${title}"?`)) {
      deleteTask(taskId);
      toast.success('Task deleted');
      
      // Send to chat
      onSendToChat(`Deleted task: "${title}" from ${format(selectedDate, 'EEEE, MMMM do, yyyy')}`);
    }
  };

  const getTasksForDate = (date: Date) => {
    const dateString = format(date, 'yyyy-MM-dd');
    return tasks.filter(task => task.dueDate === dateString);
  };

  const hasTasksOnDate = (date: Date) => {
    return getTasksForDate(date).length > 0;
  };

  const sendDaySummaryToChat = () => {
    const totalTasks = tasksForSelectedDate.length;
    const completedTasks = tasksForSelectedDate.filter(t => t.completed).length;
    const pendingTasks = tasksForSelectedDate.filter(t => !t.completed);
    
    let summary = `📅 Summary for ${format(selectedDate, 'EEEE, MMMM do, yyyy')}:\n`;
    summary += `Total tasks: ${totalTasks}\n`;
    summary += `Completed: ${completedTasks}\n`;
    summary += `Remaining: ${totalTasks - completedTasks}\n\n`;
    
    if (pendingTasks.length > 0) {
      summary += `Pending tasks:\n`;
      pendingTasks.forEach((task, index) => {
        summary += `${index + 1}. ${task.title}\n`;
      });
    }
    
    onSendToChat(summary);
  };

  return (
    <div className="h-full flex flex-col p-4 max-w-full">
      <Card className="flex-1 flex flex-col">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center justify-between text-lg">
            <div className="flex items-center space-x-2">
              <CalendarIcon className="h-5 w-5" />
              <span>Calendar Planner</span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={sendDaySummaryToChat}
              disabled={tasksForSelectedDate.length === 0}
            >
              Send Summary to Chat
            </Button>
          </CardTitle>
        </CardHeader>
        
        <CardContent className="flex-1 flex flex-col space-y-4">
          {/* Calendar */}
          <div className="flex justify-center">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={(date) => date && setSelectedDate(date)}
              className="rounded-md border"
              modifiers={{
                hasTasks: (date) => hasTasksOnDate(date)
              }}
              modifiersStyles={{
                hasTasks: { 
                  backgroundColor: 'rgb(99 102 241 / 0.1)',
                  color: 'rgb(99 102 241)',
                  fontWeight: 'bold'
                }
              }}
            />
          </div>

          {/* Selected Date Info */}
          <div className="text-center">
            <h3 className="font-semibold text-lg">
              {format(selectedDate, 'EEEE, MMMM do, yyyy')}
            </h3>
            <Badge variant="secondary" className="mt-1">
              {tasksForSelectedDate.length} task{tasksForSelectedDate.length !== 1 ? 's' : ''}
            </Badge>
          </div>

          {/* Add Task Button */}
          {!showAddTask ? (
            <Button
              onClick={() => setShowAddTask(true)}
              className="w-full"
              variant="outline"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Task for {format(selectedDate, 'MMM do')}
            </Button>
          ) : (
            <div className="space-y-2">
              <Input
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                placeholder="Enter task title..."
                onKeyPress={(e) => e.key === 'Enter' && handleAddTask()}
                autoFocus
              />
              <div className="flex space-x-2">
                <Button onClick={handleAddTask} disabled={!newTaskTitle.trim()} className="flex-1">
                  Add Task
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setShowAddTask(false);
                    setNewTaskTitle('');
                  }}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {/* Tasks for Selected Date */}
          <ScrollArea className="flex-1">
            <div className="space-y-2">
              {tasksForSelectedDate.length === 0 ? (
                <div className="text-center text-gray-500 py-8">
                  <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No tasks for this date</p>
                </div>
              ) : (
                tasksForSelectedDate
                  .sort((a, b) => a.completed ? 1 : b.completed ? -1 : 0)
                  .map((task) => (
                    <Card key={task.id} className={`p-3 ${task.completed ? 'bg-green-50 dark:bg-green-950/20' : ''}`}>
                      <div className="flex items-center space-x-3">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleToggleTask(task.id, !task.completed, task.title)}
                          className={task.completed ? 'text-green-600' : 'text-gray-400'}
                        >
                          <CheckCircle className="h-4 w-4" />
                        </Button>
                        
                        <div className="flex-1">
                          <p className={`text-sm ${task.completed ? 'line-through text-gray-500' : 'text-gray-900 dark:text-white'}`}>
                            {task.title}
                          </p>
                        </div>

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteTask(task.id, task.title)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </Card>
                  ))
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
};
