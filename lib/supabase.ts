import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Types pour les réponses des edge functions
export interface ImageGenerationRequest {
  prompt: string;
  images?: string[]; // URLs des images de base (optionnel)
  num_inference_steps?: number;
  guidance_scale?: number;
  width?: number;
  height?: number;
}

export interface ImageGenerationResponse {
  success: boolean;
  image_url?: string;
  error?: string;
  task_id?: string;
}
