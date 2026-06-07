import { FlatCompat } from '@eslint/eslintrc';
import simpleImportSort from 'eslint-plugin-simple-import-sort';
import { dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({ baseDirectory: __dirname });

const eslintConfig = [
  { ignores: ['.next/**', 'node_modules/**', 'next-env.d.ts'] },
  ...compat.extends('next/core-web-vitals', 'next/typescript'),
  {
    plugins: { 'simple-import-sort': simpleImportSort },
    rules: {
      // Clear, explicit import order (auto-fixable with `eslint --fix`):
      //   side-effects -> node builtins -> react/next -> other externals
      //   -> @events/* workspace libs -> @/* app-internal -> relative
      'simple-import-sort/imports': [
        'error',
        {
          groups: [
            ['^\\u0000'],
            ['^node:'],
            ['^react$', '^react', '^next'],
            ['^@?\\w'],
            ['^@events/'],
            ['^@/'],
            ['^\\.'],
          ],
        },
      ],
      'simple-import-sort/exports': 'error',
    },
  },
];

export default eslintConfig;
