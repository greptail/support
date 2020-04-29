var request = require('request')

var headers = {
  'Content-Type': 'application/x-www-form-urlencoded'
}

var dataString = 'username=1800049513&password=Abc@1234&grant_type=password'

var options = {
  url: 'https://cat.generalmobi.mobi/authserver/oauth/token',
  method: 'POST',
  headers: headers,
  body: dataString,
  auth: {
    user: 'mobile_ui',
    pass: 'test'
  }
}

function callback (error, response, body) {
  if (!error && response.statusCode === 200) {
    console.log(JSON.parse(body).access_token)
  }
  console.log(response.statusCode)
  console.log(body)

  console.log(error)
}

request(options, callback)
