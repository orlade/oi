var oi = require('@oi/oi');

module.exports = function (data, host, options) {
  return new oi.Module({
    command: "oi",
    describe: "Runs development actions on Oi itself",
    actions: {
      build: {
        describe: "Builds Oi from source",
        handler: function (name, options) {
          oi.utils.exec('npm run build', {workingDir: `${options.workspace}/lib`})
        }
      },
      test: {
        describe: "Tests the Oi package",
        handler: function (name, options) {
          oi.utils.exec('npm test', {workingDir: `${options.workspace}/lib`})
        }
      }
    },
    config: {
      workspace: '${workspace}/oi'
    },
    requireConfig: {
      workspace: true
    }
  });
};
