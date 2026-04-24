export default [
  {
    ignores: [
      'dist/**',
      'node_modules/**',
      'build/**',
      '.husky/**',
      '.vscode/**',
      'coverage/**',
      'assets/screenshots/**',
      '**/*.min.js',
      'package-lock.json',
      // Uses import-attribute syntax (`assert { type: 'json' }`) which espree
      // does not yet parse. The file is served as-is to modern browsers.
      'src/lib/historical-data.js',
    ],
  },
  {
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        window: 'readonly',
        document: 'readonly',
        navigator: 'readonly',
        console: 'readonly',
        localStorage: 'readonly',
        sessionStorage: 'readonly',
        fetch: 'readonly',
        URL: 'readonly',
        URLSearchParams: 'readonly',
        CustomEvent: 'readonly',
        Event: 'readonly',
        Element: 'readonly',
        HTMLElement: 'readonly',
        NodeList: 'readonly',
        setTimeout: 'readonly',
        setInterval: 'readonly',
        clearTimeout: 'readonly',
        clearInterval: 'readonly',
        requestAnimationFrame: 'readonly',
        cancelAnimationFrame: 'readonly',
        IntersectionObserver: 'readonly',
        ResizeObserver: 'readonly',
        MutationObserver: 'readonly',
        performance: 'readonly',
        location: 'readonly',
        history: 'readonly',
        alert: 'readonly',
        confirm: 'readonly',
        prompt: 'readonly',
        process: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
        module: 'readonly',
        require: 'readonly',
        exports: 'writable',
        global: 'readonly',
        Buffer: 'readonly',
      },
    },
    rules: {
      'no-unused-vars': [
        'warn',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        },
      ],
      'no-console': 'off',
      semi: ['error', 'always'],
      quotes: ['error', 'single', { avoidEscape: true }],
      indent: 'off',
      'no-var': 'error',
      'prefer-const': 'error',
    },
  },
  {
    // Browser-facing source must not import server-only modules. The
    // server/ directory holds the service-role Supabase key and other
    // secrets; leaking even one import would ship them to the client
    // bundle. See docs/plans/2026-04-24_security-performance-deps-audit.md
    // Track A #6.
    files: ['src/**/*.js', 'src/**/*.mjs'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['**/server/**', '../server/**', '../../server/**', '../../../server/**'],
              message:
                'Do not import server/** modules from src/**. Server modules may hold secrets (e.g. service-role keys) and must not ship to the browser bundle.',
            },
          ],
        },
      ],
    },
  },
];
