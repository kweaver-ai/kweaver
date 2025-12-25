<!-- 文件预览 -->
<template>
    <div></div>
</template>
<script>
import i18n from '@/assets/lang'
export default {
  data() {
    return {
      // 文档ID
      docid: '',
      // 文档名称
      name: '',
      // 文档大小
      size: '',
      // 文档版本
      rev: ''
    }
  },
  created() {
    this.docid = this.$route.query.docid
    this.name = this.$route.query.name
    this.size = this.$route.query.size
    this.rev = this.$route.query.rev
    this.openDoc()
  },
  methods: {
    openDoc() {
      let self = this
      AnyShareSDKFactory.create({
        apiBase: self.anyshareUrl,
        rootElement: document.getElementById('AnyShareDom'),
        token: self.$utils.cookie('client.oauth2_token'),
        locale: i18n.locale
      }).then(function resolve(sdk) {
        sdk.preview(
          {
            docid: self.docid,
            name: self.name,
            size: self.size,
            rev: self.rev
          },
          false
        )
      })
        .catch(function reject(err) {
          console.error(err)
        })
    }
  }
}
</script>
