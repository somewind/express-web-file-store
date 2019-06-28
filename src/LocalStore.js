import path from 'path'
import express from 'express'
import lodash from 'lodash'
import {
  checkParam,
  asyncWrapperWithError,
  asyncAccess,
  asyncMkdirp,
  asyncStat,
  asyncUnlink
} from './util'

const defaultOptions = {
  root: '',
  createParentPath: true,
  static: {
  }
}

const mustOptions = {
  static: {
    fallthrough: false
  }
}

export default class LocalStore {
  constructor (options = {}) {
    checkParam(!options.root, 'options.root can not be null.')

    this.options = lodash.merge({}, defaultOptions, options, mustOptions)
    this.staticMiddleware = express.static(this.options.root, this.options.static)
  }

  _filepath (req) {
    const filepath = path.join(this.options.root, req.params.filepath)
    return filepath
  }

  get (req, res) {
    return new Promise(async (resolve, reject) => {
      const filepath = this._filepath(req)
      this.staticMiddleware(req, res, err => {
        if (err) {
          if (err.status === 404) {
            err.msg = 'No file found.'
          } else {
            err.msg = 'IO failed.'
          }
          reject(err)
        }
      })
      const exist = await asyncAccess(filepath)
      if (exist) {
        resolve()
      }
    })
  }

  async put (req, res) {
    try {
      const filepath = this._filepath(req)
      const files = Object.values(req.files)
      const file = files[0]
      if (this.options.createParentPath) {
        const dirname = path.dirname(filepath)
        if (!await asyncAccess(dirname)) {
          await asyncMkdirp(dirname, 0o755)
        }
      }
      await asyncWrapperWithError(file.mv)(filepath)
    } catch (e) {
      e.msg = 'IO failed.'
      throw e
    }
  }

  async delete (req, res) {
    const filepath = this._filepath(req)
    let stat
    try {
      [ stat ] = await asyncStat(filepath)
    } catch (e) {
      e.msg = 'No file found.'
      e.status = 404
      throw e
    }
    if (stat.isDirectory()) {
      throw new Error('Directory is not allowed.')
    }

    try {
      await asyncUnlink(filepath)
    } catch (e) {
      e.msg = 'IO failed.'
      throw e
    }
  }
}
