import { Github, Linkedin, FileDown, Mail } from 'lucide-react';
import { Nav } from '../ui/Nav';
import { AudioPlayer } from '../ui/AudioPlayer';

const links = [
  { icon: Github, href: 'https://github.com/njmackinlay', label: 'GitHub' },
  {
    icon: Linkedin,
    href: 'https://linkedin.com/in/njmackinlay',
    label: 'LinkedIn'
  },
  { icon: FileDown, href: '/resume.pdf', label: 'Resume', download: true },
  { icon: Mail, href: 'mailto:njmackinlay@gmail.com', label: 'Email' }
];

export const Home = () => {
  return (
    <div className="flex flex-col min-h-screen p-8">
      <div className="mx-auto w-full max-w-[1400px] flex justify-between items-start">
        <h1 className="text-sorc-400 text-4xl">nathy.dev</h1>
        <div className="flex gap-4 items-center">
          <Nav />
          <AudioPlayer />
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center gap-3">
        <h2 className="text-fog text-5xl md:text-6xl font-bold tracking-tight text-center">
          Nathaniel MacKinlay
        </h2>
        <p className="text-fog/60 text-sm md:text-base tracking-wide text-center">
          Software Engineer | Dad | Pancake Enthusiast
        </p>
        <div className="flex gap-3 mt-4">
          {links.map(({ icon: Icon, href, label, download }) => (
            <a
              key={label}
              href={href}
              target={download ? undefined : '_blank'}
              rel={download ? undefined : 'noopener noreferrer'}
              download={download || undefined}
              aria-label={label}
              className="group relative flex h-10 w-10 items-center justify-center rounded-lg border-[3px] border-fog bg-pine transition-all duration-500 hover:scale-[1.15] cursor-pointer"
            >
              <Icon className="h-4 w-4 text-fog group-hover:animate-wiggle transition-colors duration-500" />
            </a>
          ))}
        </div>
      </div>
    </div>
  );
};
