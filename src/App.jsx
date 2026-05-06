import { useState, useEffect } from 'react'
import { Routes, Route } from 'react-router-dom'
import Navbar from './Navbar.jsx'
import CollegeCapstone from './CollegeCapstone.jsx'
import './App.css'

function formatDate(mtime) {
  return new Date(mtime).toLocaleDateString(undefined, {
    year: 'numeric', month: 'short', day: 'numeric',
  })
}

function AudioTrack({ folder, file }) {
  const src = `/music/${encodeURIComponent(folder)}/${encodeURIComponent(file.name)}`
  const name = file.name.replace(/\.[^/.]+$/, '')
  return (
    <div className="track">
      <div className="track-header">
        <span className="track-name">{name}</span>
        <span className="track-date">{formatDate(file.mtime)}</span>
      </div>
      <audio controls preload="none" src={src} />
    </div>
  )
}

function MusicPlayer({ sidebarOpen, onSidebarClose }) {
  const [folders, setFolders] = useState([])
  const [selected, setSelected] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/music')
      .then(r => r.json())
      .then(data => {
        setFolders(data)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  function selectFolder(name) {
    setSelected(name)
    onSidebarClose()
  }

  const selectedFolder = folders.find(f => f.name === selected)

  return (
    <div className="layout">
      {sidebarOpen && <div className="sidebar-overlay" onClick={onSidebarClose} />}
      <aside className={`sidebar${sidebarOpen ? ' sidebar-open' : ''}`}>
        {loading && <div className="sidebar-loading">Loading…</div>}
        <ul className="folder-list">
          {folders.map(f => (
            <li
              key={f.name}
              className={`folder-item${selected === f.name ? ' active' : ''}`}
              onClick={() => selectFolder(f.name)}
            >
              <span className="folder-name">{f.name}</span>
              <span className="folder-date">{formatDate(f.newestMtime)}</span>
            </li>
          ))}
        </ul>
      </aside>

      <main className="main">
        {!selected && (
          <div className="empty-state">Select a folder to listen</div>
        )}
        {selectedFolder && (
          <>
            <h2 className="folder-title">{selectedFolder.name}</h2>
            <div className="track-list">
              {selectedFolder.files.map(file => (
                <AudioTrack key={file.name} folder={selectedFolder.name} file={file} />
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  )
}

export default function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="app-shell">
      <Navbar onMenuToggle={() => setSidebarOpen(o => !o)} />
      <Routes>
        <Route path="/" element={
          <MusicPlayer
            sidebarOpen={sidebarOpen}
            onSidebarClose={() => setSidebarOpen(false)}
          />
        } />
        <Route path="/projects/college-capstone" element={<CollegeCapstone />} />
      </Routes>
    </div>
  )
}
