import * as SQLite from 'expo-sqlite'
import { type EtatClinique, type EtatFinal, type EvenementTimeline, type Mission } from '../types/models'

const database = SQLite.openDatabase('medtrackrapat.db')

export const initializeSchema = (): void => {
  database.transaction(tx => {
    tx.executeSql(
      `CREATE TABLE IF NOT EXISTS missions (
        id TEXT PRIMARY KEY NOT NULL,
        type TEXT NOT NULL,
        date TEXT NOT NULL,
        depart TEXT NOT NULL,
        arrivee TEXT NOT NULL,
        accompagnant TEXT NOT NULL,
        patientIdentifiant TEXT NOT NULL,
        patientAge INTEGER NOT NULL,
        patientSexe TEXT NOT NULL,
        patientDiagnostic TEXT NOT NULL,
        createdAt TEXT NOT NULL
      );`
    )

    tx.executeSql(
      `CREATE TABLE IF NOT EXISTS etats_initiaux (
        missionId TEXT PRIMARY KEY NOT NULL,
        ta TEXT NOT NULL,
        fc TEXT NOT NULL,
        spo2 TEXT NOT NULL,
        fr TEXT NOT NULL,
        temperature TEXT NOT NULL,
        conscience TEXT NOT NULL,
        douleurEVA INTEGER NOT NULL,
        traitements TEXT NOT NULL,
        dispositifs TEXT NOT NULL,
        horodatage TEXT NOT NULL,
        FOREIGN KEY(missionId) REFERENCES missions(id)
      );`
    )

    tx.executeSql(
      `CREATE TABLE IF NOT EXISTS timeline (
        id TEXT PRIMARY KEY NOT NULL,
        missionId TEXT NOT NULL,
        type TEXT NOT NULL,
        constantes TEXT,
        note TEXT,
        horodatage TEXT NOT NULL,
        FOREIGN KEY(missionId) REFERENCES missions(id)
      );`
    )

    tx.executeSql(
      `CREATE TABLE IF NOT EXISTS etats_finaux (
        missionId TEXT PRIMARY KEY NOT NULL,
        ta TEXT NOT NULL,
        fc TEXT NOT NULL,
        spo2 TEXT NOT NULL,
        fr TEXT NOT NULL,
        temperature TEXT NOT NULL,
        conscience TEXT NOT NULL,
        douleurEVA INTEGER NOT NULL,
        traitements TEXT NOT NULL,
        dispositifs TEXT NOT NULL,
        horodatage TEXT NOT NULL,
        typeRemise TEXT NOT NULL,
        heureRemise TEXT NOT NULL,
        signatureAccompagnant TEXT NOT NULL,
        FOREIGN KEY(missionId) REFERENCES missions(id)
      );`
    )
  })
}

export const saveMission = (mission: Mission): void => {
  const patient = mission.patient
  database.transaction(tx => {
    tx.executeSql(
      `INSERT OR REPLACE INTO missions (id, type, date, depart, arrivee, accompagnant, patientIdentifiant, patientAge, patientSexe, patientDiagnostic, createdAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
      [mission.id, mission.type, mission.date, mission.depart, mission.arrivee, mission.accompagnant, patient.identifiant, patient.age, patient.sexe, patient.diagnostic, mission.createdAt]
    )
  })
}

export const saveEtatInitial = (missionId: string, etat: EtatClinique): void => {
  database.transaction(tx => {
    tx.executeSql(
      `INSERT OR REPLACE INTO etats_initiaux (missionId, ta, fc, spo2, fr, temperature, conscience, douleurEVA, traitements, dispositifs, horodatage)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
      [missionId, etat.ta, etat.fc, etat.spo2, etat.fr, etat.temperature, etat.conscience, etat.douleurEVA, JSON.stringify(etat.traitements), JSON.stringify(etat.dispositifs), etat.horodatage]
    )
  })
}

export const appendTimelineEvent = (evenement: EvenementTimeline): void => {
  database.transaction(tx => {
    tx.executeSql(
      `INSERT OR REPLACE INTO timeline (id, missionId, type, constantes, note, horodatage)
       VALUES (?, ?, ?, ?, ?, ?);`,
      [evenement.id, evenement.missionId, evenement.type, JSON.stringify(evenement.constantes ?? {}), evenement.note ?? '', evenement.horodatage]
    )
  })
}

export const saveEtatFinal = (etatFinal: EtatFinal): void => {
  const etat = etatFinal.etatPatient
  database.transaction(tx => {
    tx.executeSql(
      `INSERT OR REPLACE INTO etats_finaux (missionId, ta, fc, spo2, fr, temperature, conscience, douleurEVA, traitements, dispositifs, horodatage, typeRemise, heureRemise, signatureAccompagnant)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
      [etatFinal.missionId, etat.ta, etat.fc, etat.spo2, etat.fr, etat.temperature, etat.conscience, etat.douleurEVA, JSON.stringify(etat.traitements), JSON.stringify(etat.dispositifs), etat.horodatage, etatFinal.typeRemise, etatFinal.heureRemise, etatFinal.signatureAccompagnant]
    )
  })
}
