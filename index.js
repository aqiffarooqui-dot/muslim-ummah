import { registerRootComponent } from 'expo';

import App from './App';
import AuthGate from './src/auth/AuthGate';
import { AuthProvider } from './src/auth/AuthProvider';
import { PremiumProvider } from './src/premium/PremiumProvider';
import { ThemeProvider } from './src/themes/ThemeProvider';

function Root() {
  return (
    <AuthProvider>
      <PremiumProvider>
        <ThemeProvider>
          <AuthGate>
            <App />
          </AuthGate>
        </ThemeProvider>
      </PremiumProvider>
    </AuthProvider>
  );
}

registerRootComponent(Root);
