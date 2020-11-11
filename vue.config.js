const path = require('path'); //引入path模块
function resolve(dir) {
  return path.join(__dirname, dir); //path.join(__dirname)设置绝对路径
}
// 引入happypack
const Happypack = require('happypack');

// 代码压缩
const UglifyJsPlugin = require('uglifyjs-webpack-plugin');

// gzip压缩
const CompressionWebpackPlugin = require('compression-webpack-plugin');

// 是否为生产环境
const isProduction = process.env.NODE_ENV !== 'development';

// 本地环境是否需要使用cdn
const devNeedCdn = true;

// cdn链接
const cdn = {
  // cdn：模块名称和模块作用域命名（对应window里面挂载的变量名称）
  externals: {
    vue: 'Vue',
    vuex: 'Vuex',
    'vue-router': 'VueRouter',
  },
  // cdn的css链接
  css: [],
  // cdn的js链接
  js: [
    'https://cdn.staticfile.org/vue/2.6.10/vue.min.js',
    'https://cdn.staticfile.org/vuex/3.0.1/vuex.min.js',
    'https://cdn.staticfile.org/vue-router/3.0.3/vue-router.min.js',
  ],
};
module.exports = {
  // 基本路径
  // baseUrl: "/",
  // 输出文件目录
  outputDir: '/dist',
  // eslint-loader 是否在保存的时候检查
  lintOnSave: true,
  // webpack配置
  // see https://github.com/vuejs/vue-cli/blob/dev/docs/webpack.md
  chainWebpack: (config) => {
    config.resolve.alias
      .set('@', resolve('./src'))
      .set('components', resolve('./src/components'))
      .set('views', resolve('./src/views'))
      .set('assets', resolve('./src/assets'))
      .set('common', resolve('./src/common'));
    //set第一个参数：设置的别名，第二个参数：设置的路径
  },
  configureWebpack: (config) => {
    // 多线程优化构建速度
    config.plugins.push(
      new Happypack({
        loaders: ['babel-loader', 'vue-loader', 'url-loader'],
        cache: true,
        threads: 3, // 线程数取决于你电脑性能的好坏，好的电脑建议开更多线程
      })
    );
    // 用cdn方式引入，则构建时要忽略相关资源
    if (isProduction || devNeedCdn) config.externals = cdn.externals;

    // 生产环境相关配置
    if (isProduction) {
      // 代码压缩
      config.plugins.push(
        new UglifyJsPlugin({
          uglifyOptions: {
            //生产环境自动删除console
            compress: {
              warnings: false, // 若打包错误，则注释这行
              drop_debugger: true,
              drop_console: true,
              pure_funcs: ['console.log'],
            },
          },
          sourceMap: false,
          parallel: true,
        })
      );

      // gzip压缩
      const productionGzipExtensions = ['html', 'js', 'css'];
      config.plugins.push(
        new CompressionWebpackPlugin({
          filename: '[path].gz[query]',
          algorithm: 'gzip',
          test: new RegExp('\\.(' + productionGzipExtensions.join('|') + ')$'),
          threshold: 10240, // 只有大小大于该值的资源会被处理 10240
          minRatio: 0.8, // 只有压缩率小于这个值的资源才会被处理
          deleteOriginalAssets: false, // 删除原文件
        })
      );

      // 公共代码抽离
      config.optimization = {
        splitChunks: {
          cacheGroups: {
            vendor: {
              chunks: 'all',
              test: /node_modules/,
              name: 'vendor',
              minChunks: 1,
              maxInitialRequests: 5,
              minSize: 0,
              priority: 100,
            },
            common: {
              chunks: 'all',
              test: /[\\/]src[\\/]js[\\/]/,
              name: 'common',
              minChunks: 2,
              maxInitialRequests: 5,
              minSize: 0,
              priority: 60,
            },
            styles: {
              name: 'styles',
              test: /\.(sa|sc|c)ss$/,
              chunks: 'all',
              enforce: true,
            },
            runtimeChunk: {
              name: 'manifest',
            },
          },
        },
      };
    }
  },
  // vue-loader 配置项
  // https://vue-loader.vuejs.org/en/options.html
  // vueLoader: {},
  // 生产环境是否生成 sourceMap 文件
  productionSourceMap: true,
  // css相关配置
  css: {
    // 是否使用css分离插件 ExtractTextPlugin
    extract: false,
    // 开启 CSS source maps?
    sourceMap: false,
    // css预设器配置项
    loaderOptions: {},
    // 启用 CSS modules for all css / pre-processor files.
    modules: false,
  },

  // use thread-loader for babel & TS in production build
  // enabled by default if the machine has more than 1 cores
  parallel: require('os').cpus().length > 1,
  // 是否启用dll
  // See https://github.com/vuejs/vue-cli/blob/dev/docs/cli-service.md#dll-mode
  // dll: false,
  // PWA 插件相关配置
  // see vuejs/vue-cli
  pwa: {},
  // webpack-dev-server 相关配置
  devServer: {
    open: process.platform === 'darwin',
    host: '0.0.0.0',
    port: 8080,
    https: false,
    hotOnly: false,
    proxy: {
      '/gxyundata': {
        target: 'http://localhost:3000/',
        changeOrigin: true,
        pathRewrite: {
          '^/gxyundata': '/gxyundata',
        },
      },
    }, // 设置代理
    // before: app => {}
  },
  chainWebpack: (config) => {
    // 其他配置
    config.entry('main').add('babel-polyfill'); // main是入口js文件
    // ============压缩图片 start============
    config.module
      .rule('images')
      .use('image-webpack-loader')
      .loader('image-webpack-loader')
      .options({ bypassOnDebug: true })
      .end();
    // ============压缩图片 end============

    // ============注入cdn start============
    config.plugin('html').tap((args) => {
      // 生产环境或本地需要cdn时，才注入cdn
      if (isProduction || devNeedCdn) args[0].cdn = cdn;
      return args;
    });
    // ============注入cdn start============
    // 其他配置
  },
  // 第三方插件配置
  pluginOptions: {
    // ...
  },
};
