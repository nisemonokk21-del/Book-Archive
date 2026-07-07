import { useState, useEffect, useRef } from 'react'
import { collection, addDoc, doc, updateDoc, serverTimestamp, query, orderBy, onSnapshot } from 'firebase/firestore'
import { db } from '../firebase'
import { compressImage } from '../utils'

const EMOTION_TAGS = ['怒り', '悲しみ', '喜び', '恐怖', '葛藤', '愛情', '孤独', '絶望', '希望', '嫉妬', '後悔', '驚き']
const SCENE_TAGS = ['独白', '対話', '対立', '和解', '別れ', '再会', '告白', '嘘', '真実', '沈黙']

export default function SceneForm({ user, scene, initialBookId, onDone, onCancel }) {
  const isEdit = !!scene
  const [form, setForm] = useState({
    bookId: scene?.bookId || initialBookId || '',
    title: scene?.title || '',
    page: scene?.page != null ? String(scene.page) : '',
    description: scene?.description || '',
    emotionTags: scene?.emotionTags || [],
    sceneTags: scene?.sceneTags || [],
    memo: scene?.memo || '',
    photo: scene?.photo || null,
  })
  const [books, setBooks] = useState([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [photoLoading, setPhotoLoading] = useState(false)
  const [photoError, setPhotoError] = useState('')
  const fileRef = useRef(null)

  useEffect(() => {
    const q = query(collection(db, 'books'), orderBy('createdAt', 'desc'))
    const unsub = onSnapshot(q, (snap) => {
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
    e.target.value = ''
    setPhotoError('')
    setPhotoLoading(true)
    try {
      // 圧縮してから保存・文字起こしに使う（Firestoreの1MB制限と無料枠の節約のため）
      const compressed = await compressImage(file)
      set('photo', compressed.dataUrl)

      const res = await fetch('/api/ai-transcribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64: compressed.base64, mediaType: compressed.mediaType }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || '文字起こしに失敗しました')
      if (data.text) {
        setForm((f) => ({
          ...f,
          description: f.description ? `${f.description}\n${data.text}` : data.text,
        }))
      }
    } catch (err) {
      setPhotoError(err.message)
    } finally {
      setPhotoLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.bookId) return
    setSaving(true)
    setError('')
    try {
      const data = {
        ...form,
        page: form.page ? Number(form.page) : null,
        updatedAt: serverTimestamp(),
      }
      if (isEdit) {
        await updateDoc(doc(db, 'scenes', scene.id), data)
      } else {
        await addDoc(collection(db, 'scenes'), {
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
        <div className="form-title" style={{ marginBottom: 0 }}>{isEdit ? 'シーンを編集' : 'シーンを追加'}</div>
      </div>

      {error && <div className="auth-error" style={{ marginBottom: 16 }}>{error}</div>}

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
            {form.bookId && !books.some((b) => b.id === form.bookId) && (
              <option value={form.bookId}>読み込み中...</option>
            )}
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
          <label className="label">シーン本文・説明</label>

          <div
            className="photo-capture"
            onClick={() => !photoLoading && fileRef.current?.click()}
            style={{ marginBottom: 10 }}
          >
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handlePhoto}
            />
            {form.photo && (
              <img src={form.photo} alt="撮影したページ" className="photo-preview" />
            )}
            {photoLoading ? (
              <div style={{ color: 'var(--muted)', fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                <span className="spinner spinner-dark" />文字起こし中...
              </div>
            ) : (
              <div style={{ color: 'var(--muted)', fontSize: 13 }}>
                <div style={{ fontSize: 24, marginBottom: 6 }}>📷</div>
                {form.photo ? '別の写真を撮る' : 'ページを撮影して文字起こし'}
              </div>
            )}
          </div>

          {form.photo && !photoLoading && (
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={() => set('photo', null)}
              style={{ alignSelf: 'flex-start', marginBottom: 8 }}
            >
              写真を削除（文字だけ保存）
            </button>
          )}

          {photoError && (
            <div className="auth-error" style={{ marginBottom: 8 }}>{photoError}</div>
          )}

          <textarea
            className="textarea"
            value={form.description}
            onChange={(e) => set('description', e.target.value)}
            placeholder="シーンの本文・描写（写真撮影で自動入力も可）"
            style={{ minHeight: 100 }}
          />
          <p className="field-hint">
            写真は自動で圧縮して保存されます。文字起こしだけ残して写真を削除すると、保存容量をほぼ使いません。
          </p>
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
            placeholder="このシーンへの感想や演じる時の気づき..."
            style={{ minHeight: 80 }}
          />
          <div className="memo-note">
            <span className="lock-icon">🔒</span>
            自分だけに見えるメモです
          </div>
        </div>

        <div className="form-footer">
          <button type="button" className="btn btn-ghost" onClick={onCancel}>キャンセル</button>
          <button
            type="submit"
            className="btn btn-primary"
            style={{ flex: 1 }}
            disabled={saving || !form.bookId}
          >
            {saving
              ? <><span className="spinner" />保存中...</>
              : isEdit ? '変更を保存する' : 'シーンを追加する'}
          </button>
        </div>
      </form>
    </div>
  )
}
