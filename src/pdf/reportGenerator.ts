import * as FileSystem from 'expo-file-system'
import { PDFDocument, PageSizes } from 'react-native-pdf-lib'
import { type EtatClinique, type EvenementTimeline, type Mission, type EtatFinal } from '../types/models'

interface ReportData {
  mission: Mission
  etatInitial: EtatClinique
  timeline: EvenementTimeline[]
  etatFinal: EtatFinal
}

const line = (label: string, value: string): string => `${label}: ${value}`

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

  const etatInitialLines = [
    line('TA', etatInitial.ta),
    line('FC', etatInitial.fc),
    line('SpO₂', etatInitial.spo2),
    line('FR', etatInitial.fr),
    line('Température', etatInitial.temperature),
    line('Conscience', etatInitial.conscience),
    line('Douleur (EVA)', `${etatInitial.douleurEVA}`),
    line('Traitements', etatInitial.traitements.join(', ')),
    line('Dispositifs', etatInitial.dispositifs.join(', '))
  ]

  const timelineLines = timeline
    .sort((a, b) => a.horodatage.localeCompare(b.horodatage))
    .map((item) => {
      const constantes = item.constantes ? JSON.stringify(item.constantes) : '—'
      const note = item.note ?? '—'
      return `${item.horodatage} | ${item.type} | Constantes: ${constantes} | Note: ${note}`
    })

  const finalLines = [
    line('TA', etatFinal.etatPatient.ta),
    line('FC', etatFinal.etatPatient.fc),
    line('SpO₂', etatFinal.etatPatient.spo2),
    line('FR', etatFinal.etatPatient.fr),
    line('Température', etatFinal.etatPatient.temperature),
    line('Conscience', etatFinal.etatPatient.conscience),
    line('Douleur (EVA)', `${etatFinal.etatPatient.douleurEVA}`),
    line('Traitements', etatFinal.etatPatient.traitements.join(', ')),
    line('Dispositifs', etatFinal.etatPatient.dispositifs.join(', ')),
    line('Type de remise', etatFinal.typeRemise),
    line('Heure de remise', etatFinal.heureRemise),
    line('Signature accompagnant', etatFinal.signatureAccompagnant)
  ]

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

  const incidentsOnly = timelineLines.filter(lineText => lineText.includes('incident'))
  drawTitle('4. Incidents')
  drawList(incidentsOnly.length > 0 ? incidentsOnly : ['Aucun incident déclaré'])

  drawTitle('5. État final + signature')
  drawList(finalLines)

  page.drawText(`PDF généré le ${date}`, { x: marginLeft, y: yOffset, fontSize: 10 })

  const pdfBytes = await doc.write()
  const filename = `${FileSystem.documentDirectory ?? FileSystem.cacheDirectory}mission_${mission.id}.pdf`
  await FileSystem.writeAsStringAsync(filename, pdfBytes, { encoding: FileSystem.EncodingType.Base64 })

  return filename
}
