// Submit data when enter key is pressed

$('#LMATAction').click(function (e) {
  setLMATType()
  e.preventDefault()
})
$('#DocumentAction').click(function (e) {
  setDocumentType()
  e.preventDefault()
})

$('#getIDBtn').click(function (e) {
  // alert ("call data");
  const theIDType = $('#idType').val()
  const value = $('#valueData').val()
  const md = $('#md').val()
  const theURL = `./api/registerIdentity?type=${theIDType}&value=${value}`

  $('#existsLbl').text('')
  $('#integraId').val('')
  $.ajax({
    method: 'Get',
    url: theURL,
    contentType: 'application/json',
    accept: 'application/json'
  })
    .done(function (data) {
      const res = (data['identityId'])
      $('#integraId').val(res)
      $('#idResults').show()
    })
})
$('#verifyIDBtn').click(function (e) {
  const theIDType = $('#idType').val()
  $('#existsLbl').text('')
  const theID = $('#integraId').val()
  $.ajax({
    method: 'Get',
    url: './api/identityExists?id=' + theID,
    contentType: 'application/json',
    accept: 'application/json'
  })
    .done(function (data) {
      const res = (data['exists'])
      $('#existsLbl').text(res)
    })
})
$('#verifyDocBtn').click(function (e) {
  const theIDType = $('#idType').val()
  $('#existsDocLbl').text('')
  const theID = $('#docHash').val()
  $.ajax({
    method: 'Get',
    url: './api/valueExists?id=' + theID,
    contentType: 'application/json',
    accept: 'application/json'
  })
    .done(function (data) {
      const res = (data['exists'])
      $('#existsDocLbl').text(res)
    })
})

function createClioMatter (lMatID) {
  const clientID = '941888686'
  const desc = 'Sample_Matter_Created _From_Integra'
  const theURL = `http://localhost:3001/api/postToClio?LMAT=${lMatID}`
  console.log(theURL)
  $.ajax({
    method: 'Get',
    url: theURL,
    Authorization: 'Bearer UskTXxAGVeQwulmfirrCYVMcdztfy1zEaXY7TA26'
  })
    .done(function (data) {
      // alert (data['ClioID']);
      const msg = `Clio Matter ID ${data['ClioID']} Created with Client Reference # (LMAT) ${lMatID}`
      $('#ClioID').val(msg)
    })
}

$('#CallClio').click(function (e) {
  const md = $('#md').val()
  const value = $('#valueData').val()
  const theIDType = $('#idType').val()
  const theURL = `./api/registerIdentity?type=${theIDType}&value=${value}`
  $.ajax({
    method: 'Get',
    url: theURL,
    contentType: 'application/json',
    accept: 'application/json'
  })
    .done(function (data) {
      const res = (data['identityId'])
      // alert (data['identityId']);
      createClioMatter(data['identityId'])
    })
})

function setLMATType () {
  $('#idType').val('com.integraledger.lmat')
  $('#DocumentDataGroup').hide()
  $('#valueData').val('')
  // $('#idResults').hide();
}

function setDocumentType () {
  $('#idType').val('com.integraledger.document')
  $('#DocumentDataGroup').show()
  $('#valueData').val('')
  clearResults()
  // $('#idResults').hide();
}

// Retreive all the visitors from the database
function getNames () {
  $.get('./api/visitors')
    .done(function (data) {
      if (data.length > 0) {
        data.forEach(function (element, index) {
          data[index] = AntiXSS.sanitizeInput(element)
        })
        $('#databaseNames').html('Database contents: ' + JSON.stringify(data))
      }
    })
}

setLMATType()
initialize()
$('#fileInput').change(function () {
  // alert ("selected");
  startProcessing($('#fileInput'), populateResults, populateError, populateProgress)
})
$('#fileInputCheck').change(function () {
  // alert ("selected");
  $('#existsDocLbl').text('Exists')
  startProcessing($('#fileInputCheck'), populateResultsCheck, populateError, populateProgress)
})

function calculateHash (fileContents) {
  return sha1.hash(fileContents)
}

function startProcessing (fileInput, onsuccess, onerror, onprogress) {
  const fileList = fileInput[0].files
  const file = fileList[0]
  const results = {
    name: file.name,
    size: file.size,
    type: file.type,
    hash: ''
  }

  const fileReader = new FileReader()
  fileReader.onload = function (e) {
    results.hash = calculateHash(e.target.result)
    onsuccess(results)
  }
  fileReader.onerror = function (e) {
    onerror(e.target.error.name)
  }
  fileReader.onprogress = function (e) {
    onprogress(e.loaded, e.total)
  }
  fileReader.readAsArrayBuffer(file)
}

function setResults (name, size, type, hash) {
  // var table = $("#processResults");
  // table.find("#nameValue").text(name);
  // table.find("#sizeValue").text(size);
  // table.find("#typeValue").text(type);
  // table.find("#hashValue").text(hash);
  // alert ("qqq " + hash + " " + name);
  // $('#valueData').val(hash);
}

function clearResults () {
  $('#processProgress').val(0).show()
  $('#processError').hide()
  $('#processResults').hide()
  // setResults("", "", "", "");
}

function populateResults (data) {
  $('#processProgress').val(1)
  $('#processResults').show()
  // setResults(data.name, data.size, data.type, data.hash);
  $('#valueData').val(data.hash)
}

function populateResultsCheck (data) {
  $('#processProgress').val(1)
  $('#processResults').show()
  // setResults(data.name, data.size, data.type, data.hash);
  // docHash
  $('#docHash').val(data.hash)
}

function populateError (msg) {
  $('#processProgress').hide()
  let processError = $('#processError')
  processError.text('Failed to read file: ' + msg)
  processError.show()
}

function populateProgress (loaded, total) {
  $('#processProgress').val(loaded / total)
}

function initialize () {
  $('#fileForm').submit(function (e) {
    e.preventDefault()
    startProcessing($('#fileInput'), populateResults, populateError, populateProgress)
  })
  clearResults()
}
