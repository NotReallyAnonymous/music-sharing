import { useNavigate } from 'react-router-dom'
import './CollegeCapstone.css'

const PROJECTS = [
  {
    title: 'Hello Seattle (Sound-alike)',
    description: (
      <>
        My attempt to create a sound-alike of{' '}
        <a
          href="https://www.youtube.com/watch?v=yOsNFsG7xLk&list=RDyOsNFsG7xLk&start_radio=1&pp=ygUWT3dsIENpdHkgSGVsbG8gU2VhdHRsZaAHAQ%3D%3D"
          target="_blank"
          rel="noreferrer"
        >
          Hello Seattle by Owl City
        </a>{' '}
        with Adam&apos;s vocals replaced with a synth.
      </>
    ),
    src: '/music/Hello%20Seattle/four.wav',
  },
  {
    title: 'Isometric',
    description: null,
    src: '/music/Isometric/Isometric.wav',
  },
  {
    title: 'Dungeon Lullaby',
    description: 'This song came to be because I had just been gifted a kalimba.',
    src: '/music/Dungeon%20Lullaby/1.wav',
  },
  {
    title: 'Blinding Lights (Chiptune)',
    description: null,
    src: '/music/Blinding%20Lights%20(Chiptune)/Chiptune%20Cover%20of%20Blinding%20Lights.wav',
  },
  {
    title: 'Burning the Midnight Oil',
    description: null,
    src: '/music/Burning%20the%20Midnight%20Oil/Burning%20The%20midnight%20Oil.wav',
  },
]

export default function CollegeCapstone() {
  const navigate = useNavigate()

  return (
    <div className="capstone-page">
      <div className="capstone-content">
        <button className="back-btn" onClick={() => navigate('/')}>
          ← See All Demos
        </button>
        <h1 className="capstone-heading">College Capstone Project</h1>
        <div className="project-list">
          {PROJECTS.map(p => (
            <div key={p.title} className="project-card">
              <h2 className="project-title">{p.title}</h2>
              {p.description && <p className="project-desc">{p.description}</p>}
              <audio controls preload="none" src={p.src} />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
