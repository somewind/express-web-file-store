import fs from 'fs'
import lodash from 'lodash'
import AWS from 'aws-sdk'
import mimetype from 'mimetype'

const defaultOptions = {
  bucket: '',
  etag: true, // default true
  lastModified: true, // default true
  maxAge: 0, // ms, default 0 ms
  s3option: {}
}

export default class AmazonS3 {
  constructor (options = {}) {
    this.options = lodash.merge({}, defaultOptions, options)
    this.s3 = new AWS.S3(this.options.s3option)
  }

  async get (req, res) {
    return new Promise((resolve, reject) => {
      const { filepath } = req.params
      if (!filepath) {
        const e = new Error('filepath can not bey null.')
        e.status = 404
        e.msg = 'filepath can not be null.'
        reject(e)
      }
      const s3Request = this.s3.getObject({
        Bucket: this.options.bucket,
        Key: filepath
      })
      // set headers
      s3Request.on('httpHeaders', (statusCode, headers) => {
        // set header
        if (this.options.etag && headers['etag']) {
          res.set('Etag', headers['etag'])
        }
        if (this.options.lastModified && headers['last-modified']) {
          res.set('Last-Modified', headers['last-modified'])
        }
        if (typeof this.options.maxAge === 'number' && this.options.maxAge !== 0) {
          res.set('Cache-Control', `public, max-age=${this.options.maxAge / 1000}`)
        }
        res.set('Content-Length', headers['content-length'])
        if (headers['content-Type'] === 'application/octet-stream') {
          // convert from file extension
          res.set('Content-Type', mimetype.lookup(filepath))
        } else {
          res.set('Content-Type', headers['content-type'])
        }
      })
      // handle error
      s3Request.on('error', function (err) {
        // clear content-type
        res.removeHeader('Content-Type')
        res.removeHeader('Content-Length')
        res.removeHeader('Cache-Control')
        res.removeHeader('Etag')
        res.removeHeader('Last-Modified')
        err.status = err.statusCode
        err.msg = err.message
        reject(err)
      })
      const s3Stream = s3Request.createReadStream()
      // listen for errors returned by the service
      s3Stream.on('error', function (err) {
        err.msg = err.message
        reject(err)
      })
      res.on('error', function (err) {
        err.msg = err.message
        reject(err)
      })
      s3Stream.pipe(res)
    })
  }

  async put (req, res) {
    return new Promise((resolve, reject) => {
      const { filepath } = req.params
      if (!filepath) {
        const e = new Error('filepath can not bey null.')
        e.status = 404
        e.msg = 'filepath can not be null.'
        reject(e)
      }

      const [file] = Object.values(req.files)

      const fileStream = fs.createReadStream(file.tempFilePath)
      this.s3.putObject({
        Bucket: this.options.bucket,
        Key: filepath,
        Body: fileStream,
        ContentType: file.mimetype
      }, function (err, data) {
        if (err) {
          err.status = err.statusCode
          err.msg = err.message
          reject(err)
        } else {
          resolve()
        }
      })
    })
  }

  async delete (req, res) {
    return new Promise((resolve, reject) => {
      const { filepath } = req.params
      if (!filepath) {
        const e = new Error('filepath can not bey null.')
        e.status = 404
        e.msg = 'filepath can not be null.'
        reject(e)
      }
      this.s3.deleteObject({
        Bucket: this.options.bucket,
        Key: filepath
      }, function (err, data) {
        if (err) {
          err.status = err.statusCode
          err.msg = err.message
          reject(err)
        } else {
          resolve()
        }
      })
    })
  }
}
