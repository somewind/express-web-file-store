const express = require('express')
const path = require('path')
const fileStore = require('../lib')

const { LocalStore } = fileStore

const store = fileStore.default({
  verbose: true
})

// YourStore => failure => YourStore1 (default)
// YourStore => parallel => YourStore1 (not implemented)
// store.use(new YourStore())
// store.use(new YourStore1())
store.use(new LocalStore({
  root: path.join(__dirname, './upload')
}))
// 失败处理
// 可提供一次类似于 express 的处理中间件
// store.use((err, req, res, next) => {

// })

const app = express()
// POST /filename multipart file
// DELETE /filename
// GET /filename
app.use('/file', store)

app.listen(1234)
