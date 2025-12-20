export type MissionType = 'sanitaire' | 'rapatriement' | 'néonatal' | 'autre'
export type MissionStatus = 'draft' | 'finalized'
export type AccompagnantType = 'MD' | 'IDE'
export type DiagnosticPrincipal = 'traumatique' | 'cardiaque' | 'respiratoire' | 'neurologique' | 'autre'
export type ConscienceLevel = 'Alerte' | 'Verbal' | 'Pain' | 'Unresponsive'
export type EvenementType = 'surveillance' | 'acte_medical' | 'incident'
export type TypeRemise = 'établissement' | 'ambulance' | 'tiers'

export const MISSION_TYPES: MissionType[] = ['sanitaire', 'rapatriement', 'néonatal', 'autre']
export const ACCOMPAGNANT_TYPES: AccompagnantType[] = ['MD', 'IDE']
export const DIAGNOSTIC_OPTIONS: DiagnosticPrincipal[] = ['traumatique', 'cardiaque', 'respiratoire', 'neurologique', 'autre']
export const CONSCIENCE_OPTIONS: ConscienceLevel[] = ['Alerte', 'Verbal', 'Pain', 'Unresponsive']
export const EVENEMENT_TYPES: EvenementType[] = ['surveillance', 'acte_medical', 'incident']
export const TYPE_REMISE_OPTIONS: TypeRemise[] = ['établissement', 'ambulance', 'tiers']

export interface Mission {
  id: string
  type: MissionType
  date: string
  depart: string
  arrivee: string
  accompagnant: AccompagnantType
  patient: Patient
  createdAt: string
  status: MissionStatus
  finalizedAt?: string | null
  reopenedAt?: string | null
  reopenCodeHash?: string | null
  reopenAttemptsRemaining?: number | null
}

export interface Patient {
  identifiant: string
  age: number
  sexe: 'H' | 'F'
  diagnostic: DiagnosticPrincipal
}

export interface EtatClinique {
  ta: string
  fc: string
  spo2: string
  fr: string
  temperature: string
  conscience: ConscienceLevel
  douleurEVA: number
  traitements: string[]
  dispositifs: string[]
  horodatage: string
}

export interface EvenementTimeline {
  id: string
  missionId: string
  type: EvenementType
  constantes?: Partial<EtatClinique>
  note?: string
  horodatage: string
}

export interface EtatFinal {
  missionId: string
  etatPatient: EtatClinique
  typeRemise: TypeRemise
  heureRemise: string
  signatureAccompagnant: string
}
