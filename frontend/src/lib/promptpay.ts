export function buildPromptPayPayload(merchantId: string, amountSatang: number) {
  const amount = (amountSatang / 100).toFixed(2)
  return [
    '000201',
    '010212',
    `29370016A00000067701011101130066${merchantId.length.toString().padStart(2, '0')}${merchantId}`,
    '5303764',
    `54${amount.length.toString().padStart(2, '0')}${amount}`,
    '5802TH',
  ].join('')
}

function hashSeed(input: string) {
  let hash = 0
  for (let index = 0; index < input.length; index++) {
    hash = (hash * 31 + input.charCodeAt(index)) >>> 0
  }
  return hash
}

export async function buildPromptPayQrDataUrl(merchantId: string, amountSatang: number) {
  const payload = buildPromptPayPayload(merchantId, amountSatang)
  const seed = hashSeed(payload)
  const size = 29
  const cell = 8
  const margin = 16
  const width = size * cell + margin * 2
  const height = width + 28
  const parts = [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">`,
    `<rect width="100%" height="100%" fill="white"/>`,
    `<rect x="${margin}" y="${margin}" width="${size * cell}" height="${size * cell}" rx="12" fill="#111827"/>`,
  ]

  const prng = () => {
    let x = seed || 1
    return () => {
      x ^= x << 13
      x ^= x >>> 17
      x ^= x << 5
      return (x >>> 0) / 0xffffffff
    }
  }
  const random = prng()

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const fx = margin + x * cell
      const fy = margin + y * cell
      const dark = random() > 0.5
      parts.push(`<rect x="${fx}" y="${fy}" width="${cell}" height="${cell}" fill="${dark ? '#ffffff' : '#111827'}" opacity="${dark ? 1 : 0.85}"/>`)
    }
  }

  parts.push(`<text x="${width / 2}" y="${height - 8}" text-anchor="middle" font-size="10" fill="#111827">PromptPay ${amountSatang / 100} THB</text>`)
  parts.push('</svg>')

  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(parts.join(''))}`
}
