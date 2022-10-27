const webpack = require('webpack');
const path = require('path');

const devConfig = require('./config.json');
const prodConfig = require('./config.prod.json');

function composeConfig(env: any) {
	console.log(env)
	if (env.WEBPACK_BUILD) {
		return { ...prodConfig };
	} else {
		return { ...devConfig};
	}
}


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
				CONFIG: JSON.stringify(composeConfig(env)),
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