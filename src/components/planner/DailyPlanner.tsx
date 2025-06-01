
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Check, Clock, Calendar, Trash2, CheckCircle } from 'lucide-react';
import { useLocalTasks } from '@/hooks/useLocalTasks';
import { generateId, getTimestamp, getTodayDateString, formatDate } from '@/utils/helpers';
import { toast } from "sonner";

export const DailyPlanner: React.FC = () => {
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDueDate, setNewTaskDueDate] = useState(getTodayDateString());
  const [showAllTasks, setShowAllTasks] = useState(false);
  
  const { 
    tasks, 
    addTask, 
    updateTask, 
    deleteTask, 
    getTodaysTasks, 
    getTodaysCompletedCount, 
    getTodaysTotalCount 
  } = useLocalTasks();

  const todaysTasks = getTodaysTasks();
  const completedToday = getTodaysCompletedCount();
  const totalToday = getTodaysTotalCount();
  const remainingToday = totalToday - completedToday;

  const handleAddTask = () => {
    if (!newTaskTitle.trim()) {
      toast.error('Please enter a task title');
      return;
    }

    const newTask = {
      id: generateId(),
      title: newTaskTitle.trim(),
      dueDate: newTaskDueDate,
      completed: false,
      timestamp: getTimestamp(),
    };

    addTask(newTask);
    setNewTaskTitle('');
    setNewTaskDueDate(getTodayDateString());
    toast.success('Task added successfully!');
  };

  const handleCompleteTask = (taskId: string, title: string) => {
    updateTask(taskId, { completed: true });
    toast.success(`"${title}" marked as completed!`);
  };

  const handleToggleTask = (taskId: string, completed: boolean) => {
    updateTask(taskId, { completed });
    toast.success(completed ? 'Task completed!' : 'Task marked as incomplete');
  };

  const handleDeleteTask = (taskId: string, title: string) => {
    if (window.confirm(`Are you sure you want to delete "${title}"?`)) {
      deleteTask(taskId);
      toast.success('Task deleted');
    }
  };

  const getPriorityColor = (dueDate: string, completed: boolean) => {
    if (completed) return 'border-l-green-500 bg-green-50 dark:bg-green-950/20';
    
    const today = getTodayDateString();
    const due = new Date(dueDate);
    const todayDate = new Date(today);
    
    if (due < todayDate) return 'border-l-red-500 bg-red-50 dark:bg-red-950/20'; // Overdue
    if (due.getTime() === todayDate.getTime()) return 'border-l-yellow-500 bg-yellow-50 dark:bg-yellow-950/20'; // Due today
    return 'border-l-blue-500 bg-blue-50 dark:bg-blue-950/20'; // Future
  };

  const getStatusText = (dueDate: string, completed: boolean) => {
    if (completed) return 'Completed';
    
    const today = getTodayDateString();
    const due = new Date(dueDate);
    const todayDate = new Date(today);
    
    if (due < todayDate) return 'Overdue';
    if (due.getTime() === todayDate.getTime()) return 'Due today';
    return 'Upcoming';
  };

  const displayTasks = showAllTasks ? tasks : todaysTasks;

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Daily Planner
        </h2>
        <p className="text-gray-600 dark:text-gray-300">
          Organize your day and boost productivity
        </p>
      </div>

      {/* Daily Summary */}
      <Card className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white">
        <CardContent className="p-4">
          <div className="text-center mb-4">
            <h3 className="text-lg font-semibold">Today's Progress</h3>
            <p className="text-sm opacity-90">
              You have {totalToday} tasks due today. 
              Completed {completedToday}, Remaining {remainingToday}.
            </p>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-3xl font-bold">{completedToday}/{totalToday}</div>
              <div className="text-sm opacity-90">Tasks</div>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold">
                {totalToday > 0 ? Math.round((completedToday / totalToday) * 100) : 0}%
              </div>
              <div className="text-sm opacity-90">Complete</div>
            </div>
          </div>
          <div className="w-full bg-blue-400/30 rounded-full h-2 mt-3">
            <div 
              className="bg-white h-2 rounded-full transition-all duration-300"
              style={{ 
                width: `${totalToday > 0 ? (completedToday / totalToday) * 100 : 0}%` 
              }}
            ></div>
          </div>
        </CardContent>
      </Card>

      {/* Add New Task */}
      <Card className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Plus className="h-5 w-5" />
            <span>Add New Task</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            value={newTaskTitle}
            onChange={(e) => setNewTaskTitle(e.target.value)}
            placeholder="Task title..."
            onKeyPress={(e) => e.key === 'Enter' && handleAddTask()}
          />
          <div className="flex space-x-2">
            <Input
              type="date"
              value={newTaskDueDate}
              onChange={(e) => setNewTaskDueDate(e.target.value)}
              className="flex-1"
            />
            <Button onClick={handleAddTask} disabled={!newTaskTitle.trim()}>
              Add Task
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Task Filter */}
      <div className="flex space-x-2">
        <Button
          variant={!showAllTasks ? "default" : "outline"}
          onClick={() => setShowAllTasks(false)}
        >
          Today's Tasks ({todaysTasks.length})
        </Button>
        <Button
          variant={showAllTasks ? "default" : "outline"}
          onClick={() => setShowAllTasks(true)}
        >
          All Tasks ({tasks.length})
        </Button>
      </div>

      {/* Tasks List */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center space-x-2">
          <Calendar className="h-5 w-5" />
          <span>{showAllTasks ? 'All Tasks' : 'Today\'s Tasks'}</span>
        </h3>

        {displayTasks.length === 0 ? (
          <Card className="bg-white/40 dark:bg-gray-800/40 backdrop-blur-sm">
            <CardContent className="p-8 text-center">
              <Clock className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <p className="text-gray-600 dark:text-gray-400">
                {showAllTasks ? 'No tasks yet. Add one above to get started!' : 'No tasks due today!'}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {displayTasks
              .sort((a, b) => {
                if (a.completed !== b.completed) {
                  return a.completed ? 1 : -1;
                }
                return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
              })
              .map((task) => (
                <Card 
                  key={task.id} 
                  className={`border-l-4 ${getPriorityColor(task.dueDate, task.completed)} backdrop-blur-sm`}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start space-x-3">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleToggleTask(task.id, !task.completed)}
                        className={`mt-1 ${task.completed ? 'text-green-600' : 'text-gray-400'}`}
                      >
                        <Check className="h-4 w-4" />
                      </Button>
                      
                      <div className="flex-1 min-w-0">
                        <h4 className={`font-medium ${
                          task.completed 
                            ? 'line-through text-gray-500 dark:text-gray-400' 
                            : 'text-gray-900 dark:text-white'
                        }`}>
                          {task.title}
                        </h4>
                        <div className="flex items-center space-x-4 mt-2">
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            task.completed 
                              ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                              : task.dueDate < getTodayDateString()
                              ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                              : task.dueDate === getTodayDateString()
                              ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300'
                              : 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                          }`}>
                            {getStatusText(task.dueDate, task.completed)}
                          </span>
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            Due: {formatDate(new Date(task.dueDate).getTime())}
                          </span>
                        </div>
                      </div>

                      <div className="flex space-x-1">
                        {!task.completed && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleCompleteTask(task.id, task.title)}
                            className="text-green-600 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-950/20"
                          >
                            <CheckCircle className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteTask(task.id, task.title)}
                          className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
          </div>
        )}
      </div>
    </div>
  );
};
