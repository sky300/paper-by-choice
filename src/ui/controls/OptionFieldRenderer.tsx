/**
 * 按纸型选项声明映射控件。
 * Maps declared paper options to form controls.
 */
/**
 * Turns one paper `OptionField` declaration into the matching control.
 *
 * Labels, hints and choice names are translated by the paper-scoped
 * translator; group fields recurse, and `showIf` hides the whole subtree.
 */
import type { JSX } from 'react'
import { getOption } from '../../core/papers/kit'
import type { OptionField } from '../../core/papers/contract'
import type { Translator } from '../../core/types'
import { NumberField } from './NumberField'
import { SliderField } from './SliderField'
import { ToggleField } from './ToggleField'
import { SelectField } from './SelectField'
import { TextField } from './TextField'
import { ColorField } from './ColorField'

export interface OptionFieldRendererProps {
  field: OptionField
  /** The resolved, validated options of the current paper. */
  options: Record<string, unknown>
  /** Paper-scoped translator for labels, hints and choice names. */
  t: Translator
  /** Receives (path, value); group fields never call it. */
  onSet: (path: string, value: unknown) => void
}

/** Renders the control for `field`, or `null` when `showIf` hides it. */
export function OptionFieldRenderer(
  props: OptionFieldRendererProps,
): JSX.Element | null {
  const { field, options, t, onSet } = props
  if (field.showIf && !field.showIf(options)) return null
  const label = t(field.label)
  const hint = field.hint ? t(field.hint) : undefined

  switch (field.kind) {
    case 'group':
      return (
        <fieldset className="ctl-group">
          <legend className="ctl-group-legend">{label}</legend>
          {field.fields.map((child) => (
            <OptionFieldRenderer
              key={child.key}
              field={child}
              options={options}
              t={t}
              onSet={onSet}
            />
          ))}
        </fieldset>
      )
    case 'number':
      return (
        <NumberField
          label={label}
          hint={hint}
          value={getOption(options, field.key, field.default)}
          min={field.min}
          max={field.max}
          step={field.step}
          unit={field.unit}
          onCommit={(value) => onSet(field.key, value)}
        />
      )
    case 'slider':
      return (
        <SliderField
          label={label}
          hint={hint}
          value={getOption(options, field.key, field.default)}
          min={field.min}
          max={field.max}
          step={field.step}
          unit={field.unit}
          onChange={(value) => onSet(field.key, value)}
        />
      )
    case 'toggle':
      return (
        <ToggleField
          label={label}
          hint={hint}
          checked={getOption(options, field.key, field.default)}
          onChange={(checked) => onSet(field.key, checked)}
        />
      )
    case 'select':
      return (
        <SelectField
          label={label}
          hint={hint}
          value={getOption(options, field.key, field.default)}
          choices={field.choices.map((choice) => ({
            value: choice.value,
            label: t(choice.label),
          }))}
          onChange={(value) => onSet(field.key, value)}
        />
      )
    case 'text':
      return (
        <TextField
          label={label}
          hint={hint}
          value={getOption(options, field.key, field.default)}
          maxLength={field.maxLength}
          onChange={(value) => onSet(field.key, value)}
        />
      )
    case 'color':
      return (
        <ColorField
          label={label}
          hint={hint}
          value={getOption(options, field.key, field.default)}
          onChange={(color) => onSet(field.key, color)}
        />
      )
  }
}
