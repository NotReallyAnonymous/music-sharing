import http from 'http'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DIST_DIR = path.join(__dirname, 'dist')
const MUSIC_DIR = path.join(__dirname, 'music')
const PORT = 16666

const AUDIO_EXTS = new Set(['.mp3', '.wav', '.ogg', '.flac', '.aac', '.m4a', '.opus', '.wma'])

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js':   'application/javascript',
  '.mjs':  'application/javascript',
  '.css':  'text/css',
  '.svg':  'image/svg+xml',
  '.png':  'image/png',
  '.jpg':  'image/jpeg',
  '.ico':  'image/x-icon',
  '.json': 'application/json',
  '.mp3':  'audio/mpeg',
  '.wav':  'audio/wav',
  '.ogg':  'audio/ogg',
  '.flac': 'audio/flac',
  '.aac':  'audio/aac',
  '.m4a':  'audio/mp4',
  '.opus': 'audio/opus',
  '.wma':  'audio/x-ms-wma',
}

function serveFile(res, filePath, contentType) {
  const stat = fs.statSync(filePath)
  res.writeHead(200, { 'Content-Type': contentType, 'Content-Length': stat.size })
  fs.createReadStream(filePath).pipe(res)
}

function serveAudio(req, res, filePath) {
  const stat = fs.statSync(filePath)
  const ext = path.extname(filePath).toLowerCase()
  const contentType = MIME[ext] || 'application/octet-stream'
  const range = req.headers['range']

  if (range) {
    const [startStr, endStr] = range.replace(/bytes=/, '').split('-')
    const start = parseInt(startStr, 10)
    const end = endStr ? parseInt(endStr, 10) : stat.size - 1
    res.writeHead(206, {
      'Content-Type': contentType,
      'Content-Range': `bytes ${start}-${end}/${stat.size}`,
      'Accept-Ranges': 'bytes',
      'Content-Length': end - start + 1,
    })
    fs.createReadStream(filePath, { start, end }).pipe(res)
  } else {
    res.writeHead(200, {
      'Content-Type': contentType,
      'Accept-Ranges': 'bytes',
      'Content-Length': stat.size,
    })
    fs.createReadStream(filePath).pipe(res)
  }
}

function handleMusicApi(res) {
  const folders = fs.readdirSync(MUSIC_DIR, { withFileTypes: true })
    .filter(d => d.isDirectory())
    .map(d => {
      const folderPath = path.join(MUSIC_DIR, d.name)
      const files = fs.readdirSync(folderPath)
        .filter(f => AUDIO_EXTS.has(path.extname(f).toLowerCase()))
        .map(f => ({ name: f, mtime: fs.statSync(path.join(folderPath, f)).mtimeMs }))
        .sort((a, b) => b.mtime - a.mtime)
      if (!files.length) return null
      return { name: d.name, files, newestMtime: files[0].mtime }
    })
    .filter(Boolean)
    .sort((a, b) => b.newestMtime - a.newestMtime)

  res.writeHead(200, { 'Content-Type': 'application/json' })
  res.end(JSON.stringify(folders))
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://localhost`)
  const pathname = url.pathname

  // Music API
  if (pathname === '/api/music') {
    try { handleMusicApi(res) } catch (e) {
      res.writeHead(500)
      res.end(JSON.stringify({ error: e.message }))
    }
    return
  }

  // Audio files
  if (pathname.startsWith('/music/')) {
    const filePath = path.resolve(MUSIC_DIR, decodeURIComponent(pathname.slice('/music/'.length)))
    if (!filePath.startsWith(MUSIC_DIR + path.sep)) {
      res.writeHead(403); res.end('Forbidden'); return
    }
    try {
      if (fs.statSync(filePath).isFile()) { serveAudio(req, res, filePath); return }
    } catch { /* fall through */ }
    res.writeHead(404); res.end('Not found')
    return
  }

  // Static assets from dist/
  let filePath = path.join(DIST_DIR, pathname)
  try {
    const stat = fs.statSync(filePath)
    if (stat.isDirectory()) filePath = path.join(filePath, 'index.html')
  } catch {
    // SPA fallback — serve index.html for any unknown path
    filePath = path.join(DIST_DIR, 'index.html')
  }

  try {
    const ext = path.extname(filePath).toLowerCase()
    serveFile(res, filePath, MIME[ext] || 'application/octet-stream')
  } catch {
    res.writeHead(404); res.end('Not found')
  }
})

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Listening on port ${PORT}`)
})
