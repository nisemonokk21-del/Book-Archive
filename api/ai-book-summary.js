import Anthropic from '@anthropic-ai/sdk'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { title, author } = req.body || {}
  if (!title) {
    return res.status(400).json({ error: 'タイトルは必須です' })
  }

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return res.status(500).json({ error: 'APIキーが設定されていません' })
  }

  const client = new Anthropic({ apiKey })

  const prompt = `以下の本のあらすじと主要登場人物を日本語でまとめてください。

タイトル：${title}
${author ? `著者：${author}` : ''}

以下のJSON形式で回答してください（マークダウンコードブロックなし）：
{
  "synopsis": "200字程度のあらすじ",
  "characters": ["登場人物1", "登場人物2", "登場人物3"]
}

実在の本でない場合や情報が不明な場合は、タイトルから想像した内容でも構いません。`

  try {
    const message = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      messages: [{ role: 'user', content: prompt }],
    })

    const text = message.content[0]?.text || ''
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) throw new Error('JSONの解析に失敗しました')

    const result = JSON.parse(jsonMatch[0])
    return res.status(200).json({
      synopsis: result.synopsis || '',
      characters: Array.isArray(result.characters) ? result.characters : [],
    })
  } catch (err) {
    console.error('AI summary error:', err)
    return res.status(500).json({ error: err.message || 'AI処理中にエラーが発生しました' })
  }
}
