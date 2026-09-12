import parse from 'html-react-parser'
import { loadLegacyDocument } from '@/lib/legacy'

export function LegacyPage({ fileName }: { fileName: string }) {
  const document = loadLegacyDocument(fileName)

  return (
    <>
      {document.stylesheets.map((href) => (
        <link key={href} rel="stylesheet" href={href} />
      ))}

      {parse(document.bodyHtml)}

      {document.scripts.map((script, index) => {
        if (script.src) {
          return <script key={`${script.src}-${index}`} src={script.src} type={script.type} />
        }

        return (
          <script
            key={`inline-${index}`}
            type={script.type}
            dangerouslySetInnerHTML={{ __html: script.code ?? '' }}
          />
        )
      })}
    </>
  )
}
