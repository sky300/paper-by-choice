/**
 * Controlled select field with pre-translated choices.
 */
import { useId } from 'react'
import type { JSX } from 'react'

/** One option of a `SelectField`. */
export interface SelectChoice {
  value: string
  label: string
}

export interface SelectFieldProps {
  label: string
  value: string
  choices: readonly SelectChoice[]
  hint?: string
  disabled?: boolean
  onChange: (value: string) => void
}

/** Renders a labelled dropdown of choices. */
export function SelectField(props: SelectFieldProps): JSX.Element {
  const { label, value, choices, hint, disabled, onChange } = props
  const id = useId()
  const hintId = `${id}-hint`
  return (
    <div className="ctl-field">
      <label className="ctl-label" htmlFor={id}>
        {label}
      </label>
      <div className="ctl-control">
        <select
          className="ctl-select"
          id={id}
          value={value}
          disabled={disabled}
          aria-describedby={hint ? hintId : undefined}
          onChange={(event) => onChange(event.target.value)}
        >
          {choices.map((choice) => (
            <option key={choice.value} value={choice.value}>
              {choice.label}
            </option>
          ))}
        </select>
      </div>
      {hint ? (
        <p className="ctl-hint" id={hintId}>
          {hint}
        </p>
      ) : null}
    </div>
  )
}
