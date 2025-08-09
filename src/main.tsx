import { createRoot } from 'react-dom/client'
import { BackgroundProvider } from '@/contexts/BackgroundContext'
import App from './App.tsx'
import './index.css'

createRoot(document.getElementById("root")!).render(
  <BackgroundProvider>
    <App />
  </BackgroundProvider>
);
