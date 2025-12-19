# MedTrackRapat (MVP)

Application mobile offline-first pour documenter une mission de rapatriement médical et produire un PDF standardisé. Le dépôt contient un squelette React Native/Expo couvrant les cinq blocs fonctionnels du cahier des charges.

## Architecture
- `App.tsx` : enchaînement linéaire des écrans (Mission → État initial → Suivi → Fin → Rapport).
- `src/screens/` : écrans par bloc fonctionnel.
- `src/storage/localDatabase.ts` : schéma SQLite local (missions, état initial, timeline, état final) et fonctions de persistance.
- `src/pdf/reportGenerator.ts` : génération locale d’un PDF structuré.
- `src/types/models.ts` : typage des données métier.

## Pré-requis
- Node.js 18+
- Expo CLI (`npm install -g expo-cli`)

## Installer & lancer
```bash
npm install
npm run start # ou npm run android / npm run ios
```

## Parcours MVP
1. **Création & cadrage de mission** : identifiant unique, typage mission/accompagnant, données patient minimales.
2. **État initial** : constantes vitales, état clinique et traitements/dispositifs via champs courts.
3. **Timeline** : ajout rapide d’événements (surveillance/acte/incident) sans blocage.
4. **Fin de mission** : état final, type/heure de remise, signature accompagnant, validation irréversible.
5. **Rapport PDF** : génération locale structurée en cinq sections prêtes à l’export.

## Sécurité & données
- Stockage local uniquement, sans synchronisation réseau.
- Pas de données nominatives patient, identifiant interne uniquement.
