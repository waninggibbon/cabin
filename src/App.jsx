import { Game } from './game';
import { UI } from './ui';
import { AudioProvider } from './context/AudioContext';

function App() {
  return (
    <AudioProvider>
      <UI />
      <Game />
    </AudioProvider>
  );
}

export default App;
