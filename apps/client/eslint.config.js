import js from '@eslint/js';
import importPlugin from 'eslint-plugin-import';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  { ignores: ['dist', 'node_modules', 'coverage'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['**/*.{ts,tsx}'],
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
      import: importPlugin,
    },
    settings: {
      'import/resolver': {
        typescript: { project: './tsconfig.app.json' },
      },
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': [
        'warn',
        { allowConstantExport: true },
      ],
      'no-console': 'error',
      '@typescript-eslint/no-explicit-any': 'error',
      'import/no-restricted-paths': [
        'error',
        {
          zones: [
            {
              target: ['./src/app', './src/modules/shared'],
              from: './src/modules/connectivity',
              except: ['./index.ts'],
              message:
                'Import the connectivity module via its index.ts public API.',
            },
          ],
        },
      ],
    },
  },
  {
    files: ['**/*.{js,cjs}', 'eslint.config.js', 'vite.config.ts', 'vitest.config.ts'],
    rules: { '@typescript-eslint/no-explicit-any': 'off' },
  },
);
