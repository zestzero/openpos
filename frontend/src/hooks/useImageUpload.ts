import { useState } from 'react'
import { getToken } from '@/lib/auth'

const apiBaseUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:8080'

export type ImageUploadState =
  | { status: 'idle' }
  | { status: 'compressing' }
  | { status: 'uploading'; progress: number }
  | { status: 'done'; url: string }
  | { status: 'error'; message: string }

const MAX_DIMENSION = 1200
const JPEG_QUALITY = 0.82

/**
 * Compress an image File via canvas before upload.
 * Resizes to MAX_DIMENSION on the longest side and re-encodes as JPEG.
 */
async function compressImage(file: File): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const objectUrl = URL.createObjectURL(file)

    img.onload = () => {
      URL.revokeObjectURL(objectUrl)

      let { width, height } = img
      if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
        if (width >= height) {
          height = Math.round((height / width) * MAX_DIMENSION)
          width = MAX_DIMENSION
        } else {
          width = Math.round((width / height) * MAX_DIMENSION)
          height = MAX_DIMENSION
        }
      }

      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext('2d')
      if (!ctx) {
        reject(new Error('Canvas 2D context unavailable'))
        return
      }

      ctx.drawImage(img, 0, 0, width, height)
      canvas.toBlob(
        (blob) => {
          if (blob) resolve(blob)
          else reject(new Error('Canvas toBlob failed'))
        },
        'image/jpeg',
        JPEG_QUALITY,
      )
    }

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl)
      reject(new Error('Failed to load image'))
    }

    img.src = objectUrl
  })
}

/**
 * Hook that provides image selection, client-side compression,
 * and upload to POST /api/catalog/images.
 *
 * Returns [state, upload handler].
 */
export function useImageUpload(onSuccess: (url: string) => void) {
  const [state, setState] = useState<ImageUploadState>({ status: 'idle' })

  const upload = async (file: File) => {
    try {
      setState({ status: 'compressing' })
      const compressed = await compressImage(file)

      setState({ status: 'uploading', progress: 0 })

      const form = new FormData()
      // Use original filename but blob is JPEG after compression
      form.append('image', compressed, file.name.replace(/\.[^.]+$/, '.jpg'))

      const token = getToken()
      const response = await fetch(`${apiBaseUrl}/api/catalog/images`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: form,
      })

      if (!response.ok) {
        const body = await response.json().catch(() => ({}))
        throw new Error((body as { error?: string }).error ?? `Upload failed (${response.status})`)
      }

      const { url } = (await response.json()) as { url: string }
      setState({ status: 'done', url })
      onSuccess(url)
    } catch (err) {
      setState({ status: 'error', message: err instanceof Error ? err.message : 'Upload failed' })
    }
  }

  const reset = () => setState({ status: 'idle' })

  return { state, upload, reset }
}
