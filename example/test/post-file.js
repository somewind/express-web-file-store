const axios = require('axios')
const FormData = require('form-data')
const fs = require('fs')
const path = require('path')

const filepath = path.join(__dirname, './img.jpg')

const formData = new FormData()
formData.append('file', fs.createReadStream(filepath))
axios.post('http://127.0.0.1:1234/img.jpg', formData, {
  headers: formData.getHeaders()
}).then(res => {
  console.log(res.status, res.data)
}).catch(err => {
  console.log(err)
  console.log(err.response.status, err.response.data)
})
