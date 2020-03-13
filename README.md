# express-web-file-store

## Usage

```js
import path from 'path'
import express from 'express'
import fileStore, { LocalStore, SeaweedFS } from 'express-web-file-store'

const store = fileStore({
  verbose: true
})

// 1. YourStore => failure => YourStore1 (default)
// 2. YourStore => parallel => YourStore1 (not implemented)
// store.use(new YourStore())
// store.use(new YourStore1())
store.use(new LocalStore({
  // Read-only addresses, can have multiple, sequential reads
  rootReadonly: ['/a/b/path'],
  // Read/Write address
  // Read Order: rootReadonly -> root
  // if root not set, Write will throw error
  root: path.join(__dirname, './upload')
}))

// use seaweedfs store https://github.com/chrislusf/seaweedfs
store.use(new SeaweedFS({
  filerServer: 'http://seaweedfs-filer:8888/'
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
