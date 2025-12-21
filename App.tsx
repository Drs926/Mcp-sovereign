import React, { useEffect, useState } from 'react'
import { SafeAreaView, StatusBar, Text, View } from 'react-native'
import { MissionCreationScreen } from './src/screens/MissionCreationScreen'
import { InitialStateScreen } from './src/screens/InitialStateScreen'
import { TimelineScreen } from './src/screens/TimelineScreen'
import { FinalizationScreen } from './src/screens/FinalizationScreen'
import { ReportScreen } from './src/screens/ReportScreen'
import { type Mission, type EtatClinique, type EvenementTimeline, type EtatFinal } from './src/types/models'
import { initializeSchema, loadMostRecentMissionBundle, reopenMission, type ReopenResult } from './src/storage/localDatabase'

export default function App (): JSX.Element {
  const [mission, setMission] = useState<Mission | null>(null)
  const [etatInitial, setEtatInitial] = useState<EtatClinique | null>(null)
  const [timeline, setTimeline] = useState<EvenementTimeline[]>([])
  const [timelineDone, setTimelineDone] = useState<boolean>(false)
  const [etatFinal, setEtatFinal] = useState<EtatFinal | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [storageError, setStorageError] = useState<string | null>(null)

  useEffect(() => {
    const bootstrap = async (): Promise<void> => {
      try {
        await initializeSchema()
        const restored = await loadMostRecentMissionBundle()
        if (restored != null) {
          setMission(restored.mission)
          setEtatInitial(restored.etatInitial)
          setTimeline(restored.timeline)
          setTimelineDone(restored.etatFinal != null)
          setEtatFinal(restored.etatFinal)
        }
      } catch (error) {
        console.error('bootstrap', error)
        setStorageError('Impossible de lire les données locales. Redémarrez l’application ou relancez une mission neuve.')
      } finally {
        setLoading(false)
      }
    }

    void bootstrap()
  }, [])

  const handleReopen = async (code: string): Promise<ReopenResult> => {
    if (mission == null) return { success: false, attemptsLeft: 0, wiped: false }
    const result = await reopenMission(mission.id, code)
    if (result.success && result.reopenedAt != null) {
      setMission({ ...mission, status: 'draft', reopenedAt: result.reopenedAt, finalizedAt: null })
      setEtatFinal(null)
      setTimelineDone(true)
    }

    if (result.wiped) {
      setMission(null)
      setEtatInitial(null)
      setTimeline([])
      setTimelineDone(false)
      setEtatFinal(null)
    }

    return result
  }

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <StatusBar barStyle="dark-content" />
      {loading && <Text style={{ padding: 16 }}>Chargement des données locales…</Text>}
      {storageError != null && (
        <View style={{ padding: 16, backgroundColor: '#fef2f2', margin: 8, borderRadius: 8 }}>
          <Text style={{ color: '#991b1b', fontWeight: '600' }}>{storageError}</Text>
          <Text style={{ color: '#991b1b' }}>Les erreurs sont journalisées localement (SQLite/SecureStore).</Text>
        </View>
      )}
      {!loading && !mission && <MissionCreationScreen onNext={setMission} />}
      {!loading && mission != null && etatInitial == null && <InitialStateScreen mission={mission} onNext={setEtatInitial} />}
      {!loading && mission != null && etatInitial != null && !timelineDone && (
        <TimelineScreen
          mission={mission}
          existingEvents={timeline}
          onNext={(events) => {
            setTimeline(events)
            setTimelineDone(true)
          }}
        />
      )}
      {!loading && mission != null && etatInitial != null && timelineDone && etatFinal == null && (
        <FinalizationScreen
          mission={mission}
          etatInitial={etatInitial}
          onNext={(finalState, finalizedAt) => {
            setEtatFinal(finalState)
            setMission({ ...mission, status: 'finalized', finalizedAt })
          }}
        />
      )}
      {!loading && mission != null && etatInitial != null && etatFinal != null && (
        <ReportScreen mission={mission} etatInitial={etatInitial} timeline={timeline} etatFinal={etatFinal} onReopen={handleReopen} />
      )}
    </SafeAreaView>
  )
}
