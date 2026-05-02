import QRCode from 'qrcode'

function formatField(tag: string, value: string) {
  const length = value.length.toString().padStart(2, '0')
  return `${tag}${length}${value}`
}

function crc16Ccitt(input: string) {
  let crc = 0xffff

  for (let index = 0; index < input.length; index++) {
    crc ^= input.charCodeAt(index) << 8
    for (let bit = 0; bit < 8; bit++) {
      if (crc & 0x8000) {
        crc = ((crc << 1) ^ 0x1021) & 0xffff
      } else {
        crc = (crc << 1) & 0xffff
      }
    }
  }

  return crc.toString(16).toUpperCase().padStart(4, '0')
}

export function buildPromptPayPayload(merchantId: string, amountSatang: number) {
  const amount = (amountSatang / 100).toFixed(2)
  const cleanedMerchantId = merchantId.trim()
  const payloadWithoutCrc = [
    formatField('00', '01'),
    formatField('01', '12'),
    formatField(
      '29',
      [
        formatField('00', 'A000000677010111'),
        formatField('01', cleanedMerchantId),
      ].join(''),
    ),
    formatField('52', '0000'),
    formatField('53', '764'),
    formatField('54', amount),
    formatField('58', 'TH'),
    '6304',
  ].join('')

  return `${payloadWithoutCrc}${crc16Ccitt(payloadWithoutCrc)}`
}

export async function buildPromptPayQrDataUrl(merchantId: string, amountSatang: number) {
  const payload = buildPromptPayPayload(merchantId, amountSatang)
  return QRCode.toDataURL(payload, {
    errorCorrectionLevel: 'M',
    margin: 1,
    scale: 8,
    type: 'image/png',
  })
}
