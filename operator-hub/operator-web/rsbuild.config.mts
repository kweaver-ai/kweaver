import { defineConfig } from '@rsbuild/core';
import { pluginReact } from '@rsbuild/plugin-react';
import { pluginLess } from '@rsbuild/plugin-less';
import { pluginSvgr } from '@rsbuild/plugin-svgr';
import fs from 'fs';
import path, { dirname } from 'path';
import { fileURLToPath } from 'url';
import { name as packageName } from './package.json';

// ========== 常量定义 ==========
const __dirname = dirname(fileURLToPath(import.meta.url));
const DEV_PORT = 1108; // 开发服务器端口
const PAGES_DIR = 'src/pages'; // 页面目录
const TEMPLATE_PATH = './templates/index.html'; // HTML 模板路径
const PUBLIC_DIR = './public'; // 静态资源目录

// ========== 工具函数 ==========

/**
 * 获取页面入口配置
 * @param pagesDir - 页面目录路径
 * @returns 入口配置对象
 */
function getPageEntries(pagesDir: string): Record<string, string> {
  const pages = fs.readdirSync(pagesDir);
  return pages.reduce((prev: Record<string, string>, page: string) => {
    return {
      ...prev,
      [page]: path.resolve(__dirname, pagesDir, page, 'index.tsx'),
    };
  }, {});
}

// ========== 配置计算 ==========
const entry = getPageEntries(PAGES_DIR);

export default defineConfig({
  // ========== 插件配置 ==========
  plugins: [
    pluginReact(),
    pluginLess({
      lessLoaderOptions: {
        lessOptions: {
          javascriptEnabled: true,
          modifyVars: {
            '@ant-prefix': packageName, // 自定义前缀，避免与其他项目冲突
          },
        },
      },
    }),
    pluginSvgr({
      svgrOptions: {
        exportType: 'default', // 导出默认组件
      },
    }),
  ],

  // ========== 构建配置 ==========
  source: {
    entry,
  },

  resolve: {
    // 配置别名，支持TypeScript路径映射
    alias: {
      // 配置 TypeScript 路径映射对应的别名
      '@': path.resolve(__dirname, 'src'),
      // 指定特定的React路径
      react: path.resolve(__dirname, './node_modules/react'),
    },
  },

  html: {
    template: TEMPLATE_PATH,
    mountId: packageName, // 修改根元素的 id
  },

  output: {
    // 开发环境生成 sourcemap，生产环境不生成
    sourceMap: {
      js: process.env.NODE_ENV === 'development' ? 'eval-source-map' : false,
      css: process.env.NODE_ENV === 'development',
    },
    assetPrefix: './', // 静态资源路径前缀，用于解决相对路径问题
    polyfill: 'usage', // 仅引入使用到的polyfill，减小包大小
    copy: [
      {
        from: PUBLIC_DIR,
        to: PUBLIC_DIR,
      },
    ],
  },

  // ========== 开发环境配置 ==========
  server: {
    publicDir: false, // 禁用默认的拷贝public目录到dist/public（因为它是平铺拷贝的，所以禁用）
    port: DEV_PORT,
    headers: {
      'Access-Control-Allow-Origin': '*',
    },
  },

  dev: {
    assetPrefix: './', // 静态资源路径前缀，用于解决相对路径问题
    client: {
      protocol: 'ws',
      host: 'localhost',
      port: DEV_PORT,
    },
    lazyCompilation: false,
  },

  // ========== 性能优化配置 ==========
  performance: {
    removeMomentLocale: true, // 移除moment的locale文件，减小包大小
  },

  // ========== 微前端配置 ==========
  tools: {
    rspack: {
      output: {
        library: `${packageName}-[name]`,
        libraryTarget: 'umd', // 必须声明为 umd 格式
        chunkLoadingGlobal: `webpackJsonp_${packageName}`, // 避免全局变量冲突
      },
    },
  },
});
