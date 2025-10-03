// Expo + Metro configuration with custom symbolicator to avoid
// attempting to open Hermes internal frames like "InternalBytecode.js".
// This prevents noisy ENOENT errors during stack symbolication on Windows.
const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('metro-config').ConfigT} */
const config = getDefaultConfig(__dirname);
config.resolver = config.resolver || {};
// Ensure Metro uses package exports (selects RN entry points where provided)
config.resolver.unstable_enablePackageExports = true;

config.symbolicator = {
  customizeFrame: (frame) => {
    const file = frame.file || '';
    // Collapse Hermes internal frames so Metro doesn't try to read them
    if (
      file.endsWith('InternalBytecode.js') ||
      file.endsWith('NativeBytecode.js') ||
      file === 'address at (native)'
    ) {
      return { collapse: true };
    }
    return null;
  },
};

module.exports = config;
