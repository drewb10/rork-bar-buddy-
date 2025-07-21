const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname, {
  // [Web-only]: Enables CSS support in Metro.
  isCSSEnabled: true,
});

// Optimize for production and reduce file watching
config.watchFolders = [];
config.resolver.platforms = ['native', 'web', 'ios', 'android'];

// Reduce the number of files being watched
config.resolver.assetExts.push('bin');

// Disable some watchers to reduce ENOSPC issues
config.transformer = {
  ...config.transformer,
  minifierPath: require.resolve('metro-minify-terser'),
  minifierConfig: {
    // Reduce memory usage during minification
    keep_fnames: true,
    mangle: {
      keep_fnames: true,
    },
  },
};

module.exports = config;