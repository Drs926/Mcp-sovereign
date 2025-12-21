import * as SQLite from 'expo-sqlite'
import { decryptString, decryptWithKey, encryptString, encryptWithKey, hashCode, rotateEncryptionKey } from './crypto'
import {
  type EtatClinique,
  type EtatFinal,
  type EvenementTimeline,
  type Mission,
  type MissionStatus
} from '../types/models'

const database = SQLite.openDatabaseSync('medtrackrapat.db')
const SCHEMA_VERSION = 2
const DEFAULT_REOPEN_ATTEMPTS = 3
const DEFAULT_PURGE_DELAY_HOURS = 24

type StatementParams = SQLite.SQLiteBindParams | SQLite.SQLiteVariadicBindParams
type MetaRow = { key: string, value: string }

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
  reopenAttemptsRemaining?: number | null
  purgeAfter?: string | null
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

const logStorageError = (scope: string, error: unknown): void => {
  console.error(`[storage:${scope}]`, error)
}

const runStatement = async (query: string, params: StatementParams = []): Promise<SQLite.SQLiteRunResult> => {
  try {
    return await database.runAsync(query, params)
  } catch (error) {
    logStorageError('run', error)
    throw error
  }
}

const getFirst = async <T>(query: string, params: StatementParams = []): Promise<T | null> => {
  try {
    return await database.getFirstAsync<T>(query, params) ?? null
  } catch (error) {
    logStorageError('getFirst', error)
    throw error
  }
}

const getAll = async <T>(query: string, params: StatementParams = []): Promise<T[]> => {
  try {
    return await database.getAllAsync<T>(query, params)
  } catch (error) {
    logStorageError('getAll', error)
    throw error
  }
}

const migrateToV1 = async (): Promise<void> => {
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

const migrateToV2 = async (): Promise<void> => {
  await database.execAsync('ALTER TABLE missions ADD COLUMN reopenAttemptsRemaining INTEGER NOT NULL DEFAULT 3;')
  await database.execAsync('ALTER TABLE missions ADD COLUMN purgeAfter TEXT;')
  await database.execAsync('CREATE TABLE IF NOT EXISTS meta (key TEXT PRIMARY KEY NOT NULL, value TEXT NOT NULL);')
  await database.execAsync(
    `CREATE TABLE IF NOT EXISTS mission_exports (
      missionId TEXT PRIMARY KEY NOT NULL,
      checksum TEXT NOT NULL,
      exportedAt TEXT NOT NULL,
      purgeAfter TEXT NOT NULL,
      FOREIGN KEY(missionId) REFERENCES missions(id)
    );`
  )
}

const getCurrentSchemaVersion = async (): Promise<number> => {
  const row = await database.getFirstAsync<{ user_version: number }>('PRAGMA user_version;')
  return row?.user_version ?? 0
}

const setSchemaVersion = async (version: number): Promise<void> => {
  await database.execAsync(`PRAGMA user_version = ${version};`)
}

export const initializeSchema = async (): Promise<void> => {
  let version = await getCurrentSchemaVersion()
  while (version < SCHEMA_VERSION) {
    version += 1
    if (version === 1) await migrateToV1()
    if (version === 2) await migrateToV2()
    await setSchemaVersion(version)
  }
  await purgeExpiredMissions()
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
    reopenCodeHash: row.reopenCodeHash ?? null,
    reopenAttemptsRemaining: row.reopenAttemptsRemaining ?? DEFAULT_REOPEN_ATTEMPTS
  }
}

export const saveMission = async (mission: Mission): Promise<void> => {
  const patientCipher = await encryptString(JSON.stringify(mission.patient))

  await runStatement(
    `INSERT OR REPLACE INTO missions (id, type, date, depart, arrivee, accompagnant, patientCipher, status, createdAt, finalizedAt, reopenedAt, reopenCodeHash, reopenAttemptsRemaining, purgeAfter)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
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
      mission.reopenCodeHash ?? null,
      mission.reopenAttemptsRemaining ?? DEFAULT_REOPEN_ATTEMPTS,
      mission.purgeAfter ?? null
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
    `UPDATE missions SET status = 'finalized', finalizedAt = ?, reopenCodeHash = ?, reopenAttemptsRemaining = ? WHERE id = ?;`,
    [finalizedAt, reopenCodeHash, DEFAULT_REOPEN_ATTEMPTS, missionId]
  )
  return finalizedAt
}

export interface ReopenResult {
  success: boolean
  reopenedAt?: string
  attemptsLeft: number
  wiped: boolean
}

export const reopenMission = async (missionId: string, providedCode: string): Promise<ReopenResult> => {
  const row = await getFirst<{ reopenCodeHash: string | null, reopenAttemptsRemaining: number | null }>(
    'SELECT reopenCodeHash, reopenAttemptsRemaining FROM missions WHERE id = ? LIMIT 1;',
    [missionId]
  )
  if (row == null || row.reopenCodeHash == null) return { success: false, attemptsLeft: 0, wiped: false }

  const attemptsLeft = row.reopenAttemptsRemaining ?? DEFAULT_REOPEN_ATTEMPTS
  if (attemptsLeft <= 0) {
    await wipeMissionData(missionId)
    return { success: false, attemptsLeft: 0, wiped: true }
  }

  if (row.reopenCodeHash !== hashCode(providedCode)) {
    const nextAttempts = Math.max(0, attemptsLeft - 1)
    await runStatement('UPDATE missions SET reopenAttemptsRemaining = ? WHERE id = ?;', [nextAttempts, missionId])
    if (nextAttempts === 0) await wipeMissionData(missionId)
    return { success: false, attemptsLeft: nextAttempts, wiped: nextAttempts === 0 }
  }

  const reopenedAt = new Date().toISOString()
  await runStatement(
    'UPDATE missions SET status = "draft", reopenedAt = ?, reopenAttemptsRemaining = ? WHERE id = ?;',
    [reopenedAt, DEFAULT_REOPEN_ATTEMPTS, missionId]
  )
  return { success: true, reopenedAt, attemptsLeft: DEFAULT_REOPEN_ATTEMPTS, wiped: false }
}

export interface MissionBundle {
  mission: Mission
  etatInitial: EtatClinique | null
  timeline: EvenementTimeline[]
  etatFinal: EtatFinal | null
}

export const wipeMissionData = async (missionId: string): Promise<void> => {
  await database.execAsync('BEGIN;')
  try {
    await runStatement('DELETE FROM etats_finaux WHERE missionId = ?;', [missionId])
    await runStatement('DELETE FROM etats_initiaux WHERE missionId = ?;', [missionId])
    await runStatement('DELETE FROM timeline WHERE missionId = ?;', [missionId])
    await runStatement('DELETE FROM mission_exports WHERE missionId = ?;', [missionId])
    await runStatement('DELETE FROM missions WHERE id = ?;', [missionId])
    await database.execAsync('COMMIT;')
  } catch (error) {
    await database.execAsync('ROLLBACK;')
    logStorageError('wipe', error)
    throw error
  }
}

const getMeta = async (key: string): Promise<string | null> => {
  const row = await getFirst<MetaRow>('SELECT * FROM meta WHERE key = ? LIMIT 1;', [key])
  return row?.value ?? null
}

const setMeta = async (key: string, value: string): Promise<void> => {
  await runStatement('INSERT OR REPLACE INTO meta (key, value) VALUES (?, ?);', [key, value])
}

export const purgeExpiredMissions = async (): Promise<void> => {
  const now = new Date().toISOString()
  const expired = await getAll<{ missionId: string }>('SELECT missionId FROM mission_exports WHERE purgeAfter <= ?;', [now])
  for (const row of expired) {
    await wipeMissionData(row.missionId)
  }
}

export const recordPdfExport = async (missionId: string, checksum: string, delayHours: number = DEFAULT_PURGE_DELAY_HOURS): Promise<string> => {
  const exportedAt = new Date().toISOString()
  const purgeAfter = new Date(Date.now() + delayHours * 60 * 60 * 1000).toISOString()
  await runStatement(
    `INSERT OR REPLACE INTO mission_exports (missionId, checksum, exportedAt, purgeAfter)
     VALUES (?, ?, ?, ?);`,
    [missionId, checksum, exportedAt, purgeAfter]
  )
  await runStatement('UPDATE missions SET purgeAfter = ? WHERE id = ?;', [purgeAfter, missionId])
  return purgeAfter
}

export const rotateEncryptedStorage = async (): Promise<void> => {
  await rotateEncryptionKey(async (oldKey, newKey) => {
    await database.execAsync('BEGIN;')
    try {
      const missions = await getAll<{ id: string, patientCipher: string }>('SELECT id, patientCipher FROM missions;')
      for (const mission of missions) {
        const patient = JSON.parse(decryptWithKey(mission.patientCipher, oldKey))
        const updatedCipher = encryptWithKey(JSON.stringify(patient), newKey)
        await runStatement('UPDATE missions SET patientCipher = ? WHERE id = ?;', [updatedCipher, mission.id])
      }

      const notes = await getAll<{ id: string, noteCipher: string | null }>('SELECT id, noteCipher FROM timeline WHERE noteCipher IS NOT NULL;')
      for (const note of notes) {
        if (note.noteCipher == null || note.noteCipher === '') continue
        const decrypted = decryptWithKey(note.noteCipher, oldKey)
        const reciphered = encryptWithKey(decrypted, newKey)
        await runStatement('UPDATE timeline SET noteCipher = ? WHERE id = ?;', [reciphered, note.id])
      }

      await setMeta('encryptionVersion', newKey.slice(0, 8))
      await database.execAsync('COMMIT;')
    } catch (error) {
      await database.execAsync('ROLLBACK;')
      logStorageError('rotateEncryption', error)
      throw error
    }
  })
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
