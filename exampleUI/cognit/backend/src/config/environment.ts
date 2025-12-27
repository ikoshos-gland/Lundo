import dotenv from 'dotenv';

dotenv.config();

export const config = {
  geminiApiKey: process.env.GEMINI_API_KEY!,
  port: parseInt(process.env.PORT || '3001'),
  nodeEnv: process.env.NODE_ENV || 'development',
  logLevel: process.env.LOG_LEVEL || 'info'
};

// Validation
if (!config.geminiApiKey || config.geminiApiKey === 'PLACEHOLDER_API_KEY') {
  console.warn('⚠️  GEMINI_API_KEY is not configured. Please set it in backend/.env');
}
