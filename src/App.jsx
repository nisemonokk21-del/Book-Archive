import { useState, useEffect } from 'react'
import { onAuthStateChanged, signOut } from 'firebase/auth'
import { auth } from './firebase'
import Auth from './components/Auth'
import TabNav from './components/TabNav'
import BookList from './components/BookList'
import SceneList from './components/SceneList'
import BookForm from './components/BookForm'
import SceneForm from './components/SceneForm'

export default function App() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  // view: { name: 'books' | 'scenes' | 'book-form' | 'scene-form', book?, scene?, bookId? }
  const [view, setView] = useState({ name: 'books' })
  const [toast, setToast] = useState(null)

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u)
      setLoading(false)
    })
    return unsub
  }, [])

  const showToast = (msg) => {
    setToast(msg)
    setTimeout(() => setToast(null), 2000)
  }

  if (loading) return <div className="loading">読み込み中...</div>
  if (!user) return <Auth />

  const activeTab = view.name === 'scenes' || (view.name === 'scene-form') ? 'scenes' : 'books'
  const isFormView = view.name === 'book-form' || view.name === 'scene-form'

  return (
    <div className="app">
      <header className="header">
        <span className="logo">SCRIPT VAULT</span>
        <button className="logout-btn" onClick={() => signOut(auth)}>ログアウト</button>
      </header>

      <main className="main">
        {view.name === 'books' && (
          <BookList
            user={user}
            onAdd={() => setView({ name: 'book-form' })}
            onEdit={(book) => setView({ name: 'book-form', book })}
            onAddScene={(bookId) => setView({ name: 'scene-form', bookId })}
            onViewScenes={(bookId) => setView({ name: 'scenes', bookId })}
            showToast={showToast}
          />
        )}

        {view.name === 'scenes' && (
          <SceneList
            user={user}
            initialBookId={view.bookId || ''}
            onAdd={() => setView({ name: 'scene-form' })}
            onEdit={(scene) => setView({ name: 'scene-form', scene })}
            onAddBook={() => setView({ name: 'book-form' })}
            showToast={showToast}
          />
        )}

        {view.name === 'book-form' && (
          <BookForm
            user={user}
            book={view.book}
            onDone={() => {
              setView({ name: 'books' })
              showToast(view.book ? '本を更新しました' : '本を追加しました')
            }}
            onCancel={() => setView({ name: 'books' })}
          />
        )}

        {view.name === 'scene-form' && (
          <SceneForm
            user={user}
            scene={view.scene}
            initialBookId={view.bookId || ''}
            onDone={() => {
              setView({ name: 'scenes' })
              showToast(view.scene ? 'シーンを更新しました' : 'シーンを追加しました')
            }}
            onCancel={() => setView({ name: 'scenes' })}
          />
        )}
      </main>

      {!isFormView && (
        <TabNav
          activeTab={activeTab}
          setActiveTab={(tab) => setView({ name: tab })}
        />
      )}

      {toast && <div className="toast">{toast}</div>}
    </div>
  )
}
