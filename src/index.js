/* eslint-disable handle-callback-err */
'use strict'

const express = require('express')
const app = express()
const bodyParser = require('body-parser')
const serverAd = 'http://18.221.90.80:3000'
const _request = require('request')
const _setup = require('./setupEnv')
const _utils = require('./utils')
const _const = require('./constants')
//
// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }))

// parse application/json
app.use(bodyParser.json())

let mydb = _setup.getDb()

/* Endpoint to greet and add a new visitor to database.
 * Send a POST request to 18.221.90.80:3000/api/visitors with body
 * {
 *   "name": "Bob"
 * }
 */

// Sample Database Code
app.post('/api/visitors', function (request, response) {
  const userName = request.body.name
  if (!mydb) {
    console.log('No database.')
    response.send(`Hello ${userName}!`)
    return
  }

  mydb.insert({ 'name': userName }, function (err, body, header) {
    if (err) {
      return console.log('[mydb.insert] ', err.message)
    }
    response.send(`Hello ${userName}! I added you to the database.`)
  })
})

/**
 * Endpoint to get a JSON array of all the visitors in the database
 * REST API example:
 * <code>
 * GET http://184.172.242.210:31090/api/visitors
 * </code>
 *
 * Response:
 * [ "Bob", "Jane" ]
 * @return An array of all the visitor names
 */
app.get('/api/visitors', function (request, response) {
  const names = []
  if (!mydb) {
    response.json(names) // TODO: Really? You just want to return an empty array if there is no database?
    return
  }

  mydb.list({ include_docs: true }, function (err, body) {
    if (!err) {
      body.rows.forEach(function (row) {
        if (row.doc.name) { names.push(row.doc.name) }
      })
      response.json(names)
    }
  })
})

/**
 * Endpoint to get a JSON array of all the visitors in the database
 * REST API example:
 * <code>
 * GET http://184.172.242.210:31090/api/visitors
 * </code>
 *
 * Response:
 * [ "Bob", "Jane" ]
 * @return An array of all the visitor names
 */
app.get('/api/lmatid', function (request, response) {
  const theGuid = _utils.createGuid()
  const names = {lmatid: theGuid}
  response.json(names)
})

/**
 * Endpoint to get a JSON array of all the visitors in the database
 * REST API example:
 * <code>
 * GET http://184.172.242.210:31090/api/visitors
 * </code>
 *
 * Response:
 * [ "Bob", "Jane" ]
 * @return An array of all the visitor names
 */
const registerIdentity = function (request, response) {
  const theGuid = _utils.createGuid()
  const theType = request.query['type'] || request.body['type']

  let theValue = request.query['value'] || request.body['value']
  console.log(`value = ${theValue}`)
  if (!theValue || !theValue.length) {
    theValue = _utils.createGuid()
  }

  const theMetaData = request.query['metadata'] || request.body['metadata']// request.query['metaData'];
  let metadataStr = theMetaData ? ',"metaData":"' + theMetaData + `"` : '';
  const theBody = `{"$class": "com.integraledger.identityregistry.RegisterIdentity","identityId":"${theGuid}","identityType":"${theType}","value":"${theValue}"` + metadataStr +"}"
  console.log(theBody)
  const cb = function (error, res, body) {
    let err = _utils.getError(error, JSON.parse(body))
    if (err) {
      console.log(err)
      response.status(500).send(err)
      return
    }

    const names = {'identityId': theGuid}
    response.json(names)
  }

  const options = {
    url: `${serverAd}/api/RegisterIdentity`,
    headers: _const.jsonHeaders,
    body: theBody
  }

  _request
    .post(options, cb)
    .on('response', function (response) {
      // TODO: What do you want done here?
    })
}

app.get('/api/registerIdentity', registerIdentity)
app.post('/api/registerIdentity', registerIdentity)

const registerKey = function (request, response) {
  const theOwner = request.query['owner'] || request.body['owner']
  const theValue = request.query['value'] || request.body['value']
  const theBody = `{"$class": "com.integraledger.identityregistry.RegisterKey","owner":"${theOwner}","keyValue":"${theValue}"}`

  const cb = function (error, res, body) {
    let err = _utils.getError(error, JSON.parse(body))
    if (err) {
      console.log(err)
      response.status(500).send(err)
      return
    }
    const theResponse = {'theKey': theValue}
    response.json(theResponse)
  }
  const options = {
    url: `${serverAd}/api/RegisterKey`,
    headers: _const.jsonHeaders,
    body: theBody
  }

  _request
    .post(options, cb)
    .on('response', function (response) {
      // TODO: What do you want done here?
    })
}

app.get('/api/registerKey', registerKey)
app.post('/api/registerKey', registerKey)

const postToClio = function (request, response) {
  const theLMAT = request.query['LMAT'] || request.body['LMAT']

  const cb = function (error, res, body) {
    const theJSON = JSON.parse(body)
    let err = _utils.getError(error, theJSON)
    if (err) {
      console.log(err)
      response.status(500).send(err)
      return
    }

    const theData = theJSON.data.id
    console.log(`${body} |||||| ${theData}`)

    const names = {'ClioID': theData}
    response.json(names)
  }

  const options = {
    url: `https://app.goclio.com/api/v4/matters?data[client][id]=${_const.clioId}&data[description]=${encodeURIComponent('Created from Integra API Call')}&data[client_reference]=${theLMAT}`,
    headers: {
      'Content-Type': 'application/json', 'Authorization': `Bearer ${_const.clioBearerId}`
    }
  }

  _request
    .post(options, cb)
    .on('response', function (response) {

    })
}

app.get('/api/postToClio', postToClio)
app.post('/api/postToClio', postToClio)

// TODO: This seems like a legit get
app.get('/api/identityExists', function (request, response) {
  const theId = request.query['id']

  const cb = function (error, res, body) {
    let err = _utils.getError(error, JSON.parse(body))
    if (err) {
      console.log(err)
      response.status(500).send(err)
      return
    }
    var elements = JSON.parse(body);
    const exists = elements.length > 0
    const names = {'exists': exists, "data": elements}
    response.json(names)
  }

  const component = encodeURIComponent(`{"where":{"identityId": "${theId}"}}`)
  console.log(`xxxxxhttp://18.221.90.80:3000/api/IntegraIdentity?filter=${component}`)

  const options = {
    url: `${serverAd}/api/IntegraIdentity?filter=${component}`,
    headers: _const.jsonHeaders
  }

  _request
    .get(options, cb)
    .on('response', function (response) {

    })
})

// TODO: This seems like a legit get
app.get('/api/valueExists', function (request, response) {
  const theId = request.query['value']
  const cb = function (error, res, body) {
    let err = _utils.getError(error, JSON.parse(body))
    if (err) {
      console.log(err)
      response.status(500).send(err)
      return
    }
    const exists = JSON.parse(body) > 0
    const names = {'exists': exists}
    response.json(names)
  }
  const component = encodeURIComponent(`{"where":{"value": "${theId}"}}`)

  const options = {
    url: `${serverAd}/api/HashVal?filter=${component}`,
    headers: _const.jsonHeaders
  }

  _request
    .get(options, cb)
    .on('response', function (response) {

    })
})

// TODO: This seems like a legit get
app.get('/api/keyForOwner', function (request, response) {
  const theOwner = request.query['owner']

  const cb = function (error, res, body) {
    let err = _utils.getError(error, JSON.parse(body))
    if (err) {
      console.log(err)
      response.status(500).send(err)
      return
    }
    const cbRes = JSON.parse(body)
    console.log(cbRes)
    if (cbRes.length) {
      const rec = cbRes[0]
      console.log(rec)
      const theKey = rec['keyValue']
      const names = {'key': theKey}
      response.json(names)
    } else {
      response.json({'key': 'No Key'})
    }
  }
  const component = `{"where":{"owner": "${theOwner}"}}`

  const options = {
    url: `${serverAd}/api/Key?filter=${component}`,
    headers: _const.jsonHeaders
  }

  _request
    .get(options, cb)
    .on('response', function (response) {

    })
})

// serve static file (index.html, images, css)
app.use(express.static(`${__dirname}/views`))

const port = process.env.PORT || 3003
app.listen(port, function () {
  console.log(`To view your app, open this link in your browser: http://localhost:${port}`)
})
