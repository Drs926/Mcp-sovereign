import React, { useEffect, useState } from 'react'
import { SafeAreaView, StatusBar, Text } from 'react-native'
import { MissionCreationScreen } from './src/screens/MissionCreationScreen'
import { InitialStateScreen } from './src/screens/InitialStateScreen'
import { TimelineScreen } from './src/screens/TimelineScreen'
import { FinalizationScreen } from './src/screens/FinalizationScreen'
import { ReportScreen } from './src/screens/ReportScreen'
import { type Mission, type EtatClinique, type EvenementTimeline, type EtatFinal } from './src/types/models'
import { initializeSchema, loadMostRecentMissionBundle, reopenMission } from './src/storage/localDatabase'

export default function App (): JSX.Element {
  const [mission, setMission] = useState<Mission | null>(null)
  const [etatInitial, setEtatInitial] = useState<EtatClinique | null>(null)
  const [timeline, setTimeline] = useState<EvenementTimeline[]>([])
  const [timelineDone, setTimelineDone] = useState<boolean>(false)
  const [etatFinal, setEtatFinal] = useState<EtatFinal | null>(null)
  const [loading, setLoading] = useState<boolean>(true)

  useEffect(() => {
    const bootstrap = async (): Promise<void> => {
      await initializeSchema()
      const restored = await loadMostRecentMissionBundle()
      if (restored != null) {
        setMission(restored.mission)
        setEtatInitial(restored.etatInitial)
        setTimeline(restored.timeline)
        setTimelineDone(restored.etatFinal != null)
        setEtatFinal(restored.etatFinal)
      }
      setLoading(false)
    }

    void bootstrap()
  }, [])

  const handleReopen = async (code: string): Promise<boolean> => {
    if (mission == null) return false
    const reopenedAt = await reopenMission(mission.id, code)
    if (reopenedAt == null) return false
    setMission({ ...mission, status: 'draft', reopenedAt, finalizedAt: null })
    setEtatFinal(null)
    setTimelineDone(true)
    return true
  }

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <StatusBar barStyle="dark-content" />
      {loading && <Text style={{ padding: 16 }}>Chargement des données locales…</Text>}
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
