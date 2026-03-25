#!/bin/bash
# Script de démarrage du parcours de test complet
# Utilisation: ./run-test.sh

echo "=========================================================="
echo "  🧪 PARCOURS DE TEST COMPLET - Faisabilité Biomasse"
echo "=========================================================="
echo ""

# Couleurs
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}Étape 1: npm install${NC}"
echo "(Skipée si node_modules existe)"
if [ ! -d "node_modules" ]; then
  npm install
fi
echo ""

echo -e "${BLUE}Étape 2: npx prisma generate${NC}"
npx prisma generate
echo ""

echo -e "${BLUE}Étape 3: npx prisma db seed${NC}"
npx prisma db seed
echo ""

echo -e "${BLUE}Étape 4: Lancer le test du parcours complet${NC}"
npx tsx scripts/test-parcours-complet.ts
echo ""

echo "=========================================================="
echo -e "${GREEN}✅ Test terminé!${NC}"
echo "=========================================================="
echo ""
echo "Si tous les tests sont passés (100%):"
echo "  1. Lancer le serveur: npm run dev"
echo "  2. Ouvrir http://localhost:3000"
echo "  3. Créer une affaire manuellement ou charger celle testée"
echo "  4. Exporter un PDF pour vérification finale"
echo ""
