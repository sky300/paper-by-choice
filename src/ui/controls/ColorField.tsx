/**
 * Controlled colour field: a native picker, hex text and optional swatches.
 *
 * The picker falls back to `#000000` for an invalid hex value so the DOM
 * never holds an unusable colour, while the text still shows the raw value.
 */
import { useId } from 'react'
import type { JSX } from 'react'

/** A preset colour button. */
export interface ColorSwatch {
  label: string
  value: string
}

export interface ColorFieldProps {
  label: string
  value: string
  /** Preset colour buttons; omitted means none are rendered. */
  swatches?: readonly ColorSwatch[]
  hint?: string
  disabled?: boolean
  /** Fires continuously while the picker is dragged. */
  onChange: (color: string) => void
}

const HEX = /^#[0-9a-f]{6}$/i

/** Renders a colour picker with a hex field and optional swatch buttons. */
export function ColorField(props: ColorFieldProps): JSX.Element {
  const { label, value, swatches, hint, disabled, onChange } = props
  const id = useId()
  const hintId = `${id}-hint`
  const pickerValue = HEX.test(value) ? value : '#000000'
  return (
    <div className="ctl-field ctl-color-field">
      <label className="ctl-label" htmlFor={id}>
        {label}
      </label>
      <div className="ctl-control ctl-color-value">
        <input
          className="ctl-color"
          id={id}
          type="color"
          value={pickerValue}
          disabled={disabled}
          aria-describedby={hint ? hintId : undefined}
          onChange={(event) => onChange(event.target.value)}
        />
        <span className="ctl-hex">{value}</span>
      </div>
      {swatches ? (
        <span className="ctl-swatches">
          {swatches.map((swatch) => (
            <button
              key={swatch.value}
              type="button"
              className="ctl-swatch"
              style={{ backgroundColor: swatch.value }}
              title={swatch.label}
              aria-label={swatch.label}
              aria-pressed={swatch.value.toLowerCase() === value.toLowerCase()}
              disabled={disabled}
              onClick={() => onChange(swatch.value)}
            />
          ))}
        </span>
      ) : null}
      {hint ? (
        <p className="ctl-hint" id={hintId}>
          {hint}
        </p>
      ) : null}
    </div>
  )
}
