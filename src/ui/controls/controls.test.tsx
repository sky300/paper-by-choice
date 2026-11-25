// @vitest-environment happy-dom
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, test, vi } from 'vitest'
import type { OptionField } from '../../core/papers/contract'
import { Section } from './Section'
import { NumberField } from './NumberField'
import { SliderField } from './SliderField'
import { ToggleField } from './ToggleField'
import { SelectField } from './SelectField'
import { TextField } from './TextField'
import { ColorField } from './ColorField'
import { OptionFieldRenderer } from './OptionFieldRenderer'

;(
  globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true

const t = (key: string) => `T:${key}`

afterEach(cleanup)

/** Reads the input associated with the visible label. */
function input(): HTMLInputElement {
  return screen.getByRole('textbox', { name: /Label/ }) as HTMLInputElement
}

describe('NumberField', () => {
  function setup(value = 8) {
    const onCommit = vi.fn()
    const utils = render(
      <NumberField
        label="Label"
        value={value}
        min={4}
        max={20}
        step={0.5}
        onCommit={onCommit}
      />,
    )
    return { onCommit, ...utils }
  }

  test('is a controlled number input with min, max and step', () => {
    setup()
    const el = screen.getByRole('spinbutton') as HTMLInputElement
    expect(el.type).toBe('number')
    expect(el.min).toBe('4')
    expect(el.max).toBe('20')
    expect(el.step).toBe('0.5')
  })

  test('commits an in-range value immediately while typing', () => {
    const { onCommit } = setup()
    fireEvent.change(screen.getByRole('spinbutton'), {
      target: { value: '10' },
    })
    expect(onCommit).toHaveBeenCalledWith(10)
  })

  test('does not commit an out-of-range intermediate value', () => {
    const { onCommit } = setup()
    const el = screen.getByRole('spinbutton') as HTMLInputElement
    fireEvent.change(el, { target: { value: '99' } })
    expect(el.value).toBe('99')
    expect(onCommit).not.toHaveBeenCalled()
  })

  test('clamps and commits on blur', () => {
    const { onCommit } = setup()
    const el = screen.getByRole('spinbutton') as HTMLInputElement
    fireEvent.change(el, { target: { value: '99' } })
    fireEvent.blur(el)
    expect(onCommit).toHaveBeenCalledWith(20)
    expect(el.value).toBe('8')
  })

  test('an empty draft reverts to the previous value on blur', () => {
    const { onCommit } = setup()
    const el = screen.getByRole('spinbutton') as HTMLInputElement
    fireEvent.change(el, { target: { value: '' } })
    fireEvent.blur(el)
    expect(onCommit).not.toHaveBeenCalled()
    expect(el.value).toBe('8')
  })

  test('Enter commits, clamps and clears the draft', () => {
    const { onCommit } = setup()
    const el = screen.getByRole('spinbutton') as HTMLInputElement
    fireEvent.change(el, { target: { value: '99' } })
    fireEvent.keyDown(el, { key: 'Enter' })
    expect(onCommit).toHaveBeenCalledWith(20)
    expect(el.value).toBe('8')
  })

  test('formats the value without trailing zeros', () => {
    setup(8.5)
    expect((screen.getByRole('spinbutton') as HTMLInputElement).value).toBe(
      '8.5',
    )
  })
})

describe('SliderField', () => {
  test('dragging fires onChange with a number', () => {
    const onChange = vi.fn()
    render(
      <SliderField
        label="Label"
        value={5}
        min={0}
        max={10}
        step={1}
        onChange={onChange}
      />,
    )
    fireEvent.change(screen.getByRole('slider'), { target: { value: '7' } })
    expect(onChange).toHaveBeenCalledWith(7)
  })

  test('shows 0–1 as a whole percentage', () => {
    render(
      <SliderField
        label="Label"
        value={0.2}
        min={0}
        max={1}
        step={0.05}
        unit="%"
        onChange={vi.fn()}
      />,
    )
    expect(screen.getByRole('status').textContent).toBe('20%')
  })

  test('respects an explicit decimals count', () => {
    render(
      <SliderField
        label="Label"
        value={0.25}
        min={0}
        max={1}
        step={0.05}
        decimals={2}
        onChange={vi.fn()}
      />,
    )
    expect(screen.getByRole('status').textContent).toBe('0.25')
  })
})

describe('ToggleField', () => {
  test('renders the checked state and reports changes', () => {
    const onChange = vi.fn()
    render(<ToggleField label="Label" checked={false} onChange={onChange} />)
    const el = screen.getByRole('checkbox') as HTMLInputElement
    expect(el.checked).toBe(false)
    fireEvent.click(el)
    expect(onChange).toHaveBeenCalledWith(true)
  })
})

describe('SelectField', () => {
  test('renders choices and reports the selected value', () => {
    const onChange = vi.fn()
    render(
      <SelectField
        label="Label"
        value="b"
        choices={[
          { value: 'a', label: 'T:choice.a' },
          { value: 'b', label: 'T:choice.b' },
        ]}
        onChange={onChange}
      />,
    )
    const el = screen.getByRole('combobox') as HTMLSelectElement
    expect(el.value).toBe('b')
    expect(screen.getByRole('option', { name: 'T:choice.a' })).toBeTruthy()
    fireEvent.change(el, { target: { value: 'a' } })
    expect(onChange).toHaveBeenCalledWith('a')
  })
})

describe('TextField', () => {
  test('renders the value and reports changes', () => {
    const onChange = vi.fn()
    render(<TextField label="Label" value="hello" onChange={onChange} />)
    const el = input()
    expect(el.value).toBe('hello')
    fireEvent.change(el, { target: { value: 'world' } })
    expect(onChange).toHaveBeenCalledWith('world')
  })
})

describe('ColorField', () => {
  test('the color picker reports changes', () => {
    const onChange = vi.fn()
    render(<ColorField label="Label" value="#112233" onChange={onChange} />)
    const picker = document.querySelector(
      'input[type="color"]',
    ) as HTMLInputElement
    fireEvent.change(picker, { target: { value: '#abcdef' } })
    expect(onChange).toHaveBeenCalledWith('#abcdef')
  })

  test('clicking a swatch reports its color', () => {
    const onChange = vi.fn()
    render(
      <ColorField
        label="Label"
        value="#112233"
        swatches={[
          { label: 'T:ink', value: '#112233' },
          { label: 'T:red', value: '#ff0000' },
        ]}
        onChange={onChange}
      />,
    )
    const buttons = screen.getAllByRole('button')
    expect(buttons).toHaveLength(2)
    expect(buttons[0].style.backgroundColor).toBe('#112233')
    expect(buttons[1].style.backgroundColor).toBe('#ff0000')
    expect(buttons[0].getAttribute('title')).toBe('T:ink')
    expect(buttons[0].getAttribute('aria-pressed')).toBe('true')
    expect(buttons[1].getAttribute('aria-pressed')).toBe('false')
    fireEvent.click(buttons[1])
    expect(onChange).toHaveBeenCalledWith('#ff0000')
  })

  test('no swatches means no swatch buttons', () => {
    render(<ColorField label="Label" value="#112233" onChange={vi.fn()} />)
    expect(screen.queryAllByRole('button')).toEqual([])
  })

  test('an invalid value falls back to #000000 in the picker', () => {
    render(<ColorField label="Label" value="nope" onChange={vi.fn()} />)
    expect(
      (document.querySelector('input[type="color"]') as HTMLInputElement).value,
    ).toBe('#000000')
  })
})

describe('OptionFieldRenderer', () => {
  function renderField(field: OptionField, onSet = vi.fn()) {
    const utils = render(
      <OptionFieldRenderer field={field} options={{}} t={t} onSet={onSet} />,
    )
    return { onSet, ...utils }
  }

  const cases: [string, OptionField, string | null][] = [
    [
      'number',
      {
        kind: 'number',
        key: 'n',
        label: 'f.n',
        min: 0,
        max: 10,
        step: 1,
        default: 1,
      },
      'spinbutton',
    ],
    [
      'slider',
      {
        kind: 'slider',
        key: 's',
        label: 'f.s',
        min: 0,
        max: 10,
        step: 1,
        default: 1,
      },
      'slider',
    ],
    [
      'toggle',
      { kind: 'toggle', key: 'b', label: 'f.b', default: false },
      'checkbox',
    ],
    [
      'select',
      {
        kind: 'select',
        key: 'c',
        label: 'f.c',
        choices: [{ value: 'x', label: 'f.x' }],
        default: 'x',
      },
      'combobox',
    ],
    ['text', { kind: 'text', key: 't', label: 'f.t', default: '' }, 'textbox'],
    [
      'color',
      { kind: 'color', key: 'c', label: 'f.color', default: '#000000' },
      null,
    ],
  ]

  test.each(cases)(
    'renders a %s field as its control',
    (_name, field, role) => {
      renderField(field)
      if (role) {
        expect(screen.getAllByRole(role).length).toBeGreaterThan(0)
      } else {
        expect(document.querySelector('input[type="color"]')).not.toBeNull()
      }
    },
  )

  test('translates the label and the choice names', () => {
    renderField({
      kind: 'select',
      key: 'c',
      label: 'f.c',
      choices: [{ value: 'x', label: 'f.x' }],
      default: 'x',
    })
    expect(screen.getByText('T:f.c')).toBeTruthy()
    expect(screen.getByRole('option', { name: 'T:f.x' })).toBeTruthy()
  })

  test('showIf false renders nothing', () => {
    const { container } = renderField({
      kind: 'number',
      key: 'n',
      label: 'f.n',
      min: 0,
      max: 10,
      step: 1,
      default: 1,
      showIf: () => false,
    })
    expect(container.firstChild).toBeNull()
  })

  test('a group recurses into its fields', () => {
    renderField({
      kind: 'group',
      key: 'g',
      label: 'f.g',
      fields: [
        { kind: 'toggle', key: 'inner', label: 'f.inner', default: false },
      ],
    })
    expect(screen.getByRole('group')).toBeTruthy()
    expect(screen.getByRole('checkbox')).toBeTruthy()
  })

  test('a group with showIf false is hidden entirely', () => {
    const { container } = renderField({
      kind: 'group',
      key: 'g',
      label: 'f.g',
      showIf: () => false,
      fields: [
        { kind: 'toggle', key: 'inner', label: 'f.inner', default: false },
      ],
    })
    expect(container.firstChild).toBeNull()
  })

  test('commits carry the field path', () => {
    const { onSet } = renderField({
      kind: 'number',
      key: 'layout.rows',
      label: 'f.n',
      min: 0,
      max: 10,
      step: 1,
      default: 1,
    })
    fireEvent.change(screen.getByRole('spinbutton'), { target: { value: '5' } })
    expect(onSet).toHaveBeenCalledWith('layout.rows', 5)
  })

  test('a hint becomes the accessible description', () => {
    render(
      <NumberField
        label="Label"
        value={8}
        min={4}
        max={20}
        step={0.5}
        hint="Hint text"
        onCommit={vi.fn()}
      />,
    )
    const el = screen.getByRole('spinbutton')
    const describedBy = el.getAttribute('aria-describedby')
    expect(describedBy).toBeTruthy()
    expect(document.getElementById(describedBy!)?.textContent).toBe('Hint text')
  })
})

describe('Section', () => {
  test('renders the title and the body, open by default', () => {
    render(
      <Section id="sec" title="T:title">
        <p>Body</p>
      </Section>,
    )
    expect(screen.getByText('T:title')).toBeTruthy()
    expect(screen.getByText('Body')).toBeTruthy()
    expect((document.querySelector('details') as HTMLDetailsElement).open).toBe(
      true,
    )
  })

  test('defaultOpen false leaves the section closed', () => {
    render(
      <Section id="sec" title="T:title" defaultOpen={false}>
        <p>Body</p>
      </Section>,
    )
    expect((document.querySelector('details') as HTMLDetailsElement).open).toBe(
      false,
    )
  })

  test('clicking an action button does not toggle the section', () => {
    const onAction = vi.fn()
    render(
      <Section
        id="sec"
        title="T:title"
        actions={
          <button type="button" onClick={onAction}>
            Action
          </button>
        }
      >
        <p>Body</p>
      </Section>,
    )
    const button = screen.getByRole('button', { name: 'Action' })
    const event = new MouseEvent('click', { bubbles: true, cancelable: true })
    button.dispatchEvent(event)
    expect(onAction).toHaveBeenCalled()
    expect(event.defaultPrevented).toBe(true)
    expect(event.cancelBubble).toBe(true)
  })
})

describe('shared control conventions', () => {
  test('label and control are associated through htmlFor / id', () => {
    render(<TextField label="Label" value="x" onChange={vi.fn()} />)
    const el = input()
    const label = screen.getByText('Label') as HTMLLabelElement
    expect(label.htmlFor).toBe(el.id)
  })

  test('a hint is linked with aria-describedby', () => {
    render(
      <TextField label="Label" value="x" hint="Hint text" onChange={vi.fn()} />,
    )
    const el = input()
    const describedBy = el.getAttribute('aria-describedby')
    expect(describedBy).toBeTruthy()
    expect(document.getElementById(describedBy!)?.textContent).toBe('Hint text')
  })
})
