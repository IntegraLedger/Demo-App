// TODO: encapsulate globals

var IntegraServer="https://integra-demo.mybluemix.net"
var IBMClientID="09d25564-cfbd-4c90-820d-a8d3538a667a"
var IBMClientSecret="c88c5925-f19c-4d7d-b4c4-cc5e3c928f97"

// Dropdown text change
$('.dropdown-menu li a').click(function () {
  $(this).parents('.dropdown').find('.btn').html($(this).text() + ' <span class="caret"></span>')
  $(this).parents('.dropdown').find('.btn').val($(this).data('value'))
})

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
  const theIDType = $('#idType').val()
  const value = $('#valueData').val()
  const md = $('#md').val()
  const theURL = `/api/registerIdentity?type=${theIDType}&value=${value}&metadata=${md}`

  $('#existsLbl').text('')
  $('#integraId').val('')
  $.ajax({
    method: 'Get',
    url: theURL,
    contentType: 'application/json',
    accept: 'application/json',
    headers: {
       "X-IBM-Client-ID": IBMClientID,
       "X-IBM-Client-Secret": IBMClientSecret
    }
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
    url: IntegraServer+'/api/identityExists?id=' + theID,
    contentType: 'application/json',
    accept: 'application/json',
    headers: {
       "X-IBM-Client-ID": IBMClientID,
       "X-IBM-Client-Secret": IBMClientSecret
    }
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
  //  alert ("docHash " + theID);
  $.ajax({
    method: 'Get',
    url: IntegraServer+'/api/valueExists?value=' + theID,
    contentType: 'application/json',
    accept: 'application/json',
    headers: {
      "X-IBM-Client-ID": IBMClientID,
      "X-IBM-Client-Secret": IBMClientSecret
    }
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
      const msg = `Clio Matter ID ${data['ClioID']} Created with Client Reference # (LMAT) ${lMatID}`
      $('#ClioID').val(msg)
    })
}

$('#CallClio').click(function (e) {
  const md = $('#md').val()
  const value = $('#valueData').val()
  const theIDType = $('#idType').val()
  const theURL = IntegraServer+`/api/registerIdentity?type=${theIDType}&value=${value}`
  $.ajax({
    method: 'Get',
    url: theURL,
    contentType: 'application/json',
    accept: 'application/json'
  })
    .done(function (data) {
      const res = (data['identityId'])
      createClioMatter(data['identityId'])
    })
})

$('#registerKeyBtn').click(function (e) {
  const value = $('#keyValue').val()
  const user = $('#keyUser').val()
  const theURL = IntegraServer+`/api/registerKey?owner=${user}&value=${value}`
  $.ajax({
    method: 'Get',
    url: theURL,
    contentType: 'application/json',
    accept: 'application/json',
    headers: {
      "X-IBM-Client-ID": IBMClientID,
      "X-IBM-Client-Secret": IBMClientSecret
    }
  })
    .done(function (data) {
      const res = (data['keyValue'])
    })
})

$('#checkKeyOwnerBtn').click(function (e) {
  const theID = $('#keyUser').val()
  $.ajax({
    method: 'Get',
    url: IntegraServer+'/api/keyForOwner?owner=' + theID,
    contentType: 'application/json',
    accept: 'application/json',
    headers: {
      "X-IBM-Client-ID": IBMClientID,
      "X-IBM-Client-Secret": IBMClientSecret
    }

  })
    .done(function (data) {
      const res = (data['key'])
      $('#checkKeyOwnerLbl').text(res)
    })
})

function setLMATType () {
  $('#idType').val('com.integraledger.lmat')
  $('#DocumentDataGroup').hide()
  $('#valueData').val('')
}

function setDocumentType () {
  $('#idType').val('com.integraledger.document')
  $('#DocumentDataGroup').show()
  $('#valueData').val('')

  clearResults()
}

// Retreive all the visitors from the database
function getNames () {
  $.get(IntegraServer+'/api/visitors')
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
  startProcessing($('#fileInput'), populateResults, populateError, populateProgress)
})
$('#fileInputCheck').change(function () {
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
}

function populateResults (data) {
  $('#processProgress').val(1)
  $('#processResults').show()
  $('#valueData').val(data.hash)
}

function populateResultsCheck (data) {
  $('#processProgress').val(1)
  $('#processResults').show()
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
