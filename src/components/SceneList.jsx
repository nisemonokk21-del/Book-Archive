import { useState, useEffect } from 'react'
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore'
import { db } from '../firebase'

const EMOTION_TAGS = ['怒り', '悲しみ', '喜び', '恐怖', '葛藤', '愛情', '孤独', '絶望', '希望', '嫉妬', '後悔', '驚き']

export default function SceneList({ user }) {
  const [scenes, setScenes] = useState([])
  const [books, setBooks] = useState({})
  const [loading, setLoading] = useState(true)
  const [filterEmotion, setFilterEmotion] = useState(null)
  const [expanded, setExpanded] = useState(null)

  useEffect(() => {
    const q = query(
      collection(db, 'scenes'),
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc')
    )
    const unsub = onSnapshot(q, (snap) => {
      setScenes(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
      setLoading(false)
    })
    return unsub
  }, [user.uid])

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'books'), (snap) => {
      const map = {}
      snap.docs.forEach((d) => { map[d.id] = d.data().title })
      setBooks(map)
    })
    return unsub
  }, [])

  const filtered = filterEmotion
    ? scenes.filter((s) => s.emotionTags?.includes(filterEmotion))
    : scenes

  return (
    <div>
      <div className="section-header">
        <span className="section-title">シーン一覧</span>
        <span className="count-badge">{filtered.length}件</span>
      </div>

      <div className="filter-bar">
        <button
          className={`filter-chip${!filterEmotion ? ' active' : ''}`}
          onClick={() => setFilterEmotion(null)}
        >すべて</button>
        {EMOTION_TAGS.map((tag) => (
          <button
            key={tag}
            className={`filter-chip${filterEmotion === tag ? ' active' : ''}`}
            onClick={() => setFilterEmotion(filterEmotion === tag ? null : tag)}
          >{tag}</button>
        ))}
      </div>

      {loading && <div style={{ color: 'var(--muted)', fontSize: 14, textAlign: 'center', padding: 32 }}>読み込み中...</div>}

      {!loading && filtered.length === 0 && (
        <div className="empty">
          <div className="empty-icon">✍️</div>
          <p>シーンはまだありません。<br />「シーンを追加」タブから記録できます。</p>
        </div>
      )}

      {filtered.map((scene) => (
        <SceneCard
          key={scene.id}
          scene={scene}
          bookTitle={books[scene.bookId] || ''}
          isExpanded={expanded === scene.id}
          onToggle={() => setExpanded(expanded === scene.id ? null : scene.id)}
        />
      ))}
    </div>
  )
}

function SceneCard({ scene, bookTitle, isExpanded, onToggle }) {
  return (
    <div className="card">
      {bookTitle && (
        <div style={{ fontSize: 11, color: 'var(--accent)', fontWeight: 600, marginBottom: 4, letterSpacing: '0.04em' }}>
          {bookTitle}
        </div>
      )}
      <div className="card-title">{scene.title || '無題のシーン'}</div>
      {scene.page && (
        <div className="card-sub">p.{scene.page}</div>
      )}

      <div className="tags">
        {scene.emotionTags?.map((t) => (
          <span key={t} className="tag tag-emotion">{t}</span>
        ))}
        {scene.sceneTags?.map((t) => (
          <span key={t} className="tag tag-scene">{t}</span>
        ))}
      </div>

      <button className="expand-btn" onClick={onToggle}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          {isExpanded
            ? <polyline points="18 15 12 9 6 15" />
            : <polyline points="6 9 12 15 18 9" />}
        </svg>
        {isExpanded ? '閉じる' : '詳細を見る'}
      </button>

      {isExpanded && (
        <div className="card-expand">
          {scene.description && (
            <div style={{ marginBottom: 12 }}>
              <div className="label" style={{ marginBottom: 6 }}>シーン説明</div>
              <div className="card-body">{scene.description}</div>
            </div>
          )}
          {scene.memo && (
            <div style={{ background: 'var(--bg)', borderRadius: 'var(--radius-sm)', padding: '12px 14px' }}>
              <div className="label" style={{ marginBottom: 6 }}>
                🔒 個人メモ
              </div>
              <div className="card-body">{scene.memo}</div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
