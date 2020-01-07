import path from 'path'
import express from 'express'
import lodash from 'lodash'
import fs from 'fs'
import {
  checkParam,
  asyncWrapperWithError,
  asyncAccess,
  asyncMkdirp,
  asyncStat,
  asyncUnlink
} from './util'

const defaultOptions = {
  rootReadonly: [],
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
    const { rootReadonly, root } = this.options
    const readDirs = []
    if (typeof rootReadonly === 'string') {
      readDirs.push(rootReadonly)
    } else if (Array.isArray(rootReadonly)) {
      readDirs.push(...rootReadonly)
    }
    readDirs.push(root)

    this.staticMiddlewares = readDirs.map(readDir => {
      const mid = express.static(readDir, this.options.static)
      mid.root = readDir
      return mid
    })
  }

  _filepath (req) {
    const filepath = path.join(this.options.root, req.params.filepath)
    return filepath
  }

  async get (req, res) {
    const readMiddleware = (middleware) => new Promise(async (resolve, reject) => {
      const filepath = path.join(middleware.root, req.params.filepath)
      middleware(req, res, err => {
        if (err) {
          if (err.status === 404) {
            err.msg = 'No file found.'
          } else {
            err.msg = 'IO failed.'
          }
          resolve(err)
        }
      })
      const exist = await asyncAccess(filepath)
      if (exist) {
        resolve()
      }
    })

    let err
    for (let i = 0; i < this.staticMiddlewares.length; i++) {
      err = await readMiddleware(this.staticMiddlewares[i])
      if (!err) {
        return
      }
    }
    throw err
  }

  async put (req, res) {
    const filepath = this._filepath(req)
    const files = Object.values(req.files)
    const file = files[0]
    // try create parent path
    try {
      if (this.options.createParentPath) {
        const dirname = path.dirname(filepath)

        if (!await asyncAccess(dirname)) {
          await asyncMkdirp(dirname, 0o755)
        }
      }
    } catch (e) {
    // do nothing
    }
    try {
      // do not use file.mv, problems with high concurrency
      // await asyncWrapperWithError(file.mv)(filepath)

      // // error when cross-device, ERROR EXDEV: cross-device link not permitted
      //   await asyncWrapperWithError(fs.rename)(file.tempFilePath, filepath)
      await asyncWrapperWithError(fs.copyFile)(file.tempFilePath, filepath)
      // cancel delete tempFilePath
      // copyFile will conflict with unlink, sometimes slower than unlink
      // try {
      //   await asyncWrapperWithError(fs.unlink)(file.tempFilePath)
      // } catch (e) {
      //   // do nothing
      // }
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
