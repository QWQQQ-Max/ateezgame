import { useState } from 'react';
import { PlayerSetup } from './types';
import WelcomeScreen from './components/WelcomeScreen';
import SetupScreen from './components/SetupScreen';
import ChatScreen from './components/ChatScreen';

type Screen = 'welcome' | 'setup' | 'chat';

export default function App() {
  const [screen, setScreen] = useState<Screen>('welcome');
  const [setup, setSetup] = useState<PlayerSetup | null>(null);

  const handleSetupComplete = (s: PlayerSetup) => {
    setSetup(s);
    setScreen('chat');
  };

  const handleRestart = () => {
    setSetup(null);
    setScreen('welcome');
  };

  if (screen === 'welcome') {
    return <WelcomeScreen onStart={() => setScreen('setup')} />;
  }

  if (screen === 'setup') {
    return (
      <SetupScreen
        onComplete={handleSetupComplete}
        onBack={() => setScreen('welcome')}
      />
    );
  }

  if (screen === 'chat' && setup) {
    return <ChatScreen setup={setup} onRestart={handleRestart} />;
  }

  return null;
}
