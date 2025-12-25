const path = require('path')
function resolve (dir) {
  return path.join(__dirname, dir)
}
const host = '0.0.0.0'
const port = 1005
const webpack = require('webpack')
const { name } = require('./package')
const timeStamp = new Date().getTime()
module.exports = {
  // publicPath: process.env.VUE_APP_CONTEXT_PATH,
  publicPath: process.env.NODE_ENV === 'development' ? process.env.VUE_APP_CONTEXT_PATH : './',
  assetsDir: 'static',
  lintOnSave: false,
  productionSourceMap: false,
  transpileDependencies: ['/bpmnlint/','element-ui'],
  css: {
    // 重点.
    extract: false
    // extract: {
    //   // 打包后css文件名称添加时间戳
    //   filename: `css/[name].${timeStamp}.css`,
    //   chunkFilename: `css/chunk.[id].${timeStamp}.css`
    // }

  },
  devServer: {
    port,
    host,
    disableHostCheck: true,
    clientLogLevel: 'warning',
    inline: true,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
      'Access-Control-Allow-Headers':
        'X-Requested-With, content-type, Authorization'
    },
    proxy: {
      '/doc-audit-client/AnyShare/foxit': {
        secure: false,
        target: 'https://192.168.1.200/anyshare/static/foxit/',
        pathRewrite: { '^/doc-audit-client/AnyShare/foxit': '/' },
        changeOrigin: true,
        rejectUnauthorized: false
      }
    }
  },
  configureWebpack: {
    resolve: {
      alias: {
        '@': resolve('src')
      }
    },
    output: {
      library: `${name}`,
      libraryTarget: 'umd', // 把微应用打包成 umd 库格式
      jsonpFunction: `webpackJsonp_${name}`
    },
    plugins: [
      new webpack.ProvidePlugin({
        $: 'jquery',
        jQuery: 'jquery',
        'windows.jQuery': 'jquery'
      })
    ]
  },
  // 解决IE11不兼容，页面无法访问的问题
  // transpileDependencies: ['element-ui'],
  // 独立部署时，可打开该配置进行代码压缩加密
  // productionSourceMap: false,
  chainWebpack: config => {
    config.module
      .rule('fonts')
      .use('url-loader')
      .loader('url-loader')
      .options({})
      .end()
    config.module
      .rule('images')
      .use('url-loader')
      .loader('url-loader')
      .options({})
      .end()

    // set svg-sprite-loader
    config.module
      .rule('svg')
      .exclude.add(resolve('src/icons'))
      .end()
    config.module
      .rule('icons')
      .test(/\.svg$/)
      .include.add(resolve('src/icons'))
      .end()
      .use('svg-sprite-loader')
      .loader('svg-sprite-loader')
      .options({
        symbolId: 'icon-[name]'
      })
      .end()
    config
      .when(process.env.NODE_ENV !== 'development',
        config => {
          config
            .plugin('ScriptExtHtmlWebpackPlugin')
            .after('html')
            .use('script-ext-html-webpack-plugin', [{
              // `runtime` must same as runtimeChunk name. default is `runtime`
              inline: /runtime\..*\.js$/
            }])
            .end()
          config
            .optimization.splitChunks({
              chunks: 'all',
              cacheGroups: {
                libs: {
                  name: 'chunk-libs',
                  test: /[\\/]node_modules[\\/]/,
                  priority: 10,
                  chunks: 'initial' // only package third parties that are initially dependent
                },
                elementUI: {
                  name: 'chunk-elementUI', // split elementUI into a single package
                  priority: 20, // the weight needs to be larger than libs and app or it will be packaged into libs or app
                  test: /[\\/]node_modules[\\/]_?element-ui(.*)/ // in order to adapt to cnpm
                },
                commons: {
                  name: 'chunk-commons',
                  test: resolve('src/components'), // can customize your rules
                  minChunks: 3, //  minimum common number
                  priority: 5,
                  reuseExistingChunk: true
                }
              }
            })

          const TerserPlugin = require('terser-webpack-plugin')
          config.optimization.minimizer([
            new TerserPlugin({
              minify: TerserPlugin.uglifyJsMinify,
              // `terserOptions` options will be passed to `uglify-js`
              // Link to options - https://github.com/mishoo/UglifyJS#minify-options
              terserOptions: {
                output: {
                  ascii_only: true
                }
              }
            })
          ])
          // https:// webpack.js.org/configuration/optimization/#optimizationruntimechunk
          config.optimization.runtimeChunk('single')
        }
      )
  }
}
