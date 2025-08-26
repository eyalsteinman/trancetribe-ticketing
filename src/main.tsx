import { createRoot } from 'react-dom/client'
import { BackgroundProvider } from '@/contexts/BackgroundContext'
import { DarkModeProvider } from './hooks/useDarkMode.tsx'
import App from './App.tsx'
import './index.css'

createRoot(document.getElementById("root")!).render(
  <BackgroundProvider>
    <DarkModeProvider>
      <App />
    </DarkModeProvider>
  </BackgroundProvider>
);
