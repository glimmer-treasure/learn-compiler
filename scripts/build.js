import path from 'path'
import process from 'process'
import ts from 'rollup-plugin-typescript2'

const rootPath = process.cwd()

export default {
	input: path.resolve(rootPath, './src/index.ts'),
	output: {
		dir: path.resolve(rootPath, './dist'),
		format: 'es',
        sourcemap: true
	},
    plugins: [
        ts({
            tsconfig: path.resolve(rootPath, './tsconfig.json'),
        })
    ]
};