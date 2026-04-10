const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const webpack = require('webpack');
const ReactRefreshWebpackPlugin = require('@pmmmwh/react-refresh-webpack-plugin');

const isDevelopment = process.env.NODE_ENV !== 'production';

module.exports = {
  entry: './src/index.js',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'bundle.js',
    publicPath: '/'
  },
  module: {
    rules: [
      {
        test: /\.(js|jsx)$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env', '@babel/preset-react'],
            plugins: isDevelopment ? ['react-refresh/babel'] : []
          }
        }
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader']
      }
    ]
  },
  resolve: {
    extensions: ['.js', '.jsx']
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: './src/index.html'
    }),
    new webpack.DefinePlugin({
      'process.env': {
        REACT_APP_API_URL: JSON.stringify('http://localhost:3000'),
        REACT_APP_WS_URL: JSON.stringify('ws://localhost:3000'),
        NODE_ENV: JSON.stringify(process.env.NODE_ENV || 'development')
      }
    }),
    isDevelopment && new ReactRefreshWebpackPlugin()
  ].filter(Boolean),
  devServer: {
    static: {
      directory: path.join(__dirname, 'dist')
    },
    compress: true,
    port: 8081,
    host: 'localhost',
    open: true,
    historyApiFallback: true,
    hot: true,
    liveReload: false,
    client: {
      overlay: {
        errors: true,
        warnings: false,
      },
      progress: true,
      logging: 'info',
    },
    proxy: [
      {
        context: ['/messages', '/upload', '/download', '/pinned', '/favorites', '/search'],
        target: 'http://localhost:3000',
        changeOrigin: true
      }
    ]
  }
};