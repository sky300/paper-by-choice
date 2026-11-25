/**
 * 初始化 React 根节点并加载全局样式。
 * Bootstraps React and global styles.
 */
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './ui/styles.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
