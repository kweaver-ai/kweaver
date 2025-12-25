<template>
  <div class="file-lists" v-loading="loading">
    <template v-if="temp.doc_type === 'file'">
      <div class="list">
        <div :class="fileClass(temp.doc_path)" class="paper-list">
          <!---加上xls(文件后缀)，可以改变图标；加上unread有红点；加上hover-btn操作按钮变成鼠标滑过才出现--->
          <div class="file-ico">
            <Thumbnail :rowData="temp"></Thumbnail>
          </div>
          <div class="file-title">
            <span  v-title :title="temp.doc_path" >{{ temp.doc_path | formatDocName}}</span>
          </div>
          <div class="file-btn">
            <a class="btn-updown" v-title  :title="$t('common.operation.download')" @click="download(temp.doc_id, temp.doc_path)"></a>
          </div>
        </div>
        <!----paper-list----->
      </div>
    </template>
    <div style="margin-top: 15px;">
      <template v-for="(item, index) in fileList">
        <div class="list" v-if="temp.apply_type !== 'flow'">
          <div :class="fileClass(item.name)" class="paper-list">
            <!---加上xls(文件后缀)，可以改变图标；加上unread有红点；加上hover-btn操作按钮变成鼠标滑过才出现--->
            <div class="file-ico">
              <Thumbnail :rowData="item"></Thumbnail>
            </div>
            <div class="file-title">
              <span v-title :title="item.name">{{ item.name}}</span>
            </div>
            <div class="file-btn">
              <a class="btn-updown" v-title :title="$t('common.operation.download')"  @click="download(item.docid, item.name)"></a>
            </div>
          </div>
          <!----paper-list----->
          <div class="data-text">
            <template v-if="$store.state.app.secret.status === 'y'">
              <span v-title :title="temp.doc_path.replace('Anyshare://','') + item.path" >
                <span>{{ temp.doc_path.replace('Anyshare://','') }}{{ item.path }}</span>
              </span>
            </template>
            <template v-else>
              <span v-title :title="temp.doc_path + item.path" >
                <span>{{ temp.doc_path }}{{ item.path }}</span>
              </span>
            </template>
          </div>
        </div>
        <div class="list" v-else>
          <div :class="fileClass(item.path)" class="paper-list">
            <!---加上xls(文件后缀)，可以改变图标；加上unread有红点；加上hover-btn操作按钮变成鼠标滑过才出现--->
            <div class="file-ico">
              <Thumbnail :rowData="item"></Thumbnail>
            </div>
            <div class="file-title">
              <span v-title :title="formatName(item.path)">{{formatName(item.path) }}</span>
            </div>
            <div class="file-btn">
              <a class="btn-updown"  :title="$t('common.operation.download')"  @click="download(item.id, item.path,item.version)"></a>
            </div>
          </div>
          <!----paper-list----->
          <div class="data-text" v-if="temp.doc_type === 'folder' || temp.doc_type === 'multiple' ">
            <template v-if="$store.state.app.secret.status === 'y'">
              <span v-title :title="`${temp.doc_path.replace('Anyshare://','')}/${item.path}`">
                <span>{{ temp.doc_path.replace('Anyshare://','') }}/{{ item.path }}</span>
              </span>
            </template>
            <template v-else>
              <span v-title :title="`${temp.doc_path}/${item.path}`">
                <span>{{ temp.doc_path }}/{{ item.path }}</span>
              </span>
            </template>
          </div>
        </div>
        <!----list----->
      </template>
      <div v-if="(temp.doc_type === 'folder' || temp.doc_type === 'multiple' ) && fileList.length === 0" class="rzsj_empty">
        <div class="error_img img_1">
          <div class="images-2"/>
        </div>
        <div class="error_text">
          <p class="text">{{ $t('common.detail.dirEmpty') }}</p>
        </div>
      </div>
      <!--rzsj_error 暂无数据-->
    </div>
  </div>
</template>
<script>
import detail from './detail'
import { fecthDirsList, fecthDownload } from '@/api/audit'
import { docPermCheck } from '@/api/anyshareOpenApi'
import Thumbnail from '@/components/Thumbnail'
import { getFileTypeClass } from '@/utils/common.js'
export default {
  components: { detail, Thumbnail },
  props: {
    temp: {
      type: Object,
      required: true
    }
  },
  filters: {
    /**
     * 根据文件全路径得到文件名
     * @param {*} value AnyShare://张三/文件夹1/音频1232342342345.mp3
     * @returns 音频1232342342345.mp3
     */
    formatDocName: function (value) {
      if (value == null) return
      return value.substring(value.lastIndexOf('/') + 1, value.length)
    }
  },
  data () {
    return {
      loading: false,
      fileList: []
    }
  }, computed: {
    microWidgetPropsVal () {
      return this.$store.state.app.microWidgetProps
    }
  },
  methods: {
    /**
     * 查询文件夹中子文件
     */
    handleSearch () {
      let _this = this
      _this.fileList = []
      if (_this.temp.doc_type === 'folder' && _this.temp.apply_type !== 'flow') {
        _this.loading = true
        const params = {
          'proc_inst_id': _this.temp.proc_inst_id,
          'type': 'task',
          'doc_id': _this.temp.doc_id
        }
        fecthDirsList(params).then(res => {
          _this.fileList = res.data.files
          _this.$nextTick(function () {
            _this.loading = false
          })
        }).catch(res => {
          if (res.response.data.code === 401001101) {
            _this.$dialog_alert(_this.$t('message.downloadError'), _this.$t('message.UndoFailedNotTask'), _this.$t('message.confirm'), function () {
              _this.$emit('auditResult')
            })
          } else if (res.response.data.code === 401001102) {
            _this.$dialog_alert('', _this.$t('message.csfLevel'), _this.$t('message.confirm'))
          } else if (res.response.data.code === 401001103) {
            _this.$dialog_alert('', _this.$t('message.readingStrategies'), _this.$t('message.confirm'))
          } else {
            _this.$dialog_alert('', res.response.data.message, _this.$t('message.confirm'))
          }
        })
      }
      if ((_this.temp.doc_type === 'folder' || _this.temp.doc_type === 'multiple') && _this.temp.apply_type === 'flow') {
        _this.fileList = _this.temp.apply_detail.doc_list
      }

    },
    /**
     * @description 申请列表下载文件
     * @param id 申请ID
     * @param name 文件名称
     * @param version 文件版本
     * @author xiashneghui
     * @updateTime 2022/3/2
     * */
    download (id, name, version) {
      if (this.temp.apply_type === 'flow') {
        name = name.substring(name.lastIndexOf('/') + 1)
      }
      let _this = this
      _this.loading = true
      _this.executeDownload(id, name, version)
    },
    /**
     * @description 下载文件
     * @param id 申请ID
     * @param name 文件名称
     * @param version 文件版本
     * @author xiashneghui
     * @updateTime 2022/3/2
     * */
    executeDownload (id, name, version) {
      let _this = this
      let docName = name.substring(name.lastIndexOf('/') + 1, name.length)
      const params = {
        'proc_inst_id': _this.temp.proc_inst_id,
        'type': 'task',
        'read_restriction': 'download',
        'doc_id': id,
        'rev': version,
        'doc_lib_type': _this.temp.apply_detail.doc_lib_type,
        'id': _this.temp.id
      }
      fecthDownload(params).then((res) => {
        _this.$nextTick(function () {
          _this.loading = false
        })
        let downloadUrl = ''
        if (res.data.read_as === 'sub_document') {
          downloadUrl = res.data.subResult.url
        } else if (res.data.read_as === 'not_allow') {
          _this.$dialog_alert(_this.$t('message.downloadError'), _this.$t('message.readingControls'), _this.$t('message.confirm'))
          return
        } else {
          downloadUrl = res.data.masterResult.authrequest[1]
        }
        if (_this.microWidgetPropsVal) {
          const functionid = _this.microWidgetPropsVal.config.systemInfo.functionid
          const params = {
            functionid: functionid,
            url: downloadUrl
          }
          _this.microWidgetPropsVal.contextMenu.downloadWithUrl(params)
        } else {
          const link = document.createElement('a')
          link.style.display = 'none'
          link.href = downloadUrl
          link.download = docName
          document.body.appendChild(link)
          link.click()
          document.body.removeChild(link)
        }
      }).catch(res => {
        _this.$nextTick(function () {
          _this.loading = false
        })
        if(res.response && res.response.status === 401) {
          return 
        }
        if (res.response.data.code === 401001101) {
          _this.$dialog_alert(_this.$t('message.downloadError'), _this.$t('message.UndoFailedNotTask'), _this.$t('message.confirm'), function () {
            _this.$emit('auditResult')
          })
        } else if (res.response.data.code === 401001102) {
          _this.$dialog_alert(_this.$t('message.downloadError'), _this.$t('message.csfLevel'), _this.$t('message.confirm'))
        } else if (res.response.data.code === 401001103) {
          _this.$dialog_alert(_this.$t('message.downloadError'), _this.$t('message.readingStrategies'), _this.$t('message.confirm'))
        } else if (res.response.data.code === 503008001) {
          // 转码中,轮询下载
          _this.loading = true
          _this.executeDownload(id, name)
        } else {
          if (res.response.data.code !== 500) {
            _this.$dialog_alert(_this.$t('message.downloadError'), res.response.data.message, _this.$t('message.confirm'))
          }
        }
      })
    },
    /**
     * 获取文档类型
     * @param {*} name
     */
    fileClass (name) {
      if (this.temp.apply_type === 'flow') {
        name = name.substring(name.lastIndexOf('/') + 1)
      }
      return getFileTypeClass(name)
    },
    /**
     * @description 格式化字符串
     * @param path 文件地址
     * @author xiashneghui
     * @updateTime 2022/3/2
     * */
    formatName (path) {
      return path.substring(path.lastIndexOf('/') + 1)
    }
  }
}

</script>
