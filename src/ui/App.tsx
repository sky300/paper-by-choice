import { LocaleProvider } from './i18n/LocaleProvider'
import { SettingsProvider } from './store/SettingsProvider'
import { Workspace } from './layout/Workspace'
import type { JSX } from 'react'

export default function App(): JSX.Element {
  return (
    <LocaleProvider>
      <SettingsProvider>
        <Workspace />
      </SettingsProvider>
    </LocaleProvider>
  )
}
