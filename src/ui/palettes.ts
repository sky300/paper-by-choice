/**
 * Preset colour palettes for the control panel.
 *
 * Labels are dictionary keys so the swatch names follow the UI language;
 * the values are this project's own restrained, light palette.
 */
import type { ColorSwatch } from './controls/ColorField'

/** Background tints offered beside the native colour picker. */
export const BACKGROUND_SWATCHES: readonly ColorSwatch[] = [
  { label: 'swatch.white', value: '#ffffff' },
  { label: 'swatch.cream', value: '#fffaf0' },
  { label: 'swatch.grayLight', value: '#f6f6f7' },
  { label: 'swatch.blueLight', value: '#eff7ff' },
  { label: 'swatch.greenLight', value: '#f1faf3' },
  { label: 'swatch.pinkLight', value: '#fff3f6' },
  { label: 'swatch.yellowLight', value: '#fffbe8' },
]

/** Pattern / texture colours offered beside the native colour picker. */
export const PATTERN_SWATCHES: readonly ColorSwatch[] = [
  { label: 'swatch.gray', value: '#e0e3e8' },
  { label: 'swatch.grayMedium', value: '#b8bec8' },
  { label: 'swatch.blue', value: '#a9cff5' },
  { label: 'swatch.green', value: '#a9e5bd' },
  { label: 'swatch.red', value: '#f5b0b0' },
  { label: 'swatch.purple', value: '#cdbcf5' },
  { label: 'swatch.yellow', value: '#f7dc8e' },
]
