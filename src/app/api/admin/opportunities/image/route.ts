import { NextResponse } from 'next/server'
import { put } from '@vercel/blob'
import { auth } from '@/lib/auth'
import { IMAGE_ACCEPTED_TYPES, validateImageFile } from '@/lib/opportunity-image'

// src/proxy.ts lets /api/* through untouched, so this route has to gate itself.
export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: request.headers })
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  if (session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  let file: FormDataEntryValue | null
  try {
    file = (await request.formData()).get('file')
  } catch {
    return NextResponse.json({ error: 'Invalid upload.' }, { status: 400 })
  }

  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'No file provided.' }, { status: 400 })
  }

  const invalid = validateImageFile(file)
  if (invalid) {
    return NextResponse.json({ error: invalid }, { status: 400 })
  }

  // The extension comes from the validated MIME type, never from the user-supplied name.
  const extension = IMAGE_ACCEPTED_TYPES[file.type as keyof typeof IMAGE_ACCEPTED_TYPES]

  try {
    const blob = await put(`opportunities/${crypto.randomUUID()}.${extension}`, file, {
      access: 'public',
      contentType: file.type,
    })
    return NextResponse.json({ url: blob.url })
  } catch {
    return NextResponse.json(
      { error: 'Upload failed. Check that BLOB_READ_WRITE_TOKEN is configured.' },
      { status: 500 },
    )
  }
}
