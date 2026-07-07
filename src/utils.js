// 旧データ（文字列の配列）と新データ（{name, note} の配列）の両方を扱えるように正規化する
export function normalizeCharacters(characters) {
  if (!Array.isArray(characters)) return []
  return characters
    .map((c) => {
      if (typeof c === 'string') return { name: c, note: '' }
      if (c && typeof c === 'object') return { name: c.name || '', note: c.note || c.description || '' }
      return null
    })
    .filter((c) => c && c.name)
}

// Firestore の 1MB/ドキュメント制限内に収めるため、写真は保存前にリサイズ・JPEG圧縮する
export function compressImage(file, maxDim = 1000, quality = 0.72) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(new Error('画像の読み込みに失敗しました'))
    reader.onload = (ev) => {
      const img = new Image()
      img.onerror = () => reject(new Error('画像の読み込みに失敗しました'))
      img.onload = () => {
        const scale = Math.min(1, maxDim / Math.max(img.width, img.height))
        const canvas = document.createElement('canvas')
        canvas.width = Math.round(img.width * scale)
        canvas.height = Math.round(img.height * scale)
        canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height)

        let q = quality
        let dataUrl = canvas.toDataURL('image/jpeg', q)
        // base64 で 700KB を超える場合は品質を下げて再圧縮
        while (dataUrl.length > 700 * 1024 && q > 0.3) {
          q -= 0.12
          dataUrl = canvas.toDataURL('image/jpeg', q)
        }

        resolve({
          dataUrl,
          base64: dataUrl.split(',')[1],
          mediaType: 'image/jpeg',
          sizeKB: Math.round(dataUrl.length / 1024),
        })
      }
      img.src = ev.target.result
    }
    reader.readAsDataURL(file)
  })
}
