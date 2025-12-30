import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { sveltePreprocess } from 'svelte-preprocess';
import fs from 'fs';

const production = process.env.NODE_ENV === 'production';
const packageJson = JSON.parse(fs.readFileSync('./package.json', 'utf-8'));

export default defineConfig({
    plugins: [
        svelte({
            preprocess: sveltePreprocess({
                sourceMap: !production,
                replace: [
                    [/PRE_REP_CLIENT_VERSION/g, JSON.stringify(packageJson.version)],
                    [/PRE_REP_DEV_ENVIRONMENT/g, JSON.stringify(!production)]
                ]
            }),
            compilerOptions: {
                dev: !production
            }
        })
    ],
    build: {
        outDir: 'public',
        emptyOutDir: true
    },
    publicDir: "frontend"
});