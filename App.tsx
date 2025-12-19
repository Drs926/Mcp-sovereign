import React, { useState } from 'react'
import { SafeAreaView, StatusBar } from 'react-native'
import { MissionCreationScreen } from './src/screens/MissionCreationScreen'
import { InitialStateScreen } from './src/screens/InitialStateScreen'
import { TimelineScreen } from './src/screens/TimelineScreen'
import { FinalizationScreen } from './src/screens/FinalizationScreen'
import { ReportScreen } from './src/screens/ReportScreen'
import { type Mission, type EtatClinique, type EvenementTimeline, type EtatFinal } from './src/types/models'

export default function App (): JSX.Element {
  const [mission, setMission] = useState<Mission | null>(null)
  const [etatInitial, setEtatInitial] = useState<EtatClinique | null>(null)
  const [timeline, setTimeline] = useState<EvenementTimeline[]>([])
  const [timelineDone, setTimelineDone] = useState<boolean>(false)
  const [etatFinal, setEtatFinal] = useState<EtatFinal | null>(null)

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <StatusBar barStyle="dark-content" />
      {!mission && <MissionCreationScreen onNext={setMission} />}
      {mission != null && etatInitial == null && <InitialStateScreen mission={mission} onNext={setEtatInitial} />}
      {mission != null && etatInitial != null && !timelineDone && (
        <TimelineScreen
          mission={mission}
          onNext={(events) => {
            setTimeline(events)
            setTimelineDone(true)
          }}
        />
      )}
      {mission != null && etatInitial != null && timelineDone && etatFinal == null && (
        <FinalizationScreen mission={mission} onNext={setEtatFinal} />
      )}
      {mission != null && etatInitial != null && etatFinal != null && (
        <ReportScreen mission={mission} etatInitial={etatInitial} timeline={timeline} etatFinal={etatFinal} />
      )}
    </SafeAreaView>
  )
}
