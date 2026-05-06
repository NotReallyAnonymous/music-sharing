import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const MUSIC_DIR = path.join(__dirname, 'music')
const AUDIO_EXTS = new Set(['.mp3', '.wav', '.ogg', '.flac', '.aac', '.m4a', '.opus', '.wma'])

function musicPlugin() {
  return {
    name: 'music-plugin',
    configureServer(server) {
      server.middlewares.use('/api/music', (_req, res) => {
        try {
          const folders = fs.readdirSync(MUSIC_DIR, { withFileTypes: true })
            .filter(d => d.isDirectory())
            .map(d => {
              const folderPath = path.join(MUSIC_DIR, d.name)
              const files = fs.readdirSync(folderPath)
                .filter(f => AUDIO_EXTS.has(path.extname(f).toLowerCase()))
                .map(f => {
                  const mtime = fs.statSync(path.join(folderPath, f)).mtimeMs
                  return { name: f, mtime }
                })
                .sort((a, b) => b.mtime - a.mtime)
              if (!files.length) return null
              return { name: d.name, files, newestMtime: files[0].mtime }
            })
            .filter(Boolean)
            .sort((a, b) => b.newestMtime - a.newestMtime)
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify(folders))
        } catch (e) {
          res.statusCode = 500
          res.end(JSON.stringify({ error: e.message }))
        }
      })

      server.middlewares.use('/music', (req, res, next) => {
        const filePath = path.join(MUSIC_DIR, decodeURIComponent(req.url || ''))
        const resolved = path.resolve(filePath)
        if (!resolved.startsWith(MUSIC_DIR + path.sep) && resolved !== MUSIC_DIR) {
          res.statusCode = 403
          res.end('Forbidden')
          return
        }
        try {
          const stat = fs.statSync(resolved)
          if (!stat.isFile()) { next(); return }
          const ext = path.extname(resolved).toLowerCase()
          const mime = {
            '.mp3': 'audio/mpeg', '.wav': 'audio/wav', '.ogg': 'audio/ogg',
            '.flac': 'audio/flac', '.aac': 'audio/aac', '.m4a': 'audio/mp4',
            '.opus': 'audio/opus', '.wma': 'audio/x-ms-wma',
          }
          const range = req.headers['range']
          if (range) {
            const [startStr, endStr] = range.replace(/bytes=/, '').split('-')
            const start = parseInt(startStr, 10)
            const end = endStr ? parseInt(endStr, 10) : stat.size - 1
            res.statusCode = 206
            res.setHeader('Content-Range', `bytes ${start}-${end}/${stat.size}`)
            res.setHeader('Accept-Ranges', 'bytes')
            res.setHeader('Content-Length', end - start + 1)
            res.setHeader('Content-Type', mime[ext] || 'application/octet-stream')
            fs.createReadStream(resolved, { start, end }).pipe(res)
          } else {
            res.setHeader('Accept-Ranges', 'bytes')
            res.setHeader('Content-Length', stat.size)
            res.setHeader('Content-Type', mime[ext] || 'application/octet-stream')
            fs.createReadStream(resolved).pipe(res)
          }
        } catch {
          next()
        }
      })
    },
  }
}

export default defineConfig({
  plugins: [react(), musicPlugin()],
  server: {
    port: 16666,
    host: true,
  },
})
