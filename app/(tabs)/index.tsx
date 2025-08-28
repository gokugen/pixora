import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import React, { useState } from 'react';
import {
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View
} from 'react-native';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';

interface SelectedImage {
  uri: string;
  id: string;
}

export default function ImageEditorScreen() {
  const [selectedImages, setSelectedImages] = useState<SelectedImage[]>([]);
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

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
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        quality: 0.8,
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

  const generateImage = async () => {
    if (!prompt.trim()) {
      Alert.alert('Erreur', 'Veuillez saisir un prompt pour générer l\'image');
      return;
    }

    setIsGenerating(true);

    // Simulation de génération d'image
    setTimeout(() => {
      setIsGenerating(false);
      Alert.alert(
        'Génération terminée',
        `Image générée avec le prompt: "${prompt}"\n\nCette fonctionnalité sera intégrée avec votre API d'IA.`
      );
    }, 2000);
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <ThemedView style={styles.header}>
        <ThemedText type="title" style={styles.title}>
          Éditeur d'Images IA
        </ThemedText>
        <ThemedText style={styles.subtitle}>
          Créez et éditez des images avec l'intelligence artificielle
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
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {selectedImages.map((image) => (
                <View key={image.id} style={styles.imageWrapper}>
                  <Image source={{ uri: image.uri }} style={styles.selectedImage} />
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
          Décrivez l'image que vous souhaitez créer ou modifier
        </ThemedText>

        <ThemedView style={styles.promptContainer}>
          <ThemedText style={styles.promptLabel}>Description :</ThemedText>
          <ThemedView style={styles.textInputContainer}>
            <ThemedText
              style={styles.textInput}
              multiline
              numberOfLines={4}
              placeholder="Ex: Une forêt enchantée avec des lucioles, style peinture à l'huile..."
              placeholderTextColor="#999"
              value={prompt}
              onChangeText={setPrompt}
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
          onPress={generateImage}
          disabled={!prompt.trim() || isGenerating}
        >
          {isGenerating ? (
            <>
              <Ionicons name="sync" size={24} color="#FFF" style={styles.spinning} />
              <ThemedText style={styles.generateButtonText}>
                Génération en cours...
              </ThemedText>
            </>
          ) : (
            <>
              <Ionicons name="sparkles" size={24} color="#FFF" />
              <ThemedText style={styles.generateButtonText}>
                Générer l'Image
              </ThemedText>
            </>
          )}
        </TouchableOpacity>
      </ThemedView>

      {/* Espace en bas pour éviter que le bouton soit caché */}
      <View style={styles.bottomSpacer} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    padding: 20,
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#7F8C8D',
    textAlign: 'center',
  },
  section: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#2C3E50',
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 14,
    color: '#7F8C8D',
    marginBottom: 16,
  },
  importButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEF7E0',
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
  },
  imagesCount: {
    fontSize: 14,
    color: '#7F8C8D',
    marginBottom: 12,
  },
  imageWrapper: {
    position: 'relative',
    marginRight: 12,
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
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
  },
  promptContainer: {
    gap: 8,
  },
  promptLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#2C3E50',
  },
  textInputContainer: {
    borderWidth: 1,
    borderColor: '#E1E8ED',
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    minHeight: 100,
  },
  textInput: {
    padding: 12,
    fontSize: 16,
    color: '#2C3E50',
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
    backgroundColor: '#E1E8ED',
    shadowOpacity: 0,
    elevation: 0,
  },
  generateButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  spinning: {
    transform: [{ rotate: '0deg' }],
  },
  bottomSpacer: {
    height: 40,
  },
});
