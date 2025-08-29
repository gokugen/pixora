import { ImageGenerationRequest, ImageGenerationResponse, supabase } from '@/lib/supabase';
import { decode } from "base64-arraybuffer";
import * as FileSystem from 'expo-file-system';

export class ImageGenerationService {
  /**
   * Upload une image vers Supabase Storage
   */
  private static async uploadImageToStorage(imageUri: string): Promise<string> {
    try {
      // Générer un nom de fichier unique
      const fileName = `ai_image_${Date.now()}_${Math.random().toString(36).substring(7)}.jpg`;

      // Lire le fichier local en base64
      const base64 = await FileSystem.readAsStringAsync(imageUri, {
        encoding: FileSystem.EncodingType.Base64
      });

      // Créer un buffer à partir du base64 pour l'upload
      const arrayBuffer = decode(base64);

      // Upload vers le bucket user pictures
      const { data, error } = await supabase.storage
        .from('user pictures')
        .upload(fileName, arrayBuffer);

      if (error) {
        console.error('Erreur lors de l\'upload:', error);
        throw new Error('Impossible d\'uploader l\'image vers Storage');
      }

      // Retourner l'URL publique de l'image
      const { data: urlData } = supabase.storage
        .from('user pictures')
        .getPublicUrl(fileName);

      return urlData.publicUrl;
    } catch (error) {
      console.error('Erreur lors de l\'upload vers Storage:', error);
      throw new Error('Impossible d\'uploader l\'image vers Storage');
    }
  }

  /**
   * Génère une image via l'edge function Supabase
   */
  static async generateImage(request: ImageGenerationRequest): Promise<ImageGenerationResponse> {
    try {
      // Uploader les images vers Storage si elles existent
      let storageUrls: string[] = [];
      if (request.images && request.images.length > 0) {
        for (const imageUri of request.images) {
          const storageUrl = await this.uploadImageToStorage(imageUri);
          storageUrls.push(storageUrl);
        }
      }

      // Préparer la requête avec les URLs des images uploadées
      const generationRequest = {
        ...request,
        images: storageUrls,
      };

      const { data, error } = await supabase.functions.invoke('generate-image', {
        body: generationRequest,
      });

      if (error) {
        console.error('Erreur lors de la génération:', error);
        return {
          success: false,
          error: error.message || 'Erreur lors de la génération de l\'image',
        };
      }

      return {
        success: true,
        image_url: data.images_url,
        task_id: data?.task_id,
      };
    } catch (error) {
      console.error('Erreur inattendue:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erreur inattendue lors de la génération',
      };
    }
  }

  /**
   * Vérifie le statut d'une tâche de génération
   */
  static async checkTaskStatus(taskId: string): Promise<ImageGenerationResponse> {
    try {
      const { data, error } = await supabase.functions.invoke('check-task-status', {
        body: { task_id: taskId },
      });

      if (error) {
        return {
          success: false,
          error: error.message || 'Erreur lors de la vérification du statut',
        };
      }

      return {
        success: true,
        image_url: data?.image_url,
        task_id: taskId,
      };
    } catch (error) {
      return {
        success: false,
        error: 'Erreur lors de la vérification du statut',
      };
    }
  }
}
