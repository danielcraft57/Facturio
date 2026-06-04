const path = require('path')
const { getDefaultConfig } = require('expo/metro-config')

const config = getDefaultConfig(__dirname)
const notificationsStub = path.resolve(__dirname, 'src/stubs/expo-notifications.web.ts')

const defaultResolveRequest = config.resolver.resolveRequest

config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (
    platform === 'web' &&
    (moduleName === 'expo-notifications' || moduleName.startsWith('expo-notifications/'))
  ) {
    return { type: 'sourceFile', filePath: notificationsStub }
  }
  if (defaultResolveRequest) {
    return defaultResolveRequest(context, moduleName, platform)
  }
  return context.resolveRequest(context, moduleName, platform)
}

module.exports = config
