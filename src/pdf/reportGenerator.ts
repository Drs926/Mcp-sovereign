import * as FileSystem from 'expo-file-system/build/legacy'
import { PDFDocument, PageSizes } from 'react-native-pdf-lib'
import { type EtatClinique, type EvenementTimeline, type Mission, type EtatFinal } from '../types/models'

interface ReportData {
  mission: Mission
  etatInitial: EtatClinique
  timeline: EvenementTimeline[]
  etatFinal: EtatFinal
}

const line = (label: string, value: string): string => `${label}: ${value}`

const formatEtatClinique = (etat: EtatClinique): string[] => [
  line('TA', etat.ta),
  line('FC', etat.fc),
  line('SpO₂', etat.spo2),
  line('FR', etat.fr),
  line('Température', etat.temperature),
  line('Conscience', etat.conscience),
  line('Douleur (EVA)', `${etat.douleurEVA}`),
  line('Traitements', etat.traitements.join(', ')),
  line('Dispositifs', etat.dispositifs.join(', '))
]

const formatComparatif = (initial: EtatClinique, final: EtatClinique): string[] => [
  `TA: ${initial.ta} → ${final.ta}`,
  `FC: ${initial.fc} → ${final.fc}`,
  `SpO₂: ${initial.spo2} → ${final.spo2}`,
  `FR: ${initial.fr} → ${final.fr}`,
  `Température: ${initial.temperature} → ${final.temperature}`,
  `Conscience: ${initial.conscience} → ${final.conscience}`,
  `Douleur EVA: ${initial.douleurEVA} → ${final.douleurEVA}`
]

export const generateMissionReport = async (data: ReportData): Promise<string> => {
  const { mission, etatInitial, timeline, etatFinal } = data
  const date = new Date().toISOString()

  const summaryLines = [
    line('Mission', mission.id),
    line('Type', mission.type),
    line('Date/heure', mission.date),
    line('Départ', mission.depart),
    line('Arrivée', mission.arrivee),
    line('Accompagnant', mission.accompagnant),
    line('Patient (identifiant)', mission.patient.identifiant),
    line('Âge', `${mission.patient.age}`),
    line('Sexe', mission.patient.sexe),
    line('Diagnostic', mission.patient.diagnostic)
  ]

  const etatInitialLines = formatEtatClinique(etatInitial)

  const timelineLines = timeline
    .sort((a, b) => a.horodatage.localeCompare(b.horodatage))
    .map((item) => {
      const constantes = item.constantes
        ? Object.entries(item.constantes)
          .filter(([, value]) => value != null && value !== '')
          .map(([k, v]) => `${k.toUpperCase()}: ${v}`)
          .join(' • ')
        : '—'
      const note = item.note ?? '—'
      return `${item.horodatage} | ${item.type} | Constantes: ${constantes} | Note: ${note}`
    })

  const finalLines = [
    ...formatEtatClinique(etatFinal.etatPatient),
    line('Type de remise', etatFinal.typeRemise),
    line('Heure de remise', etatFinal.heureRemise),
    line('Signature accompagnant', etatFinal.signatureAccompagnant)
  ]
  const comparatifLines = formatComparatif(etatInitial, etatFinal.etatPatient)

  const doc = PDFDocument.create()
  const page = doc.addPage(PageSizes.A4)
  const marginLeft = 20
  let yOffset = 780

  const drawTitle = (title: string): void => {
    page.drawText(title, { x: marginLeft, y: yOffset, color: '#0B4F6C', fontSize: 16 })
    yOffset -= 20
  }

  const drawList = (items: string[]): void => {
    items.forEach((text) => {
      page.drawText(text, { x: marginLeft, y: yOffset, fontSize: 12 })
      yOffset -= 16
    })
    yOffset -= 12
  }

  drawTitle('1. Informations mission')
  drawList(summaryLines)

  drawTitle('2. État initial')
  drawList(etatInitialLines)

  drawTitle('3. Chronologie')
  drawList(timelineLines)

  const incidentsOnly = timeline
    .filter(item => item.type === 'incident')
    .sort((a, b) => a.horodatage.localeCompare(b.horodatage))
    .map(item => {
      const note = item.note ?? '—'
      return `${item.horodatage} | Incident | Note: ${note}`
    })
  drawTitle('4. Incidents')
  drawList(incidentsOnly.length > 0 ? incidentsOnly : ['Aucun incident déclaré'])

  drawTitle('5. État final + signature')
  drawList(finalLines)
  drawTitle('Comparatif initial / final')
  drawList(comparatifLines)

  page.drawText(`PDF généré le ${date}`, { x: marginLeft, y: yOffset, fontSize: 10 })

  const pdfBytes = await doc.write()
  const filename = `${FileSystem.documentDirectory ?? FileSystem.cacheDirectory}mission_${mission.id}.pdf`
  await FileSystem.writeAsStringAsync(filename, pdfBytes, { encoding: FileSystem.EncodingType.Base64 })

  return filename
}
