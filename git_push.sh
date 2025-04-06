#!/bin/bash
# Script pour semi-automatiser l'envoi vers GitHub

echo "Entrez le message du commit :"
read commitMessage

echo "Exécution de 'git add .'..."
git add .

echo "Création du commit..."
git commit -m "$commitMessage"

echo "Poussée vers GitHub..."
git push
echo "DISCORD_TOKEN=your_token_here" > .env.example
echo "DATABASE_URL=mysql://user:pass@host/db" >> .env.example
git add .env.example
git commit -m "🧪 Ajout du fichier .env.example pour les variables d'environnement"
git push origin main
