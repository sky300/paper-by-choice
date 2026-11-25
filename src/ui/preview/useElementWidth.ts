/** Observes the content width of an element, with a resize-event fallback. */
import { useEffect, useRef, useState, type RefObject } from 'react'

export function useElementWidth<T extends HTMLElement>(): [
  RefObject<T | null>,
  number,
] {
  const ref = useRef<T | null>(null)
  const [width, setWidth] = useState(0)

  useEffect(() => {
    const element = ref.current
    if (!element) return
    const measure = (): void => setWidth(element.clientWidth)
    measure()
    if (typeof ResizeObserver !== 'undefined') {
      const observer = new ResizeObserver(measure)
      observer.observe(element)
      return () => observer.disconnect()
    }
    window.addEventListener('resize', measure)
    return () => window.removeEventListener('resize', measure)
  }, [])

  return [ref, width]
}
