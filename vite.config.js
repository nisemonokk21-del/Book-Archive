import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// GitHub Pages のプロジェクトサイト（/Book-Archive/ 配下）で配信するための base 設定
export default defineConfig({
  plugins: [react()],
  base: '/Book-Archive/',
})
