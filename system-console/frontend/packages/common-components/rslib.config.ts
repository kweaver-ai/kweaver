import { pluginReact } from '@rsbuild/plugin-react';
import { defineConfig } from '@rslib/core';
import { pluginLess } from '@rsbuild/plugin-less';

import { prefixClsCommon } from '../mf-style/variable';

export default defineConfig({
	source: {
		entry: {
			index: ['./src/**'],
		},
	},
	lib: [
		{
			bundle: false,
			dts: true,
			format: 'esm',
		},
	],
	output: {
		target: 'web',
		cssModules: {
			localIdentName: `${prefixClsCommon}-[local]`,
		},
	},
	plugins: [pluginReact(), pluginLess()],
	performance: {
		removeConsole: process.env.NODE_ENV === 'production',
	},
});
