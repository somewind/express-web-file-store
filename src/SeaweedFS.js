import fs from 'fs'
import lodash from 'lodash'
import axios from 'axios'
import FormData from 'form-data'
import url from 'url'

const defaultOptions = {
  filerServer: 'http://seaweedfs-filer:8888/'
}

export default class SeaweedFS {
  constructor (options = {}) {
    this.options = lodash.merge({}, defaultOptions, options)
  }

  _getFileUrl (req) {
    const fileurl = new url.URL(req.params.filepath, this.options.filerServer)
    return fileurl.href
  }

  async get (req, res) {
    const fileUrl = this._getFileUrl(req)
    if (!fileUrl) {
      const e = new Error('fileUrl is null')
      e.status = 404
      e.msg = 'fileUrl is null'
      throw e
    }

    const response = await axios.get(fileUrl, {
      responseType: 'stream'
    })
    if (response.status === 200) {
      response.data.pipe(res)
    } else {
      const e = new Error(response.statusText)
      e.status = response.status
      e.msg = response.statusText
      throw e
    }
  }

  async put (req, res) {
    const fileUrl = this._getFileUrl(req)
    if (!fileUrl) {
      const e = new Error('fileUrl is null')
      e.status = 404
      e.msg = 'fileUrl is null'
      throw e
    }

    const [file] = Object.values(req.files)

    const formData = new FormData()
    formData.append('file', fs.createReadStream(file.tempFilePath))
    const response = await axios.post(fileUrl, formData, {
      headers: formData.getHeaders()
    })

    if (response.status !== 201) {
      const e = new Error(response.statusText)
      e.status = response.status
      e.msg = response.statusText
      throw e
    }
  }

  async delete (req, res) {
    const fileUrl = this._getFileUrl(req)
    if (!fileUrl) {
      const e = new Error('fileUrl is null')
      e.status = 404
      e.msg = 'fileUrl is null'
      throw e
    }

    const response = await axios.delete(fileUrl)
    if (response.status !== 204) {
      const e = new Error(response.statusText)
      e.status = response.status
      e.msg = response.statusText
      throw e
    }
  }
}
