import { serveRepoFile } from '@/lib/static-file'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params
  return serveRepoFile('img', path)
}
