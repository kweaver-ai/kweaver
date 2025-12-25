module.exports = {
  presets: ['@vue/app'],
  plugins: [
    [
      '@babel/plugin-transform-modules-commonjs',
      {
        allowTopLevelThis: true
      }
    ],
    ['transform-remove-strict-mode']
  ],
  ignore: [
    './public/*.js'
  ]
}
