/**
 * Controlled numeric input with a typing-friendly draft.
 *
 * Intermediate text is kept locally so out-of-range or blank states never
 * reach the store; a commit happens immediately for valid in-range text and
 * on blur / Enter the value is clamped into the allowed range.
 */
import { useId, useState } from 'react'
import type { JSX } from 'react'
import { clamp } from '../../core/scene/geometry'

export interface NumberFieldProps {
  label: string
  value: number
  min: number
  max: number
  step: number
  /** Unit shown to the right of the input. */
  unit?: string
  hint?: string
  disabled?: boolean
  /** Commits a number already inside [min, max]. */
  onCommit: (value: number) => void
}

/** Formats a number for display without redundant trailing zeros. */
function format(value: number): string {
  return String(Number(value.toFixed(10)))
}

/** Parses draft text into a finite number, or `null` for blank / invalid text. */
function parse(text: string): number | null {
  if (text.trim() === '') return null
  const number = Number(text)
  return Number.isFinite(number) ? number : null
}

/** Renders a numeric field that commits only valid, range-checked values. */
export function NumberField(props: NumberFieldProps): JSX.Element {
  const { label, value, min, max, step, unit, hint, disabled, onCommit } = props
  const id = useId()
  const hintId = `${id}-hint`
  const [edit, setEdit] = useState<{ value: number; draft: string | null }>({
    value,
    draft: null,
  })

  // A new external value supersedes whatever the user was typing.
  const draft = edit.value === value ? edit.draft : null

  function setDraft(text: string | null) {
    setEdit({ value, draft: text })
  }

  function commitDraft(text: string, clampValue: boolean) {
    const parsed = parse(text)
    if (parsed === null) {
      setDraft(null)
      return
    }
    const next = clampValue ? clamp(parsed, min, max) : parsed
    if (clampValue || (next >= min && next <= max)) onCommit(next)
    setDraft(null)
  }

  const display = draft ?? format(value)

  return (
    <div className="ctl-field">
      <label className="ctl-label" htmlFor={id}>
        {label}
      </label>
      <div className="ctl-control">
        <input
          className="ctl-input"
          id={id}
          type="number"
          inputMode="decimal"
          min={min}
          max={max}
          step={step}
          value={display}
          disabled={disabled}
          aria-describedby={hint ? hintId : undefined}
          onChange={(event) => {
            const text = event.target.value
            setDraft(text)
            const parsed = parse(text)
            if (parsed !== null && parsed >= min && parsed <= max) {
              onCommit(parsed)
            }
          }}
          onBlur={(event) => commitDraft(event.target.value, true)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault()
              commitDraft(event.currentTarget.value, true)
            }
          }}
        />
        {unit ? <span className="ctl-unit">{unit}</span> : null}
      </div>
      {hint ? (
        <p className="ctl-hint" id={hintId}>
          {hint}
        </p>
      ) : null}
    </div>
  )
}
