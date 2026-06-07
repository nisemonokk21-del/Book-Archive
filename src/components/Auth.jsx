import { useState } from 'react'
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from 'firebase/auth'
import { auth } from '../firebase'

export default function Auth() {
  const [mode, setMode] = useState('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      if (mode === 'login') {
        await signInWithEmailAndPassword(auth, email, password)
      } else {
        await createUserWithEmailAndPassword(auth, email, password)
      }
    } catch (err) {
      setError(getErrorMsg(err.code))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-logo">SCRIPT VAULT</div>
      <div className="auth-sub">本とシーンの記録庫</div>

      <div style={{ width: '100%', maxWidth: 360, marginBottom: 32, display: 'flex', flexDirection: 'column', gap: 10 }}>
        {[
          { icon: '📚', text: '本を登録してあらすじ・登場人物をまとめる' },
          { icon: '✍️', text: '印象的なシーンをページ・感情タグで記録' },
          { icon: '🔒', text: '感想メモは自分だけに見える個人データ' },
        ].map(({ icon, text }) => (
          <div key={text} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', background: 'var(--bg)', borderRadius: 'var(--radius-sm)', fontSize: 13, color: 'var(--muted)' }}>
            <span style={{ fontSize: 18 }}>{icon}</span>
            {text}
          </div>
        ))}
      </div>

      <form className="auth-form" onSubmit={handleSubmit}>
        {error && <div className="auth-error">{error}</div>}

        <div className="field">
          <label className="label">メールアドレス</label>
          <input
            className="input"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            required
            autoComplete="email"
          />
        </div>

        <div className="field">
          <label className="label">パスワード</label>
          <input
            className="input"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="6文字以上"
            required
            minLength={6}
            autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
          />
        </div>

        <button className="btn btn-primary btn-full" type="submit" disabled={loading}>
          {loading ? <><span className="spinner" />処理中...</> : mode === 'login' ? 'ログイン' : '新規登録'}
        </button>
      </form>

      <div className="auth-toggle">
        {mode === 'login' ? (
          <>アカウントをお持ちでない方は{' '}
            <button onClick={() => { setMode('register'); setError('') }}>新規登録</button>
          </>
        ) : (
          <>すでにアカウントをお持ちの方は{' '}
            <button onClick={() => { setMode('login'); setError('') }}>ログイン</button>
          </>
        )}
      </div>
    </div>
  )
}

function getErrorMsg(code) {
  const map = {
    'auth/user-not-found': 'メールアドレスが見つかりません',
    'auth/wrong-password': 'パスワードが正しくありません',
    'auth/invalid-credential': 'メールアドレスまたはパスワードが正しくありません',
    'auth/email-already-in-use': 'このメールアドレスはすでに使用されています',
    'auth/weak-password': 'パスワードは6文字以上で設定してください',
    'auth/invalid-email': 'メールアドレスの形式が正しくありません',
    'auth/too-many-requests': 'しばらく時間をおいてから再度お試しください',
  }
  return map[code] || '予期しないエラーが発生しました'
}
