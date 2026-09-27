import { registerRootComponent } from 'expo';

import App from './App';
import AuthGate from './src/auth/AuthGate';
import { PremiumProvider } from './src/premium/PremiumProvider';
import { ThemeProvider } from './src/themes/ThemeProvider';

function Root() {
  return (
    <AuthGate>
      <PremiumProvider>
        <ThemeProvider>
          <App />
        </ThemeProvider>
      </PremiumProvider>
    </AuthGate>
  );
}

registerRootComponent(Root);
