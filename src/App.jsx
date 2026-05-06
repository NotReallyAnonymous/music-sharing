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

const TAG_COLORS = {
  rock:        '#c0392b',
  metal:       '#3d3d3d',
  deathcore:   '#2c2c2c',
  rap:         '#7d3c98',
  'hip-hop':   '#7d3c98',
  hiphop:      '#7d3c98',
  jazz:        '#b7950b',
  blues:       '#1a5276',
  classical:   '#1f618d',
  piano:       '#2471a3',
  acoustic:    '#1e8449',
  folk:        '#6e4c1e',
  electronic:  '#117a65',
  chiptune:    '#0e6655',
  ambient:     '#566573',
  orchestral:  '#6c3483',
  pop:         '#b03a7c',
  country:     '#b7770d',
  funk:        '#ba4a00',
  punk:        '#922b21',
  rnb:         '#4a235a',
  soul:        '#784212',
  reggae:      '#1d8348',
  lofi:        '#2e4057',
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
        const saved = localStorage.getItem('selectedFolder')
        const valid = data.find(f => f.name === saved)
        setSelected(valid ? saved : data[0]?.name ?? null)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  function selectFolder(name) {
    setSelected(name)
    localStorage.setItem('selectedFolder', name)
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
              <span className="folder-name">
                {f.config?.star && <span className="folder-star">★</span>}
                {f.name}
              </span>
              <span className="folder-date">{formatDate(f.newestMtime)}</span>
              {f.config?.tags?.length > 0 && (
                <div className="folder-tags">
                  {f.config.tags.map(tag => (
                    <span key={tag} className="tag" style={{ '--tag-color': TAG_COLORS[tag.toLowerCase()] ?? '#4a4a5a' }}>{tag}</span>
                  ))}
                </div>
              )}
            </li>
          ))}
        </ul>
      </aside>

      <main className="main">
        {selectedFolder && (
          <>
            <h2 className="folder-title">
              {selectedFolder.config?.star && <span className="folder-star main-star">★</span>}
              {selectedFolder.name}
            </h2>
            {selectedFolder.config?.description && (
              <p className="folder-description">{selectedFolder.config.description}</p>
            )}
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
