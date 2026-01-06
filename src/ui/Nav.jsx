import { useState, useEffect } from 'react';
import { Button } from './Button';
import { Menu } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const useMediaQuery = query => {
  const [matches, setMatches] = useState(false);
  useEffect(() => {
    const media = window.matchMedia(query);
    if (media.matches !== matches) {
      setMatches(media.matches);
    }
    const listener = () => setMatches(media.matches);
    window.addEventListener('resize', listener);
    return () => window.removeEventListener('resize', listener);
  }, [matches, query]);
  return matches;
};

export const Nav = () => {
  const [isOpen, setIsOpen] = useState(false);
  const isDesktop = useMediaQuery('(min-width: 768px)');

  // Radius gets fucked when transitioning between mobile and desktop
  // So just close the menu in that case
  useEffect(() => {
    setIsOpen(false);
  }, [isDesktop]);

  const items = [
    { label: 'Home', onClick: () => setIsOpen(false) },
    { label: 'About', onClick: () => setIsOpen(false) },
    { label: 'Contact', onClick: () => setIsOpen(false) },
    { label: 'Blog', onClick: () => setIsOpen(false) },
    { label: 'Work', onClick: () => setIsOpen(false) }
  ];

  // Animation Variants
  const menuVariants = {
    closed: {
      transition: { staggerChildren: 0.05, staggerDirection: 1 }
    },
    open: {
      transition: {
        staggerChildren: 0.07,
        delayChildren: 0.2,
        staggerDirection: -1
      }
    }
  };

  const mobileMenuVariants = {
    closed: { transition: { staggerChildren: 0.05, staggerDirection: -1 } },
    open: { transition: { staggerChildren: 0.07, delayChildren: 0.1 } }
  };

  const desktopItemVariants = {
    closed: {
      x: 20,
      opacity: 0,
      transition: { type: 'spring', stiffness: 300, damping: 24 }
    },
    open: {
      x: 0,
      opacity: 1,
      transition: { type: 'spring', stiffness: 300, damping: 24 }
    }
  };

  const mobileCircleRadius = 120;

  return (
    <nav className="relative flex items-center">
      <div className="z-50 relative">
        <Button
          onClick={() => setIsOpen(!isOpen)}
          variant={isOpen ? 'attention' : 'default'}
        >
          <AnimatePresence mode="wait">
            {isOpen ? (
              <motion.div
                key="close"
                initial={{ rotate: -90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: 90, opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <span className="text-xl">X</span>
              </motion.div>
            ) : (
              <motion.div
                key="menu"
                initial={{ rotate: 90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: -90, opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <Menu />
              </motion.div>
            )}
          </AnimatePresence>
        </Button>
      </div>

      <AnimatePresence>
        {isOpen && (
          <>
            {isDesktop ? (
              <motion.ul
                variants={menuVariants}
                initial="closed"
                animate="open"
                exit="closed"
                className="absolute top-0 right-full mr-4 flex gap-4 items-end"
              >
                {items.map((item, i) => (
                  <motion.li key={i} variants={desktopItemVariants}>
                    <Button onClick={item.onClick}>{item.label}</Button>
                  </motion.li>
                ))}
              </motion.ul>
            ) : (
              // Mobile: Circle Fly-out
              <motion.ul
                variants={mobileMenuVariants}
                initial="closed"
                animate="open"
                exit="closed"
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-0 h-0 z-0" // Center anchor at button center
              >
                {items.map((item, i) => {
                  const totalAngle = 180; // Semi-circle
                  const startAngle = 180; // Left
                  const step =
                    items.length > 1 ? totalAngle / (items.length - 1) : 0;
                  const angleDeg = startAngle + i * step;
                  const angleRad = (angleDeg * Math.PI) / 180;

                  // offset by button size + ui layer padding
                  const x = Math.cos(angleRad) * mobileCircleRadius - 24 - 16;
                  const y = Math.sin(angleRad) * mobileCircleRadius - 24 - 16;

                  return (
                    <motion.li
                      key={i}
                      className="absolute top-0 left-0" // Stacking context
                      initial={{ x: 0, y: 0, scale: 0, opacity: 0 }}
                      animate={{
                        x,
                        y,
                        scale: 1,
                        opacity: 1,
                        transition: {
                          type: 'spring',
                          stiffness: 200,
                          damping: 20,
                          delay: i * 0.05
                        }
                      }}
                      exit={{
                        x: 0,
                        y: 0,
                        scale: 0,
                        opacity: 0,
                        transition: { duration: 0.2 }
                      }}
                    >
                      <Button onClick={item.onClick}>{item.label}</Button>
                    </motion.li>
                  );
                })}
              </motion.ul>
            )}
          </>
        )}
      </AnimatePresence>
    </nav>
  );
};
