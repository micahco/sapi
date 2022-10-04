const webpack = require('webpack');
const path = require('path');

module.exports = (env: any, argv: any) => {
	return { 
		entry: './src/index.ts',
		mode: 'development',
		module: {
			rules: [
				{
					test: /\.ts?$/,
					use: 'ts-loader',
					exclude: /node_modules/,
				},
			],
		},
		resolve: {
			extensions: ['.tsx', '.ts', '.js'],
		},
		output: {
			filename: 'bundle.min.js',
			publicPath: '/dist',
			path: path.join(__dirname, 'dist'),
		},
		plugins: [
			new webpack.DefinePlugin({
				PRODUCTION: JSON.stringify(argv.mode === 'production'),
			}),
		],
		devServer: {
			static: {
				directory: __dirname,
			},
			compress: true,
			port: 3001
		}
	}
};