#!/bin/bash

# Script de déploiement des edge functions Supabase
echo "🚀 Déploiement des edge functions Supabase..."

# Vérifier que Supabase CLI est installé
if ! command -v npx supabase &> /dev/null; then
    echo "❌ Supabase CLI non trouvé. Installation..."
    npm install -g @supabase/cli
fi

# Vérifier que nous sommes dans le bon répertoire
if [ ! -d "supabase/functions" ]; then
    echo "❌ Répertoire supabase/functions non trouvé"
    echo "Assurez-vous d'être dans le répertoire racine du projet"
    exit 1
fi

# Déployer la fonction generate-image
echo "📤 Déploiement de generate-image..."
npx supabase functions deploy generate-image

if [ $? -eq 0 ]; then
    echo "✅ generate-image déployée avec succès"
else
    echo "❌ Erreur lors du déploiement de generate-image"
    exit 1
fi

# Déployer la fonction check-task-status (optionnelle)
if [ -d "supabase/functions/check-task-status" ]; then
    echo "📤 Déploiement de check-task-status..."
    npx supabase functions deploy check-task-status
    
    if [ $? -eq 0 ]; then
        echo "✅ check-task-status déployée avec succès"
    else
        echo "❌ Erreur lors du déploiement de check-task-status"
    fi
fi

echo "🎉 Déploiement terminé !"
echo ""
echo "📋 Prochaines étapes :"
echo "1. Vérifiez que vos variables d'environnement sont configurées"
echo "2. Testez la génération d'images dans votre application"
echo "3. Vérifiez les logs dans le dashboard Supabase"
