import React, { useEffect, useState } from 'react'
import { View, Text, TextInput, Button, StyleSheet } from 'react-native'
import { v4 as uuidv4 } from 'uuid'
import { saveMission, initializeSchema } from '../storage/localDatabase'
import { type Mission, type MissionType, type DiagnosticPrincipal, type AccompagnantType } from '../types/models'

interface Props {
  onNext: (mission: Mission) => void
}

const defaultMissionType: MissionType = 'sanitaire'
const defaultDiagnostic: DiagnosticPrincipal = 'traumatique'
const defaultAccompagnant: AccompagnantType = 'MD'

export const MissionCreationScreen: React.FC<Props> = ({ onNext }) => {
  const [mission, setMission] = useState<Mission>({
    id: uuidv4(),
    type: defaultMissionType,
    date: new Date().toISOString(),
    depart: '',
    arrivee: '',
    accompagnant: defaultAccompagnant,
    patient: {
      identifiant: '',
      age: 0,
      sexe: 'H',
      diagnostic: defaultDiagnostic
    },
    createdAt: new Date().toISOString()
  })

  useEffect(() => {
    initializeSchema()
  }, [])

  const updateField = (field: keyof Mission, value: string | number): void => {
    setMission((prev) => ({ ...prev, [field]: value }))
  }

  const updatePatient = (field: 'identifiant' | 'age' | 'sexe' | 'diagnostic', value: string | number): void => {
    setMission((prev) => ({
      ...prev,
      patient: { ...prev.patient, [field]: value }
    }))
  }

  const handleContinue = (): void => {
    saveMission(mission)
    onNext(mission)
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Mission</Text>
      <TextInput placeholder="Type (liste fermée)" value={mission.type} onChangeText={(text) => updateField('type', text)} style={styles.input} />
      <TextInput placeholder="Date/heure" value={mission.date} onChangeText={(text) => updateField('date', text)} style={styles.input} />
      <TextInput placeholder="Lieu départ" value={mission.depart} onChangeText={(text) => updateField('depart', text)} style={styles.input} />
      <TextInput placeholder="Lieu arrivée" value={mission.arrivee} onChangeText={(text) => updateField('arrivee', text)} style={styles.input} />
      <TextInput placeholder="Type accompagnant (MD/IDE)" value={mission.accompagnant} onChangeText={(text) => updateField('accompagnant', text)} style={styles.input} />

      <Text style={styles.title}>Patient</Text>
      <TextInput placeholder="Identifiant interne / initiales" value={mission.patient.identifiant} onChangeText={(text) => updatePatient('identifiant', text)} style={styles.input} />
      <TextInput placeholder="Âge" keyboardType="numeric" value={mission.patient.age.toString()} onChangeText={(text) => updatePatient('age', Number(text))} style={styles.input} />
      <TextInput placeholder="Sexe (H/F)" value={mission.patient.sexe} onChangeText={(text) => updatePatient('sexe', text)} style={styles.input} />
      <TextInput placeholder="Diagnostic principal" value={mission.patient.diagnostic} onChangeText={(text) => updatePatient('diagnostic', text)} style={styles.input} />

      <Button title="Enregistrer & continuer" onPress={handleContinue} />
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
  input: {
    borderWidth: 1,
    borderColor: '#d0d7de',
    borderRadius: 4,
    padding: 10,
    marginBottom: 10,
    backgroundColor: '#fff'
  }
})
