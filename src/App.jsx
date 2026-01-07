import { Experience } from './experience';
import { UI } from './ui';
import { AudioProvider } from './context/AudioContext';

function App() {
  return (
    <AudioProvider>
      <UI />
      <Experience />
    </AudioProvider>
  );
}

export default App;
