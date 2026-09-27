import { registerRootComponent } from 'expo';

import App from './App';
import AuthGate from './src/auth/AuthGate';
import { PremiumProvider } from './src/premium/PremiumProvider';

function Root() {
  return (
    <AuthGate>
      <PremiumProvider>
        <App />
      </PremiumProvider>
    </AuthGate>
  );
}

registerRootComponent(Root);
