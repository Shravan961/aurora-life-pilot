
import { useState, useEffect } from 'react';
import { NutritionEntry } from '@/types';
import { STORAGE_KEYS } from '@/utils/constants';
import { isToday } from '@/utils/helpers';

export const useLocalNutrition = () => {
  const [entries, setEntries] = useState<NutritionEntry[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEYS.NUTRITION_ENTRIES);
    if (stored) {
      try {
        setEntries(JSON.parse(stored));
      } catch (error) {
        console.error('Error parsing nutrition entries:', error);
        setEntries([]);
      }
    }
  }, []);

  const saveEntries = (newEntries: NutritionEntry[]) => {
    setEntries(newEntries);
    localStorage.setItem(STORAGE_KEYS.NUTRITION_ENTRIES, JSON.stringify(newEntries));
  };

  const addEntry = (entry: NutritionEntry) => {
    const newEntries = [entry, ...entries];
    saveEntries(newEntries);
  };

  const deleteEntry = (entryId: string) => {
    const newEntries = entries.filter(entry => entry.id !== entryId);
    saveEntries(newEntries);
  };

  const getTodaysCalories = (): number => {
    return entries
      .filter(entry => isToday(entry.timestamp))
      .reduce((total, entry) => {
        return total + entry.result.items.reduce((sum, item) => sum + item.calories, 0);
      }, 0);
  };

  const getTodaysEntries = (): NutritionEntry[] => {
    return entries.filter(entry => isToday(entry.timestamp));
  };

  return {
    entries,
    addEntry,
    deleteEntry,
    getTodaysCalories,
    getTodaysEntries
  };
};
