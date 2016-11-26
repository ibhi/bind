var path = require('path');

module.exports = {
  entry: './app/app.es6',
  output: {
    // path: path.resolve(__dirname, 'public/'),
    fileName: 'bundle.js'
  },
  // devServer: {
  //   contentBase: 'public'
  // },
  devtool: 'source-map',
  module: {
    preLoaders: [
      {
        test: /\.es6$/,
        exclude: 'node_modules',
        loader: 'eslint-loader'
      }
    ],
    loaders: [
     {
       test: /\.es6$/,
       exclude: /node_modules/,
       loader: 'babel-loader',
       query: {
         presets: ['es2015'] 
       }
     }
   ]
  },
  resolve: {
    extensions: ['', '.js', '.es6']
  },
};