import React, { useState } from 'react'
import { View, Text, Button, StyleSheet } from 'react-native'
import { generateMissionReport } from '../pdf/reportGenerator'
import { type EtatClinique, type EvenementTimeline, type EtatFinal, type Mission } from '../types/models'

interface Props {
  mission: Mission
  etatInitial: EtatClinique
  timeline: EvenementTimeline[]
  etatFinal: EtatFinal
}

export const ReportScreen: React.FC<Props> = ({ mission, etatInitial, timeline, etatFinal }) => {
  const [pdfPath, setPdfPath] = useState<string>('')

  const handleGenerate = async (): Promise<void> => {
    const path = await generateMissionReport({ mission, etatInitial, timeline, etatFinal })
    setPdfPath(path)
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Rapport PDF</Text>
      <Text style={styles.text}>Structure fixe : Informations mission → État initial → Chronologie → Incidents → État final + signature</Text>
      <Button title="Générer le PDF" onPress={handleGenerate} />
      {pdfPath !== '' && <Text style={styles.text}>Fichier généré : {pdfPath}</Text>}
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
  }
})
