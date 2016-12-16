import PreModule from '../core/premodule'

export default new PreModule({
  command: "poi",
  describe: "Pre oi",
  actions: {
    build: {
      describe: "build a thing",
      //handler: () => console.log('build!!')
      actions: {
        fast: {
          describe: 'fast',
          handler: () => {
            console.log("handling fast")
          }
        //},
        //slow: {
        //  describe: 'slow',
        //  handler: () => console.log("slow")
        }
      }
    }
  }
});
