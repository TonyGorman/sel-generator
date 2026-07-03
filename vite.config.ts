import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

const resolveBasePath = (): string => {
  if (process.env.GITHUB_ACTIONS !== 'true') {
    return '/'
  }

  const repository = process.env.GITHUB_REPOSITORY ?? ''
  const [, repoName = ''] = repository.split('/')

  if (!repoName || repoName.endsWith('.github.io')) {
    return '/'
  }

  return `/${repoName}/`
}

const getVitestExecArgv = (): string[] => {
  const majorNodeVersion = Number.parseInt(process.versions.node.split('.')[0] ?? '0', 10)

  if (Number.isNaN(majorNodeVersion) || majorNodeVersion < 25) {
    return []
  }

  // Node 25+ enables Web Storage by default, which triggers Vitest's warning path.
  return ['--no-experimental-webstorage']
}

// https://vitejs.dev/config/
export default defineConfig({
  base: resolveBasePath(),
  plugins: [react()],
  server: {
    port: 5173,
    open: false
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: (id: string) => {
          if (id.includes('jsbarcode') || id.includes('react-barcode')) {
            return 'barcode-renderer';
          }
        },
      },
    },
  },
  test: {
    environment: 'jsdom',
    execArgv: getVitestExecArgv(),
    setupFiles: './src/test/setup.ts',
    globals: true,
    css: true,
    exclude: ['tests/e2e/**', 'node_modules/**', 'dist/**'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      include: [
        'src/components/**/*.ts',
        'src/components/**/*.tsx',
        'src/config/**/*.ts',
        'src/domain/**/*.ts',
      ],
      exclude: [
        'src/**/*.module.css.d.ts',
        'src/domain/labelCodeDomain.ts',
      ],
    }
  }
})
