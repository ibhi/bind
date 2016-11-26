module.exports = {
  entry: './app/app.es6',
  output: {
    fileName: 'bundle.js'
  },
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