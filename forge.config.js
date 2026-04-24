const fs = require('fs');
const path = require('node:path');
const { FusesPlugin } = require('@electron-forge/plugin-fuses');
const { FuseV1Options, FuseVersion } = require('@electron/fuses');

const makers = [
  {
    name: '@electron-forge/maker-squirrel',
    config: {}
  },
  {
    name: '@electron-forge/maker-zip',
    platforms: ['darwin']
  }
];

if (fs.existsSync('/etc/redhat-release')) {
  makers.push({ name: '@electron-forge/maker-rpm', config: {} });
} else if (fs.existsSync('/etc/debian_version')) {
  makers.push({ name: '@electron-forge/maker-deb', config: {} });
}

module.exports = {
  packagerConfig: {
    asar: true,
    icon: path.join(__dirname, 'assets', 'icon.icns')
  },
  rebuildConfig: {},
  makers,
  plugins: [
    {
      name: '@electron-forge/plugin-auto-unpack-natives',
      config: {}
    },
    // Fuses are used to enable/disable various Electron functionality
    // at package time, before code signing the application
    new FusesPlugin({
      version: FuseVersion.V1,
      [FuseV1Options.RunAsNode]: false,
      [FuseV1Options.EnableCookieEncryption]: false,
      [FuseV1Options.EnableNodeOptionsEnvironmentVariable]: false,
      [FuseV1Options.EnableNodeCliInspectArguments]: false,
      [FuseV1Options.EnableEmbeddedAsarIntegrityValidation]: true,
      [FuseV1Options.OnlyLoadAppFromAsar]: true
    })
  ]
};
