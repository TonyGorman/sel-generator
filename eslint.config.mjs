import babelParser from '@babel/eslint-parser';
import reactHooksPlugin from 'eslint-plugin-react-hooks';

export default [
  {
    ignores: ['dist/**', 'coverage/**', 'playwright-report/**', 'scripts/**'],
  },
  {
    files: ['src/**/*.{ts,tsx}'],
    languageOptions: {
      parser: babelParser,
      parserOptions: {
        requireConfigFile: false,
        babelOptions: {
          plugins: ['@babel/plugin-syntax-typescript', '@babel/plugin-syntax-jsx'],
        },
      },
    },
    plugins: {
      'react-hooks': reactHooksPlugin,
    },
    rules: {
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
    },
  },
];
