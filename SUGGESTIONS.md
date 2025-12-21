# Suggestions de suivi

Liste courte de pistes pour fiabiliser l’application après le MVP livré.

## Robustesse et reprise
- Ajouter des tests E2E offline (par exemple via Detox) couvrant le parcours Mission → Rapport avec coupure réseau simulée.
- Journaliser les erreurs SQLite/SecureStore et afficher un message utilisateur expliquant comment relancer une mission en cas d’échec d’écriture.
- Prévoir une migration de schéma versionnée pour gérer les évolutions des enums et des champs chiffrés sans perte de données locales.

## Sécurité et conformité
- Introduire une rotation de la clé AES locale (nouvelle clé, re-chiffrement en tâche unique) avec sauvegarde transactionnelle pour éviter les données mixtes clair/chiffré.
- Limiter la réouverture aux utilisateurs autorisés en affichant le nombre de tentatives restantes et en proposant un mécanisme d’effacement sécurisé après plusieurs échecs.
- Ajouter une purge automatique des missions finalisées après export PDF (délai configurable) pour minimiser la surface de données sensibles.

## Expérience et validation
- Rendre les champs obligatoires visuellement explicites et résumer les validations manquantes avant la finalisation pour éviter les allers-retours.
- Préciser dans la timeline les unités (mmHg, bpm, °C, %SpO2) et proposer des valeurs par défaut pour accélérer la saisie terrain.
- Offrir un mode « révision » en lecture seule après finalisation pour consulter le rapport sans risque d’édition.

## PDF et export
- Ajouter une pagination, un sommaire succinct et des identifiants de mission dans l’en-tête/pied de page du PDF pour faciliter l’archivage.
- Permettre l’export local horodaté du PDF (nom de fichier incluant missionId et finalizedAt) et une vérification simple d’intégrité (checksum affiché).
- Tester l’affichage PDF sur différents lecteurs mobiles pour vérifier la stabilité des polices et des encodages.
