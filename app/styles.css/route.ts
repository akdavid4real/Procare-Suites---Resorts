import fs from 'node:fs'
import path from 'node:path'

export const dynamic = 'force-static'

export function GET() {
  const css = fs.readFileSync(path.join(process.cwd(), 'styles.css'), 'utf8')
  return new Response(css, {
    headers: {
      'Content-Type': 'text/css; charset=utf-8',
      'Cache-Control': 'public, max-age=3600'
    }
  })
}
