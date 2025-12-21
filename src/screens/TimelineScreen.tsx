import React, { useEffect, useState } from 'react'
import { View, Text, TextInput, Button, StyleSheet, FlatList, Pressable } from 'react-native'
import { v4 as uuidv4 } from 'uuid'
import { appendTimelineEvent } from '../storage/localDatabase'
import { EVENEMENT_TYPES, type EvenementTimeline, type EvenementType, type Mission } from '../types/models'

interface Props {
  mission: Mission
  onNext: (events: EvenementTimeline[]) => void
  existingEvents?: EvenementTimeline[]
}

export const TimelineScreen: React.FC<Props> = ({ mission, onNext, existingEvents = [] }) => {
  const [evenements, setEvenements] = useState<EvenementTimeline[]>(existingEvents)
  const [type, setType] = useState<EvenementType>('surveillance')
  const [note, setNote] = useState('')
  const [constantes, setConstantes] = useState({
    ta: '120/70 mmHg',
    fc: '80 bpm',
    spo2: '98 %SpO₂',
    fr: '16 c/min',
    temperature: '37.0 °C'
  })

  useEffect(() => {
    if (existingEvents.length > 0) {
      setEvenements(existingEvents)
    }
  }, [existingEvents])

  const addEvent = async (): Promise<void> => {
    const event: EvenementTimeline = {
      id: uuidv4(),
      missionId: mission.id,
      type,
      note,
      constantes,
      horodatage: new Date().toISOString()
    }
    await appendTimelineEvent(event)
    setEvenements((prev) => [...prev, event])
    setNote('')
    setConstantes({ ta: '120/70 mmHg', fc: '80 bpm', spo2: '98 %SpO₂', fr: '16 c/min', temperature: '37.0 °C' })
  }

  const handleNext = (): void => {
    onNext(evenements)
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Suivi en mission</Text>
      <Text style={styles.label}>Type d’événement</Text>
      <View style={styles.optionsRow}>
        {EVENEMENT_TYPES.map(option => (
          <Pressable
            key={option}
            onPress={() => setType(option)}
            style={[styles.optionChip, type === option && styles.optionChipSelected]}
          >
            <Text style={type === option ? styles.optionChipSelectedText : styles.optionChipText}>{option}</Text>
          </Pressable>
        ))}
      </View>
      <TextInput placeholder="Note courte" value={note} onChangeText={setNote} style={styles.input} />
      <Text style={styles.label}>Constantes ponctuelles (optionnel) — unités : mmHg / bpm / c/min / %SpO₂</Text>
      <View style={styles.constantesRow}>
        <TextInput placeholder="TA" value={constantes.ta} onChangeText={(text) => setConstantes(prev => ({ ...prev, ta: text }))} style={styles.inputSmall} />
        <TextInput placeholder="FC" value={constantes.fc} onChangeText={(text) => setConstantes(prev => ({ ...prev, fc: text }))} style={styles.inputSmall} />
        <TextInput placeholder="SpO₂" value={constantes.spo2} onChangeText={(text) => setConstantes(prev => ({ ...prev, spo2: text }))} style={styles.inputSmall} />
        <TextInput placeholder="FR" value={constantes.fr} onChangeText={(text) => setConstantes(prev => ({ ...prev, fr: text }))} style={styles.inputSmall} />
        <TextInput placeholder="Temp" value={constantes.temperature} onChangeText={(text) => setConstantes(prev => ({ ...prev, temperature: text }))} style={styles.inputSmall} />
      </View>
      <Button title="Ajouter un événement" onPress={addEvent} />

      <FlatList
        data={evenements}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.eventRow}>
            <Text style={styles.eventText}>{item.horodatage} — {item.type}</Text>
            {item.note != null && item.note.trim() !== '' && <Text style={styles.eventNote}>Note: {item.note}</Text>}
            {item.constantes != null && (
              <Text style={styles.eventNote}>
                Constantes: {['ta', 'fc', 'spo2', 'fr', 'temperature']
                  .map(key => ({ key, value: (item.constantes as any)[key] }))
                  .filter(entry => entry.value)
                  .map(entry => `${entry.key.toUpperCase()}: ${entry.value}`)
                  .join(' • ')}
              </Text>
            )}
          </View>
        )}
      />

      <Button title="Passer à la fin de mission" onPress={handleNext} />
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
  inputSmall: {
    borderWidth: 1,
    borderColor: '#d0d7de',
    borderRadius: 4,
    padding: 8,
    marginBottom: 10,
    backgroundColor: '#fff',
    width: 70,
    marginRight: 6
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
  constantesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 6
  },
  eventRow: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb'
  },
  eventText: {
    fontWeight: '600'
  },
  eventNote: {
    color: '#6b7280'
  }
})
