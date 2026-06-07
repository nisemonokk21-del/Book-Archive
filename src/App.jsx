import { useState, useEffect } from 'react'
import { onAuthStateChanged, signOut } from 'firebase/auth'
import { auth } from './firebase'
import Auth from './components/Auth'
import TabNav from './components/TabNav'
import BookList from './components/BookList'
import SceneList from './components/SceneList'
import AddBook from './components/AddBook'
import AddScene from './components/AddScene'

export default function App() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('books')
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

  return (
    <div className="app">
      <header className="header">
        <span className="logo">SCRIPT VAULT</span>
        <button className="logout-btn" onClick={() => signOut(auth)}>ログアウト</button>
      </header>

      <main className="main">
        {activeTab === 'books' && <BookList />}
        {activeTab === 'scenes' && <SceneList user={user} />}
        {activeTab === 'add-book' && (
          <AddBook onDone={() => { setActiveTab('books'); showToast('本を追加しました') }} />
        )}
        {activeTab === 'add-scene' && (
          <AddScene user={user} onDone={() => { setActiveTab('scenes'); showToast('シーンを追加しました') }} />
        )}
      </main>

      <TabNav activeTab={activeTab} setActiveTab={setActiveTab} />

      {toast && <div className="toast">{toast}</div>}
    </div>
  )
}
