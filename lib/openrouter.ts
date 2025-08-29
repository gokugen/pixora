// Configuration OpenRouter API
export const OPENROUTER_CONFIG = {
  API_KEY: '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',
  BASE_URL: 'https://openrouter.ai/api/v1',
  MODEL: 'google/gemini-2.5-flash-image-preview:free',
  DEFAULT_INSTRUCTIONS: 'Génère moi une image.',
} as const;

// Types pour l'API OpenRouter
export interface OpenRouterMessage {
  role: 'user' | 'assistant' | 'system';
  content: Array<{
    type: 'text' | 'image_url';
    text?: string;
    image_url?: {
      url: string;
    };
  }>;
}

export interface OpenRouterRequest {
  model: string;
  response_format: {
    type: 'image_url';
  };
  messages: OpenRouterMessage[];
}

export interface OpenRouterResponse {
  choices: Array<{
    message: {
      images: Array<{
        image_url: {
          url: string;
        };
      }>;
    };
  }>;
}
