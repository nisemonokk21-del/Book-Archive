import { useState, useEffect } from 'react'
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore'
import { db } from '../firebase'

const GENRES = ['すべて', '恋愛小説', 'ミステリー', 'SF', 'ファンタジー', '純文学', '青春小説', 'ホラー', '歴史小説', 'ノンフィクション', 'その他']

export default function BookList() {
  const [books, setBooks] = useState([])
  const [loading, setLoading] = useState(true)
  const [genre, setGenre] = useState('すべて')
  const [expanded, setExpanded] = useState(null)

  useEffect(() => {
    const q = query(collection(db, 'books'), orderBy('createdAt', 'desc'))
    const unsub = onSnapshot(q, (snap) => {
      setBooks(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
      setLoading(false)
    })
    return unsub
  }, [])

  const filtered = genre === 'すべて' ? books : books.filter((b) => b.genre === genre)

  return (
    <div>
      <div className="section-header">
        <span className="section-title">本一覧</span>
        <span className="count-badge">{filtered.length}冊</span>
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

      {loading && <div style={{ color: 'var(--muted)', fontSize: 14, textAlign: 'center', padding: 32 }}>読み込み中...</div>}

      {!loading && filtered.length === 0 && (
        <div className="empty">
          <div className="empty-icon">📚</div>
          <p>まだ本が登録されていません。<br />「本を追加」タブから追加できます。</p>
        </div>
      )}

      {filtered.map((book) => (
        <BookCard
          key={book.id}
          book={book}
          isExpanded={expanded === book.id}
          onToggle={() => setExpanded(expanded === book.id ? null : book.id)}
        />
      ))}
    </div>
  )
}

function BookCard({ book, isExpanded, onToggle }) {
  return (
    <div className="card">
      <div className="card-title">{book.title}</div>
      <div className="card-sub">{book.author}</div>

      {book.genre && (
        <div className="tags">
          <span className="tag tag-genre">{book.genre}</span>
        </div>
      )}

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
            <div style={{ marginBottom: 12 }}>
              <div className="label" style={{ marginBottom: 6 }}>あらすじ</div>
              <div className="card-body">{book.synopsis}</div>
            </div>
          )}
          {book.characters && book.characters.length > 0 && (
            <div>
              <div className="label" style={{ marginBottom: 6 }}>登場人物</div>
              <div className="tags">
                {book.characters.map((c, i) => (
                  <span key={i} className="tag tag-character">{c}</span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
