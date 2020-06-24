var PropertiesReader = require('properties-reader')
var prop = PropertiesReader('/etc/assistance/app.properties')
var cashflow = {}

var request = require('request')
var userSchema = require('../models/user')
var roleSchema = require('../models/role')
var clientId = prop.get('client_id')
var clientSecret = prop.get('secret')
var apiEndPoint = prop.get('api.endpoint')
var tokenEndPoint = prop.get('token.endpoint')

var CUSTOMER_ROLE = 'User'
var SUPPORT_ROLE = 'Support'

var headers = {
  'Content-Type': 'application/x-www-form-urlencoded'
}

cashflow.getToken = async (username, password) => {
  return await executeTokenApi(username, password)
    .then(result => {
      return result
    })
    .catch(error => {
      console.log('catch' + error)
      return { code: 500 }
    })
}

cashflow.getUserDetails = async token => {
  return await executeUserDetailApi(token)
    .then(result => {
      return result
    })
    .catch(error => {
      console.log('catch' + error)
      return { code: 500 }
    })
}

function executeTokenApi (username, password) {
  var payload = `username=${username}&password=${password}&grant_type=password`
  var options = {
    url: tokenEndPoint,
    method: 'POST',
    headers: headers,
    body: payload,
    auth: {
      user: clientId,
      pass: clientSecret
    }
  }
  return new Promise(function (resolve, reject) {
    request(options, function (error, response, body) {
      // console.log(body)
      if (!error) {
        var result = null
        if (response.statusCode === 200) {
          result = { code: 200, access_token: JSON.parse(body).access_token }
        } else if (response.statusCode === 400) {
          result = { code: 401 }
        } else {
          result = { code: 500 }
        }

        resolve(result)
      } else {
        console.log('Error occured while fetching token ' + error)
        reject(error)
      }
    })
  })
}

cashflow.registerIfRequired = function (token, callback) {
  cashflow.getUserDetails(token).then(response => {
    var result = response.result

    if (response.code === 200) {
      userSchema.findOne({ username: new RegExp('^' + result.mobileNumber + '$', 'i') }).exec(function (err, user) {
        if (err) {
          console.log('Error ' + err)
        }
        if (user == null) {
          var role = resolveRole(result.userType)
          roleSchema.getRoleByName(role, function (err, role) {
            var account = new userSchema({
              username: result.mobileNumber,
              password: 'na',
              fullname: result.name,
              email: result.emailId,
              //accessToken: token,
              role: role.id
            })
            console.log('Registering user ' + account)
            account.save(function (err, a) {
              if (err) {
                console.log('Error ' + err)
              }
              callback(account)
            })
          })
        } else {
          console.log('User already registered...')
          /*
                                                user.accessToken = token;
                                                console.log("Updating latest token ");
                                                user.save(function (err, a) {
                                                    if (err) {
                                                        console.log(err);
                                                    }
                                                    callback(user);
                                                });
                        */

          callback(user)
        }
      })
    } else {
      callback(null)
    }
  })
}

function executeUserDetailApi (token) {
  var oauth_header = {
    Authorization: `Bearer ${token}`,
    'Content-type': 'application/json'
  }

  var options = {
    url: `${apiEndPoint}/uiObjects/openapi/v1/user`,
    method: 'GET',
    headers: oauth_header
  }
  return new Promise(function (resolve, reject) {
    request(options, function (error, response, body) {
      console.log(body)
      if (!error) {
        if (response.statusCode === 200) {
          var apiResponse = JSON.parse(body)
          if (apiResponse.status.code == 2000) {
            result = { code: 200, result: apiResponse.result }
          } else {
            result = { code: 500 }
          }
        } else {
          result = { code: response.statusCode }
        }
        resolve(result)
      } else {
        console.log('Error ' + error)

        reject(error)
      }
    })
  })
}

function resolveRole (userType) {
  if (userType == 'agent' || userType == 'distributor' || userType == 'superDistributor' || userType == 'operator') {
    return CUSTOMER_ROLE
  }
  return SUPPORT_ROLE
}

module.exports = cashflow

/*
var mongoose = require('mongoose');
//Set up default mongoose connection
var mongoDB = 'mongodb://127.0.0.1/trudesk';
mongoose.connect(mongoDB, { useNewUrlParser: true });

console.log(prop.get("client_id"));


cashflow.getToken("8888888801", "Abc@1234").then((oauth) => {

  console.log("Oauth " + oauth.access_token);
  cashflow.registerIfRequired(oauth.access_token, (response) => {
    console.log("Result " + response);
  });
});

*/
