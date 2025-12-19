import React, { useState } from 'react'
import { View, Text, TextInput, Button, StyleSheet } from 'react-native'
import { saveEtatFinal } from '../storage/localDatabase'
import { type EtatClinique, type EtatFinal, type Mission } from '../types/models'

interface Props {
  mission: Mission
  onNext: (etatFinal: EtatFinal) => void
}

export const FinalizationScreen: React.FC<Props> = ({ mission, onNext }) => {
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

  const [typeRemise, setTypeRemise] = useState<'établissement' | 'ambulance' | 'tiers'>('établissement')
  const [heureRemise, setHeureRemise] = useState<string>('')
  const [signature, setSignature] = useState<string>('')

  const updateEtatPatient = (field: keyof EtatClinique, value: string | number): void => {
    setEtatPatient((prev) => ({ ...prev, [field]: value }))
  }

  const handleSave = (): void => {
    const etatFinal: EtatFinal = {
      missionId: mission.id,
      etatPatient,
      typeRemise,
      heureRemise,
      signatureAccompagnant: signature
    }
    saveEtatFinal(etatFinal)
    onNext(etatFinal)
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Fin de mission</Text>
      <TextInput placeholder="Heure de remise" value={heureRemise} onChangeText={setHeureRemise} style={styles.input} />
      <TextInput placeholder="Type de remise (établissement/ambulance/tiers)" value={typeRemise} onChangeText={(text) => setTypeRemise(text as typeof typeRemise)} style={styles.input} />
      <TextInput placeholder="Signature numérique" value={signature} onChangeText={setSignature} style={styles.input} />

      <Text style={styles.title}>État final patient</Text>
      <TextInput placeholder="TA" value={etatPatient.ta} onChangeText={(text) => updateEtatPatient('ta', text)} style={styles.input} />
      <TextInput placeholder="FC" value={etatPatient.fc} onChangeText={(text) => updateEtatPatient('fc', text)} style={styles.input} />
      <TextInput placeholder="SpO₂" value={etatPatient.spo2} onChangeText={(text) => updateEtatPatient('spo2', text)} style={styles.input} />
      <TextInput placeholder="FR" value={etatPatient.fr} onChangeText={(text) => updateEtatPatient('fr', text)} style={styles.input} />
      <TextInput placeholder="Température" value={etatPatient.temperature} onChangeText={(text) => updateEtatPatient('temperature', text)} style={styles.input} />
      <TextInput placeholder="Conscience" value={etatPatient.conscience} onChangeText={(text) => updateEtatPatient('conscience', text)} style={styles.input} />
      <TextInput placeholder="Douleur (EVA)" keyboardType="numeric" value={etatPatient.douleurEVA.toString()} onChangeText={(text) => updateEtatPatient('douleurEVA', Number(text))} style={styles.input} />
      <TextInput placeholder="Traitements" value={etatPatient.traitements.join(', ')} onChangeText={(text) => updateEtatPatient('traitements', text.split(',').map(s => s.trim()).filter(Boolean))} style={styles.input} />
      <TextInput placeholder="Dispositifs" value={etatPatient.dispositifs.join(', ')} onChangeText={(text) => updateEtatPatient('dispositifs', text.split(',').map(s => s.trim()).filter(Boolean))} style={styles.input} />

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
  input: {
    borderWidth: 1,
    borderColor: '#d0d7de',
    borderRadius: 4,
    padding: 10,
    marginBottom: 10,
    backgroundColor: '#fff'
  }
})
