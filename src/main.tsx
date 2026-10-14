import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// 滚动条：滚轮滚动后显示，1.5s 无操作后隐藏
let scrollTimer: ReturnType<typeof setTimeout> | null = null
document.addEventListener('wheel', () => {
  document.documentElement.classList.add('scrolling')
  if (scrollTimer) clearTimeout(scrollTimer)
  scrollTimer = setTimeout(() => {
    document.documentElement.classList.remove('scrolling')
  }, 1500)
}, { passive: true })

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)