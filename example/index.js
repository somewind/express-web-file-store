const express = require('express')
const path = require('path')
const fileStore = require('../lib')

const { LocalStore, AmazonS3 } = fileStore

const store = fileStore.default({
  verbose: true
})

// YourStore => failure => YourStore1 (default)
// YourStore => parallel => YourStore1 (not implemented)
// store.use(new YourStore())
// store.use(new YourStore1())
// store.use(new LocalStore({
//   root: path.join(__dirname, './upload')
// }))
store.use(new AmazonS3({
  bucket: '',
  etag: true,
  lastModified: true,
  maxAge: 31536000 * 1000,
  s3option: {
    sslEnabled: false,
    s3ForcePathStyle: true,
    credentials: {
      accessKeyId: '',
      secretAccessKey: ''
    },
    endpoint: 'http://xxxxxxxxx:80',
    httpOptions: {
    },
    region: '',
    // apiVersion: '2',
    signatureVersion: 'v2'
  }
}))
// 失败处理
// 可提供一次类似于 express 的处理中间件
// store.use((err, req, res, next) => {

// })

const app = express()
// POST /filename multipart file
// DELETE /filename
// GET /filename
app.use('/', store)

app.listen(1234)
