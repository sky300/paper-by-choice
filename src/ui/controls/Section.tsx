/**
 * Collapsible control-panel section built on native `<details>`.
 *
 * Native disclosure gives keyboard and screen-reader support without state;
 * action buttons stop propagation and prevent the summary's default toggle.
 */
import type { JSX, ReactNode } from 'react'

export interface SectionProps {
  /** Stable identifier used to generate the element id. */
  id: string
  title: string
  /** Extra content on the right of the summary, e.g. buttons. */
  actions?: ReactNode
  /** Whether the section starts expanded; defaults to `true`. */
  defaultOpen?: boolean
  children: ReactNode
}

/** Renders a titled, collapsible section with an optional actions area. */
export function Section(props: SectionProps): JSX.Element {
  const open = props.defaultOpen ?? true
  return (
    <details className="ctl-section" id={props.id} open={open}>
      <summary className="ctl-section-summary">
        <span className="ctl-section-title">{props.title}</span>
        <span
          className="ctl-section-actions"
          onClick={(event) => {
            event.preventDefault()
            event.stopPropagation()
          }}
        >
          {props.actions}
        </span>
      </summary>
      <div className="ctl-section-body">{props.children}</div>
    </details>
  )
}
