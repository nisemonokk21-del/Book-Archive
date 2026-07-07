import { useState, useEffect } from 'react'
import { collection, query, where, onSnapshot, doc, deleteDoc } from 'firebase/firestore'
import { db } from '../firebase'

const EMOTION_TAGS = ['怒り', '悲しみ', '喜び', '恐怖', '葛藤', '愛情', '孤独', '絶望', '希望', '嫉妬', '後悔', '驚き']

export default function SceneList({ user, initialBookId, onAdd, onEdit, onAddBook, showToast }) {
  const [scenes, setScenes] = useState([])
  const [books, setBooks] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filterEmotion, setFilterEmotion] = useState(null)
  const [filterBook, setFilterBook] = useState(initialBookId || '')
  const [search, setSearch] = useState('')
  const [expanded, setExpanded] = useState(null)

  useEffect(() => {
    // orderBy を組み合わせると複合インデックスが必要になるため、並び替えはクライアント側で行う
    const q = query(collection(db, 'scenes'), where('userId', '==', user.uid))
    const unsub = onSnapshot(
      q,
      (snap) => {
        const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
        list.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0))
        setScenes(list)
        setLoading(false)
        setError('')
      },
      (err) => {
        console.error(err)
        setError('シーンの読み込みに失敗しました。時間をおいて再度お試しください。')
        setLoading(false)
      }
    )
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

  const handleDelete = async (scene) => {
    if (!window.confirm(`「${scene.title || '無題のシーン'}」を削除しますか？`)) return
    try {
      await deleteDoc(doc(db, 'scenes', scene.id))
      showToast('シーンを削除しました')
    } catch (err) {
      console.error(err)
      showToast('削除に失敗しました')
    }
  }

  const keyword = search.trim().toLowerCase()
  const filtered = scenes.filter((s) => {
    if (filterBook && s.bookId !== filterBook) return false
    if (filterEmotion && !s.emotionTags?.includes(filterEmotion)) return false
    if (!keyword) return true
    return [s.title, s.description, s.memo, books[s.bookId]]
      .some((t) => (t || '').toLowerCase().includes(keyword))
  })

  return (
    <div>
      <div className="section-header">
        <span className="section-title">シーン</span>
        <div className="section-actions">
          <span className="count-badge">{filtered.length}件</span>
          <button className="btn btn-primary btn-sm" onClick={onAdd}>＋ シーンを追加</button>
        </div>
      </div>

      <div className="search-box">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <input
          className="search-input"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="タイトル・本文・メモで検索"
        />
        {search && (
          <button className="search-clear" onClick={() => setSearch('')}>×</button>
        )}
      </div>

      <select
        className="select"
        value={filterBook}
        onChange={(e) => setFilterBook(e.target.value)}
        style={{ marginBottom: 12 }}
      >
        <option value="">すべての本</option>
        {Object.entries(books).map(([id, title]) => (
          <option key={id} value={id}>{title}</option>
        ))}
      </select>

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

      {loading && <div className="list-loading">読み込み中...</div>}

      {error && <div className="auth-error" style={{ marginBottom: 12 }}>{error}</div>}

      {!loading && scenes.length === 0 && Object.keys(books).length === 0 && (
        <div className="empty">
          <div className="empty-icon">📚</div>
          <p>シーンを追加するには<br />まず本を登録してください。</p>
          <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={onAddBook}>
            本を追加する
          </button>
        </div>
      )}

      {!loading && scenes.length === 0 && Object.keys(books).length > 0 && (
        <div className="empty">
          <div className="empty-icon">✍️</div>
          <p>シーンはまだありません。<br />演じてみたい場面をストックしましょう。</p>
          <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={onAdd}>
            最初のシーンを追加する
          </button>
        </div>
      )}

      {!loading && scenes.length > 0 && filtered.length === 0 && (
        <div className="empty">
          <p style={{ fontSize: 14 }}>該当するシーンがありません</p>
        </div>
      )}

      {filtered.map((scene) => (
        <SceneCard
          key={scene.id}
          scene={scene}
          bookTitle={books[scene.bookId] || ''}
          isExpanded={expanded === scene.id}
          onToggle={() => setExpanded(expanded === scene.id ? null : scene.id)}
          onEdit={() => onEdit(scene)}
          onDelete={() => handleDelete(scene)}
        />
      ))}
    </div>
  )
}

function SceneCard({ scene, bookTitle, isExpanded, onToggle, onEdit, onDelete }) {
  return (
    <div className="card">
      <div className="card-head">
        <div className="card-head-main" onClick={onToggle}>
          {bookTitle && (
            <div style={{ fontSize: 11, color: 'var(--accent)', fontWeight: 600, marginBottom: 4, letterSpacing: '0.04em' }}>
              {bookTitle}
            </div>
          )}
          <div className="card-title">{scene.title || '無題のシーン'}</div>
          {scene.page && <div className="card-sub">p.{scene.page}</div>}
        </div>
        <div className="card-head-actions">
          <button className="icon-btn" onClick={onEdit} aria-label="編集">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
          </button>
          <button className="icon-btn icon-btn-danger" onClick={onDelete} aria-label="削除">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
            </svg>
          </button>
        </div>
      </div>

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
          {scene.photo && (
            <img src={scene.photo} alt="シーンの写真" className="scene-photo" />
          )}
          {scene.description && (
            <div style={{ marginBottom: 12 }}>
              <div className="label" style={{ marginBottom: 6 }}>シーン本文・説明</div>
              <div className="card-body" style={{ whiteSpace: 'pre-wrap' }}>{scene.description}</div>
            </div>
          )}
          {scene.memo && (
            <div style={{ background: 'var(--bg)', borderRadius: 'var(--radius-sm)', padding: '12px 14px' }}>
              <div className="label" style={{ marginBottom: 6 }}>
                🔒 個人メモ
              </div>
              <div className="card-body" style={{ whiteSpace: 'pre-wrap' }}>{scene.memo}</div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
