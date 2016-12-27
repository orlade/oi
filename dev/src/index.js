var oi = require('@oi/oi');

module.exports = function (data, host, options) {
  return new oi.Module({
    command: "oi",
    describe: "Runs development actions on Oi itself",
    actions: {
      build: {
        describe: "Builds Oi from source",
        handler: (name, options) => oi.utils.exec('npm run build', options)
      },
      test: {
        describe: "Tests the Oi package",
        handler: (name, options) => oi.utils.exec('npm test', options)
      }
    },
    config: {
      workingDir: '${workspace}/oi/lib'
    },
    requireConfig: {
      workspace: true
    }
  });
};
