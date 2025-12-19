// Point d'entrée simplifié qui délègue à l'app principale déjà configurée
// avec toutes les routes (/factures/:id, /clients/:id, etc.) dans modules/app/App.tsx.
import { App as MainApp } from './modules/app/App';

export default function App() {
  return <MainApp />;
}
