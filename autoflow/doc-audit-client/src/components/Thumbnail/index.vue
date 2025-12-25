<template>
  <div v-if="url.length > 0">
    <img :src="url" alt="" class="thumbnail-img" />
  </div>

  <span v-else class="ico"></span>
</template>

<script>
import { getOauth2Token } from '@/utils/request'
import { getFileTypeClass } from '@/utils/common'
import { getFileThumbnail } from '@/api/anyshareOpenApi'
export default {
  name: 'Thumbnail',
  props: {
    rowData: {
      required: true
    }
  },
  data() {
    return {
      url: '',
      maxRequestTimes: 30,
      requestTimes: 0
    }
  },
  mounted() {
    try {
      if (
        typeof this.rowData.doc_type === 'string' &&
        this.rowData.doc_type !== 'file'
      ) {
        return
      }
      const type = getFileTypeClass(this.rowData.doc_path || this.rowData.path)
      if (type['img'] === true || type['ps'] === true || type['ai'] === true) {
        const token = getOauth2Token()
        this.getThumbnailUrl(token)
      }
    } catch (e) {
      console.warn(e)
    }
  },
  methods: {
    async getThumbnailUrl(token) {
      try {
        const docid =
          this.rowData.doc_id || this.rowData.id || this.rowData.docid
        if (!docid) {
          return
        }
        const { data } = await getFileThumbnail(
          docid.slice(-32),
          '24*24',
          token,
          false
        )
        if (data.url) {
          this.url = data.url
        }
      } catch (e) {
        // 转码中
        if (
          e.response.data.code === 503008001 &&
          this.requestTimes < this.maxRequestTimes
        ) {
          setTimeout(() => {
            this.requestTimes = this.requestTimes + 1
            this.getThumbnailUrl(token)
          }, 1000)
          return
        }
        console.warn(e)
      }
    }
  }
}
</script>

<style scoped>
.paper-list .file-ico .thumbnail-img {
  width: 24px;
  height: 24px;
}
</style>
