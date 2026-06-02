module.exports = function (api) {
  const isTest = api.env('test')
  api.cache(true)
  return {
    presets: ['babel-preset-expo'],
    plugins: isTest ? [] : ['react-native-reanimated/plugin'],
  }
}
