import { ImageGenerationRequest } from '@/lib/supabase';
import { ImageGenerationService } from '@/services/imageGeneration';
import { useCallback, useState } from 'react';
import { Alert } from 'react-native';

interface UseImageGenerationReturn {
  isGenerating: boolean;
  generatedImageUrl: string | null;
  error: string | null;
  generateImage: (request: ImageGenerationRequest) => Promise<void>;
  resetGeneration: () => void;
}

export const useImageGeneration = (): UseImageGenerationReturn => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const generateImage = useCallback(async (request: ImageGenerationRequest) => {
    setIsGenerating(true);
    setError(null);
    setGeneratedImageUrl(null);

    try {
      // Appeler directement le service qui gère la conversion en base64
      const result = await ImageGenerationService.generateImage(request);

      if (result.success && result.image_url) {
        setGeneratedImageUrl(result.image_url);
        Alert.alert('Succès', 'Image générée avec succès !');
      } else if (result.success && result.task_id) {
        // Si c'est une tâche asynchrone, on peut implémenter le polling ici
        Alert.alert('Tâche créée', 'La génération est en cours. Vérifiez le statut plus tard.');
      } else {
        setError(result.error || 'Erreur lors de la génération');
        Alert.alert('Erreur', result.error || 'Erreur lors de la génération');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur inattendue';
      setError(errorMessage);
      Alert.alert('Erreur', errorMessage);
    } finally {
      setIsGenerating(false);
    }
  }, []);

  const resetGeneration = useCallback(() => {
    setGeneratedImageUrl(null);
    setError(null);
  }, []);

  return {
    isGenerating,
    generatedImageUrl,
    error,
    generateImage,
    resetGeneration,
  };
};
