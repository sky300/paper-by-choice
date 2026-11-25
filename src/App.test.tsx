// @vitest-environment happy-dom
import { render, screen } from '@testing-library/react'
import { expect, test } from 'vitest'
import App from './App'

test('renders the app shell with a preview and export controls', () => {
  render(<App />)
  expect(screen.getByText(/纸随心|Paper by Choice/)).toBeDefined()
  expect(screen.getAllByRole('button').length).toBeGreaterThan(5)
  expect(document.querySelectorAll('.sheet').length).toBeGreaterThan(0)
  expect(document.querySelector('.export-bar')).not.toBeNull()
})
