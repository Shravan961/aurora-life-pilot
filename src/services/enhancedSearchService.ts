
import { GROQ_API_KEY, GROQ_MODEL } from '@/utils/constants';

interface SearchResult {
  title: string;
  url: string;
  snippet: string;
  content?: string;
}

class EnhancedSearchService {
  private async fetchWebContent(url: string): Promise<string> {
    try {
      const response = await fetch(`https://api.allorigins.win/get?url=${encodeURIComponent(url)}`);
      const data = await response.json();
      
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = data.contents;
      
      // Remove scripts, styles, and other unwanted elements
      const unwantedElements = tempDiv.querySelectorAll('script, style, nav, header, footer, aside, .ads, .advertisement');
      unwantedElements.forEach(el => el.remove());
      
      // Try to find main content
      let content = '';
      const contentSelectors = [
        'article', '[role="main"]', 'main', '.content', '.post-content', 
        '.entry-content', '.article-content', '.article-body', 'p'
      ];
      
      for (const selector of contentSelectors) {
        const elements = tempDiv.querySelectorAll(selector);
        if (elements.length > 0) {
          content = Array.from(elements)
            .map(el => el.textContent)
            .join('\n')
            .trim();
          if (content.length > 300) break;
        }
      }
      
      // Fallback to all text if no specific content found
      if (!content || content.length < 100) {
        content = tempDiv.textContent || '';
      }
      
      return content.replace(/\s+/g, ' ').trim().substring(0, 5000);
    } catch (error) {
      console.error('Error fetching web content:', error);
      return '';
    }
  }

  private async searchDuckDuckGo(query: string): Promise<SearchResult[]> {
    try {
      const response = await fetch(`https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1&skip_disambig=1`);
      const data = await response.json();
      
      const results: SearchResult[] = [];
      
      // Add abstract if available
      if (data.Abstract && data.AbstractURL) {
        results.push({
          title: data.AbstractSource || 'Reference',
          url: data.AbstractURL,
          snippet: data.Abstract
        });
      }

      // Add related topics
      if (data.RelatedTopics && Array.isArray(data.RelatedTopics)) {
        for (const topic of data.RelatedTopics.slice(0, 5)) {
          if (topic.Text && topic.FirstURL) {
            results.push({
              title: topic.Text.split(' - ')[0] || 'Related Topic',
              url: topic.FirstURL,
              snippet: topic.Text
            });
          }
        }
      }

      // Try to fetch actual content for each result
      for (const result of results) {
        if (result.url) {
          result.content = await this.fetchWebContent(result.url);
        }
      }

      return results;
    } catch (error) {
      console.error('DuckDuckGo search error:', error);
      return [];
    }
  }

  private async summarizeWithGroq(content: string, context: string): Promise<string> {
    try {
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
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
              content: 'You are an expert research assistant. Summarize web content into clear, informative bullet points. Focus on key facts, insights, and practical information. Avoid repetition and filler content.'
            },
            {
              role: 'user',
              content: `Context: ${context}\n\nContent to summarize:\n${content}`
            }
          ],
          temperature: 0.3,
          max_tokens: 500
        })
      });

      if (!response.ok) {
        throw new Error(`Groq API error: ${response.status}`);
      }

      const data = await response.json();
      return data.choices[0]?.message?.content || 'Could not generate summary';
    } catch (error) {
      console.error('Groq summarization error:', error);
      return content.substring(0, 300) + '...';
    }
  }

  async performEnhancedSearch(query: string): Promise<string> {
    try {
      // Search for results
      const searchResults = await this.searchDuckDuckGo(query);
      
      if (searchResults.length === 0) {
        return "I couldn't find specific information about that topic. Could you try rephrasing your search query?";
      }

      // Summarize each result
      const summaries: string[] = [];
      for (const result of searchResults) {
        if (result.content && result.content.length > 100) {
          const summary = await this.summarizeWithGroq(result.content, `Query: ${query}, Source: ${result.title}`);
          summaries.push(`**${result.title}**\n${summary}\n🔗 [Source](${result.url})`);
        } else if (result.snippet) {
          summaries.push(`**${result.title}**\n${result.snippet}\n🔗 [Source](${result.url})`);
        }
      }

      // Combine summaries into final response
      const combinedContent = summaries.join('\n\n---\n\n');
      
      const finalResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
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
              content: 'You are an expert research assistant. Create a comprehensive, well-structured summary from the provided sources. Organize information logically, highlight key insights, and maintain source attribution.'
            },
            {
              role: 'user',
              content: `User Query: "${query}"\n\nSource Summaries:\n${combinedContent}\n\nPlease provide a comprehensive answer that synthesizes this information into a clear, actionable response. Include the most important points and maintain source references.`
            }
          ],
          temperature: 0.4,
          max_tokens: 1000
        })
      });

      if (!finalResponse.ok) {
        return combinedContent; // Fallback to raw summaries
      }

      const finalData = await finalResponse.json();
      const synthesizedResponse = finalData.choices[0]?.message?.content;
      
      return synthesizedResponse || combinedContent;
    } catch (error) {
      console.error('Enhanced search error:', error);
      return 'I encountered an error while searching. Please try again with a different query.';
    }
  }
}

export const enhancedSearchService = new EnhancedSearchService();
