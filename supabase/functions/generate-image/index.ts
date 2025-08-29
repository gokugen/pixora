import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { fal } from "npm:@fal-ai/client";

fal.config({
  credentials: "d7de3009-7d49-459c-8eae-d079160df4a7:f5c9a476b39fcded1da50cc30efd80cf"
});

// Créer le client Supabase pour accéder au Storage
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface ImageGenerationRequest {
  prompt: string
  images: string[] // URLs des images dans Storage
  instructions?: string
}

interface OpenRouterResponse {
  choices: {
    message: {
      images: {
        image_url: {
          url: string
        }
      }[]
    }
  }[]
}

serve(async (req) => {
  // Gérer les requêtes OPTIONS pour CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      },
    })
  }

  const { prompt, images, instructions = "Génère moi une image." }: ImageGenerationRequest = await req.json()

  try {
    if (!prompt) {
      throw new Error('Le prompt est requis')
    }

    // Si des images sont fournies, utiliser TOUTES pour la génération
    let imagesObject: any[] = []
    if (images?.length > 0) {
      images.forEach(img => imagesObject.push({
        "type": "image_url",
        "image_url": {
          "url": img // Les images ont déjà le préfixe data:image/jpeg;base64, côté mobile
        }
      }))
    }

    // Préparer le contenu du message
    const messageContent: any[] = [
      {
        type: "text",
        text: instructions + " " + prompt
      },
      ...imagesObject
    ]

    // Appeler l'API OpenRouter
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": "Bearer " + Deno.env.get('OPEN_ROUTER_API_KEY'),
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        "model": "google/gemini-2.5-flash-image-preview:free",
        "response_format": {
          "type": "image_url"
        },
        "messages": [
          {
            "role": "user",
            "content": messageContent
          }
        ]
      })
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Erreur OpenRouter API: ${response.status} - ${errorText}`)
    }

    const data: OpenRouterResponse = await response.json()

    // Vérification de sécurité pour les types
    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      throw new Error("Réponse API invalide")
    }

    let resImages = data.choices[0].message.images

    if (!resImages || !resImages.length) {
      if (images?.length) {
        const result = await fal.subscribe("fal-ai/nano-banana/edit", {
          input: {
            prompt,
            image_urls: images
          },
          logs: true
        });
        resImages = result.data.images;
      }
      else {
        const result = await fal.subscribe("fal-ai/nano-banana", {
          input: {
            prompt
          },
          logs: true
        });
        resImages = result.data.images;
      }

      if (!resImages.length)
        throw new Error("Aucune image trouvée dans la réponse");
    }

    // Retourner la première image générée
    const generatedImagesUrl = resImages.map((image: any) => {
      let imageUrl = "";

      if (image.image_url)
        imageUrl = image.image_url.url;
      else
        imageUrl = image.url;

      return imageUrl;
    });

    // Nettoyer les images d'entrée du Storage avant de retourner la réponse
    await cleanupInputImages(images);

    return new Response(
      JSON.stringify({
        success: true,
        images_url: generatedImagesUrl[0],
        message: 'Image générée avec succès'
      }),
      {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
        }
      }
    )

  } catch (error) {
    // Même en cas d'erreur, nettoyer les images d'entrée
    if (images?.length > 0) {
      try {
        await cleanupInputImages(images);
      } catch (cleanupError) {
        console.error("Erreur lors du nettoyage des images:", cleanupError);
      }
    }

    console.error("Erreur dans la edge function:", error)

    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Erreur inconnue"
      }),
      {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
        }
      }
    )
  }
})

/**
 * Nettoie les images d'entrée du bucket Storage
 */
async function cleanupInputImages(imageUrls: string[]) {
  if (!imageUrls || imageUrls.length === 0) return;

  try {
    for (const imageUrl of imageUrls) {
      // Extraire le nom du fichier de l'URL
      const fileName = extractFileNameFromUrl(imageUrl);
      if (fileName) {
        // Supprimer le fichier du bucket
        const { error } = await supabase.storage
          .from('user pictures')
          .remove([fileName]);

        if (error) {
          console.error(`Erreur lors de la suppression de ${fileName}:`, error);
        } else {
          console.log(`Image supprimée: ${fileName}`);
        }
      }
    }
  } catch (error) {
    console.error("Erreur lors du nettoyage des images:", error);
  }
}

/**
 * Extrait le nom du fichier d'une URL Supabase Storage
 */
function extractFileNameFromUrl(storageUrl: string): string | null {
  try {
    // L'URL est de la forme: https://xxx.supabase.co/storage/v1/object/public/user-pictures/filename.jpg
    const urlParts = storageUrl.split('/');
    const fileName = urlParts[urlParts.length - 1];
    return fileName || null;
  } catch (error) {
    console.error("Erreur lors de l'extraction du nom de fichier:", error);
    return null;
  }
}
