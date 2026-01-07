import { Nav } from './Nav';
import { AudioPlayer } from './AudioPlayer';

export const UI = () => {
  return (
    <div className="fixed inset-0 z-10 pointer-events-none p-8">
      <div className="mx-auto w-full h-full max-w-[1400px] relative">
        <h1 className="pointer-events-auto absolute top-0 left-0 text-sorc-400 text-4xl">
          nathy.dev
        </h1>

        <div className="md:pointer-events-auto md:absolute md:top-0 md:right-0 md:flex md:gap-4">
          <div className="pointer-events-auto absolute bottom-0 left-1/2 -translate-x-1/2 md:static md:translate-x-0">
            <Nav />
          </div>
          <div className="pointer-events-auto absolute top-0 right-0 md:static">
            <AudioPlayer />
          </div>
        </div>
      </div>
    </div>
  );
};
