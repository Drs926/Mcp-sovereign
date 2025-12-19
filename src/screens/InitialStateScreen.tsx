import React, { useState } from 'react'
import { View, Text, TextInput, Button, StyleSheet } from 'react-native'
import { saveEtatInitial } from '../storage/localDatabase'
import { type EtatClinique, type Mission } from '../types/models'

interface Props {
  mission: Mission
  onNext: (etat: EtatClinique) => void
}

export const InitialStateScreen: React.FC<Props> = ({ mission, onNext }) => {
  const [etat, setEtat] = useState<EtatClinique>({
    ta: '',
    fc: '',
    spo2: '',
    fr: '',
    temperature: '',
    conscience: 'Alerte',
    douleurEVA: 0,
    traitements: [],
    dispositifs: [],
    horodatage: new Date().toISOString()
  })

  const updateField = (field: keyof EtatClinique, value: string | number): void => {
    setEtat((prev) => ({ ...prev, [field]: value }))
  }

  const handleSave = (): void => {
    saveEtatInitial(mission.id, etat)
    onNext(etat)
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>État initial patient</Text>
      <TextInput placeholder="TA" value={etat.ta} onChangeText={(text) => updateField('ta', text)} style={styles.input} />
      <TextInput placeholder="FC" value={etat.fc} onChangeText={(text) => updateField('fc', text)} style={styles.input} />
      <TextInput placeholder="SpO₂" value={etat.spo2} onChangeText={(text) => updateField('spo2', text)} style={styles.input} />
      <TextInput placeholder="FR" value={etat.fr} onChangeText={(text) => updateField('fr', text)} style={styles.input} />
      <TextInput placeholder="Température" value={etat.temperature} onChangeText={(text) => updateField('temperature', text)} style={styles.input} />
      <TextInput placeholder="Conscience (AVPU)" value={etat.conscience} onChangeText={(text) => updateField('conscience', text)} style={styles.input} />
      <TextInput placeholder="Douleur (EVA)" keyboardType="numeric" value={etat.douleurEVA.toString()} onChangeText={(text) => updateField('douleurEVA', Number(text))} style={styles.input} />
      <TextInput placeholder="Traitements (liste courte)" value={etat.traitements.join(', ')} onChangeText={(text) => updateField('traitements', text.split(',').map(s => s.trim()).filter(Boolean))} style={styles.input} />
      <TextInput placeholder="Dispositifs" value={etat.dispositifs.join(', ')} onChangeText={(text) => updateField('dispositifs', text.split(',').map(s => s.trim()).filter(Boolean))} style={styles.input} />
      <Button title="Continuer vers suivi" onPress={handleSave} />
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
