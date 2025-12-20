import * as SQLite from 'expo-sqlite'
import { decryptString, encryptString, hashCode } from './crypto'
import {
  type EtatClinique,
  type EtatFinal,
  type EvenementTimeline,
  type Mission,
  type MissionStatus
} from '../types/models'

const database = SQLite.openDatabaseSync('medtrackrapat.db')

type StatementParams = SQLite.SQLiteBindParams | SQLite.SQLiteVariadicBindParams

type MissionRow = {
  id: string
  type: Mission['type']
  date: string
  depart: string
  arrivee: string
  accompagnant: Mission['accompagnant']
  patientCipher: string
  status: MissionStatus
  createdAt: string
  finalizedAt?: string | null
  reopenedAt?: string | null
  reopenCodeHash?: string | null
}

type EtatCliniqueRow = {
  ta: string
  fc: string
  spo2: string
  fr: string
  temperature: string
  conscience: string
  douleurEVA: number
  traitements: string
  dispositifs: string
  horodatage: string
}

type TimelineRow = {
  id: string
  missionId: string
  type: EvenementTimeline['type']
  constantes?: string | null
  noteCipher?: string | null
  horodatage: string
}

const runStatement = async (query: string, params: StatementParams = []): Promise<SQLite.SQLiteRunResult> =>
  await database.runAsync(query, params)

const getFirst = async <T>(query: string, params: StatementParams = []): Promise<T | null> =>
  await database.getFirstAsync<T>(query, params) ?? null

const getAll = async <T>(query: string, params: StatementParams = []): Promise<T[]> =>
  await database.getAllAsync<T>(query, params)

export const initializeSchema = async (): Promise<void> => {
  await database.execAsync(
    `CREATE TABLE IF NOT EXISTS missions (
      id TEXT PRIMARY KEY NOT NULL,
      type TEXT NOT NULL,
      date TEXT NOT NULL,
      depart TEXT NOT NULL,
      arrivee TEXT NOT NULL,
      accompagnant TEXT NOT NULL,
      patientCipher TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'draft',
      createdAt TEXT NOT NULL,
      finalizedAt TEXT,
      reopenedAt TEXT,
      reopenCodeHash TEXT
    );`
  )

  await database.execAsync(
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

  await database.execAsync(
    `CREATE TABLE IF NOT EXISTS timeline (
      id TEXT PRIMARY KEY NOT NULL,
      missionId TEXT NOT NULL,
      type TEXT NOT NULL,
      constantes TEXT,
      noteCipher TEXT,
      horodatage TEXT NOT NULL,
      FOREIGN KEY(missionId) REFERENCES missions(id)
    );`
  )

  await database.execAsync(
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
}

const parseEtatClinique = (row: EtatCliniqueRow): EtatClinique => ({
  ta: row.ta,
  fc: row.fc,
  spo2: row.spo2,
  fr: row.fr,
  temperature: row.temperature,
  conscience: row.conscience as EtatClinique['conscience'],
  douleurEVA: Number(row.douleurEVA),
  traitements: JSON.parse(row.traitements),
  dispositifs: JSON.parse(row.dispositifs),
  horodatage: row.horodatage
})

const mapMissionRow = async (row: MissionRow): Promise<Mission> => {
  const patientJson = await decryptString(row.patientCipher)
  const patient = JSON.parse(patientJson)

  return {
    id: row.id,
    type: row.type,
    date: row.date,
    depart: row.depart,
    arrivee: row.arrivee,
    accompagnant: row.accompagnant,
    patient,
    createdAt: row.createdAt,
    status: row.status,
    finalizedAt: row.finalizedAt ?? null,
    reopenedAt: row.reopenedAt ?? null,
    reopenCodeHash: row.reopenCodeHash ?? null
  }
}

export const saveMission = async (mission: Mission): Promise<void> => {
  const patientCipher = await encryptString(JSON.stringify(mission.patient))

  await runStatement(
    `INSERT OR REPLACE INTO missions (id, type, date, depart, arrivee, accompagnant, patientCipher, status, createdAt, finalizedAt, reopenedAt, reopenCodeHash)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
    [
      mission.id,
      mission.type,
      mission.date,
      mission.depart,
      mission.arrivee,
      mission.accompagnant,
      patientCipher,
      mission.status,
      mission.createdAt,
      mission.finalizedAt ?? null,
      mission.reopenedAt ?? null,
      mission.reopenCodeHash ?? null
    ]
  )
}

export const saveEtatInitial = async (missionId: string, etat: EtatClinique): Promise<void> => {
  await runStatement(
    `INSERT OR REPLACE INTO etats_initiaux (missionId, ta, fc, spo2, fr, temperature, conscience, douleurEVA, traitements, dispositifs, horodatage)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
    [
      missionId,
      etat.ta,
      etat.fc,
      etat.spo2,
      etat.fr,
      etat.temperature,
      etat.conscience,
      etat.douleurEVA,
      JSON.stringify(etat.traitements),
      JSON.stringify(etat.dispositifs),
      etat.horodatage
    ]
  )
}

export const appendTimelineEvent = async (evenement: EvenementTimeline): Promise<void> => {
  const noteCipher = evenement.note != null && evenement.note.trim().length > 0
    ? await encryptString(evenement.note)
    : ''

  await runStatement(
    `INSERT OR REPLACE INTO timeline (id, missionId, type, constantes, noteCipher, horodatage)
     VALUES (?, ?, ?, ?, ?, ?);`,
    [
      evenement.id,
      evenement.missionId,
      evenement.type,
      JSON.stringify(evenement.constantes ?? {}),
      noteCipher,
      evenement.horodatage
    ]
  )
}

export const saveEtatFinal = async (etatFinal: EtatFinal): Promise<void> => {
  const etat = etatFinal.etatPatient
  await runStatement(
    `INSERT OR REPLACE INTO etats_finaux (missionId, ta, fc, spo2, fr, temperature, conscience, douleurEVA, traitements, dispositifs, horodatage, typeRemise, heureRemise, signatureAccompagnant)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
    [
      etatFinal.missionId,
      etat.ta,
      etat.fc,
      etat.spo2,
      etat.fr,
      etat.temperature,
      etat.conscience,
      etat.douleurEVA,
      JSON.stringify(etat.traitements),
      JSON.stringify(etat.dispositifs),
      etat.horodatage,
      etatFinal.typeRemise,
      etatFinal.heureRemise,
      etatFinal.signatureAccompagnant
    ]
  )
}

export const getEtatInitial = async (missionId: string): Promise<EtatClinique | null> => {
  const row = await getFirst<EtatCliniqueRow>('SELECT * FROM etats_initiaux WHERE missionId = ? LIMIT 1;', [missionId])
  if (row == null) return null
  return parseEtatClinique(row)
}

export const getEtatFinal = async (missionId: string): Promise<EtatFinal | null> => {
  const row = await getFirst<EtatCliniqueRow & { typeRemise: string, heureRemise: string, signatureAccompagnant: string }>(
    'SELECT * FROM etats_finaux WHERE missionId = ? LIMIT 1;',
    [missionId]
  )
  if (row == null) return null

  return {
    missionId,
    etatPatient: parseEtatClinique(row),
    typeRemise: row.typeRemise as EtatFinal['typeRemise'],
    heureRemise: row.heureRemise,
    signatureAccompagnant: row.signatureAccompagnant
  }
}

export const getTimeline = async (missionId: string): Promise<EvenementTimeline[]> => {
  const rows = await getAll<TimelineRow>('SELECT * FROM timeline WHERE missionId = ? ORDER BY horodatage ASC;', [missionId])
  const events: EvenementTimeline[] = []

  for (const row of rows) {
    const constantes = row.constantes != null && row.constantes !== '' ? JSON.parse(row.constantes) : undefined
    const note = row.noteCipher ? await decryptString(row.noteCipher) : undefined

    events.push({
      id: row.id,
      missionId: row.missionId,
      type: row.type,
      constantes,
      note,
      horodatage: row.horodatage
    })
  }

  return events
}

export const markMissionFinalized = async (missionId: string, reopenCode: string): Promise<string> => {
  const finalizedAt = new Date().toISOString()
  const reopenCodeHash = hashCode(reopenCode)
  await runStatement(
    `UPDATE missions SET status = 'finalized', finalizedAt = ?, reopenCodeHash = ? WHERE id = ?;`,
    [finalizedAt, reopenCodeHash, missionId]
  )
  return finalizedAt
}

export const reopenMission = async (missionId: string, providedCode: string): Promise<string | null> => {
  const row = await getFirst<{ reopenCodeHash: string | null }>('SELECT reopenCodeHash FROM missions WHERE id = ? LIMIT 1;', [missionId])
  if (row == null || row.reopenCodeHash == null) return null

  if (row.reopenCodeHash !== hashCode(providedCode)) {
    return null
  }

  const reopenedAt = new Date().toISOString()
  await runStatement('UPDATE missions SET status = "draft", reopenedAt = ? WHERE id = ?;', [reopenedAt, missionId])
  return reopenedAt
}

export interface MissionBundle {
  mission: Mission
  etatInitial: EtatClinique | null
  timeline: EvenementTimeline[]
  etatFinal: EtatFinal | null
}

export const loadMostRecentMissionBundle = async (): Promise<MissionBundle | null> => {
  const row = await getFirst<MissionRow>('SELECT * FROM missions ORDER BY createdAt DESC LIMIT 1;')
  if (row == null) return null

  const mission = await mapMissionRow(row)
  const [etatInitial, timeline, etatFinal] = await Promise.all([
    getEtatInitial(mission.id),
    getTimeline(mission.id),
    getEtatFinal(mission.id)
  ])

  return { mission, etatInitial, timeline, etatFinal }
}
