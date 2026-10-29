import React from 'react';
import AppShell from './components/layout/AppShell.jsx';
import { useAppState } from './hooks/useAppState.js';

export default function App() {
  const appState = useAppState();
  return <AppShell {...appState} />;
}
