import fs from 'fs'
import path from 'path'

export const checkParam = (flag, msg, name) => {
  if (flag) {
    throw new Error(msg || `${name || 'expression results'} can not be null!`)
  }
}

export const hasErrorHandler = (router) => {
  if (!router.stack) {
    return false
  }

  return router.stack.some(s => s.handle.length === 4)
}

export const asyncWrapperWithError = (func) => async (...args) => {
  const wrapper = asyncWrapper(func)
  const result = await wrapper(...args)
  if (result[0]) {
    throw result[0]
  }
  return result.slice(1)
}

export const asyncWrapperWithBoolean = (func) => async (...args) => {
  const wrapper = asyncWrapper(func)
  const result = await wrapper(...args)
  if (result[0]) {
    return false
  }
  return true
}

export const asyncWrapper = (func) => {
  if (typeof func !== 'function') {
    throw new Error('func must be function')
  }
  return (...args) => new Promise((resolve, reject) => {
    func(...args, (...callbackArgs) => {
      resolve(callbackArgs)
    })
  })
}

export const asyncStat = asyncWrapperWithError(fs.stat)
export const asyncUnlink = asyncWrapperWithError(fs.unlink)
export const asyncMkdir = asyncWrapperWithError(fs.mkdir)
export const asyncAccess = asyncWrapperWithBoolean(fs.access)

export const asyncMkdirp = async (dirname, mode) => {
  const exist = await asyncAccess(dirname)
  if (!exist) {
    await asyncMkdirp(path.dirname(dirname))
    try {
      await asyncMkdir(dirname, mode)
    } catch (e) {
      // may be created asynchronously by another, ignore EEXIST error
      if (e.code !== 'EEXIST') {
        throw e
      }
    }
  }
}
