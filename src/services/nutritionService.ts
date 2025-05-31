
const CALORIE_NINJAS_API_KEY = 'AGA1x8JS+nq9z3KduU+vrA==C3MXzxW2DQ54kmuT';

interface NutritionItem {
  name: string;
  calories: number;
  protein_g: number;
  fat_total_g: number;
  carbohydrates_total_g: number;
  fiber_g?: number;
  sugar_g?: number;
  sodium_mg?: number;
}

class NutritionService {
  async searchNutrition(query: string): Promise<NutritionItem[]> {
    try {
      const response = await fetch(`https://api.calorieninjas.com/v1/nutrition?query=${encodeURIComponent(query)}`, {
        method: 'GET',
        headers: {
          'X-Api-Key': CALORIE_NINJAS_API_KEY,
        },
      });

      if (!response.ok) {
        throw new Error(`CalorieNinjas API error: ${response.status}`);
      }

      const data = await response.json();
      
      if (!data.items || data.items.length === 0) {
        throw new Error('No nutrition information found for this query');
      }

      return data.items;
    } catch (error) {
      console.error('Nutrition API error:', error);
      throw error;
    }
  }
}

export const nutritionService = new NutritionService();
