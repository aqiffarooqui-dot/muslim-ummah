module.exports = ({ config }) => ({
  ...config,
  experiments: {
    ...(config.experiments || {}),
    baseUrl:
      process.env.GITHUB_ACTIONS === 'true'
        ? '/muslim-ummah'
        : '',
  },
});
