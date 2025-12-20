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
1. **Création & cadrage de mission** : identifiant unique, typage mission/accompagnant, données patient minimales (saisies via listes fermées).
2. **État initial** : constantes vitales, état clinique et traitements/dispositifs via champs courts.
3. **Timeline** : ajout rapide d’événements (surveillance/acte/incident) sans blocage et constantes ponctuelles.
4. **Fin de mission** : état final, type/heure de remise, signature accompagnant, comparatif initial/final, validation irréversible avec code de réouverture.
5. **Rapport PDF** : génération locale structurée en cinq sections prêtes à l’export + comparatif initial/final.

## Sécurité & données
- Stockage local uniquement, sans synchronisation réseau.
- Pas de données nominatives patient, identifiant interne uniquement.
- Chiffrement AES applicatif des données sensibles (patient, notes timeline) avec clé stockée dans SecureStore, hash pour codes de réouverture.

## Exécution du plan de conformité
- **Encodage et libellés** : fichiers Markdown et libellés UI en UTF-8 sans caractères corrompus.
- **Listes fermées et validations** : sélecteurs pour type de mission, diagnostic principal, accompagnant, conscience, type de remise ; validations minimales sur les champs obligatoires.
- **Persistance chiffrée** : AES applicatif des données patient et notes timeline, clé locale SecureStore ; statut de mission, finalisation irréversible et réouverture par code hashé.
- **Reprise et flux linéaire** : reprise de la mission la plus récente (état initial, timeline, état final) et navigation Mission → Initial → Timeline → Fin → Rapport.
- **PDF structuré** : rapport en 5 sections, incidents filtrés par type, comparatif initial/final inclus, champs accentués corrects.

## Prochaines étapes recommandées
Consultez [`SUGGESTIONS.md`](./SUGGESTIONS.md) pour une courte liste de pistes d’amélioration (robustesse offline, sécurité renforcée, ergonomie et PDF).
