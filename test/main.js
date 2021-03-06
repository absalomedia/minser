let Application = require('spectron').Application
let chai = require('chai')
let chaiAsPromised = require('chai-as-promised')
let electronPath = require('electron')

chai.should()
chai.use(chaiAsPromised)
const timeout = process.env.CI ? 30000 : 10000

describe('minser', function () {
  this.timeout(timeout)
  beforeEach(function () {
    this.app = new Application({
      path: electronPath,
      args: [
        `${__dirname}/../app`
      ]
    })
    return this.app.start()
  })

  beforeEach(function () {
    chaiAsPromised.transferPromiseness = this.app.transferPromiseness
  })

  afterEach(function () {
    if (this.app && this.app.isRunning()) {
      return this.app.stop()
    }
  })
  
})
