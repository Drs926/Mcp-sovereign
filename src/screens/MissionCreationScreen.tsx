import React, { useEffect, useState } from 'react'
import { View, Text, TextInput, Button, StyleSheet, Pressable } from 'react-native'
import { v4 as uuidv4 } from 'uuid'
import { saveMission, initializeSchema } from '../storage/localDatabase'
import {
  ACCOMPAGNANT_TYPES,
  DIAGNOSTIC_OPTIONS,
  MISSION_TYPES,
  type Mission,
  type MissionType,
  type DiagnosticPrincipal,
  type AccompagnantType
} from '../types/models'

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
    createdAt: new Date().toISOString(),
    status: 'draft'
  })
  const [error, setError] = useState<string>('')

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

  const handleContinue = async (): Promise<void> => {
    if (mission.depart.trim() === '' || mission.arrivee.trim() === '') {
      setError('Les lieux de départ et d’arrivée sont obligatoires.')
      return
    }

    if (mission.patient.identifiant.trim() === '' || mission.patient.age <= 0) {
      setError('Renseignez un identifiant patient et un âge valide.')
      return
    }

    setError('')
    await saveMission(mission)
    onNext(mission)
  }

  const renderOptions = <T extends string>(options: T[], selected: T, onSelect: (value: T) => void): JSX.Element => (
    <View style={styles.optionsRow}>
      {options.map(option => (
        <Pressable
          key={option}
          onPress={() => onSelect(option)}
          style={[styles.optionChip, selected === option && styles.optionChipSelected]}
        >
          <Text style={selected === option ? styles.optionChipSelectedText : styles.optionChipText}>{option}</Text>
        </Pressable>
      ))}
    </View>
  )

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Mission</Text>
      <Text style={styles.label}>Type de mission</Text>
      {renderOptions<MissionType>(MISSION_TYPES, mission.type, (value) => updateField('type', value))}
      <TextInput placeholder="Date/heure" value={mission.date} onChangeText={(text) => updateField('date', text)} style={styles.input} />
      <TextInput placeholder="Lieu départ" value={mission.depart} onChangeText={(text) => updateField('depart', text)} style={styles.input} />
      <TextInput placeholder="Lieu arrivée" value={mission.arrivee} onChangeText={(text) => updateField('arrivee', text)} style={styles.input} />
      <Text style={styles.label}>Accompagnant</Text>
      {renderOptions<AccompagnantType>(ACCOMPAGNANT_TYPES, mission.accompagnant, (value) => updateField('accompagnant', value))}

      <Text style={styles.title}>Patient</Text>
      <TextInput placeholder="Identifiant interne / initiales" value={mission.patient.identifiant} onChangeText={(text) => updatePatient('identifiant', text)} style={styles.input} />
      <TextInput placeholder="Âge" keyboardType="numeric" value={mission.patient.age.toString()} onChangeText={(text) => updatePatient('age', Number(text))} style={styles.input} />
      <Text style={styles.label}>Sexe</Text>
      {renderOptions<'H' | 'F'>(['H', 'F'], mission.patient.sexe, (value) => updatePatient('sexe', value))}
      <Text style={styles.label}>Diagnostic principal</Text>
      {renderOptions<DiagnosticPrincipal>(DIAGNOSTIC_OPTIONS, mission.patient.diagnostic, (value) => updatePatient('diagnostic', value))}

      {error !== '' && <Text style={styles.error}>{error}</Text>}
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
  label: {
    fontWeight: '600',
    marginBottom: 6
  },
  input: {
    borderWidth: 1,
    borderColor: '#d0d7de',
    borderRadius: 4,
    padding: 10,
    marginBottom: 10,
    backgroundColor: '#fff'
  },
  optionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12
  },
  optionChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    backgroundColor: '#fff'
  },
  optionChipSelected: {
    backgroundColor: '#0ea5e9',
    borderColor: '#0284c7'
  },
  optionChipText: {
    color: '#0f172a'
  },
  optionChipSelectedText: {
    color: '#fff',
    fontWeight: '600'
  },
  error: {
    color: '#b91c1c',
    marginBottom: 10
  }
})
