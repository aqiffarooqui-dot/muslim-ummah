import { registerRootComponent } from 'expo';

import App from './App';
import AuthGate from './src/auth/AuthGate';

function Root() {
  return (
    <AuthGate>
      <App />
    </AuthGate>
  );
}

registerRootComponent(Root);
