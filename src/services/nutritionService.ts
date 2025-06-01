
import { CALORIE_NINJAS_KEY } from '@/utils/constants';

export interface NutritionItem {
  name: string;
  calories: number;
  protein_g: number;
  fat_total_g: number;
  carbohydrates_total_g: number;
  fiber_g?: number;
  sugar_g?: number;
  sodium_mg?: number;
}

// Enhanced food recognition using image analysis
export const analyzeFoodImage = async (imageFile: File): Promise<string> => {
  try {
    // Create a canvas to process the image
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    return new Promise((resolve, reject) => {
      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx?.drawImage(img, 0, 0);
        
        // For now, we'll use a simplified approach that could be enhanced with OpenCV.js
        // This is a placeholder for more sophisticated image recognition
        const simulatedFoodItems = [
          "scrambled eggs", "toast", "banana", "apple", "chicken breast",
          "rice", "broccoli", "salmon", "pasta", "salad"
        ];
        
        // Simulate food detection (in production, this would use actual CV)
        const detectedFood = simulatedFoodItems[Math.floor(Math.random() * simulatedFoodItems.length)];
        const quantity = Math.floor(Math.random() * 3) + 1;
        
        resolve(`${quantity} ${detectedFood}`);
      };
      
      img.onerror = () => reject(new Error('Failed to process image'));
      img.src = URL.createObjectURL(imageFile);
    });
  } catch (error) {
    console.error('Image analysis error:', error);
    throw new Error('Unable to analyze food image');
  }
};

export const nutritionService = {
  async searchNutrition(query: string): Promise<NutritionItem[]> {
    try {
      const response = await fetch(`https://api.calorieninjas.com/v1/nutrition?query=${encodeURIComponent(query)}`, {
        headers: {
          'X-Api-Key': CALORIE_NINJAS_KEY,
        },
      });

      if (!response.ok) {
        throw new Error(`CalorieNinjas API error: ${response.status}`);
      }

      const data = await response.json();
      return data.items || [];
    } catch (error) {
      console.error('Nutrition API error:', error);
      throw error;
    }
  }
};
