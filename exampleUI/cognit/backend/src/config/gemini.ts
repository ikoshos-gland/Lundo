import { GoogleGenerativeAI } from '@google/generative-ai';
import { config } from './environment.js';

export class GeminiClient {
  private genAI: GoogleGenerativeAI;

  constructor(apiKey: string) {
    this.genAI = new GoogleGenerativeAI(apiKey);
  }

  async generateContent(prompt: string, model = 'gemini-1.5-pro'): Promise<string> {
    try {
      const generativeModel = this.genAI.getGenerativeModel({ model });
      const result = await generativeModel.generateContent(prompt);
      const response = await result.response;
      return response.text();
    } catch (error: any) {
      console.error('Gemini API error:', error.message);
      throw new Error(`Failed to generate content: ${error.message}`);
    }
  }

  async streamContent(prompt: string, model = 'gemini-1.5-pro') {
    try {
      const generativeModel = this.genAI.getGenerativeModel({ model });
      const result = await generativeModel.generateContentStream(prompt);
      return result.stream;
    } catch (error: any) {
      console.error('Gemini API streaming error:', error.message);
      throw new Error(`Failed to stream content: ${error.message}`);
    }
  }
}

export const geminiClient = new GeminiClient(config.geminiApiKey);
