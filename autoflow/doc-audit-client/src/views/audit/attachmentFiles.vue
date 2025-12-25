<template>
  <div class="attachment">
    <div class="header-bar">
      <el-button
        size="mini"
        type="text"
        class="link-btn"
        style="margin: 0"
        @click="handleSelect">
        <svg-icon icon-class="attachment" class="ops-icon"> </svg-icon>
        {{ $t('attachment.add') }}
      </el-button>
    </div>
    <div class="container" v-if="selectFileList.length > 0" ref="fileList">
      <div v-for="item in selectFileList" :key="item.docid" class="list">
        <FileIcon
          :doc="item"
          :customStyle="'font-size: 24px;margin-right:8px;'" />
        <div class="list-content">
          <span class="file-name">{{ item.name }}</span>
          <svg-icon
            icon-class="delete"
            class="ops-icon"
            @click="handleDelete(item.docid)">
          </svg-icon>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { docPermCheck } from '../../api/anyshareOpenApi'
import FileIcon from '@/components/FileIcon'
export default {
  name: 'AttachmentFiles',
  components: { FileIcon },
  props: {
    selectFileList: {
      type: Array,
      required: true
    }
  },
  computed: {
    microWidgetPropsVal() {
      return this.$store.state.app.microWidgetProps
    }
  },
  mounted() {
    // 获取配置
  },
  methods: {
    async handleSelect() {
      const _this = this
      const params = {
        functionid: this.microWidgetPropsVal.config.systemInfo.functionid,
        multiple: true,
        selectType: 1,
        title: this.$t('selectFile'),
        path: 'user'
      }
      try {
        const data = await this.microWidgetPropsVal.contextMenu.selectFn(params)
        // 过滤
        const filterFile = data.filter(
          (file) =>
            _this.selectFileList.filter((i) => i.docid === file.docid)
              .length === 0
        )
        if (!filterFile.length) {
          return
        }
        if (filterFile.length + _this.selectFileList.length > 10) {
          _this.$toast('info', _this.$t('message.attachmentOverLimit'))
          return
        }
        hasPermList = []
        const noPermList = []
        // 检查下载权限
        for (let i = 0; i < filterFile.length; i += 1) {
          try {
            const {
              data: { result }
            } = await docPermCheck(filterFile[i].docid, 'download')
            if (result !== 0) {
              noPermList.push(filterFile[i].name)
            } else {
              hasPermList.push(filterFile[i])
            }
          } catch (error) {
            console.error(error)
          }
        }
        if (noPermList.length) {
          this.$dialog_alert(
            _this.$t('message.errTitle'),
            _this.$t('message.fileNoDownloadPrem', {
              name: noPermList.join('、')
            }),
            _this.$t('message.confirm')
          )
        }
        const newList = this.selectFileList.concat(hasPermList)
        this.$emit('update:selectFileList', newList)
        if (newList.length > 2) {
          setTimeout(() => {
            this.$refs.fileList.scrollTop = this.$refs.fileList.scrollHeight
          }, 50)
        }
      } catch (error) {
        console.error(error)
      }
    },
    handleDelete(id) {
      const newList = this.selectFileList.filter((item) => item.docid !== id)
      this.$emit('update:selectFileList', newList)
    }
  }
}
</script>

<style scoped>
.attachment {
  position: relative;
  margin: 8px 32px 0px 32px;
}
.ops-icon {
  font-size: 16px;
  cursor: pointer;
}

.container {
  margin: 8px 0 12px 0;
  max-height: 110px;
  overflow: auto;
}
.link-btn {
  color: #000;
}
.link-btn:hover {
  color: #3461ec;
}
.list {
  position: relative;
  display: flex;
  align-items: center;
  margin: 8px 0;
  padding: 0 12px;
  border-radius: 4px;
  background-color: rgb(250, 250, 250);
  height: 48px;
}

.list:first-child {
  margin-top: 0;
}

.list:last-child {
  margin-bottom: 0;
}

.list-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-grow: 1;
}

.file-name {
  display: inline-block;
  max-width: 420px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
