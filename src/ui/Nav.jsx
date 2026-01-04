import { useState } from 'react'
import { Button } from './Button'
import { Menu } from 'lucide-react'
import { X } from 'lucide-react'

export const Nav = () => {
  const [isOpen, setIsOpen] = useState(false)
  return (
    <nav className="pointer-events-auto">
      <Button onClick={() => setIsOpen(!isOpen)}>
        {isOpen ? <X /> : <Menu />}
      </Button>
    </nav>
  )
}
