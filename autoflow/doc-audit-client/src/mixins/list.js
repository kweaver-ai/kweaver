/** !
 * 列表方法
 */
import XEUtils from 'xe-utils'
import JSZip from 'jszip'
import FileSaver from 'file-saver'
import { docPermCheck, docConvertpath, getUserImagesList } from '@/api/anyshareOpenApi'
import {
  fecthAuthority as fecthTask,
  fecthDownload,
  folderdownload,
  filedownload
} from '@/api/audit'
import { processCategory } from '@/api/workflow'
import { omitDocName, getFileTypeClass } from '@/utils/common.js'
import { tenantId } from '@/utils/config'
export default {
  data() {
    return {
      // 页面遮罩
      loading: true,
      // 列表数据
      dataList: [],
      // 分页参数
      pagination: {
        totalRows: 0,
        pageSize: 50,
        pageSizes: [10, 20, 50, 100, 200],
        pageNumber: 1,
        layout: 'total, prev, pager, next, jumper'
      },
      // 全部对应的申请类型
      audit_types: [],
      initialized_audit_types: false,
      // 流程监控弹框
      flowImgDialog: false,
      temp: {},
      // 所有头像
      userAvatars: {},
      pendingDialog: false,
      type: 'info',
      showEmpty: false, // 加载完数据之前列表不显示数据为空
      tableHeight: 480,
      auditTableHeight: 668,
      idsNoExist: []  // 已不存在的用户 - id
    }
  },
  filters: {
    /**
     * 根据文件全路径得到文件名，并限制显示长度
     * @param {*} value AnyShare://张三/文件夹1/音频1232342342345.mp3
     * @returns 音频12...45.mp3
     */
    formatDocOmitName: function (value) {
      return omitDocName(
        value.substring(value.lastIndexOf('/') + 1, value.length)
      )
    },
    /**
     * 根据文件全路径得到文件名
     * @param {*} value AnyShare://张三/文件夹1/音频1232342342345.mp3
     * @returns 音频1232342342345
     */
    formatDocName: function (value) {
      return value.substring(
        value.lastIndexOf('/') + 1,
        value.lastIndexOf('.') === -1 ? value.length : value.lastIndexOf('.')
      )
    },
    /**
     * 根据文件全路径得到文件全路径名，并限制显示长度
     * @param {*} value AnyShare://张三/文件夹1/音频1232342342345.mp3
     * @returns 张三/...345.mp3
     */
    formatDocFullOmitName: function (value) {
      return omitDocName(
        value.substring(value.lastIndexOf('//') + 2, value.length)
      )
    },
    /**
     * 根据文件全路径得到文件全路径名
     * @param {*} value AnyShare://张三/文件夹1/音频1232342342345.mp3
     * @returns 张三/文件夹1/音频1232342342345.mp3
     */
    formatDocFullName: function (value) {
      return value.substring(value.lastIndexOf('//') + 2, value.length)
    }
  },
  computed: {
    bizTypes: function () {
      let self = this
      // return self.$store.getters.dictList.bizTypes.map(function(item) {
      let allTypes = []
      const newBizTypes = self.$store.getters.dictList.bizTypes.map(function (
        item
      ) {
        // 开启涉密模式后，去除共享的下拉选（指定用户和任意用户），名词改为“内部授权”既是共享给指定用户流程
        if (
          item.value === 'share' &&
          self.$store.state.app.secret.status === 'y'
        ) {
          item.children = undefined
          item.label = self.$t('common.bizTypes.secretRealName')
          item.value = 'realname'
        }
        if (typeof item.children === 'undefined') {
          // 申请类型
          if (item.value === '') {
            return { label: self.$t('common.bizTypes.name'), value: item.value }
          }
          if (item.value === 'realname' || item.value === 'anonymous') {
            // 涉密模式下屏蔽匿名共享类型
            self.$store.state.app.secret.status === 'y' ? allTypes.push('realname') : allTypes.push(item.value)
            return {
              label:
                self.$store.state.app.secret.status === 'y' &&
                  item.value === 'realname'
                  ? self.$t('common.bizTypes.secretRealName')
                  : self.$t('common.bizTypes.' + item.value),
              value: item.value
            }
          } else {
            item.value && allTypes.push(item.value)
            return {
              label: item.label,
              value: item.value
            }
          }
          // 共享类型
        } else {
          if (item.children.length === 1) {
            const item2 = item.children[0]
            item2.value && allTypes.push(item2.value)
            return {
              label:
                item2.value === 'realname' || item2.value === 'anonymous'
                  ? self.$t('common.bizTypes.' + item2.value)
                  : item2.label,
              value: item2.value
            }
          }
          return {
            label: item.label,
            value: item.value,
            children: item.children.map(function (item2) {
              item2.value && allTypes.push(item2.value)
              return {
                label:
                  item2.value === 'realname' || item2.value === 'anonymous'
                    ? self.$t('common.bizTypes.' + item2.value)
                    : item2.label,
                value: item2.value
              }
            })
          }
        }
      })
      self.audit_types = allTypes
      return newBizTypes
    },
    microWidgetPropsVal() {
      return this.$store.state.app.microWidgetProps
    },
    showRealnameShare() {
      if (this.microWidgetPropsVal
        && this.microWidgetPropsVal.config.shareConfig
        && this.microWidgetPropsVal.config.shareConfig.isShowRealnameShare === false) {
        return false
      }
      return true
    },
    showAnonymousShare() {
      if (this.microWidgetPropsVal
        && this.microWidgetPropsVal.config.shareConfig
        && this.microWidgetPropsVal.config.shareConfig.isShowAnonymousShare === false) {
        return false
      }
      return true
    }
  },
  created() {
    // 监听窗口大小变化
    this.$nextTick(function () {
      const _this = this
      let headBarOffset = 0
      try {
        const config = localStorage.getItem('commonOEMConfig')
        if (config
          && this.microWidgetPropsVal
          && this.microWidgetPropsVal.config.systemInfo.isInElectronTab === false
        ) {
          const json = JSON.parse(config)
          const topBarHeight = json.topBarHeight
          if (topBarHeight) {
            headBarOffset = topBarHeight - 52
          }
        }
      } catch (error) {
        console.warn(error)
      }

      this.auditTableHeight = window.innerHeight - 150 - headBarOffset + 'px'

      this.tableHeight =
        window.innerHeight - this.$refs.singleTable.$el.offsetTop - 155 - headBarOffset
      if (
        _this.microWidgetPropsVal !== null &&
        !_this.microWidgetPropsVal.config.systemInfo.isInElectronTab
      ) {
        _this.tableHeight = _this.tableHeight - 25
      }
      window.addEventListener('resize', () => {
        if (_this.$refs.singleTable) {
          _this.auditTableHeight = window.innerHeight - 150 - headBarOffset + 'px'
          _this.tableHeight =
            window.innerHeight - _this.$refs.singleTable.$el.offsetTop - 155 - headBarOffset
          if (
            _this.microWidgetPropsVal !== null &&
            !_this.microWidgetPropsVal.config.systemInfo.isInElectronTab
          ) {
            _this.tableHeight = _this.tableHeight - 25
          }
        }
      })
    })
  },
  mounted() {
    this.initApplyTypeElementWidth('')
    this.initProcessCategory()
  },
  methods: {
    initProcessCategory() {
      const _this = this
      if (this.$store.getters.dictList.bizTypes.length > 3) {
        this.initialized_audit_types = true
        return
      }
      processCategory().then(res => {
        let processCategoryList = res.data
        // 根据客户端共享配置屏蔽类型
        let bizTypesArr =
          tenantId === 'af_workflow'
            ? this.$store.getters.dictList.bizTypes.filter(
              bizTypeItem => bizTypeItem.value === ''
            )
            : this.$store.getters.dictList.bizTypes.filter(
              bizTypeItem => {
                if (bizTypeItem.value === '') {
                  return true
                }
                if (bizTypeItem.value === 'realname' && _this.showRealnameShare) {
                  return true
                }
                if (bizTypeItem.value === 'share') {
                  if (!_this.showRealnameShare && !_this.showAnonymousShare) {
                    return false
                  }
                  if (!_this.showRealnameShare) {
                    bizTypeItem.children = bizTypeItem.children.filter(i => i.value !== 'realname')
                    if (_this.$store.state.app.secret.status === 'y') {
                      return false
                    }
                  }
                  if (!_this.showAnonymousShare) {
                    bizTypeItem.children = bizTypeItem.children.filter(i => i.value !== 'anonymous')
                  }
                  return true
                }
                return false
              }
            )
        const lang = XEUtils.cookie('lang') || 'zh-cn'
        processCategoryList.forEach(e => {
          // 实名共享/匿名共享使用默认配置
          if (
            ['perm', 'owner', 'inherit', 'anonymous'].includes(e.audit_type) ||
            typeof e.audit_type !== 'string'
          ) {
            return
          }
          let item = {
            label: e.label[lang] + this.$t('common.column.apply'),
            value: e.audit_type,
            entry: e.entry,
            name: e.name,
            resubmit: e.resubmit
          }
          const arr = bizTypesArr.filter(
            bizTypeItem => bizTypeItem.value === e.audit_type
          )
          if (arr.length === 0) {
            bizTypesArr.push(item)
          }
        })
        this.initialized_audit_types = true
        this.$store.getters.dictList.bizTypes = bizTypesArr
      }).catch(err => {
        console.error(err)
        this.initialized_audit_types = true
        this.$nextTick(function () {
          this.loading = false
        })
      })
    },
    // 申请类型筛选参数适配
    transformQueryParams(params) {
      if (!params.type && this.audit_types.length > 0) {
        if (this.audit_types.includes('realname')) {
          return { ...params, type: ['perm', 'owner', 'inherit', ...this.audit_types].join(',') }
        }
        return { ...params, type: this.audit_types.join(',') }
      }
      if (params.type === 'realname') {
        return { ...params, type: ['realname', 'perm', 'owner', 'inherit'].join(',') }
      }
      return params
    },
    initApplyTypeElementWidth(value) {
      const span = document.createElement('span')
      span.innerHTML = this.$t(
        'common.bizTypes.' + (value === '' ? 'name' : value)
      )
      let bizTypesArr = this.$store.getters.dictList.bizTypes.filter(
        bizTypeItem =>
          bizTypeItem.value === value &&
          bizTypeItem.value !== 'share' &&
          bizTypeItem.value !== ''
      )
      span.innerHTML =
        bizTypesArr.length > 0 ? bizTypesArr[0].label : span.innerHTML
      document.body.appendChild(span)
      let el_cascader_element = document.querySelector('#applyTypeElement')
      el_cascader_element.style.width = span.offsetWidth + 40 + 'px'
      document.body.removeChild(span)
    },
    handleCommand(value) {
      this.queryParams.status = value
      this.pagination.pageNumber = 1
      this.handleSearch()
    },
    // 检查当前待办是否有效
    checkFlow(params) {
      let self = this
      self.loading = true
      return new Promise(function (resolve, reject) {
        fecthTask(params)
          .then(res => {
            self.loading = false
            if (!res.data.result) {
              reject(res)
            } else {
              resolve(res.data)
            }
          })
          .catch(res => {
            reject(res)
            self.loading = false
          })
      })
    },
    // 获取所有相关用户头像
    async getAllUserAvatars(ids) {
      if (!ids.length) return

      const filterIds = this.$utils.uniq(ids).filter((id) => !this.idsNoExist.includes(id))
      try {
        const res = await getUserImagesList(filterIds)
        const obj = Object.assign({}, this.userAvatars)
        res.data.forEach((item) => {
          obj[item.id] = item.avatar_url
        })
        this.userAvatars = obj
      } catch (error) {
        // 有不存在的用户 （id失效）
        if (error && error.response && error.response.status === 404) {
          const { data: { code, detail: { ids: noExist } } } = error.response
          if (code === 404019001) {
            this.idsNoExist = [...this.idsNoExist, ...noExist]
            this.getAllUserAvatars(filterIds.filter(id => !noExist.includes(id)))
          }
        }
        console.error(error)
      }
    },
    // 分页大小改变
    handleSizeChange(val) {
      this.pagination.pageNumber = 1
      this.pagination.pageSize = val
      this.handleSearch()
    },
    // 当前页改变
    handleCurrentChange(val) {
      this.pagination.pageNumber = val
      this.handleSearch()
    },
    // 流程监控
    showProce(data) {
      this.temp = data
      this.flowImgDialog = true
    },
    // 检查是否为图片文件
    checkImage(docName) {
      return /\.(jpg|jpeg|gif|bmp|png|wmf|emf|svg|tga|tif)$/.test(docName)
    },
    // 图片展示url
    getShowImgUrl(docId) {
      const url =
        this.anyshareUrl +
        '/api/efast/v1/file/thumbnail?docid=' +
        docId +
        '&width=32&height=32&quality=50&tokenid=' +
        this.$utils.cookie('client.oauth2_token') +
        '&hash=0.6882342623953095'
      return encodeURI(url)
    },
    /**
     * 判断是否是 知识发布申请-多文档发布
     */
    getIsMultiKcPublish(info) {
      try {
        const { apply_detail: { data }, biz_type } = info
        const { hook } = JSON.parse(data)

        if (biz_type === 'wikidoc_publish' && !!hook) {
          return true
        }

        return false
      } catch {
        return false
      }
    },
    // 文件图标class
    fileClass(row) {
      if (row.doc_type === 'folder') {
        return { folder: true } // 文件夹
      }
      if (row.doc_type === 'multiple' || this.getIsMultiKcPublish(row)) {
        return { plwd: true } // 多个文件
      }
      return getFileTypeClass(row.doc_path)
    },

    // 文件图标class
    arbitrarilyFileClass(_doc_name, _doc_type) {
      if (_doc_type === 'folder') {
        return { folder: true } // 文件夹
      }

      if (_doc_type === 'multiple') {
        return { plwd: true } // 多个文件
      }

      if (_doc_type === 'autosheet') {  // 表格文件
        return { 'autosheet': true }
      }

      if (_doc_type === 'article') {  // wikidoc
        return { 'wiki': true }
      }

      if (_doc_type === 'group') {  // wikidoc分组
        return { 'wiki-group': true }
      }

      return getFileTypeClass(_doc_name)
    },
    // 申请列表下载文件
    download(row, type) {
      let self = this
      let docName = row.doc_path.substring(
        row.doc_path.lastIndexOf('/') + 1,
        row.doc_path.length
      )
      // 检查文件是否存在
      self.loading = true
      self
        .permCheck(row.doc_id, 'display')
        .then(res => {
          self.executeDownload(row, type)
        })
        .catch(res => {
          console.error(res)
          self.$nextTick(function () {
            self.loading = false
          })
          if (
            res.response.data.code === 404002006 ||
            res.response.data.code === 400000000
          ) {
            let msg =
              row.doc_type === 'folder'
                ? self.$t('message.folderNotExist')
                : self.$t('message.fileNotExist')
            msg = msg.replace('{}', docName)
            self.$dialog_alert(
              self.$t('message.downloadError'),
              msg,
              self.$t('message.confirm')
            )
          } else {
            self.$dialog_alert(
              self.$t('message.downloadError'),
              res.response.data.message,
              self.$t('message.confirm')
            )
          }
        })
    },
    executeDownload(row, type) {
      let self = this
      const params = {
        proc_inst_id: row.proc_inst_id,
        type: type,
        read_restriction: 'download',
        doc_id: row.doc_id,
        doc_lib_type: row.doc_lib_type,
        rev: row.version,
        id: row.id
      }
      fecthDownload(params)
        .then(res => {
          self.$nextTick(function () {
            self.loading = false
          })
          let downloadUrl = ''
          if (res.data.read_as === 'sub_document') {
            downloadUrl = res.data.subResult.url
          } else if (res.data.read_as === 'not_allow') {
            self.$dialog_alert(
              self.$t('message.downloadError'),
              self.$t('message.readingControls'),
              self.$t('message.confirm')
            )
            return
          } else {
            downloadUrl = res.data.masterResult.authrequest[1]
          }
          if (self.microWidgetPropsVal) {
            const functionid =
              self.microWidgetPropsVal.config.systemInfo.functionid
            const params = {
              functionid: functionid,
              url: downloadUrl
            }
            self.microWidgetPropsVal.contextMenu.downloadWithUrl(params)
          } else {
            const link = document.createElement('a')
            link.style.display = 'none'
            link.href = downloadUrl
            link.download = row.doc_path.substring(
              row.doc_path.lastIndexOf('/') + 1,
              row.doc_path.length
            )
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)
          }
        })
        .catch(res => {
          self.$nextTick(function () {
            self.loading = false
          })
          if (res.response.data.code === 401001101) {
            self.$dialog_alert(
              self.$t('message.downloadError'),
              self.$t('message.UndoFailedNotTask'),
              self.$t('message.confirm'),
              function () {
                self.pagination.pageNumber = 1
                self.handleSearch()
              }
            )
          } else if (res.response.data.code === 401001102) {
            self.$dialog_alert(
              self.$t('message.downloadError'),
              self.$t('message.csfLevel'),
              self.$t('message.confirm')
            )
          } else if (res.response.data.code === 401001103) {
            self.$dialog_alert(
              self.$t('message.downloadError'),
              self.$t('message.readingStrategies'),
              self.$t('message.confirm')
            )
          } else if (res.response.data.code === 503008001) {
            // 转码中,轮询下载
            self.loading = true
            self.executeDownload(row, type)
          } else {
            self.$dialog_alert(
              self.$t('message.downloadError'),
              res.response.data.message,
              self.$t('message.confirm')
            )
          }
        })
    },
    onDownloadFolder(row, type) {
      const _this = this
      let docName = row.doc_path.substring(
        row.doc_path.lastIndexOf('/') + 1,
        row.doc_path.length
      )
      // 检查文件是否存在
      _this.loading = true
      _this
        .permCheck(row.doc_id, 'display')
        .then(res => {
          let doc_path = row.doc_path
          let save_name =
            doc_path.indexOf('/') !== -1
              ? doc_path.substring(doc_path.lastIndexOf('/') + 1)
              : doc_path
          _this
            .getDirectoryFile(
              row.doc_id,
              row.proc_inst_id,
              type,
              row.doc_lib_type
            )
            .then(res => {
              _this.download_num = 0
              _this.download_total = 0
              _this.percentage = 0
              _this.download_doc_name = save_name
              _this.$refs['downloadProgress'].openSelector()
              _this.loading = false
              _this.batchFileZip(
                res.folder_download_list,
                res.folder_total,
                save_name
              )
            })
            .catch(res => {
              if (res.response.data.code === 401001101) {
                _this.$dialog_alert(
                  _this.$t('message.downloadError'),
                  _this.$t('message.UndoFailedNotTask'),
                  _this.$t('message.confirm'),
                  function () {
                    _this.pagination.pageNumber = 1
                    _this.handleSearch()
                  }
                )
              } else if (res.response.data.code === 401001102) {
                _this.$dialog_alert(
                  _this.$t('message.downloadError'),
                  _this.$t('message.csfLevel'),
                  _this.$t('message.confirm')
                )
              } else if (res.response.data.code === 401001103) {
                _this.$dialog_alert(
                  _this.$t('message.downloadError'),
                  _this.$t('message.readingStrategies'),
                  _this.$t('message.confirm')
                )
              } else if (
                res.response.data.code === 404002006 ||
                res.response.data.code === 400000000
              ) {
                let msg = _this.$t('message.folderNotExist')
                msg = msg.replace('{}', save_name)
                _this.$dialog_alert(
                  _this.$t('message.downloadError'),
                  msg,
                  _this.$t('message.confirm')
                )
              } else {
                _this.$dialog_alert(
                  _this.$t('message.downloadError'),
                  res.response.data.message,
                  _this.$t('message.confirm')
                )
              }
            })
        })
        .catch(res => {
          console.error(res)
          if (
            res.response.data.code === 404002006 ||
            res.response.data.code === 400000000
          ) {
            let msg = _this.$t('message.folderNotExist').replace('{}', docName)
            self.$dialog_alert(
              self.$t('message.downloadError'),
              msg,
              self.$t('message.confirm')
            )
          } else {
            self.$dialog_alert(
              self.$t('message.downloadError'),
              res.response.data.message,
              self.$t('message.confirm')
            )
          }
        })
    },
    getDirectoryFile(_doc_id, _proc_inst_id, _type, _doc_lib_type) {
      return new Promise((resolve, reject) => {
        const params = {
          proc_inst_id: _proc_inst_id,
          type: _type,
          doc_id: _doc_id,
          doc_lib_type: _doc_lib_type,
          by: 'time',
          sort: 'desc'
        }
        folderdownload(params)
          .then(res => {
            resolve(res.data)
          })
          .catch(err => {
            reject(err)
          })
      })
    },
    batchFileZip(folderDownloadList, folder_total, _save_name) {
      let zip = new JSZip()
      let promises = []
      let cache = {}
      const _this = this
      if (folderDownloadList.length === 0 && _save_name !== '') {
        _this.percentage = 50
        zip.folder(_save_name)
      } else {
        for (const item of folderDownloadList) {
          const folder_name = item.folder_name
          const download_file_list = item.download_file_list
          download_file_list.forEach(fileItem => {
            const promise = _this
              .getFile(fileItem)
              .then(data => {
                // 下载文件, 并存成ArrayBuffer对象
                if (folder_name !== '') {
                  zip
                    .folder(folder_name)
                    .file(fileItem.name, data, { binary: true })
                } else {
                  zip.file(fileItem.name, data, { binary: true })
                }
                cache[fileItem.name] = data
                _this.download_num += 1
                _this.percentage = parseInt(
                  ((_this.download_num / folder_total / 2) * 100).toFixed(0)
                )
              })
              .catch(err => { })
            promises.push(promise)
          })
        }
      }
      Promise.all(promises)
        .then(() => {
          zip
            .generateAsync({ type: 'blob' }, function updateCallback(metadata) {
              _this.percentage = 50 + parseInt(metadata.percent.toFixed(2) / 2)
            })
            .then(content => {
              // 生成二进制流
              _this.percentage = 100
              FileSaver.saveAs(content, _save_name + '.zip') // 利用file-saver保存文件  自定义文件名
            })
        })
        .catch(err => { })
    },
    getFile(file) {
      return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest()
        xhr.open('get', file.download_url, true)
        xhr.responseType = 'blob'
        xhr.send()
        xhr.onload = function () {
          if (xhr.status === 200) {
            resolve(xhr.response)
          } else {
            reject(xhr.status)
          }
        }
      })
    },
    openPath(row) {
      let self = this
      let docPath = ''
      if ('multiple' === row.doc_type) {
        docPath = row.doc_id.substring(row.doc_id.lastIndexOf('://') + 3)
      } else {
        docPath = row.doc_id.substring(
          row.doc_id.lastIndexOf('://') + 3,
          row.doc_id.lastIndexOf('/')
        )
      }
      let docName = row.doc_path.substring(
        row.doc_path.lastIndexOf('/') + 1,
        row.doc_path.length
      )
      self
        .permCheck(row.doc_id, 'display')
        .then(function (res) {
          if (res.data.result !== 0) {
            let title =
              row.doc_type === 'folder'
                ? self.$t('message.openFolderPathError')
                : self.$t('message.openFilePathError')
            let msg =
              row.doc_type === 'folder'
                ? self.$t('message.folderNotPrem')
                : self.$t('message.fileNotPrem')
            msg = msg.replace('{}', docName)
            self.$dialog_alert(title, msg, self.$t('message.confirm'))
            return
          }
          let params = {
            proc_inst_id: row.proc_inst_id,
            type: 'apply'
          }
          self
            .checkFlow(params)
            .then(function () {
              if (self.microWidgetPropsVal) {
                if (
                  !self.microWidgetPropsVal.config.systemInfo.isInElectronTab
                ) {
                  let anysharePrefix = self.anyshareUrl + '/anyshare/'
                  self.microWidgetPropsVal.history.openBrowser(
                    anysharePrefix + 'dir/' + docPath
                  )
                } else {
                  self.microWidgetPropsVal.history.push({
                    url: 'dir/' + docPath
                  })
                }
              } else {
                let anysharePrefix = self.anyshareUrl + '/anyshare/'
                let url =
                  'location?docid=' +
                  row.doc_id +
                  '&tokenid=' +
                  self.$utils.cookie('client.oauth2_token')
                window.open(anysharePrefix + url)
              }
            })
            .catch(res => {
              if (res.response.data.code === 401001101) {
                self.$dialog_alert(
                  '',
                  self.$t('message.UndoFailedNotTask'),
                  self.$t('message.confirm'),
                  function () {
                    self.pagination.pageNumber = 1
                    self.handleSearch()
                  }
                )
              } else if (res.response.data.code === 401001102) {
                self.$dialog_alert(
                  '',
                  self.$t('message.csfLevel'),
                  self.$t('message.confirm')
                )
              }
            })
        })
        .catch(res => {
          let title =
            row.doc_type === 'folder'
              ? self.$t('message.openFolderPathError')
              : self.$t('message.openFilePathError')
          if (
            res.response.data.code === 404002006 ||
            res.response.data.code === 400000000
          ) {
            let msg =
              row.doc_type === 'folder'
                ? self.$t('message.folderNotExist')
                : self.$t('message.fileNotExist')
            msg = msg.replace('{}', docName)
            self.$dialog_alert(title, msg, self.$t('message.confirm'))
          } else {
            self.$dialog_alert(
              title,
              res.response.data.message,
              self.$t('message.confirm')
            )
          }
        })
    },
    // 转换路径协议
    convertpath(docid) {
      return new Promise(function (resolve, reject) {
        docConvertpath(docid)
          .then(res => {
            if (res.data.namepath !== null) {
              resolve(true)
            }
            reject(false)
          })
          .catch(res => {
            reject(false)
          })
      })
    },
    // 检查单个权限
    permCheck(docid, perm) {
      return new Promise(function (resolve, reject) {
        docPermCheck(docid, perm)
          .then(res => {
            resolve(res)
          })
          .catch(res => {
            reject(res)
          })
      })
    },
    // 审核列表打开文档
    openDocForCheck(row) {
      let self = this
      // 检查当前待办是否有效
      let params = {
        proc_inst_id: row.proc_inst_id,
        type: 'apply'
      }
      self
        .checkFlow(params)
        .then(function () {
          self.openDoc(row)
        })
        .catch(res => { })
    },
    // 申请列表打开文档
    openDoc(row) {
      let self = this
      let docPath = row.doc_id.substring(
        row.doc_id.lastIndexOf('://') + 3,
        row.doc_id.lastIndexOf('/')
      )
      let docName = row.doc_path.substring(
        row.doc_path.lastIndexOf('/') + 1,
        row.doc_path.length
      )
      self
        .permCheck(row.doc_id, 'display')
        .then(res => {
          if (res.data.result !== 0) {
            let title =
              row.doc_type === 'folder'
                ? self.$t('message.openFolderError')
                : self.$t('message.openFileError')
            let msg =
              row.doc_type === 'folder'
                ? self.$t('message.folderNotPrem')
                : self.$t('message.fileNotPrem')
            msg = msg.replace('{}', docName)
            self.$dialog_alert(title, msg, self.$t('message.confirm'))
            return
          }
          // // 文件夹做特殊处理,展示文件列表
          if (self.microWidgetPropsVal) {
            if (!self.microWidgetPropsVal.config.systemInfo.isInElectronTab) {
              let anysharePrefix = self.anyshareUrl + '/anyshare/'
              self.microWidgetPropsVal.history.openBrowser(
                anysharePrefix + 'dir/' + docPath
              )
            } else {
              self.microWidgetPropsVal.history.push({ url: 'dir/' + docPath })
            }
          } else {
            if (row.doc_type === 'folder') {
              let url =
                self.anyshareUrl +
                '/anyshare/opendir?docid=' +
                row.doc_id +
                '&tokenid=' +
                self.$utils.cookie('client.oauth2_token')
              window.open(url)
              return
            }
            const parseUrl = self.$utils.parseUrl(window.location.href)
            let url =
              parseUrl.origin +
              parseUrl.path +
              '#/preview?docid=' +
              row.doc_id +
              '&name=' +
              row.doc_path.substring(
                row.doc_path.lastIndexOf('/') + 1,
                row.doc_path.length
              )
            window.open(url)
          }
        })
        .catch(res => {
          let title =
            row.doc_type === 'folder'
              ? self.$t('message.openFolderError')
              : self.$t('message.openFileError')
          if (
            res.response.data.code === 404002006 ||
            res.response.data.code === 400000000
          ) {
            let msg =
              row.doc_type === 'folder'
                ? self.$t('message.folderNotExist')
                : self.$t('message.fileNotExist')
            msg = msg.replace('{}', docName)
            self.$dialog_alert(title, msg, self.$t('message.confirm'))
          } else {
            self.$dialog_alert(
              title,
              res.response.data.message,
              self.$t('message.confirm')
            )
          }
        })
    },
    formatDocName(row) {
      if (row.doc_names === null && row.doc_path === null) {
        return
      }
      if (row.doc_names !== null) {
        // eslint-disable-next-line consistent-return
        return row.doc_names
      } else {
        // eslint-disable-next-line consistent-return
        return row.doc_path.substring(
          row.doc_path.lastIndexOf('/') + 1,
          row.doc_path.length
        )
      }
    },
    closeInfo() {
      this.id = ''
    },
    /**
     * 高亮摘要关键字
     * @description 可自定义HTML结构
     * @param {String} content - 内容
     * @return void
     */
    hightLightText(content) {
      if (this.searchParams.abstracts.length === 0) {
        return content
      }
      let originalContent = { text: content }
      let findStrItem = {}
      this.searchParams.abstracts.forEach(s => {
        // 判断文本段落(原文本)是否为空
        s = s.replace(/(^\s*)|(\s*$)/g, '')
        if (
          originalContent.text &&
          originalContent.text !== '' &&
          s &&
          s !== ''
        ) {
          if (originalContent.text.indexOf(s) !== -1) {
            findStrItem[
              `${s}`
            ] = `<span class="abstracts-ser-color">${s}</span>`
          }
        }
      })
      this.searchParams.abstracts.forEach(s => {
        s = s.replace(/(^\s*)|(\s*$)/g, '')
        if (findStrItem[s]) {
          originalContent.text = originalContent.text.replace(s, findStrItem[s])
        }
      })
      return originalContent.text
    },
    /**
     * 高亮发起人关键字
     * @description 可自定义HTML结构
     * @param {String} content - 内容
     * @return void
     */
    hightLightApplyUserName(content) {
      if (this.searchParams.apply_user_names.length === 0) {
        return content
      }
      let resultStr = content // 内容(原文本)
      this.searchParams.apply_user_names.forEach(s => {
        // 判断文本段落(原文本)是否为空
        if (resultStr && resultStr !== '' && s && s !== '') {
          if (content.indexOf(s) !== -1) {
            resultStr = content.replace(
              s,
              `<span class="abstracts-ser-color">${s}</span>`
            )
            return
          }
        }
      })
      return resultStr
    }
  }
}
