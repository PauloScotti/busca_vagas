import js from '@eslint/js';
import { defineConfig } from 'eslint/config';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default defineConfig(
  // public/ é o front HTML antigo, que a API não serve mais (o atual fica em web/, com oxlint próprio)
  { ignores: ['dist/', 'src/generated/', 'web/', 'public/', 'node_modules/'] },
  js.configs.recommended,
  tseslint.configs.recommendedTypeChecked,
  {
    languageOptions: {
      globals: globals.node,
      parserOptions: {
        projectService: { allowDefaultProject: ['test/*.ts', '*.config.ts'] },
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  {
    files: ['**/*.js'],
    extends: [tseslint.configs.disableTypeChecked],
  },
  {
    files: ['**/*.spec.ts', 'test/**/*.ts'],
    languageOptions: { globals: globals.jest },
  },
);
