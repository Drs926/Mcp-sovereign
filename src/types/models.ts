export type MissionType = 'sanitaire' | 'répatriement' | 'néonatal' | 'autre'
export type AccompagnantType = 'MD' | 'IDE'
export type DiagnosticPrincipal = 'traumatique' | 'cardiaque' | 'respiratoire' | 'neurologique' | 'autre'

export interface Mission {
  id: string
  type: MissionType
  date: string
  depart: string
  arrivee: string
  accompagnant: AccompagnantType
  patient: Patient
  createdAt: string
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
  conscience: 'Alerte' | 'Verbal' | 'Pain' | 'Unresponsive'
  douleurEVA: number
  traitements: string[]
  dispositifs: string[]
  horodatage: string
}

export type EvenementType = 'surveillance' | 'acte_medical' | 'incident'

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
  typeRemise: 'établissement' | 'ambulance' | 'tiers'
  heureRemise: string
  signatureAccompagnant: string
}
