/**
 * 提供滑动范围控件。
 * Provides a range slider.
 */
/**
 * Controlled range slider with a readable current-value output.
 *
 * A `%` unit displays 0–1 values as whole percentages; otherwise the value
 * is shown with the precision implied by `step` unless overridden.
 */
import { useId } from 'react'
import type { JSX } from 'react'

export interface SliderFieldProps {
  label: string
  value: number
  min: number
  max: number
  step: number
  /** Unit or suffix beside the value, e.g. `mm` or `%`. */
  unit?: string
  /** Decimal places; by default inferred from `step`. */
  decimals?: number
  hint?: string
  disabled?: boolean
  /** Fires continuously while dragging. */
  onChange: (value: number) => void
}

/** Decimal places needed to represent `step` exactly (0 for integers). */
function decimalsFor(step: number): number {
  const text = String(step)
  const dot = text.indexOf('.')
  return dot === -1 ? 0 : text.length - dot - 1
}

/** Formats the slider value for the `<output>` element. */
function displayValue(
  value: number,
  unit: string | undefined,
  decimals: number | undefined,
  step: number,
): string {
  if (unit === '%') return `${Math.round(value * 100)}%`
  const digits = decimals ?? decimalsFor(step)
  return `${value.toFixed(digits)}${unit ?? ''}`
}

/** Renders a range input plus its formatted value. */
export function SliderField(props: SliderFieldProps): JSX.Element {
  const {
    label,
    value,
    min,
    max,
    step,
    unit,
    decimals,
    hint,
    disabled,
    onChange,
  } = props
  const id = useId()
  const hintId = `${id}-hint`
  return (
    <div className="ctl-field">
      <label className="ctl-label" htmlFor={id}>
        {label}
      </label>
      <div className="ctl-control">
        <input
          className="ctl-slider"
          id={id}
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          disabled={disabled}
          aria-describedby={hint ? hintId : undefined}
          onChange={(event) => onChange(Number(event.target.value))}
        />
        <output className="ctl-output" htmlFor={id}>
          {displayValue(value, unit, decimals, step)}
        </output>
      </div>
      {hint ? (
        <p className="ctl-hint" id={hintId}>
          {hint}
        </p>
      ) : null}
    </div>
  )
}
