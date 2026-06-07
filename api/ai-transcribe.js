import Anthropic from '@anthropic-ai/sdk'

const ALLOWED_MEDIA_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { imageBase64, mediaType } = req.body || {}
  if (!imageBase64) {
    return res.status(400).json({ error: '画像データがありません' })
  }

  const safeMediaType = ALLOWED_MEDIA_TYPES.includes(mediaType) ? mediaType : 'image/jpeg'

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return res.status(500).json({ error: 'APIキーが設定されていません' })
  }

  const client = new Anthropic({ apiKey })

  try {
    const message = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2048,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: safeMediaType,
                data: imageBase64,
              },
            },
            {
              type: 'text',
              text: 'この画像に写っているテキストをすべて読み取って、そのまま書き起こしてください。本のページや手書きメモなど、見えるテキストをできる限り正確に転写してください。テキスト以外の説明は不要です。',
            },
          ],
        },
      ],
    })

    const text = message.content[0]?.text || ''
    return res.status(200).json({ text })
  } catch (err) {
    console.error('Transcribe error:', err)
    return res.status(500).json({ error: err.message || '文字起こし中にエラーが発生しました' })
  }
}
