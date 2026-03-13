import { Route, Switch } from 'wouter';
import { lazy, Suspense } from 'react';
import { AudioProvider } from './context/AudioContext';
import { Home } from './pages/Home';

const GamePage = lazy(() =>
  import('./pages/GamePage').then(m => ({ default: m.GamePage }))
);

function App() {
  return (
    <AudioProvider>
      <Switch>
        <Route path="/">
          <Home />
        </Route>
        <Route path="/game">
          <Suspense fallback={null}>
            <GamePage />
          </Suspense>
        </Route>
      </Switch>
    </AudioProvider>
  );
}

export default App;
