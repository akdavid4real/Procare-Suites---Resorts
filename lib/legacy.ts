import fs from 'node:fs'
import path from 'node:path'

export type LegacyScript = {
  src?: string
  code?: string
  type?: string
}

export type LegacyDocument = {
  title: string
  stylesheets: string[]
  bodyHtml: string
  scripts: LegacyScript[]
}

const routeMap: Record<string, string> = {
  'index.html': '/',
  'rooms.html': '/rooms',
  'dining.html': '/dining',
  'facilities.html': '/facilities',
  'contact.html': '/contact',
  'booking.html': '/booking'
}

const legacyPagePaths: Record<string, string> = {
  'index.html': path.join(process.cwd(), 'index.html'),
  'rooms.html': path.join(process.cwd(), 'rooms.html'),
  'dining.html': path.join(process.cwd(), 'dining.html'),
  'facilities.html': path.join(process.cwd(), 'facilities.html'),
  'contact.html': path.join(process.cwd(), 'contact.html'),
  'booking.html': path.join(process.cwd(), 'booking.html')
}

function rewriteUrl(url: string): string {
  const trimmed = url.trim()
  if (/^(?:https?:|mailto:|tel:|#|data:|javascript:)/i.test(trimmed)) return url

  const [pathname, suffix = ''] = trimmed.split(/(?=[?#])/)
  const mapped = routeMap[pathname]
  if (mapped) return `${mapped}${suffix}`

  if (pathname.startsWith('img/')) return `/${pathname}${suffix}`
  if (pathname.startsWith('js/')) return `/${pathname}${suffix}`
  if (pathname === 'styles.css') return `/styles.css${suffix}`

  return url
}

function rewriteLegacyLinks(html: string): string {
  return html.replace(/\b(href|src|action)=(['"])(.*?)\2/gi, (_match, attr, quote, value) => {
    return `${attr}=${quote}${rewriteUrl(value)}${quote}`
  })
}

export function loadLegacyDocument(fileName: string): LegacyDocument {
  const fullPath = legacyPagePaths[fileName]
  if (!fullPath) {
    throw new Error(`Unsupported legacy page: ${fileName}`)
  }

  const html = fs.readFileSync(/* turbopackIgnore: true */ fullPath, 'utf8')

  const title = html.match(/<title>([\s\S]*?)<\/title>/i)?.[1]?.trim() ?? 'Procare Suites & Resorts'
  const head = html.match(/<head[^>]*>([\s\S]*?)<\/head>/i)?.[1] ?? ''
  let body = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i)?.[1] ?? html

  const stylesheets = [...head.matchAll(/<link\b[^>]*rel=(['"])stylesheet\1[^>]*href=(['"])(.*?)\2[^>]*>/gi)]
    .map((match) => rewriteUrl(match[3]))

  const scripts: LegacyScript[] = []
  body = body.replace(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi, (_full, rawAttrs, code) => {
    const src = rawAttrs.match(/\bsrc=(['"])(.*?)\1/i)?.[2]
    const type = rawAttrs.match(/\btype=(['"])(.*?)\1/i)?.[2]
    scripts.push({
      src: src ? rewriteUrl(src) : undefined,
      code: src ? undefined : code,
      type
    })
    return ''
  })

  return {
    title,
    stylesheets,
    bodyHtml: rewriteLegacyLinks(body),
    scripts
  }
}
