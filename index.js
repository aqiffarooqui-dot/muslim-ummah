import { registerRootComponent } from 'expo';

import App from './App';
import AuthGate from './src/auth/AuthGate';
import { PremiumProvider } from './src/premium/PremiumProvider';
import { ThemeProvider } from './src/themes/ThemeProvider';

function Root() {
  return (
    <PremiumProvider>
      <ThemeProvider>
        <AuthGate>
          <App />
        </AuthGate>
      </ThemeProvider>
    </PremiumProvider>
  );
}

registerRootComponent(Root);
