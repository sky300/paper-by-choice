/**
 * 组合编辑器、设置和预览界面。
 * Assembles the editor, settings, and preview.
 */
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
