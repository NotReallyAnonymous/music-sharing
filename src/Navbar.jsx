import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import './Navbar.css'

export default function Navbar({ onMenuToggle }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  const navigate = useNavigate()

  useEffect(() => {
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  function go(path) {
    setOpen(false)
    navigate(path)
  }

  return (
    <nav className="navbar">
      <div className="navbar-left">
        <button className="hamburger" onClick={onMenuToggle} aria-label="Toggle menu">
          <span /><span /><span />
        </button>
        <span className="navbar-brand" onClick={() => go('/')}>Demos</span>
      </div>
      <div className="navbar-menu">
        <div className="dropdown" ref={ref}>
          <button className="dropdown-toggle" onClick={() => setOpen(o => !o)}>
            Projects <span className="caret">{open ? '▴' : '▾'}</span>
          </button>
          {open && (
            <ul className="dropdown-menu">
              <li onClick={() => go('/projects/college-capstone')}>
                College Capstone Project
              </li>
            </ul>
          )}
        </div>
      </div>
    </nav>
  )
}
