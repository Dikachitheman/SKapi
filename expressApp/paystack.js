const express = require('express')
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const app = express();
const cors = require('cors')
const axios = require('axios')


// axios.defaults.baseURL = "http://127.0.0.1:8000"

app.use(bodyParser.json());

const https = require('https')

app.post("/pay", (req, res) => {
    const params = JSON.stringify(req.body)
      
      const options = {
        hostname: 'api.paystack.co',
        port: 443,
        path: '/transaction/initialize',
        method: 'POST',
        headers: {
          Authorization: 'Bearer sk_test_6a39ee59195e667ab0d074b266e2455bb6ace553',
          'Content-Type': 'application/json'
        }
      }
      
      const request = https.request(options, res => {
        let data = ''
      
        res.on('data', (chunk) => {
          data += chunk
        });
      
        res.on('end', () => {
          console.log(JSON.parse(data))
        })
      }).on('error', error => {
        console.error(error)
      })
      
      request.write(params)
      request.end()
})

app.get("/verify", (req, res) => {

  const options = {
    hostname: 'api.paystack.co',
    port: 443,
    path: '/transaction/verify/:reference',
    method: 'GET',
    headers: {
      Authorization: 'Bearer sk_test_6a39ee59195e667ab0d074b266e2455bb6ace553'
    }
  }

  https.request(options, res => {
    let data = ''

    res.on('data', (chunk) => {
      data += chunk
    });

    res.on('end', () => {
      console.log(JSON.parse(data))
    })
  }).on('error', error => {
    console.error(error)
  })

})

app.listen(5000, () => console.log('localhost:5000'))