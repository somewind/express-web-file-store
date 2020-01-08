import express from 'express'
import fileUplaod from 'express-fileupload-temp-file'
import lodash from 'lodash'
import {
  hasErrorHandler,
  checkParam
} from './util'

const illegalChars = [
  '..',
  '../',
  './'
]

const defaultOptions = {
  createParentPath: true,
  useTempFiles: true,
  tempFileDir: '/tmp'
}

const checkSecurity = (filenames) => {
  if (typeof filenames === 'string') {
    filenames = [filenames]
  }

  const illegal = illegalChars.some(str => filenames.some(filename => filename.includes(str)))
  if (illegal) {
    throw new Error('No file found.')
  }
}

const fileStore = (options = {}) => {
  options = lodash.merge({}, defaultOptions, options)

  const router = express.Router()
  const middlewares = []
  const errorResponse = (res, status, msg, err) => {
    res.status(status || 500).json({
      code: status,
      msg: msg || 'Internal Server Error',
      detailMsg: options.verbose && err && err.message,
      stack: options.verbose && err && err.stack
    })
  }
  const defaultErrorHandler = (err, req, res, next) => {
    if (hasErrorHandler(router)) {
      next(err)
    } else {
      errorResponse(res, err.status || 500, err.msg, err)
    }
  }

  router.use(fileUplaod({
    ...options
  }))

  const processMiddlewares = async (funcName, ...args) => {
    let lasterror
    for (let i = 0; i < middlewares.length; i++) {
      const mod = middlewares[i]
      try {
        return await mod[funcName](...args)
      } catch (e) {
        const old = lasterror
        lasterror = e
        lasterror.last = old
      }
    }
    if (lasterror) {
      throw lasterror
    }
  }

  router.post('/*', async (req, res, next) => {
    try {
      checkParam(middlewares.length === 0, 'filestore middlewares is empty.')

      if (!req.files || Object.keys(req.files).length === 0) {
        return errorResponse(res, 400, 'No files were uploaded.')
      }

      checkSecurity(Object.values(req.files).map(f => f.name))

      req.params.filepath = req.path
      await processMiddlewares('put', req, res)
      if (!res.headersSent) {
        res.json({
          code: 0,
          msg: 'ok'
        })
      }
    } catch (e) {
      defaultErrorHandler(e, req, res, next)
    }
  })

  router.get('/*', async (req, res, next) => {
    try {
      checkParam(middlewares.length === 0, 'filestore middlewares is empty.')

      checkSecurity(req.path)

      req.params.filepath = req.path
      await processMiddlewares('get', req, res)
    } catch (e) {
      defaultErrorHandler(e, req, res, next)
    }
  })

  router.delete('/*', async (req, res, next) => {
    try {
      checkParam(middlewares.length === 0, 'filestore middlewares is empty.')

      checkSecurity(req.path)

      req.params.filepath = req.path
      await processMiddlewares('delete', req, res)
      if (!res.headersSent) {
        res.json({
          code: 0,
          msg: 'ok'
        })
      }
    } catch (e) {
      defaultErrorHandler(e, req, res, next)
    }
  })

  // override use function
  const oldUse = router.use
  router.use = function (...args) {
    if (args.length === 1 && typeof args[0] === 'object') {
      const mod = args[0]

      checkParam(!mod.get, 'mod.get can not be null.')
      checkParam(!mod.delete, 'mod.delete can not be null.')
      checkParam(!mod.put, 'mod.put can not be null.')

      middlewares.push(mod)
    } else {
      oldUse.apply(this, args)
    }
  }
  return router
}

export { default as LocalStore } from './LocalStore'
export default fileStore
