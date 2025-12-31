import { defineConfig } from '@rsbuild/core';
import { pluginLess } from '@rsbuild/plugin-less';
import { pluginReact } from '@rsbuild/plugin-react';
import { pluginSvgr } from '@rsbuild/plugin-svgr';
import packageJson from './package.json';

export default defineConfig({
  html: {
    template: './public/index.html',
  },
  dev: {
    assetPrefix: '/ontology/',
    client: { protocol: 'ws', host: 'localhost', port: 3010 },
  },
  server: {
    port: 3010,
    open: process.env.FIRST_RUN === '1',
    headers: { 'Access-Control-Allow-Origin': '*' }, // 允许主应用跨域加载
    proxy: {
      '/api': {
        secure: false,
        changeOrigin: true,
        // target: 'https://192.168.188.16'
        target: 'https://10.4.111.172',
      },
    },
  },
  output: {
    assetPrefix: '/ontology/',
    cssModules: {
      auto: true,
      localIdentName: `[local]__[hash:base64:5]`,
    },
    sourceMap: {
      js: process.env.NODE_ENV === 'development' ? 'eval-source-map' : false,
      css: true,
    },
  },
  plugins: [
    pluginLess(),
    pluginReact(),
    pluginSvgr({
      svgrOptions: {
        // 将 SVG 作为图标处理（自动设置 width/height 为 1em 等）
        icon: true,
      },
    }),
  ],
  performance: {
    removeConsole: true,
    removeMomentLocale: true,
  },
  tools: {
    rspack: {
      output: {
        library: `${packageJson.name}-[name]`, // 必须声明为 umd 格式
        libraryTarget: 'umd',
        chunkLoadingGlobal: `webpackJsonp_${packageJson.name}`, // 避免全局变量冲突
      },
    },
  },
});
