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
