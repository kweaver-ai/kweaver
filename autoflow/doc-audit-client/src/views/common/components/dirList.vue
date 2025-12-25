<!-- 审核列表查看文件夹 -->
<template>
    <div class="el-main_cont">
        
        <div class="small-crumb">
            <el-link type="primary"  :underline="false">返回</el-link>
            <el-divider direction="vertical"></el-divider>
            <span class="list-item">
                <el-link :underline="false" type="primary">共享审核</el-link>
                <i class="el-breadcrumb__separator el-icon-arrow-right"></i>
            </span>
            <span>文件夹一</span>
        </div>
        <div class="task_relea_page rzsj_table_bar">
        <el-table :data="dataList" v-loading="loading" class="table-ellip">
          <el-table-column :label="$t('sync.docName')" min-width="200px">
            <template slot-scope="scope">
              <div :class="fileClass(scope.row)" class="paper-list hover-btn"><!---加上xls(文件后缀)，可以改变图标；加上hover-btn操作按钮变成鼠标滑过才出现--->
                <div class="file-ico">
                    <span class="ico"></span>
                </div>
                <div class="file-title">
                  <a class="link-2" @click="openDoc(scope.row)">{{scope.row.name}}</a>
                </div>
                <div class="file-btn">
                  <el-button icon="el-icon-download" @click="download(scope.row)"></el-button>
                </div>
              </div>
            </template>
          </el-table-column>
          <el-table-column min-width="40px" align="center">
          </el-table-column>
          <div slot="empty" class="rzsj_empty">
              <div class="error_img img_1"><div class="images-2"></div></div>
              <div class="error_text"><p class="text">空文件夹</p></div>            	
          </div><!--rzsj_error 空文件夹-->
        </el-table>
      </div>
  
    </div>
  </template>
<script>
export default {
  props: {
    // 文档ID
    docId: {
      type: String,
      required: true
    },
    // 任务ID
    taskId: {
      type: String,
      required: true
    }
  },
  data() {
    return {
      apiUrl: process.env.VUE_APP_ANYSHARE_URL + '/api/efast/v1/dir/list',
      loading: false,
      dataList: [],
      // 查询条件
      queryParams: {
        status: '',
        type: 'apply'
      }
    }
  },
  created() {
    this.handleSearch()
  },
  methods: {
    // 查询列表数据
    handleSearch() {
      let _this = this
      _this.loading = true
      let params = {
        'docid': this.docId,
        'attr': false,
        'by': 'name',
        'sort': 'asc'
      }
      this.$axios.post(this.apiUrl, params).then(res => {
        if (res.data !== null) {
          let dirs = res.data.dirs.map((item,key,arr) => {
            item.isDir = true
            return item
          })
          let files = res.data.files.map((item,key,arr) => {
            item.isDir = false
            return item
          })
          _this.dataList = [...dirs, ...files]
        } else {
          _this.$message.warning(res.data.message)
        }
        _this.loading = false
      }).catch(res => {
        if (res.response !== null) {
          _this.$message.warning(res.response.data.message)
        }
        console.error(res)
        _this.loading = false
      })
    }, 
    // 文件图标class
    fileClass(row) {
      if (row.isDir) {
        return { 'folder': true }// 文件夹
      }
      if (/\.(jpg|jpeg|gif|bmp|png|wmf|emf|svg|tga|tif)$/.test(row.name)) { // 图片
        return { 'img': true }
      } else if (/\.(xls|xlsx|ods|xlsb|xlsm|et)$/.test(row.name)) { // Excel文件
        return { 'xls': true }
      } else if (/\.(doc|docx|docm|odt|dotx|wps|dotm)$/.test(row.name)) { // word文件
        return { 'doc': true }
      } else if (/\.(ppt|pptx)$/.test(row.name)) { // ppt文件
        return { 'pptx': true }
      } else if (/\.(mp3|aac|wav|wma|flac|m4a|ape|ogg)$/.test(row.name)) { // 音频文件
        return { 'mp3': true }
      } else if (/\.(avi|rmvb|rm|mp4|3gp|mkv|mov|mpg|mpeg|wmv|flv|asf|h264|x264|mts|m2ts)$/.test(row.name)) { // 视频文件
        return { 'mp4': true }
      } else if (/\.zip$/.test(row.name)) { // zip压缩文件
        return { 'zip': true }
      } else if (/\.pdf$/.test(row.name)) { // pdf文件
        return { 'pdf': true }
      } else if (/\.txt$/.test(row.name)) { // txt文件
        return { 'txt': true }
      } else if (/\.exe$/.test(row.name)) { // exe文件
        return { 'exe': true }
      } else { // 其他
        return { 'file': true }
      } 
    },
    // 审核列表下载文件
    downloadForCheck(row) {
      let _this = this
      // 检查当前待办是否有效
      _this.checkFlow(row.taskId).then(function() {
        _this.download(row)
      }).catch(res => {})
    },
    // 申请列表下载文件
    download(row) {
      let items = [{
        docid: row.docId,
        name: row.docName.substring(row.docName.lastIndexOf('\\') + 1, row.docName.length)
      }]
      let parentItem = [{
        docid: row.docId.substring(0, row.docName.lastIndexOf('\\')),
        size: -1
      }]
      AnyShareSDKFactory.create({
        apiBase: this.anyshareUrl + '/anyshare',
        rootElement: document.getElementById('AnyShareDom'),
        token: this.$utils.cookie('client.oauth2_token'),
        locale: i18n.locale
      }).then(anyShareSDK => {
        anyShareSDK.download(items, parentItem)
      }).catch(e => {
        console.error('Failed to initialize AnyShareSDK', e)
      })
            
    },
    // 审核列表打开文档
    openDocForCheck(row)  {
      let _this = this
      // 检查当前待办是否有效
      _this.checkFlow(row.taskId).then(function() {
        _this.openDoc(row)
      }).catch(res => {})
    },
    // 申请列表打开文档
    openDoc(row) {
      // 文件夹做特殊处理,展示文件列表
      if (row.docType === 'folder') {
        let startIndex = row.docId.lastIndexOf('//')
        let url = this.anyshareUrl
                    + '/anyshare/dir'
                    + row.docId.substring(startIndex + 1, row.docId.length)
        window.open(url)
        return
      }

      // 在线打开文件
      let url = this.anyshareUrl + '/anyshare/'
      if (/\.(ods|xlsb|xlsm|xlsx|odp|ppsx|pptx|docx|docm|odt|dotx|dot|pot|doc|wps|dotm|xls|et|xla|xltm|xltx|xlt|ppt|pps|dps|potm|ppsm|potx|pptm|pdf|txt|csv|xml|ott)$/.test(row.docName)) {
        url += `foxitreader?gns=${row.docId.slice(6)}&name=${encodeURIComponent(row.docName)}&_tb=none`
      } else if (
        /\.(mp3|aac|wav|wma|flac|m4a|ape|ogg)$/.test(row.docName) ||
                /\.(avi|rmvb|rm|mp4|3gp|mkv|mov|mpg|mpeg|wmv|flv|asf|h264|x264|mts|m2ts)$/.test(row.docName)
      ) {
        url += `play?gns=${row.docId.slice(6)}&name=${encodeURIComponent(row.docName)}&_tb=none`
      } else if (/\.(jpg|jpeg|gif|bmp|png|wmf|emf|svg|tga|tif)$/.test(row.docName)) {
        url += `previewimgopt?gns=${row.docId.slice(6)}&name=${encodeURIComponent(row.docName)}${`&size=${row.size}`}&_tb=none`
      } else {
        this.$message.warning('文件格式不支持在线打开')
        return
      }
      window.open(url)
    }
  }
}
</script>
