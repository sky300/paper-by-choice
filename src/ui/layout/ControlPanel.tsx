/** Left-hand control panel: the sections that configure one sheet of paper. */
import type { JSX, Ref } from 'react'
import { useLocale } from '../i18n/LocaleProvider'
import { PaperTypeSection } from '../sections/PaperTypeSection'
import { PageSizeSection } from '../sections/PageSizeSection'
import { ThemeSection } from '../sections/ThemeSection'
import { LineSection } from '../sections/LineSection'
import { OptionsSection } from '../sections/OptionsSection'
import { MarginsSection } from '../sections/MarginsSection'
import { BackgroundSection } from '../sections/BackgroundSection'
import { DecorationSection } from '../sections/DecorationSection'
import { WatermarkSection } from '../sections/WatermarkSection'
import { PagesSection } from '../sections/PagesSection'
import { TransferSection } from '../sections/TransferSection'

export interface ControlPanelProps {
  open?: boolean
  onClose?: () => void
  closeRef?: Ref<HTMLButtonElement>
}

export function ControlPanel(props: ControlPanelProps): JSX.Element {
  const { t } = useLocale()
  return (
    <aside
      className="control-panel"
      id="paper-settings"
      data-open={props.open ?? true}
      aria-label={t('common.settings')}
    >
      <div className="control-panel-head">
        <h2 className="control-panel-title">{t('common.settings')}</h2>
        {props.onClose ? (
          <button
            type="button"
            className="btn btn-quiet"
            onClick={props.onClose}
            ref={props.closeRef}
            aria-label={t('common.close')}
          >
            ×
          </button>
        ) : null}
      </div>
      <div className="control-panel-body">
        <PaperTypeSection />
        <PageSizeSection />
        <ThemeSection />
        <LineSection />
        <OptionsSection />
        <MarginsSection />
        <BackgroundSection />
        <DecorationSection />
        <WatermarkSection />
        <PagesSection />
        <TransferSection />
      </div>
    </aside>
  )
}
