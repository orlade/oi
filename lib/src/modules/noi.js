import _ from 'lodash'

const actions = {
  build: {
    describe: "build a thing",
    handler: () => console.log('build!!')
  }
};

export default {
  command: "noi",
  describe: "New oi",

  builder: (yargs) => _.each(actions, (action, command) => yargs.command(_.merge(action, {command})))
};
