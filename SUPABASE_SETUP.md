# Configuration Supabase pour Pixora

## 1. Créer un projet Supabase

1. Allez sur [supabase.com](https://supabase.com)
2. Créez un nouveau projet
3. Notez l'URL du projet et la clé anonyme

## 2. Configuration des variables d'environnement

Créez un fichier `.env` à la racine du projet avec :

```bash
EXPO_PUBLIC_SUPABASE_URL=votre_url_supabase
EXPO_PUBLIC_SUPABASE_ANON_KEY=votre_cle_anonyme
```

## 3. Configuration de l'API OpenRouter

L'application utilise OpenRouter avec le modèle Gemini 2.5 Flash pour la génération d'images. La clé API est déjà configurée dans le code.

**Note de sécurité** : En production, déplacez la clé API dans les variables d'environnement Supabase.

## 4. Structure des Edge Functions

### Fonction `generate-image`

Cette fonction :
- Reçoit le prompt et les images en base64
- Appelle l'API OpenRouter avec Gemini 2.5 Flash
- Retourne l'URL de l'image générée

**Fichier** : `supabase/functions/generate-image/index.ts`

### Fonction `check-task-status` (optionnelle)

Pour les tâches asynchronones longues.

## 5. Déploiement des Edge Functions

### Option 1 : Script automatique (recommandé)

```bash
./scripts/deploy-functions.sh
```

### Option 2 : Déploiement manuel

```bash
# Déployer generate-image
npx supabase functions deploy generate-image

# Déployer check-task-status (optionnel)
npx supabase functions deploy check-task-status
```

## 6. Flux de l'application

```
1. Utilisateur sélectionne des images
2. Images converties en base64 côté client
3. Prompt + images base64 envoyés à l'edge function
4. Edge function appelle OpenRouter API
5. Image générée retournée à l'application
6. Affichage de l'image générée
```

## 7. Configuration des politiques de sécurité

Les edge functions sont accessibles publiquement. Pour sécuriser :

```sql
-- Dans votre dashboard Supabase
-- Créer des politiques RLS si nécessaire
```

## 8. Test de l'application

1. **Redémarrez votre application Expo**
2. **Testez la génération d'images** :
   - Sélectionnez une image
   - Entrez un prompt
   - Appuyez sur "Générer l'Image"
3. **Vérifiez les logs** dans le dashboard Supabase

## 9. Dépannage

### Erreur "Missing Supabase environment variables"
- Vérifiez que le fichier `.env` existe
- Vérifiez les valeurs des variables

### Erreur "Edge function not found"
- Vérifiez que les fonctions sont déployées
- Utilisez `npx supabase functions list` pour vérifier

### Erreur OpenRouter API
- Vérifiez la clé API dans la edge function
- Consultez les logs Supabase pour plus de détails

## 10. Optimisations futures

- **Cache des images** : Stocker les images générées dans Supabase Storage
- **Authentification** : Ajouter l'auth Supabase pour sécuriser l'accès
- **Queue de génération** : Gérer les tâches longues avec un système de queue
- **Limites de taux** : Implémenter des limites pour éviter l'abus

## Notes importantes

- Les images sont converties en base64 côté client (pas d'upload vers Supabase Storage)
- L'API OpenRouter est appelée directement depuis l'edge function
- Les edge functions ont un timeout de 60 secondes par défaut
- Considérez l'utilisation de l'authentification Supabase pour sécuriser l'accès
