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
  root: path.join(__dirname, './upload'),
  // see https://www.expressjs.com.cn/4x/api.html#express.static
  static: {
    maxAge: 31536000 * 1000 // ms, default 0 ms
  }
}))

// use seaweedfs store https://github.com/chrislusf/seaweedfs
store.use(new SeaweedFS({
  filerServer: 'http://seaweedfs-filer:8888/',
  etag: true, // default true
  lastModified: true, // default true
  maxAge: 31536000 * 1000 // ms, default 0 ms
}))

// use Amazon S3 store https://docs.aws.amazon.com/sdk-for-javascript/v2/developer-guide/s3-example-creating-buckets.html
// S3 Options
store.use(new AmazonS3({
  // file operation option
  bucket: '',
  etag: true, // default true
  lastModified: true, // default true
  maxAge: 31536000 * 1000, // ms, default 0 ms
  // S3 options begin
  s3option: {
    sslEnabled: false,
    s3ForcePathStyle: true,
      credentials: {
      accessKeyId: '',
      secretAccessKey: '',
    },
    endpoint: '',
    httpOptions: {
      proxy: '',
    },
    region: '',
    signatureVersion: 'v2'
  }
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
