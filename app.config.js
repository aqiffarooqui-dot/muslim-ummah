module.exports = ({ config }) => ({
  ...config,
  experiments: {
    ...(config.experiments || {}),
    baseUrl:
      process.env.GITHUB_ACTIONS === 'true' && process.env.NATIVE_ANDROID_BUILD !== 'true'
        ? '/muslim-ummah'
        : '',
  },
});
