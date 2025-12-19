import React, { useState } from 'react'
import { View, Text, TextInput, Button, StyleSheet, FlatList } from 'react-native'
import { v4 as uuidv4 } from 'uuid'
import { appendTimelineEvent } from '../storage/localDatabase'
import { type EvenementTimeline, type EvenementType, type Mission } from '../types/models'

interface Props {
  mission: Mission
  onNext: (events: EvenementTimeline[]) => void
}

export const TimelineScreen: React.FC<Props> = ({ mission, onNext }) => {
  const [evenements, setEvenements] = useState<EvenementTimeline[]>([])
  const [type, setType] = useState<EvenementType>('surveillance')
  const [note, setNote] = useState('')

  const addEvent = (): void => {
    const event: EvenementTimeline = {
      id: uuidv4(),
      missionId: mission.id,
      type,
      note,
      horodatage: new Date().toISOString()
    }
    appendTimelineEvent(event)
    setEvenements((prev) => [...prev, event])
    setNote('')
  }

  const handleNext = (): void => {
    onNext(evenements)
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Suivi en mission</Text>
      <TextInput placeholder="Type (surveillance/acte_medical/incident)" value={type} onChangeText={(text) => setType(text as EvenementType)} style={styles.input} />
      <TextInput placeholder="Note courte" value={note} onChangeText={setNote} style={styles.input} />
      <Button title="Ajouter un événement" onPress={addEvent} />

      <FlatList
        data={evenements}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.eventRow}>
            <Text style={styles.eventText}>{item.horodatage} — {item.type}</Text>
            <Text style={styles.eventNote}>{item.note}</Text>
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
  input: {
    borderWidth: 1,
    borderColor: '#d0d7de',
    borderRadius: 4,
    padding: 10,
    marginBottom: 10,
    backgroundColor: '#fff'
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
