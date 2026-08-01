import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'
import { useGameStore } from './stores/gameStore'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)

// 调试钩子：允许控制台/自动化脚本访问 store（便于玩家排查与自动化测试）
;(window as unknown as Record<string, unknown>).__cityFate = { store: useGameStore }
