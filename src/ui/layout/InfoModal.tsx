/** Informational modal: "Guide" and "About me", in the current language. */
import { useEffect, useRef, type JSX } from 'react'
import { useLocale } from '../i18n/LocaleProvider'

export type InfoPage = 'guide' | 'about'

export interface InfoModalProps {
  page: InfoPage
  onClose: () => void
}

/** A shared dialog shell: backdrop click, Escape and focus handling. */
export function InfoModal(props: InfoModalProps): JSX.Element {
  const { t } = useLocale()
  const dialogRef = useRef<HTMLDivElement>(null)
  const previous = useRef<HTMLElement | null>(null)

  useEffect(() => {
    previous.current = document.activeElement as HTMLElement | null
    dialogRef.current?.focus()
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') props.onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('keydown', onKey)
      previous.current?.focus()
    }
  }, [props.onClose])

  return (
    <div className="gallery-backdrop" onClick={props.onClose}>
      <div
        className="info-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="info-title"
        tabIndex={-1}
        ref={dialogRef}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="info-modal-head">
          <h2 id="info-title">
            {t(
              props.page === 'guide' ? 'info.guide.title' : 'info.about.title',
            )}
          </h2>
          <button
            type="button"
            className="btn btn-quiet"
            onClick={props.onClose}
          >
            {t('common.close')}
          </button>
        </div>
        <div className="info-modal-body">
          {props.page === 'guide' ? <Guide /> : <About />}
        </div>
      </div>
    </div>
  )
}

function Guide(): JSX.Element {
  const { t } = useLocale()
  const steps = ['choose', 'adjust', 'export', 'print', 'share'] as const
  return (
    <>
      <p className="info-lead">{t('info.guide.lead')}</p>
      <ol className="info-steps">
        {steps.map((step, i) => (
          <li key={step}>
            <strong>{t(`info.guide.step${i + 1}.title`)}</strong>
            <p>{t(`info.guide.step${i + 1}.body`)}</p>
          </li>
        ))}
      </ol>
      <h3>{t('info.guide.tipsTitle')}</h3>
      <ul className="info-list">
        <li>{t('info.guide.tip1')}</li>
        <li>{t('info.guide.tip2')}</li>
        <li>{t('info.guide.tip3')}</li>
        <li>{t('info.guide.tip4')}</li>
      </ul>
    </>
  )
}

function About(): JSX.Element {
  const { t } = useLocale()
  return (
    <>
      <p className="info-lead">{t('info.about.lead')}</p>
      <p>{t('info.about.p1')}</p>
      <p>{t('info.about.p2')}</p>
      <p>{t('info.about.p3')}</p>
      <p>{t('info.about.p4')}</p>
      <h3>{t('info.about.featuresTitle')}</h3>
      <ul className="info-list">
        <li>{t('info.about.f1')}</li>
        <li>{t('info.about.f2')}</li>
        <li>{t('info.about.f3')}</li>
        <li>{t('info.about.f4')}</li>
      </ul>
      <p className="info-sign">{t('info.about.sign')}</p>
    </>
  )
}
