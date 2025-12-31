import js from '@eslint/js';
import { defineConfig, globalIgnores } from 'eslint/config';
import prettierConfig from 'eslint-config-prettier';
import importPlugin from 'eslint-plugin-import';
import prettierPlugin from 'eslint-plugin-prettier';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import unusedImports from 'eslint-plugin-unused-imports';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default defineConfig([
  // 全局忽略不需要被 ESLint 扫描的目录
  globalIgnores(['dist', 'node_modules', 'coverage', 'docker', 'helm', 'coverage', 'public', 'src/assets', '**/IconFont/**']),
  {
    settings: {
      // React 设置（必须在 React 推荐规则之前）
      react: {
        version: 'detect', // 自动检测 React 版本
      },
    },
  },
  // JavaScript 推荐规则
  js.configs.recommended,
  // TypeScript 推荐规则
  ...tseslint.configs.recommended,
  // React 推荐规则
  react.configs.flat.recommended,
  // React 17+ JSX 运行时规则
  react.configs.flat['jsx-runtime'],
  // React Hooks 推荐规则
  reactHooks.configs.flat['recommended-latest'],
  // React Refresh 推荐规则
  reactRefresh.configs.recommended,
  // 关闭与Prettier冲突的规则
  prettierConfig,

  // 自定义规则配置（适用于所有 JS/TS/React 文件）
  {
    files: ['**/*.{js,mjs,jsx,ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2020,
      sourceType: 'module',
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
        ecmaFeatures: {
          jsx: true,
        },
      },
      globals: {
        ...globals.browser, // 浏览器全局变量
        ...globals.es2025, // ES2025 全局变量
        ...globals.node, // Node.js 全局变量
      },
    },
    plugins: {
      prettier: prettierPlugin,
      import: importPlugin,
      'unused-imports': unusedImports,
    },
    rules: {
      'prettier/prettier': 'error', // 不符合 Prettier 格式化规则的地方给出错误
      'no-unused-vars': 'off', // 关闭未使用var变量警告
      'unused-imports/no-unused-imports': 'error',
      'unused-imports/no-unused-vars': [
        'warn',
        {
          vars: 'all',
          varsIgnorePattern: '^_',
          args: 'after-used',
          argsIgnorePattern: '^_',
        },
      ],
      'no-debugger': ['warn'], // 允许使用 debugger 语句
      'no-empty': 'warn', // 允许空函数
      'no-extra-boolean-cast': 'off', // 允许使用双重否定(!!)操作符
      'comma-dangle': ['error', 'only-multiline'], // 多行逗号结尾
      // Import 排序规则
      'import/order': [
        'error',
        {
          groups: [
            'builtin', // Node.js 内置模块: fs, path, http
            'external', // 外部依赖: npm 包
            'internal', // 内部路径: @/ 别名
            ['parent', 'sibling'], // 相对路径: ../ ./
            'index', // index 文件
            'object', // object imports
            'type', // TypeScript type imports
          ],
          pathGroups: [
            {
              pattern: 'react',
              group: 'external',
              position: 'before',
            },
            {
              pattern: 'react-*',
              group: 'external',
              position: 'before',
            },
            {
              pattern: '@/components/**',
              group: 'internal',
              position: 'before',
            },
            {
              pattern: '@/hooks/**',
              group: 'internal',
              position: 'before',
            },
            {
              pattern: '@/utils/**',
              group: 'internal',
              position: 'before',
            },
            {
              pattern: '@/services/**',
              group: 'internal',
              position: 'before',
            },
            {
              pattern: '@/**',
              group: 'internal',
              position: 'after',
            },
            {
              pattern: '*.{css,less,scss,sass,styl}',
              group: 'object',
              position: 'after',
            },
          ],
          pathGroupsExcludedImportTypes: ['react', 'react-*'],
          'newlines-between': 'never',
          alphabetize: {
            order: 'asc',
            caseInsensitive: true,
          },
          warnOnUnassignedImports: true,
        },
      ],
      'import/no-duplicates': 'error', // 禁止重复导入
      'import/newline-after-import': 'error', // import 后必须空一行
      'import/no-useless-path-segments': 'error', // 禁止不必要的路径段
      '@typescript-eslint/no-explicit-any': 'warn', // any类型给出提醒
      '@typescript-eslint/no-namespace': 'off', // 关闭命名空间警告
      '@typescript-eslint/no-unused-expressions': ['warn', { allowShortCircuit: true, allowTernary: true }], // TypeScript中允许短路表达式和三元表达式
      '@typescript-eslint/ban-ts-comment': ['warn', { 'ts-ignore': 'allow-with-description' }], // 允许使用@ts-ignore注释
      '@typescript-eslint/no-require-imports': 'off', // 不允许使用require导入模块
      '@typescript-eslint/no-unused-vars': 'off',
      'react/display-name': 'off',
      'react/prop-types': 'off',
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
      'react-hooks/set-state-in-effect': 'warn',
      'react-hooks/preserve-manual-memoization': 'warn',
      'react-hooks/static-components': 'warn',
      'react-hooks/immutability': 'warn',
      'react-hooks/exhaustive-deps': 'off',
      'react-hooks/use-memo': 'warn',
      'react-hooks/refs': 'warn',
    },
  },
]);
