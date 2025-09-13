const path = require('path');
const webpack = require('webpack');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');

const manifestTransformer = require('./manifest-transformer');

module.exports = (env = {}) => {
  const isDevelopment = env.development || env.mode === 'development';
  const browser = env.browser || 'chrome';
  const isProduction = !isDevelopment;
  
  console.log(`Building for ${browser} in ${isDevelopment ? 'development' : 'production'} mode`);

  const config = {
    mode: isDevelopment ? 'development' : 'production',
    devtool: isDevelopment ? 'eval-source-map' : 'source-map',
    
    entry: {
      'background/service-worker': './background/background.js',
      'content/content-script': './content/content-script.js',
      'popup/popup': './popup/popup.js',
      // Add other entry points as needed
      'ui/components': './ui/components.js',
      'ui/achievements': './ui/achievements.js',
      'optimization/optimization-engine': './optimization/optimization-engine.js'
    },

    output: {
      path: path.resolve(__dirname, `../dist/${browser}`),
      filename: '[name].js',
      clean: true,
      publicPath: '/'
    },

    module: {
      rules: [
        {
          test: /\.js$/,
          exclude: /node_modules/,
          use: {
            loader: 'babel-loader',
            options: {
              presets: [
                ['@babel/preset-env', {
                  targets: browser === 'firefox' 
                    ? { firefox: '109' }
                    : { chrome: '96' }
                }]
              ]
            }
          }
        },
        {
          test: /\.css$/,
          use: [
            isDevelopment ? 'style-loader' : MiniCssExtractPlugin.loader,
            {
              loader: 'css-loader',
              options: {
                sourceMap: isDevelopment
              }
            }
          ]
        },
        {
          test: /\.(png|jpg|jpeg|gif|svg)$/i,
          type: 'asset/resource',
          generator: {
            filename: 'assets/images/[name][ext]'
          }
        },
        {
          test: /\.(mp3|wav|ogg)$/i,
          type: 'asset/resource',
          generator: {
            filename: 'assets/sounds/[name][ext]'
          }
        },
        {
          test: /\.(woff|woff2|eot|ttf|otf)$/i,
          type: 'asset/resource',
          generator: {
            filename: 'assets/fonts/[name][ext]'
          }
        }
      ]
    },

    plugins: [
      new CleanWebpackPlugin(),
      
      new webpack.DefinePlugin({
        'process.env.NODE_ENV': JSON.stringify(isDevelopment ? 'development' : 'production'),
        'process.env.BROWSER': JSON.stringify(browser),
        'process.env.MANIFEST_VERSION': JSON.stringify(browser === 'firefox' ? 2 : 3)
      }),

      new MiniCssExtractPlugin({
        filename: '[name].css',
        chunkFilename: '[id].css'
      }),

      new CopyWebpackPlugin({
        patterns: [
          {
            from: 'manifest.json',
            to: 'manifest.json',
            transform: (content) => {
              return manifestTransformer.transform(content.toString(), browser, env);
            }
          },
          {
            from: 'assets',
            to: 'assets',
            globOptions: {
              ignore: ['**/placeholder.txt']
            }
          },
          {
            from: 'styles',
            to: 'styles'
          },
          {
            from: 'ui',
            to: 'ui',
            globOptions: {
              ignore: ['**/components.js']
            }
          },
          {
            from: 'privacy',
            to: 'privacy'
          },
          // Copy platform detectors without bundling
          {
            from: 'content/platform-detectors.js',
            to: 'content/platform-detectors.js'
          },
          {
            from: 'content/ui-injector.js',
            to: 'content/ui-injector.js'
          },
          {
            from: 'content/content.css',
            to: 'content/content.css'
          }
        ]
      }),

      new HtmlWebpackPlugin({
        template: './popup/index.html',
        filename: 'popup/index.html',
        chunks: ['popup/popup'],
        inject: false,
        templateParameters: {
          browser: browser,
          isDevelopment: isDevelopment
        }
      })
    ],

    optimization: {
      splitChunks: {
        chunks: 'all',
        cacheGroups: {
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendor',
            filename: 'js/vendor.[contenthash].js',
            chunks: 'all'
          },
          common: {
            name: 'common',
            filename: 'js/common.[contenthash].js',
            minChunks: 2,
            chunks: 'all',
            enforce: true
          }
        }
      },
      
      minimize: isProduction,
      
      // Prevent webpack from modifying the background script for MV3
      concatenateModules: false
    },

    resolve: {
      alias: {
        '@': path.resolve(__dirname, '../'),
        '@ui': path.resolve(__dirname, '../ui'),
        '@content': path.resolve(__dirname, '../content'),
        '@background': path.resolve(__dirname, '../background'),
        '@optimization': path.resolve(__dirname, '../optimization'),
        '@privacy': path.resolve(__dirname, '../privacy')
      },
      extensions: ['.js', '.json']
    },

    stats: {
      colors: true,
      modules: false,
      children: false,
      chunks: false,
      chunkModules: false
    }
  };

  // Development-specific configurations
  if (isDevelopment) {
    config.watchOptions = {
      ignored: /node_modules/,
      poll: 1000
    };
  }

  // Production-specific optimizations
  if (isProduction) {
    config.performance = {
      maxAssetSize: 2000000,
      maxEntrypointSize: 2000000,
      hints: 'warning'
    };
  }

  // Browser-specific configurations
  if (browser === 'firefox') {
    config.output.filename = '[name].js'; // Firefox doesn't like hashed filenames
    
    // Firefox-specific optimizations
    config.optimization.splitChunks.cacheGroups.vendor.filename = 'js/vendor.js';
    config.optimization.splitChunks.cacheGroups.common.filename = 'js/common.js';
  }

  if (browser === 'safari') {
    // Safari-specific configurations (future)
    config.resolve.alias['browser-polyfill'] = path.resolve(__dirname, '../utils/safari-polyfill.js');
  }

  return config;
};
