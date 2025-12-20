# Cahier des charges – MVP MedTrackRapat (Offline First)

## 1. Contexte produit
- **Produit** : MedTrackRapat, application mobile B2B pour médecins et infirmiers accompagnateurs en rapatriement médical.
- **Objectif** : documenter une mission de bout en bout et générer un rapport PDF local, standardisé et juridiquement exploitable.
- **Usage terrain** : fonctionnement hors ligne total, saisie minimale, interface sobre et linéaire.
- **Règle absolue** : aucune fonctionnalité hors périmètre décrit ci-dessous.

## 2. Périmètre fonctionnel (5 blocs non négociables)
### Bloc 1 — Création & cadrage de mission
- Création d’une mission avec identifiant unique généré localement.
- Champs obligatoires :
  - Type de mission (liste fermée)
  - Date / heure
  - Lieu départ / arrivée
  - Type d’accompagnant (MD / IDE)
- Données patient minimales : identifiant interne ou initiales, âge, sexe, diagnostic principal (liste fermée).
- Contraintes : aucune donnée nominative, sauvegarde automatique, fonctionnement offline.

### Bloc 2 — État initial patient
- Saisie des constantes vitales : TA, FC, SpO₂, FR, Température.
- État clinique : Conscience (AVPU ou équivalent simple), Douleur (EVA).
- Traitements en cours et dispositifs médicaux.
- Contraintes : checklists/sélecteurs uniquement, pas de texte libre long, horodatage automatique.

### Bloc 3 — Suivi en cours de mission (Timeline)
- Timeline chronologique automatique.
- Ajout rapide d’événements : Surveillance, Acte médical, Incident.
- Ajout ponctuel de constantes et notes courtes structurées.
- Contraintes : un bouton principal « Ajouter un événement », interaction minimale, aucun champ bloquant.

### Bloc 4 — Fin de mission & transmission
- Saisie de l’état patient à l’arrivée et comparatif automatique initial/final.
- Heure et type de remise (Établissement, Ambulance, Tiers).
- Signature numérique de l’accompagnant.
- Validation finale irréversible.

### Bloc 5 — Rapport de mission PDF
- Génération automatique locale d’un rapport PDF structuré en 5 sections :
  1. Informations mission
  2. État initial
  3. Chronologie
  4. Incidents
  5. État final + signature
- Export manuel du PDF.
- Contraintes : aucun paramétrage utilisateur, pas de versioning, pas de serveur.

## 3. Fonctionnalités explicitement interdites
- IA ou aide à la décision, notifications, messagerie.
- Synchronisation serveur, multi-utilisateurs, rôles.
- Protocoles médicaux, alertes cliniques, scores (NEWS, Glasgow, etc.).
- Toute fonctionnalité non décrite dans le périmètre ci-dessus.

## 4. Exigences UX
- Une action principale par écran ; navigation linéaire : Mission → État initial → Suivi → Fin → Rapport.
- Interface sobre, lisible, non gamifiée ; textes courts adaptés aux conditions terrain.
- Mode hors ligne total.

## 5. Exigences techniques
- Application mobile (Android prioritaire) en React Native ou Flutter.
- Stockage local chiffré (SQLite ou équivalent) ; architecture simple et commentée.
- Génération PDF locale ; aucune dépendance serveur ou réseau.

## 6. Sécurité & données
- Données stockées localement uniquement, sans identifiant nominatif.
- Chiffrement local obligatoire ; aucune transmission réseau.

## 7. Livrables attendus
- Code source complet du MVP.
- Schéma de données local.
- Générateur PDF fonctionnel.
- Documentation technique minimale + instructions de build/test.

## 8. Critères de validation
- Une mission complète peut être réalisée sans réseau.
- Rapport PDF généré automatiquement selon la structure définie.
- Parcours fluide et conforme au flux linéaire.
- Aucune fonctionnalité hors périmètre.

