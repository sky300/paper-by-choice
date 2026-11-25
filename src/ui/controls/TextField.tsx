/**
 * 提供文本输入控件。
 * Provides a text input.
 */
/**
 * Controlled single-line text field.
 */
import { useId } from 'react'
import type { JSX } from 'react'

export interface TextFieldProps {
  label: string
  value: string
  hint?: string
  placeholder?: string
  maxLength?: number
  disabled?: boolean
  onChange: (value: string) => void
}

/** Renders a labelled text input that reports every edit. */
export function TextField(props: TextFieldProps): JSX.Element {
  const { label, value, hint, placeholder, maxLength, disabled, onChange } =
    props
  const id = useId()
  const hintId = `${id}-hint`
  return (
    <div className="ctl-field">
      <label className="ctl-label" htmlFor={id}>
        {label}
      </label>
      <div className="ctl-control">
        <input
          className="ctl-input"
          id={id}
          type="text"
          value={value}
          placeholder={placeholder}
          maxLength={maxLength}
          disabled={disabled}
          aria-describedby={hint ? hintId : undefined}
          onChange={(event) => onChange(event.target.value)}
        />
      </div>
      {hint ? (
        <p className="ctl-hint" id={hintId}>
          {hint}
        </p>
      ) : null}
    </div>
  )
}
