import React, { useState } from 'react'
import { View, Text, TextInput, Button, StyleSheet, Pressable } from 'react-native'
import { saveEtatInitial } from '../storage/localDatabase'
import { CONSCIENCE_OPTIONS, type ConscienceLevel, type EtatClinique, type Mission } from '../types/models'

interface Props {
  mission: Mission
  onNext: (etat: EtatClinique) => void
}

export const InitialStateScreen: React.FC<Props> = ({ mission, onNext }) => {
  const [etat, setEtat] = useState<EtatClinique>({
    ta: '120/70 mmHg',
    fc: '80 bpm',
    spo2: '98 %SpO₂',
    fr: '16 c/min',
    temperature: '37.0 °C',
    conscience: 'Alerte',
    douleurEVA: 0,
    traitements: [],
    dispositifs: [],
    horodatage: new Date().toISOString()
  })
  const [error, setError] = useState<string>('')
  const [missingFields, setMissingFields] = useState<string[]>([])

  const updateField = (field: keyof EtatClinique, value: string | number | string[]): void => {
    setEtat((prev) => ({ ...prev, [field]: value }))
  }

  const handleSave = async (): Promise<void> => {
    const missing: string[] = []
    if ([etat.ta, etat.fc, etat.spo2, etat.fr, etat.temperature].some(value => value.trim() === '')) {
      missing.push('Constantes vitales (TA, FC, SpO₂, FR, Température)')
    }

    if (missing.length > 0) {
      setMissingFields(missing)
      setError('Complétez les constantes obligatoires avant de poursuivre.')
      return
    }

    setMissingFields([])
    setError('')
    await saveEtatInitial(mission.id, etat)
    onNext(etat)
  }

  const renderConscienceOptions = (): JSX.Element => (
    <View style={styles.optionsRow}>
      {CONSCIENCE_OPTIONS.map((option: ConscienceLevel) => (
        <Pressable
          key={option}
          onPress={() => updateField('conscience', option)}
          style={[styles.optionChip, etat.conscience === option && styles.optionChipSelected]}
        >
          <Text style={etat.conscience === option ? styles.optionChipSelectedText : styles.optionChipText}>{option}</Text>
        </Pressable>
      ))}
    </View>
  )

  return (
    <View style={styles.container}>
      <Text style={styles.title}>État initial patient (champs obligatoires *)</Text>
      <TextInput placeholder="TA (mmHg)*" value={etat.ta} onChangeText={(text) => updateField('ta', text)} style={styles.input} />
      <TextInput placeholder="FC (bpm)*" value={etat.fc} onChangeText={(text) => updateField('fc', text)} style={styles.input} />
      <TextInput placeholder="SpO₂ (%)*" value={etat.spo2} onChangeText={(text) => updateField('spo2', text)} style={styles.input} />
      <TextInput placeholder="FR (c/min)*" value={etat.fr} onChangeText={(text) => updateField('fr', text)} style={styles.input} />
      <TextInput placeholder="Température (°C)*" value={etat.temperature} onChangeText={(text) => updateField('temperature', text)} style={styles.input} />
      <Text style={styles.label}>Conscience (AVPU)</Text>
      {renderConscienceOptions()}
      <TextInput placeholder="Douleur (EVA)" keyboardType="numeric" value={etat.douleurEVA.toString()} onChangeText={(text) => updateField('douleurEVA', Number(text))} style={styles.input} />
      <TextInput placeholder="Traitements (liste courte)" value={etat.traitements.join(', ')} onChangeText={(text) => updateField('traitements', text.split(',').map(s => s.trim()).filter(Boolean))} style={styles.input} />
      <TextInput placeholder="Dispositifs" value={etat.dispositifs.join(', ')} onChangeText={(text) => updateField('dispositifs', text.split(',').map(s => s.trim()).filter(Boolean))} style={styles.input} />
      {missingFields.length > 0 && (
        <View style={styles.validationBox}>
          <Text style={styles.validationTitle}>À renseigner :</Text>
          {missingFields.map(item => (
            <Text key={item} style={styles.validationItem}>• {item}</Text>
          ))}
        </View>
      )}
      {error !== '' && <Text style={styles.error}>{error}</Text>}
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
  },
  validationBox: {
    borderWidth: 1,
    borderColor: '#f97316',
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#fff7ed',
    marginBottom: 12
  },
  validationTitle: {
    color: '#c2410c',
    fontWeight: '700',
    marginBottom: 4
  },
  validationItem: {
    color: '#7c2d12'
  }
})
