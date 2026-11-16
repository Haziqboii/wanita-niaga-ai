import { describe, it, expect } from 'vitest'
import { renderToString } from 'react-dom/server'
import { InstallPwaBanner } from '../components/InstallPwaBanner'
import fs from 'fs'
import path from 'path'

describe('Install PWA Suite (Pilihan 1 - Apple Style)', () => {
  it('1. Component renders cleanly via SSR without crashing', () => {
    const html = renderToString(<InstallPwaBanner />)
    expect(html).toBeDefined()
  })

  it('2. Web App Manifest exists with required PWA metadata', () => {
    const manifestPath = path.resolve('public/manifest.webmanifest')
    expect(fs.existsSync(manifestPath)).toBe(true)

    const manifestContent = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'))
    expect(manifestContent.name).toBe('Mekara — Pengurusan Jualan & Untung')
    expect(manifestContent.short_name).toBe('Mekara')
    expect(manifestContent.display).toBe('standalone')
    expect(manifestContent.theme_color).toBe('#800020')
    expect(manifestContent.background_color).toBe('#FAF6F0')
    expect(manifestContent.icons.length).toBeGreaterThanOrEqual(2)
  })

  it('3. Service worker file exists for offline PWA installability', () => {
    const swPath = path.resolve('public/sw.js')
    expect(fs.existsSync(swPath)).toBe(true)

    const swContent = fs.readFileSync(swPath, 'utf-8')
    expect(swContent).toContain('CACHE_NAME')
    expect(swContent).toContain('install')
    expect(swContent).toContain('activate')
    expect(swContent).toContain('fetch')
  })

  it('4. index.html includes Apple PWA meta tags and manifest link', () => {
    const indexPath = path.resolve('index.html')
    const indexContent = fs.readFileSync(indexPath, 'utf-8')

    expect(indexContent).toContain('manifest.webmanifest')
    expect(indexContent).toContain('apple-mobile-web-app-capable')
    expect(indexContent).toContain('apple-mobile-web-app-title')
    expect(indexContent).toContain('theme-color')
    expect(indexContent).toContain('apple-touch-icon')
    expect(indexContent).toContain('/sw.js')
  })

  it('5. PWA icons exist in required resolutions', () => {
    expect(fs.existsSync(path.resolve('public/images/icon-192.png'))).toBe(true)
    expect(fs.existsSync(path.resolve('public/images/icon-512.png'))).toBe(true)
    expect(fs.existsSync(path.resolve('public/images/apple-touch-icon.png'))).toBe(true)
  })
})
