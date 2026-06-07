import { useState } from 'react'
import { collection, addDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../firebase'

const GENRES = ['恋愛小説', 'ミステリー', 'SF', 'ファンタジー', '純文学', '青春小説', 'ホラー', '歴史小説', 'ノンフィクション', 'その他']

export default function AddBook({ onDone }) {
  const [form, setForm] = useState({
    title: '',
    author: '',
    genre: '',
    synopsis: '',
    characters: [],
  })
  const [charInput, setCharInput] = useState('')
  const [saving, setSaving] = useState(false)
  const [aiLoading, setAiLoading] = useState(false)
  const [aiError, setAiError] = useState('')

  const set = (key, val) => setForm((f) => ({ ...f, [key]: val }))

  const addChar = () => {
    const v = charInput.trim()
    if (v && !form.characters.includes(v)) {
      set('characters', [...form.characters, v])
    }
    setCharInput('')
  }

  const removeChar = (c) => set('characters', form.characters.filter((x) => x !== c))

  const handleAiSummary = async () => {
    if (!form.title) { setAiError('タイトルを入力してください'); return }
    setAiError('')
    setAiLoading(true)
    try {
      const res = await fetch('/api/ai-book-summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: form.title, author: form.author }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'AI処理に失敗しました')
      setForm((f) => ({
        ...f,
        synopsis: data.synopsis || f.synopsis,
        characters: data.characters?.length ? data.characters : f.characters,
      }))
    } catch (err) {
      setAiError(err.message)
    } finally {
      setAiLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.title) return
    setSaving(true)
    try {
      await addDoc(collection(db, 'books'), {
        ...form,
        createdAt: serverTimestamp(),
      })
      onDone()
    } catch (err) {
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      <div className="form-title">本を追加</div>

      <div className="ai-box" style={{ marginBottom: 24 }}>
        <div className="ai-box-title">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" /><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" /><line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
          AIまとめ機能
        </div>
        <p style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 12, lineHeight: 1.6 }}>
          タイトルと著者名を入力して「AIでまとめる」を押すと、あらすじと登場人物を自動生成します。
        </p>
        {aiError && (
          <div className="auth-error" style={{ marginBottom: 10 }}>{aiError}</div>
        )}
        <button
          type="button"
          className="btn btn-secondary btn-sm"
          onClick={handleAiSummary}
          disabled={aiLoading}
        >
          {aiLoading
            ? <><span className="spinner spinner-dark" />生成中...</>
            : '✦ AIでまとめる'}
        </button>
      </div>

      <form className="form" onSubmit={handleSubmit}>
        <div className="field">
          <label className="label">タイトル *</label>
          <input
            className="input"
            value={form.title}
            onChange={(e) => set('title', e.target.value)}
            placeholder="例：コーヒーが冷めないうちに"
            required
          />
        </div>

        <div className="field">
          <label className="label">著者名</label>
          <input
            className="input"
            value={form.author}
            onChange={(e) => set('author', e.target.value)}
            placeholder="例：川口俊和"
          />
        </div>

        <div className="field">
          <label className="label">ジャンル</label>
          <select className="select" value={form.genre} onChange={(e) => set('genre', e.target.value)}>
            <option value="">選択してください</option>
            {GENRES.map((g) => <option key={g} value={g}>{g}</option>)}
          </select>
        </div>

        <div className="field">
          <label className="label">あらすじ</label>
          <textarea
            className="textarea"
            value={form.synopsis}
            onChange={(e) => set('synopsis', e.target.value)}
            placeholder="本のあらすじを入力（AIで自動生成も可能）"
            style={{ minHeight: 100 }}
          />
        </div>

        <div className="field">
          <label className="label">登場人物</label>
          <div className="char-input-row">
            <input
              className="input"
              value={charInput}
              onChange={(e) => setCharInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addChar())}
              placeholder="人物名を入力してEnter"
            />
            <button type="button" className="btn btn-ghost btn-sm" onClick={addChar}>追加</button>
          </div>
          {form.characters.length > 0 && (
            <div className="char-list">
              {form.characters.map((c) => (
                <span key={c} className="char-item">
                  {c}
                  <button type="button" className="char-remove" onClick={() => removeChar(c)}>×</button>
                </span>
              ))}
            </div>
          )}
        </div>

        <button
          type="submit"
          className="btn btn-primary btn-full"
          disabled={saving || !form.title}
        >
          {saving ? <><span className="spinner" />保存中...</> : '本を追加する'}
        </button>
      </form>
    </div>
  )
}
