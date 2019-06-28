# express-web-file-store

## Usage

```js
import path from 'path'
import express from 'express'
import fileStore, { LocalStore } from 'express-web-file-store'

const store = fileStore({
  verbose: true
})

// 1. YourStore => failure => YourStore1 (default)
// 2. YourStore => parallel => YourStore1 (not implemented)
// store.use(new YourStore())
// store.use(new YourStore1())
store.use(new LocalStore({
  root: path.join(__dirname, './upload')
}))

const app = express()
// POST /filename multipart file
// DELETE /filename
// GET /filename
app.use('/', store)

app.listen(1234)

```

## License

[MIT](./LICENSE)
