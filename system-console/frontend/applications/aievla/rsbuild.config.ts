import { defineConfig } from '@rsbuild/core';
import { pluginLess } from '@rsbuild/plugin-less';
import { pluginReact } from '@rsbuild/plugin-react';
import packageJson from './package.json';

import { dev_port_aievla } from '../../system/applicationsPort';

export default defineConfig({
  html: {
    template: './public/index.html',
  },
  dev: {
    assetPrefix: '/aievla/',
    client: { protocol: 'ws', host: 'localhost', port: dev_port_aievla },
  },
  server: {
    port: dev_port_aievla,
    open: process.env.FIRST_RUN === '1',
    headers: { 'Access-Control-Allow-Origin': '*' }, // 允许主应用跨域加载
    proxy: {
      '/api': { secure: false, changeOrigin: true, target: 'https://10.4.134.253' },
    },
  },
  output: {
    assetPrefix: '/aievla/',
    cssModules: {
      localIdentName: `${packageJson.name}-[local]`,
    },
  },
  plugins: [pluginLess(), pluginReact()],
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
