import React, { useState } from 'react'
import { View, Text, Button, StyleSheet, TextInput } from 'react-native'
import { generateMissionReport } from '../pdf/reportGenerator'
import { type EtatClinique, type EvenementTimeline, type EtatFinal, type Mission } from '../types/models'

interface Props {
  mission: Mission
  etatInitial: EtatClinique
  timeline: EvenementTimeline[]
  etatFinal: EtatFinal
  onReopen: (code: string) => Promise<boolean>
}

export const ReportScreen: React.FC<Props> = ({ mission, etatInitial, timeline, etatFinal, onReopen }) => {
  const [pdfPath, setPdfPath] = useState<string>('')
  const [reopenCode, setReopenCode] = useState<string>('')
  const [reopenStatus, setReopenStatus] = useState<string>('')

  const handleGenerate = async (): Promise<void> => {
    const path = await generateMissionReport({ mission, etatInitial, timeline, etatFinal })
    setPdfPath(path)
  }

  const handleReopen = async (): Promise<void> => {
    const ok = await onReopen(reopenCode)
    setReopenStatus(ok ? 'Mission réouverte, retour possible à la finalisation.' : 'Code incorrect, mission verrouillée.')
    if (ok) setReopenCode('')
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Rapport PDF</Text>
      <Text style={styles.text}>Structure fixe : Informations mission → État initial → Chronologie → Incidents → État final + signature</Text>
      <Button title="Générer le PDF" onPress={handleGenerate} />
      {pdfPath !== '' && <Text style={styles.text}>Fichier généré : {pdfPath}</Text>}
      {mission.status === 'finalized' && (
        <View style={styles.reopenBox}>
          <Text style={styles.title}>Réouverture contrôlée</Text>
          <Text style={styles.text}>Saisir le code défini lors de la validation pour éditer à nouveau.</Text>
          <TextInput placeholder="Code de réouverture" value={reopenCode} secureTextEntry onChangeText={setReopenCode} style={styles.input} />
          <Button title="Réouvrir la mission" onPress={handleReopen} />
          {reopenStatus !== '' && <Text style={styles.text}>{reopenStatus}</Text>}
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f6f9fb'
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginVertical: 8
  },
  text: {
    marginVertical: 8
  },
  reopenBox: {
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#f8fafc'
  },
  input: {
    borderWidth: 1,
    borderColor: '#d0d7de',
    borderRadius: 4,
    padding: 10,
    marginVertical: 8,
    backgroundColor: '#fff'
  }
})
