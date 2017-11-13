const cfenv = require('cfenv')

const getVCap = function () {
  let retVal = null
  try {
    retVal = require('./vcap-local.json')
    console.log('Loaded local VCAP', vcapLocal)
  } catch (e) { }
  return retVal
}
// load local VCAP configuration  and service credentials
const vcapLocal = getVCap()

const appEnvOpts = vcapLocal ? {vcap: vcapLocal} : {}

const appEnv = cfenv.getAppEnv(appEnvOpts)

this.getDb = function () {
  let retVal = null
  if (appEnv.services['cloudantNoSQLDB']) {
    // Load the Cloudant library.
    const Cloudant = require('cloudant')

    // Initialize database with credentials
    const cloudant = Cloudant(appEnv.services['cloudantNoSQLDB'][0].credentials)

    // database name
    const dbName = 'mydb'

    // Create a new "mydb" database.
    cloudant.db.create(dbName, function (err, data) {
      if (!err) { // err if database doesn't already exists
        console.log(`Created database: ${dbName}`)
      }
    })

    // Specify the database we are going to use (mydb)...
    retVal = cloudant.db.use(dbName)
  }
  return retVal
}
