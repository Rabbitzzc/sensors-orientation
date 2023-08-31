import { defineConfig } from 'tsup';

export default defineConfig({
	injectStyle: false,
	loader: {
		'.png': 'base64',
		'.svg': 'base64',
	},
});
