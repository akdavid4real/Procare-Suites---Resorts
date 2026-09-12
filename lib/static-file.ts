import fs from 'node:fs'
import path from 'node:path'

const MIME_TYPES: Record<string, string> = {
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon'
}

function safeResolve(base: string, segments: string[]): string | null {
  const root = path.resolve(process.cwd(), base)
  const target = path.resolve(root, ...segments)
  if (target !== root && !target.startsWith(`${root}${path.sep}`)) return null
  return target
}

export function serveRepoFile(base: string, segments: string[]) {
  const target = safeResolve(base, segments)
  if (!target || !fs.existsSync(target) || !fs.statSync(target).isFile()) {
    return new Response('Not found', { status: 404 })
  }

  const body = fs.readFileSync(target)
  const ext = path.extname(target).toLowerCase()

  return new Response(new Uint8Array(body), {
    status: 200,
    headers: {
      'Content-Type': MIME_TYPES[ext] ?? 'application/octet-stream',
      'Cache-Control': 'public, max-age=31536000, immutable'
    }
  })
}
