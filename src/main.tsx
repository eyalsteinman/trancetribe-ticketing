import { createRoot } from 'react-dom/client'
import { BackgroundProvider } from '@/contexts/BackgroundContext'
import { LanguageProvider } from '@/contexts/LanguageContext'
import App from './App.tsx'
import './index.css'

createRoot(document.getElementById("root")!).render(
  <LanguageProvider>
    <BackgroundProvider>
      <App />
    </BackgroundProvider>
  </LanguageProvider>
);
