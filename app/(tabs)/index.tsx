import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import React, { useState } from 'react';
import {
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useImageGeneration } from '@/hooks/useImageGeneration';
import { ImageGenerationRequest } from '@/lib/supabase';
import * as FileSystem from 'expo-file-system';
import * as MediaLibrary from 'expo-media-library';
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface SelectedImage {
  uri: string;
  id: string;
}

export default function ImageEditorScreen() {
  const insets = useSafeAreaInsets();

  const [selectedImages, setSelectedImages] = useState<SelectedImage[]>([]);
  const [prompt, setPrompt] = useState('');
  const [selectedImageForViewer, setSelectedImageForViewer] = useState<SelectedImage | null>(null);
  const { isGenerating, generatedImageUrl, error, generateImage, resetGeneration } = useImageGeneration();

  const requestPermissions = async () => {
    if (Platform.OS !== 'web') {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission requise',
          'Nous avons besoin de votre permission pour accéder à votre galerie photos.'
        );
        return false;
      }
    }
    return true;
  };

  const pickImages = async () => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsMultipleSelection: true,
        quality: 1
      });

      if (!result.canceled && result.assets) {
        const newImages = result.assets.map((asset, index) => ({
          uri: asset.uri,
          id: `img_${Date.now()}_${index}`,
        }));
        setSelectedImages(prev => [...prev, ...newImages]);
      }
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de sélectionner les images');
    }
  };

  const removeImage = (id: string) => {
    setSelectedImages(prev => prev.filter(img => img.id !== id));
  };

  const openImageViewer = (image: SelectedImage) => {
    setSelectedImageForViewer(image);
  };

  const closeImageViewer = () => {
    setSelectedImageForViewer(null);
  };

  const downloadImage = async (imageUri: string) => {
    try {
      // Demander la permission d'accéder à la galerie
      const { status } = await MediaLibrary.requestPermissionsAsync();

      if (status !== 'granted') {
        Alert.alert(
          'Permission requise',
          'Nous avons besoin de votre permission pour sauvegarder l\'image dans votre galerie.'
        );
        return;
      }

      // Vérifier si c'est du base64
      if (!imageUri.startsWith('data:')) {
        throw new Error('Format d\'image non supporté. Seul le base64 est supporté.');
      }

      // Extraire le base64 de l'URI
      const base64 = imageUri.split(',')[1];
      if (!base64) {
        throw new Error('Format base64 invalide');
      }

      // Créer un fichier temporaire avec le base64
      const localUri = FileSystem.documentDirectory + 'temp_image_' + Date.now() + '.jpg';
      await FileSystem.writeAsStringAsync(localUri, base64, {
        encoding: FileSystem.EncodingType.Base64
      });

      // Sauvegarder l'image dans la galerie avec l'URI local
      const asset = await MediaLibrary.createAssetAsync(localUri);

      if (asset) {
        // Essayer de créer un album personnalisé pour les images générées
        try {
          await MediaLibrary.createAlbumAsync('Pixora AI', asset, false);
          Alert.alert(
            'Téléchargement réussi !',
            'L\'image a été sauvegardée dans votre galerie dans l\'album "Pixora AI".'
          );
        } catch (albumError) {
          // Si la création d'album échoue, l'image est quand même sauvegardée
          Alert.alert(
            'Téléchargement réussi !',
            'L\'image a été sauvegardée dans votre galerie.'
          );
        }
      } else {
        throw new Error('Impossible de créer l\'asset');
      }

      // Nettoyer le fichier temporaire
      try {
        await FileSystem.deleteAsync(localUri);
      } catch (cleanupError) {
        console.log('Impossible de nettoyer le fichier temporaire:', cleanupError);
      }

    } catch (error) {
      console.error('Erreur lors du téléchargement:', error);
      Alert.alert(
        'Erreur de téléchargement',
        'Impossible de sauvegarder l\'image. Vérifiez que vous avez accordé les permissions nécessaires.'
      );
    }
  };

  const handleGenerateImage = async () => {
    if (!prompt.trim()) {
      Alert.alert('Erreur', 'Veuillez saisir un prompt pour générer l&apos;image');
      return;
    }

    const request: ImageGenerationRequest = {
      prompt: prompt.trim(),
      images: selectedImages.map(img => img.uri)
    };

    await generateImage(request);
  };

  const handleReset = () => {
    setSelectedImages([]);
    setPrompt('');
    resetGeneration();
  };

  return (
    <View style={styles.container}>
      <KeyboardAwareScrollView>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingTop: insets.top }}
          keyboardShouldPersistTaps="handled"
          automaticallyAdjustKeyboardInsets={Platform.OS === 'ios'}
        >
          <ThemedView style={styles.header}>
            <ThemedText type="title" style={styles.title}>
              Éditeur d&apos;Images IA
            </ThemedText>
            <ThemedText style={styles.subtitle}>
              Créez et éditez des images avec l&apos;intelligence artificielle
            </ThemedText>
          </ThemedView>

          {/* Section Import des Photos */}
          <ThemedView style={styles.section}>
            <ThemedText type="subtitle" style={styles.sectionTitle}>
              Importer les Photos
            </ThemedText>
            <ThemedText style={styles.sectionDescription}>
              Sélectionnez une ou plusieurs images de départ (optionnel)
            </ThemedText>

            <TouchableOpacity style={styles.importButton} onPress={pickImages}>
              <Ionicons name="images-outline" size={24} color="#FEB50A" />
              <ThemedText style={styles.importButtonText}>
                Choisir des Images
              </ThemedText>
            </TouchableOpacity>

            {/* Affichage des images sélectionnées */}
            {selectedImages.length > 0 && (
              <View style={styles.imagesContainer}>
                <ThemedText style={styles.imagesCount}>
                  {selectedImages.length} image(s) sélectionnée(s)
                </ThemedText>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={{ overflow: 'visible' }}
                >
                  {selectedImages.map((image) => (
                    <View key={image.id} style={styles.imageWrapper}>
                      <TouchableOpacity
                        style={styles.imageTouchable}
                        onPress={() => openImageViewer(image)}
                      >
                        <Image source={{ uri: image.uri }} style={styles.selectedImage} />
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.removeButton}
                        onPress={() => removeImage(image.id)}
                      >
                        <Ionicons name="close-circle" size={24} color="#FF4444" />
                      </TouchableOpacity>
                    </View>
                  ))}
                </ScrollView>
              </View>
            )}
          </ThemedView>

          {/* Section Prompt */}
          <ThemedView style={styles.section}>
            <ThemedText type="subtitle" style={styles.sectionTitle}>
              Prompt de Génération
            </ThemedText>
            <ThemedText style={styles.sectionDescription}>
              Décrivez l&apos;image que vous souhaitez créer ou modifier
            </ThemedText>

            <ThemedView style={styles.promptContainer}>
              <ThemedText style={styles.promptLabel}>Description :</ThemedText>
              <ThemedView style={styles.textInputContainer}>
                <TextInput
                  style={styles.textInput}
                  multiline
                  numberOfLines={4}
                  placeholder="Ex: Une forêt enchantée avec des lucioles, style peinture à l&apos;huile..."
                  placeholderTextColor="#999"
                  value={prompt}
                  onChangeText={setPrompt}
                  returnKeyType="done"
                  blurOnSubmit={true}
                />
              </ThemedView>
            </ThemedView>
          </ThemedView>

          {/* Bouton Générer */}
          <ThemedView style={styles.section}>
            <TouchableOpacity
              style={[
                styles.generateButton,
                (!prompt.trim() || isGenerating) && styles.generateButtonDisabled
              ]}
              onPress={handleGenerateImage}
              disabled={!prompt.trim() || isGenerating}
            >
              {isGenerating ? (
                <>
                  <Ionicons name="sync" size={24} color="#000" style={styles.spinning} />
                  <ThemedText style={styles.generateButtonText}>
                    Génération en cours...
                  </ThemedText>
                </>
              ) : (
                <>
                  <Ionicons name="sparkles" size={24} color="#000" />
                  <ThemedText style={styles.generateButtonText}>
                    Générer l&apos;Image
                  </ThemedText>
                </>
              )}
            </TouchableOpacity>
          </ThemedView>

          {/* Affichage de l'image générée */}
          {generatedImageUrl && (
            <ThemedView style={styles.section}>
              <ThemedText type="subtitle" style={styles.sectionTitle}>
                Image Générée
              </ThemedText>
              <TouchableOpacity
                style={styles.generatedImageTouchable}
                onPress={() => setSelectedImageForViewer({ uri: generatedImageUrl, id: 'generated' })}
              >
                <Image source={{ uri: generatedImageUrl }} style={styles.generatedImage} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.resetButton} onPress={handleReset}>
                <ThemedText style={styles.resetButtonText}>Nouvelle Génération</ThemedText>
              </TouchableOpacity>
            </ThemedView>
          )}

          {/* Affichage des erreurs */}
          {error && (
            <ThemedView style={styles.section}>
              <ThemedText style={styles.errorText}>Erreur: {error}</ThemedText>
            </ThemedView>
          )}
        </ScrollView>
      </KeyboardAwareScrollView>

      {/* Modal du viewer d'image */}
      {selectedImageForViewer && (
        <View style={styles.imageViewerOverlay}>
          <TouchableOpacity
            style={styles.imageViewerBackground}
            onPress={closeImageViewer}
            activeOpacity={1}
          >
            <View style={styles.imageViewerContainer}>
              <View style={styles.imageViewerButtonsContainer}>
                <TouchableOpacity
                  style={styles.imageViewerButton}
                  onPress={(e) => {
                    e.stopPropagation();
                    downloadImage(selectedImageForViewer.uri);
                  }}
                >
                  <Ionicons name="download" size={30} color="#FFFFFF" />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.imageViewerButton}
                  onPress={(e) => {
                    e.stopPropagation();
                    closeImageViewer();
                  }}
                >
                  <Ionicons name="close" size={30} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
              <Image
                source={{ uri: selectedImageForViewer.uri }}
                style={styles.imageViewerImage}
                contentFit="contain"
              />
            </View>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#151718',
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },

  header: {
    padding: 20,
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ECEDEE',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#9BA1A6',
    textAlign: 'center',
  },
  section: {
    backgroundColor: '#1E1E1E',
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 3.84,
    elevation: 5,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#ECEDEE',
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 14,
    color: '#9BA1A6',
    marginBottom: 16,
  },
  importButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2A2A2A',
    borderWidth: 2,
    borderColor: '#FEB50A',
    borderStyle: 'dashed',
    borderRadius: 12,
    padding: 20,
    gap: 12,
  },
  importButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FEB50A',
  },
  imagesContainer: {
    marginTop: 16,
    overflow: 'hidden'
  },
  imagesCount: {
    fontSize: 14,
    color: '#9BA1A6',
    marginBottom: 12,
  },
  imageWrapper: {
    position: 'relative',
    marginRight: 12
  },
  imageTouchable: {
    borderRadius: 8,
    overflow: 'hidden'
  },
  selectedImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
  },
  removeButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#1E1E1E',
    borderRadius: 12
  },
  promptContainer: {
    gap: 8,
    backgroundColor: '#1E1E1E',
    // padding: 12,
  },
  promptLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#ECEDEE',
  },
  textInputContainer: {
    borderWidth: 1,
    borderColor: '#333333',
    borderRadius: 8,
    backgroundColor: '#2A2A2A',
    minHeight: 100,
  },
  textInput: {
    padding: 12,
    fontSize: 16,
    color: '#ECEDEE',
    textAlignVertical: 'top',
  },
  generateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEB50A',
    borderRadius: 12,
    padding: 16,
    gap: 12,
    shadowColor: '#FEB50A',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  generateButtonDisabled: {
    backgroundColor: '#444444',
    shadowOpacity: 0,
    elevation: 0,
  },
  generateButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
  },
  spinning: {
    transform: [{ rotate: '0deg' }],
  },
  generatedImage: {
    width: '100%',
    height: 300,
    borderRadius: 12,
    marginTop: 16,
    marginBottom: 16,
  },
  generatedImageTouchable: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  resetButton: {
    backgroundColor: '#2A2A2A',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resetButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FEB50A',
  },
  errorText: {
    color: '#FF4444',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 16,
  },
  // Styles pour le viewer d'image
  imageViewerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
  },
  imageViewerBackground: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageViewerContainer: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  imageViewerButtonsContainer: {
    position: 'absolute',
    top: 70,
    right: 0,
    zIndex: 1001,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center'
  },
  imageViewerButton: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 20,
    padding: 8,
    marginRight: 10,
  },
  imageViewerImage: {
    width: '100%',
    height: '100%',
  },
});
