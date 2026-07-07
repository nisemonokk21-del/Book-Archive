import { useState, useEffect } from 'react'
import { collection, query, where, orderBy, onSnapshot, doc, deleteDoc, getDocs, writeBatch } from 'firebase/firestore'
import { db } from '../firebase'
import { normalizeCharacters } from '../utils'

const GENRES = ['すべて', '恋愛小説', 'ミステリー', 'SF', 'ファンタジー', '純文学', '青春小説', 'ホラー', '歴史小説', 'ノンフィクション', '戯曲・脚本', 'その他']

export default function BookList({ user, onAdd, onEdit, onAddScene, onViewScenes, showToast }) {
  const [books, setBooks] = useState([])
  const [sceneCounts, setSceneCounts] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [genre, setGenre] = useState('すべて')
  const [search, setSearch] = useState('')
  const [expanded, setExpanded] = useState(null)

  useEffect(() => {
    const q = query(collection(db, 'books'), orderBy('createdAt', 'desc'))
    const unsub = onSnapshot(
      q,
      (snap) => {
        setBooks(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
        setLoading(false)
        setError('')
      },
      (err) => {
        console.error(err)
        setError('本の読み込みに失敗しました。時間をおいて再度お試しください。')
        setLoading(false)
      }
    )
    return unsub
  }, [])

  useEffect(() => {
    const q = query(collection(db, 'scenes'), where('userId', '==', user.uid))
    const unsub = onSnapshot(q, (snap) => {
      const counts = {}
      snap.docs.forEach((d) => {
        const bookId = d.data().bookId
        if (bookId) counts[bookId] = (counts[bookId] || 0) + 1
      })
      setSceneCounts(counts)
    })
    return unsub
  }, [user.uid])

  const handleDelete = async (book) => {
    const count = sceneCounts[book.id] || 0
    const msg = count > 0
      ? `「${book.title}」を削除しますか？\n登録済みのシーン${count}件も一緒に削除されます。`
      : `「${book.title}」を削除しますか？`
    if (!window.confirm(msg)) return

    try {
      const scenesSnap = await getDocs(
        query(collection(db, 'scenes'), where('userId', '==', user.uid), where('bookId', '==', book.id))
      )
      const batch = writeBatch(db)
      scenesSnap.docs.forEach((d) => batch.delete(d.ref))
      batch.delete(doc(db, 'books', book.id))
      await batch.commit()
      showToast('本を削除しました')
    } catch (err) {
      console.error(err)
      showToast('削除に失敗しました')
    }
  }

  const keyword = search.trim().toLowerCase()
  const filtered = books.filter((b) => {
    if (genre !== 'すべて' && b.genre !== genre) return false
    if (!keyword) return true
    const chars = normalizeCharacters(b.characters).map((c) => c.name).join(' ')
    return [b.title, b.author, b.synopsis, chars]
      .some((t) => (t || '').toLowerCase().includes(keyword))
  })

  return (
    <div>
      <div className="section-header">
        <span className="section-title">本棚</span>
        <div className="section-actions">
          <span className="count-badge">{filtered.length}冊</span>
          <button className="btn btn-primary btn-sm" onClick={onAdd}>＋ 本を追加</button>
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
          placeholder="タイトル・著者・人物名で検索"
        />
        {search && (
          <button className="search-clear" onClick={() => setSearch('')}>×</button>
        )}
      </div>

      <div className="filter-bar">
        {GENRES.map((g) => (
          <button
            key={g}
            className={`filter-chip${genre === g ? ' active' : ''}`}
            onClick={() => setGenre(g)}
          >
            {g}
          </button>
        ))}
      </div>

      {loading && <div className="list-loading">読み込み中...</div>}

      {error && <div className="auth-error" style={{ marginBottom: 12 }}>{error}</div>}

      {!loading && books.length === 0 && (
        <div className="empty">
          <div className="empty-icon">📚</div>
          <p>まだ本が登録されていません。<br />ワークショップの題材をストックしましょう。</p>
          <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={onAdd}>
            最初の本を追加する
          </button>
        </div>
      )}

      {!loading && books.length > 0 && filtered.length === 0 && (
        <div className="empty">
          <p style={{ fontSize: 14 }}>該当する本がありません</p>
        </div>
      )}

      {filtered.map((book) => (
        <BookCard
          key={book.id}
          book={book}
          sceneCount={sceneCounts[book.id] || 0}
          isExpanded={expanded === book.id}
          onToggle={() => setExpanded(expanded === book.id ? null : book.id)}
          onEdit={() => onEdit(book)}
          onDelete={() => handleDelete(book)}
          onAddScene={() => onAddScene(book.id)}
          onViewScenes={() => onViewScenes(book.id)}
        />
      ))}
    </div>
  )
}

function BookCard({ book, sceneCount, isExpanded, onToggle, onEdit, onDelete, onAddScene, onViewScenes }) {
  const characters = normalizeCharacters(book.characters)

  return (
    <div className="card">
      <div className="card-head">
        <div className="card-head-main" onClick={onToggle}>
          <div className="card-title">{book.title}</div>
          {book.author && <div className="card-sub">{book.author}</div>}
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
        {book.genre && <span className="tag tag-genre">{book.genre}</span>}
        {sceneCount > 0 && <span className="tag tag-scene">シーン {sceneCount}件</span>}
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
          {book.synopsis && (
            <div style={{ marginBottom: 14 }}>
              <div className="label" style={{ marginBottom: 6 }}>あらすじ</div>
              <div className="card-body">{book.synopsis}</div>
            </div>
          )}

          {characters.length > 0 && (
            <div style={{ marginBottom: 14 }}>
              <div className="label" style={{ marginBottom: 6 }}>登場人物</div>
              <div className="char-detail-list">
                {characters.map((c, i) => (
                  <div key={i} className="char-detail">
                    <span className="char-detail-name">{c.name}</span>
                    {c.note && <span className="char-detail-note">{c.note}</span>}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="card-actions">
            <button className="btn btn-secondary btn-sm" onClick={onAddScene}>＋ シーンを追加</button>
            {sceneCount > 0 && (
              <button className="btn btn-ghost btn-sm" onClick={onViewScenes}>シーンを見る（{sceneCount}）</button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
