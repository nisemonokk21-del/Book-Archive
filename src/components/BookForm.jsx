import { useState } from 'react'
import { collection, addDoc, doc, updateDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../firebase'
import { normalizeCharacters } from '../utils'

const GENRES = ['恋愛小説', 'ミステリー', 'SF', 'ファンタジー', '純文学', '青春小説', 'ホラー', '歴史小説', 'ノンフィクション', '戯曲・脚本', 'その他']

export default function BookForm({ user, book, onDone, onCancel }) {
  const isEdit = !!book
  const [form, setForm] = useState({
    title: book?.title || '',
    author: book?.author || '',
    genre: book?.genre || '',
    synopsis: book?.synopsis || '',
    characters: normalizeCharacters(book?.characters),
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const set = (key, val) => setForm((f) => ({ ...f, [key]: val }))

  const addChar = () => set('characters', [...form.characters, { name: '', note: '' }])

  const updateChar = (index, key, val) => {
    set('characters', form.characters.map((c, i) => (i === index ? { ...c, [key]: val } : c)))
  }

  const removeChar = (index) => {
    set('characters', form.characters.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.title) return
    setSaving(true)
    try {
      const data = {
        ...form,
        characters: form.characters
          .map((c) => ({ name: c.name.trim(), note: c.note.trim() }))
          .filter((c) => c.name),
        updatedAt: serverTimestamp(),
      }
      if (isEdit) {
        await updateDoc(doc(db, 'books', book.id), data)
      } else {
        await addDoc(collection(db, 'books'), {
          ...data,
          userId: user.uid,
          createdAt: serverTimestamp(),
        })
      }
      onDone()
    } catch (err) {
      console.error(err)
      setError('保存に失敗しました。通信環境を確認してください。')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      <div className="form-header">
        <button type="button" className="back-btn" onClick={onCancel}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
          戻る
        </button>
        <div className="form-title" style={{ marginBottom: 0 }}>{isEdit ? '本を編集' : '本を追加'}</div>
      </div>

      {error && (
        <div className="auth-error" style={{ marginBottom: 16 }}>{error}</div>
      )}

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
          {form.characters.length === 0 && (
            <p className="field-hint">「＋ 人物を追加」から名前と役柄・特徴を登録できます</p>
          )}
          {form.characters.map((c, i) => (
            <div key={i} className="char-row">
              <div className="char-row-head">
                <input
                  className="input"
                  value={c.name}
                  onChange={(e) => updateChar(i, 'name', e.target.value)}
                  placeholder="人物名（例：数）"
                />
                <button
                  type="button"
                  className="icon-btn icon-btn-danger"
                  onClick={() => removeChar(i)}
                  aria-label="人物を削除"
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>
              <textarea
                className="textarea char-note"
                value={c.note}
                onChange={(e) => updateChar(i, 'note', e.target.value)}
                placeholder="役柄・年齢・性格・関係性など（任意）"
              />
            </div>
          ))}
          <button type="button" className="btn btn-ghost btn-sm" onClick={addChar} style={{ alignSelf: 'flex-start' }}>
            ＋ 人物を追加
          </button>
        </div>

        <div className="form-footer">
          <button type="button" className="btn btn-ghost" onClick={onCancel}>キャンセル</button>
          <button
            type="submit"
            className="btn btn-primary"
            style={{ flex: 1 }}
            disabled={saving || !form.title}
          >
            {saving
              ? <><span className="spinner" />保存中...</>
              : isEdit ? '変更を保存する' : '本を追加する'}
          </button>
        </div>
      </form>
    </div>
  )
}
