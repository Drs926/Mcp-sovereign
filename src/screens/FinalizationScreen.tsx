import React, { useState } from 'react'
import { View, Text, TextInput, Button, StyleSheet, Pressable } from 'react-native'
import { markMissionFinalized, saveEtatFinal } from '../storage/localDatabase'
import {
  CONSCIENCE_OPTIONS,
  TYPE_REMISE_OPTIONS,
  type ConscienceLevel,
  type EtatClinique,
  type EtatFinal,
  type Mission,
  type TypeRemise
} from '../types/models'

interface Props {
  mission: Mission
  etatInitial: EtatClinique
  onNext: (etatFinal: EtatFinal, finalizedAt: string) => void
}

export const FinalizationScreen: React.FC<Props> = ({ mission, etatInitial, onNext }) => {
  const [etatPatient, setEtatPatient] = useState<EtatClinique>({
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

  const [typeRemise, setTypeRemise] = useState<TypeRemise>('établissement')
  const [heureRemise, setHeureRemise] = useState<string>('')
  const [signature, setSignature] = useState<string>('')
  const [reopenCode, setReopenCode] = useState<string>('')
  const [error, setError] = useState<string>('')
  const [missingFields, setMissingFields] = useState<string[]>([])

  const updateEtatPatient = (field: keyof EtatClinique, value: string | number | string[]): void => {
    setEtatPatient((prev) => ({ ...prev, [field]: value }))
  }

  const handleSave = async (): Promise<void> => {
    const missing: string[] = []
    if (heureRemise.trim() === '') missing.push('Heure de remise')
    if (signature.trim() === '') missing.push('Signature accompagnant')
    if (reopenCode.trim().length < 4) missing.push('Code de réouverture (≥4 caractères)')
    if (etatPatient.ta.trim() === '') missing.push('TA finale')
    if (etatPatient.fc.trim() === '') missing.push('FC finale')
    if (etatPatient.spo2.trim() === '') missing.push('SpO₂ finale')
    if (etatPatient.fr.trim() === '') missing.push('FR finale')
    if (etatPatient.temperature.trim() === '') missing.push('Température finale')

    if (missing.length > 0) {
      setMissingFields(missing)
      setError('Champs obligatoires manquants avant finalisation.')
      return
    }
    setMissingFields([])

    const etatFinal: EtatFinal = {
      missionId: mission.id,
      etatPatient,
      typeRemise,
      heureRemise,
      signatureAccompagnant: signature
    }
    await saveEtatFinal(etatFinal)
    const finalizedAt = await markMissionFinalized(mission.id, reopenCode)
    setError('')
    onNext(etatFinal, finalizedAt)
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

  const renderComparatif = (): JSX.Element => (
    <View style={styles.comparatifBox}>
      <Text style={styles.sectionTitle}>Comparatif initial / final</Text>
      {['ta', 'fc', 'spo2', 'fr', 'temperature', 'conscience', 'douleurEVA'].map((key) => {
        const initialValue = (etatInitial as any)[key]
        const finalValue = (etatPatient as any)[key]
        return (
          <Text key={key} style={styles.comparatifLine}>
            {key.toUpperCase()}: {initialValue ?? '—'} → {finalValue ?? '—'}
          </Text>
        )
      })}
    </View>
  )

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Fin de mission</Text>
      <TextInput placeholder="Heure de remise (obligatoire)" value={heureRemise} onChangeText={setHeureRemise} style={styles.input} />
      <Text style={styles.label}>Type de remise</Text>
      {renderOptions<TypeRemise>(TYPE_REMISE_OPTIONS, typeRemise, (value) => setTypeRemise(value))}
      <TextInput placeholder="Signature numérique (obligatoire)" value={signature} onChangeText={setSignature} style={styles.input} />
      <TextInput placeholder="Code de réouverture (4 caractères minimum)" secureTextEntry value={reopenCode} onChangeText={setReopenCode} style={styles.input} />

      <Text style={styles.title}>État final patient</Text>
      <TextInput placeholder="TA (mmHg)" value={etatPatient.ta} onChangeText={(text) => updateEtatPatient('ta', text)} style={styles.input} />
      <TextInput placeholder="FC (bpm)" value={etatPatient.fc} onChangeText={(text) => updateEtatPatient('fc', text)} style={styles.input} />
      <TextInput placeholder="SpO₂ (%)" value={etatPatient.spo2} onChangeText={(text) => updateEtatPatient('spo2', text)} style={styles.input} />
      <TextInput placeholder="FR (c/min)" value={etatPatient.fr} onChangeText={(text) => updateEtatPatient('fr', text)} style={styles.input} />
      <TextInput placeholder="Température (°C)" value={etatPatient.temperature} onChangeText={(text) => updateEtatPatient('temperature', text)} style={styles.input} />
      <Text style={styles.label}>Conscience</Text>
      {renderOptions<ConscienceLevel>(CONSCIENCE_OPTIONS, etatPatient.conscience, (value) => updateEtatPatient('conscience', value))}
      <TextInput placeholder="Douleur (EVA)" keyboardType="numeric" value={etatPatient.douleurEVA.toString()} onChangeText={(text) => updateEtatPatient('douleurEVA', Number(text))} style={styles.input} />
      <TextInput placeholder="Traitements" value={etatPatient.traitements.join(', ')} onChangeText={(text) => updateEtatPatient('traitements', text.split(',').map(s => s.trim()).filter(Boolean))} style={styles.input} />
      <TextInput placeholder="Dispositifs" value={etatPatient.dispositifs.join(', ')} onChangeText={(text) => updateEtatPatient('dispositifs', text.split(',').map(s => s.trim()).filter(Boolean))} style={styles.input} />

      {renderComparatif()}
      {missingFields.length > 0 && (
        <View style={styles.validationBox}>
          <Text style={styles.validationTitle}>À compléter avant validation :</Text>
          {missingFields.map(item => (
            <Text key={item} style={styles.validationItem}>• {item}</Text>
          ))}
        </View>
      )}
      {error !== '' && <Text style={styles.error}>{error}</Text>}
      <Button title="Valider la mission" onPress={handleSave} />
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
  sectionTitle: {
    fontWeight: '700',
    marginBottom: 6
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
  comparatifBox: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#f8fafc',
    marginBottom: 12
  },
  comparatifLine: {
    marginBottom: 4
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
