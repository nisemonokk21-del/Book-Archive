import { useState, useEffect, useRef } from 'react'
import { collection, addDoc, serverTimestamp, onSnapshot } from 'firebase/firestore'
import { db } from '../firebase'

const EMOTION_TAGS = ['怒り', '悲しみ', '喜び', '恐怖', '葛藤', '愛情', '孤独', '絶望', '希望', '嫉妬', '後悔', '驚き']
const SCENE_TAGS = ['独白', '対話', '対立', '和解', '別れ', '再会', '告白', '嘘', '真実', '沈黙']

export default function AddScene({ user, onDone }) {
  const [form, setForm] = useState({
    bookId: '',
    title: '',
    page: '',
    description: '',
    emotionTags: [],
    sceneTags: [],
    memo: '',
  })
  const [books, setBooks] = useState([])
  const [saving, setSaving] = useState(false)
  const [photoLoading, setPhotoLoading] = useState(false)
  const [photoPreview, setPhotoPreview] = useState(null)
  const [photoError, setPhotoError] = useState('')
  const fileRef = useRef(null)

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'books'), (snap) => {
      setBooks(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
    })
    return unsub
  }, [])

  const set = (key, val) => setForm((f) => ({ ...f, [key]: val }))

  const toggleTag = (key, tag) => {
    setForm((f) => ({
      ...f,
      [key]: f[key].includes(tag) ? f[key].filter((t) => t !== tag) : [...f[key], tag],
    }))
  }

  const handlePhoto = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setPhotoError('')

    const reader = new FileReader()
    reader.onload = async (ev) => {
      const base64 = ev.target.result.split(',')[1]
      setPhotoPreview(ev.target.result)
      setPhotoLoading(true)
      try {
        const res = await fetch('/api/ai-transcribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ imageBase64: base64, mediaType: file.type }),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || '文字起こしに失敗しました')
        setForm((f) => ({ ...f, description: data.text || f.description }))
      } catch (err) {
        setPhotoError(err.message)
      } finally {
        setPhotoLoading(false)
      }
    }
    reader.readAsDataURL(file)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      await addDoc(collection(db, 'scenes'), {
        ...form,
        page: form.page ? Number(form.page) : null,
        userId: user.uid,
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
      <div className="form-title">シーンを追加</div>

      <form className="form" onSubmit={handleSubmit}>
        <div className="field">
          <label className="label">本を選択 *</label>
          <select
            className="select"
            value={form.bookId}
            onChange={(e) => set('bookId', e.target.value)}
            required
          >
            <option value="">本を選んでください</option>
            {books.map((b) => (
              <option key={b.id} value={b.id}>{b.title}</option>
            ))}
          </select>
        </div>

        <div className="field">
          <label className="label">シーンタイトル</label>
          <input
            className="input"
            value={form.title}
            onChange={(e) => set('title', e.target.value)}
            placeholder="例：主人公が手紙を読む場面"
          />
        </div>

        <div className="field">
          <label className="label">ページ数</label>
          <input
            className="input"
            type="number"
            value={form.page}
            onChange={(e) => set('page', e.target.value)}
            placeholder="例：123"
            min={1}
            style={{ maxWidth: 120 }}
          />
        </div>

        <div className="field">
          <label className="label">シーン説明</label>

          <div
            className="photo-capture"
            onClick={() => fileRef.current?.click()}
            style={{ marginBottom: 10 }}
          >
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handlePhoto}
            />
            {photoPreview ? (
              <img src={photoPreview} alt="撮影した画像" className="photo-preview" />
            ) : null}
            {photoLoading ? (
              <div style={{ color: 'var(--muted)', fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                <span className="spinner spinner-dark" />文字起こし中...
              </div>
            ) : (
              <div style={{ color: 'var(--muted)', fontSize: 13 }}>
                <div style={{ fontSize: 24, marginBottom: 6 }}>📷</div>
                {photoPreview ? '別の写真を撮る' : 'カメラで撮影して文字起こし'}
              </div>
            )}
          </div>

          {photoError && (
            <div className="auth-error" style={{ marginBottom: 8 }}>{photoError}</div>
          )}

          <textarea
            className="textarea"
            value={form.description}
            onChange={(e) => set('description', e.target.value)}
            placeholder="シーンの内容・描写（写真撮影で自動入力も可）"
            style={{ minHeight: 100 }}
          />
        </div>

        <div className="field">
          <label className="label">感情タグ</label>
          <div className="tag-selector">
            {EMOTION_TAGS.map((tag) => (
              <button
                key={tag}
                type="button"
                className={`tag-option${form.emotionTags.includes(tag) ? ' selected-emotion' : ''}`}
                onClick={() => toggleTag('emotionTags', tag)}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>

        <div className="field">
          <label className="label">シーンタグ</label>
          <div className="tag-selector">
            {SCENE_TAGS.map((tag) => (
              <button
                key={tag}
                type="button"
                className={`tag-option${form.sceneTags.includes(tag) ? ' selected' : ''}`}
                onClick={() => toggleTag('sceneTags', tag)}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>

        <div className="field">
          <label className="label">個人メモ・感想</label>
          <textarea
            className="textarea"
            value={form.memo}
            onChange={(e) => set('memo', e.target.value)}
            placeholder="このシーンへの感想や気づき..."
            style={{ minHeight: 80 }}
          />
          <div className="memo-note">
            <span className="lock-icon">🔒</span>
            自分だけに見えるメモです
          </div>
        </div>

        <button
          type="submit"
          className="btn btn-primary btn-full"
          disabled={saving || !form.bookId}
        >
          {saving ? <><span className="spinner" />保存中...</> : 'シーンを追加する'}
        </button>
      </form>
    </div>
  )
}
