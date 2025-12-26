import { defineConfig } from '@rsbuild/core';
import { pluginLess } from '@rsbuild/plugin-less';
import { pluginReact } from '@rsbuild/plugin-react';

import { prefixCls } from './src/variable';
import { dev_port_business_system } from '../../system/applicationsPort';

export default defineConfig({
  html: {
    template: './public/index.html',
  },
  dev: {
    assetPrefix: `/${prefixCls}/`,
    client: { protocol: 'ws', host: 'localhost', port: dev_port_business_system },
  },
  server: {
    port: dev_port_business_system,
    open: process.env.FIRST_RUN === '1',
    headers: { 'Access-Control-Allow-Origin': '*' }, // 允许主应用跨域加载
    proxy: {
      '/api': { secure: false, changeOrigin: true, target: 'https://10.4.111.172' },
    },
  },
  output: {
    assetPrefix: `/${prefixCls}/`,
    cssModules: {
      localIdentName: `${prefixCls}-[local]__[hash:base64:5]`,
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
        library: `${prefixCls}-[name]`, // 必须声明为 umd 格式
        libraryTarget: 'umd',
        chunkLoadingGlobal: `webpackJsonp_${prefixCls}`, // 避免全局变量冲突
      },
    },
  },
});
