const path = require('path');

module.exports = {
  mode: 'production',//production|development，改成 production 就能触发 tree shaking 了
  entry: path.join(__dirname, 'index.ts'),
  output: {
    filename: 'index.js',
    path: path.resolve(__dirname, 'build')
  },
	module: {
		rules: [{
			test: /.tsx?$/,
			exclude: [
				path.resolve(__dirname, 'node_modules'),
			],
			loader: 'ts-loader'
		}]
  },
	resolve: {
		extensions: ['.json', '.ts', '.tsx']
	},
  devtool: 'source-map'
};