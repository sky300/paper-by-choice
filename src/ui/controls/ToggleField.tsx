/**
 * Controlled checkbox field with its label on the right.
 */
import type { JSX } from 'react'
import { useId } from 'react'

export interface ToggleFieldProps {
  label: string
  checked: boolean
  hint?: string
  disabled?: boolean
  onChange: (checked: boolean) => void
}

/** Renders a checkbox whose label follows the input. */
export function ToggleField(props: ToggleFieldProps): JSX.Element {
  const { label, checked, hint, disabled, onChange } = props
  const id = useId()
  const hintId = `${id}-hint`
  return (
    <div className="ctl-field ctl-toggle-field">
      <label className="ctl-toggle-row" htmlFor={id}>
        <span className="ctl-toggle-label">{label}</span>
        <input
          className="ctl-checkbox"
          id={id}
          type="checkbox"
          checked={checked}
          disabled={disabled}
          aria-describedby={hint ? hintId : undefined}
          onChange={(event) => onChange(event.target.checked)}
        />
        <span className="ctl-switch" aria-hidden="true" />
      </label>
      {hint ? (
        <p className="ctl-hint" id={hintId}>
          {hint}
        </p>
      ) : null}
    </div>
  )
}
