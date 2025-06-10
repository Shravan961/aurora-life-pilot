import { CALORIE_NINJAS_KEY, GEMINI_API_KEY, GROQ_API_KEY, GROQ_MODEL } from '@/utils/constants';
import { memoryService } from './memoryService';

export interface NutritionItem {
  name: string;
  calories: number;
  protein_g: number;
  fat_total_g: number;
  carbohydrates_total_g: number;
  fiber_g?: number;
  sugar_g?: number;
  sodium_mg?: number;
  serving_size?: string;
  confidence?: number;
}

export const analyzeFoodImage = async (imageFile: File): Promise<string> => {
  try {
    // Convert image to base64
    const base64Image = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        // Remove data:image/jpeg;base64, prefix
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(imageFile);
    });

    // First, use Gemini to identify food items and their details
    const geminiResponse = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-pro-vision:generateContent?key=' + GEMINI_API_KEY, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [
            {
              text: `Analyze this food image and provide:
1. List each food item visible
2. Estimate portion sizes and quantities
3. Identify main ingredients
4. Note any visible preparation methods (e.g., grilled, fried, raw)
5. Estimate approximate serving size
6. Note any visible condiments or toppings
7. Identify if this is a complete meal or snack
8. Note any visible nutritional concerns (e.g., excessive oil, large portions)

Format your response in a structured way, focusing on accuracy for nutritional analysis.`
            },
            {
              inline_data: {
                mime_type: imageFile.type,
                data: base64Image
              }
            }
          ]
        }],
        generationConfig: {
          temperature: 0.2,
          maxOutputTokens: 1000
        }
      })
    });

    if (!geminiResponse.ok) {
      throw new Error(`Gemini API error: ${geminiResponse.status}`);
    }

    const geminiData = await geminiResponse.json();
    const foodAnalysis = geminiData.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!foodAnalysis) {
      throw new Error('Could not analyze food in image');
    }

    // Use Groq to process the Gemini analysis and generate a nutrition-friendly query
    const groqResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        messages: [
          {
            role: 'system',
            content: `You are a nutrition expert that converts detailed food descriptions into accurate nutrition database queries.
Your task is to:
1. Parse the food analysis
2. Convert it into a precise query for nutritional lookup
3. Include quantities and portion sizes
4. Separate multiple items with commas
5. Use standard measurements (cups, grams, pieces, etc.)
6. Be specific about preparation methods that affect nutrition
7. Include major ingredients that contribute to nutritional value`
          },
          {
            role: 'user',
            content: `Convert this food analysis into a nutrition database query:\n${foodAnalysis}`
          }
        ],
        temperature: 0.2,
        max_tokens: 200
      })
    });

    const groqData = await groqResponse.json();
    const nutritionQuery = groqData.choices[0]?.message?.content;

    // Get additional nutritional insights using Gemini
    const insightsResponse = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=' + GEMINI_API_KEY, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: `Based on this food analysis, provide brief health insights:
${foodAnalysis}

Focus on:
1. Overall nutritional value
2. Portion size appropriateness
3. Balance of macronutrients
4. Any health benefits or concerns
5. Suggestions for healthier alternatives if needed
6. Estimated calorie range

Keep it concise but informative.`
          }]
        }],
        generationConfig: {
          temperature: 0.3,
          maxOutputTokens: 500
        }
      })
    });

    const insightsData = await insightsResponse.json();
    const nutritionalInsights = insightsData.candidates?.[0]?.content?.parts?.[0]?.text;

    // Save the analysis to memory
    memoryService.addMemory({
      type: 'chat',
      title: 'Food Image Analysis',
      content: `Analyzed Food Items:\n${foodAnalysis}\n\nNutritional Insights:\n${nutritionalInsights}`,
      metadata: {
        foodIdentification: true,
        originalAnalysis: foodAnalysis,
        nutritionalInsights: nutritionalInsights,
        nutritionQuery: nutritionQuery
      }
    });

    return nutritionQuery || 'Could not generate nutrition query';
  } catch (error) {
    console.error('Food image analysis error:', error);
    throw new Error('Unable to analyze food image. Please try again or enter manually.');
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
      const items = data.items || [];
      
      // Enhance nutrition data with Groq analysis
      if (items.length > 0) {
        try {
          const enhancedResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${GROQ_API_KEY}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              model: GROQ_MODEL,
              messages: [
                {
                  role: 'system',
                  content: 'You are a nutrition expert. Provide additional health insights, serving recommendations, and nutritional context for food items.'
                },
                {
                  role: 'user',
                  content: `Provide brief health insights for: ${query}. Include serving recommendations and any notable nutritional benefits or concerns.`
                }
              ],
              temperature: 0.3,
              max_tokens: 200
            })
          });

          const enhancedData = await enhancedResponse.json();
          const insights = enhancedData.choices[0]?.message?.content;

          // Add insights to memory
          memoryService.addMemory({
            type: 'chat',
            title: `Nutrition Analysis: ${query}`,
            content: `Food items: ${items.map(item => `${item.name} (${item.calories} cal)`).join(', ')}\n\nHealth insights: ${insights}`,
            metadata: { 
              nutritionQuery: query,
              totalCalories: items.reduce((sum, item) => sum + item.calories, 0),
              insights: insights
            }
          });
        } catch (error) {
          console.error('Error getting nutrition insights:', error);
        }
      }

      return items;
    } catch (error) {
      console.error('Nutrition API error:', error);
      throw error;
    }
  }
};
