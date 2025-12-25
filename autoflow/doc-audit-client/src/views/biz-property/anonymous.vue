<template>
  <div>
    <div class="text" v-if="temp.audit_status === 'avoid' || temp.audit_status === 'pass'">
      <div class="clums">{{ $t('share.shareLink') }}：</div>
      <div class="link-clums">
        <div class="link-wrapper">
          <div v-title :title="shareLinkUrl" class="link">
            {{ shareLinkUrl }}
          </div>
          <el-tooltip
            effect="dark"
            :content="$t('share.copy')"
            placement="bottom"
            :append-to-body="false"
            ref="shareLinkPop"
            popper-class="shareLink-pop"
          >
            <div
              class="copy-link-btn copyLink"
              @click="
                handleCopy(
                  shareLinkUrl,
                  temp.apply_detail.title,
                  temp.apply_detail.expires_at,
                  temp.apply_detail.password
                )
              "
              ref="copyLink"
            ></div>
          </el-tooltip>
        </div>
      </div>
    </div>
    <div class="text">
      <div class="clums">{{ $t('common.detail.urlTitle') }}：</div>
      <div class="texts">
        <span v-title :title="temp.apply_detail.title" >{{ temp.apply_detail.title}}</span>
      </div>
    </div>
    <div class="text">
      <div class="clums">{{ $t('common.detail.role') }}：</div>
      <div class="texts">
        <span v-title :title="roleStr" >{{ roleStr}}</span>
      </div>
    </div>
    <div class="text">
      <div class="clums">{{ $t('common.detail.expiresAt') }}：</div>
      <div class="texts">{{ expiresAt }}</div>
    </div>
    <div class="text">
      <div class="clums">{{ $t('common.detail.password') }}：</div>
      <div class="texts">
        <span v-title :title=" temp.apply_detail.password === '' ? '--' : temp.apply_detail.password" >{{ temp.apply_detail.password === '' ? '--' : temp.apply_detail.password }}</span>
      </div>
    </div>
    <div class="text">
      <div class="clums">{{ $t('common.detail.accessLimit') }}：</div>
      <div class="texts">{{ temp.apply_detail.access_limit < 0 ? '--' : temp.apply_detail.access_limit}}</div>
    </div>
  </div>
</template>

<script>
import copy from 'copy-to-clipboard' 

export default {
  props: {
    temp: {
      type: Object,
      required: true
    }
  },
  mounted() {
    if(this.temp.audit_status === 'avoid' || this.temp.audit_status === 'pass'){
      document.getElementById("element-ui-mount-content").appendChild(
        this.$refs.shareLinkPop.popperVM.$el
      )
    }
  },
  beforeDestroy(){
    if(this.temp.audit_status === 'avoid' || this.temp.audit_status === 'pass'){
      const uiDom  = document.getElementById("element-ui-mount-content")
      uiDom.removeChild(
        uiDom.getElementsByClassName("shareLink-pop")[0]
      )
    }
  },
  computed: {
    roleStr: function () {
      if (typeof this.temp.apply_type === 'undefined') {
        return
      }
      let detail = this.temp.apply_detail
      if (this.temp.apply_type === 'inherit') {
        return detail.inherit ? this.$t('share.roleDetail.inherit') : this.$t('share.roleDetail.noInherit')
      } else if (this.temp.apply_type === 'owner' && detail.op_type === 'create') {
        return this.$t('share.roleDetail.owner')
      } else if (this.temp.apply_type === 'owner' && detail.op_type === 'delete') {
        return this.$t('share.roleDetail.cancel') + '：' + this.$t('share.roleDetail.owner')
      }
      let allow = detail.allow_value !== '' ? detail.allow_value.split(',') : []
      if (this.temp.apply_type === 'anonymous') {
        allow = allow.filter(item => item !== 'display')
      }
      let allowResult = []
      this.$store.getters.dictList.docSharePermEnum.forEach(pe => {
        if(allow.indexOf(pe.value) !== -1){
          allowResult.push(pe.value)
        }
      })
      let _allowValue = allowResult.map((item, key, arr) => {
        return this.$t('share.roleDetail.' + item)
      })
      let _denyValue = []
      if (detail.deny_value !== null && detail.deny_value !== '' && typeof detail.deny_value !== 'undefined') {
        let denyResult = []
        let deny = detail.deny_value !== '' ? detail.deny_value.split(',') : []
        this.$store.getters.dictList.docSharePermEnum.forEach(pe => {
          if(deny.indexOf(pe.value) !== -1){
            denyResult.push(pe.value)
          }
        })
        _denyValue = denyResult.map((item, key, arr) => {
          return this.$t('share.roleDetail.' + item)
        })
      }

      let roles = ''
      if (detail.op_type === 'delete') {
        roles += this.$t('share.roleDetail.cancel') + '：'
      }

      roles += _allowValue.join('/')
      if (_denyValue.length > 0) {
        if(_allowValue.length > 0){
          roles += '(' + this.$t('share.roleDetail.deny') + ' ' + _denyValue.join('/') + ')'
        } else {
          roles += this.$t('share.roleDetail.deny') + ' ' + _denyValue.join('/')
        }
      }
      return roles
    },
    expiresAt: function () {
      if (this.temp.apply_type === 'inherit') {
        return '--'
      } else if (this.temp.apply_detail.expires_at === '-1') {
        return this.$t('share.permanent')
      } else {
        return this.$utils.toDateString(this.temp.apply_detail.expires_at, 'yyyy-MM-dd HH:mm')
      }
    },
    shareLinkUrl: function () {
      const parseUrl = this.$utils.parseUrl(window.location.href)
      return parseUrl.protocol + '//' + parseUrl.host + '/link/' + this.temp.apply_detail.link_id
    }
  },
  methods: {
    handleCopy(shareLinkUrl, title, expires, password) {
      const docName =
        this.temp.doc_type === 'file'
          ? this.$t('share.fileName')
          : this.$t('share.folderName')
      // 若不包含提取码，则复制的链接不显示提取码
      const copyText = `${shareLinkUrl} \n${docName + title} \n${this.$t(
        'share.deadline'
      ) + expires}${password &&
        ' \n' + this.$t('share.accessPassword') + password}`
      const result = copy(copyText)
      if (result) {
        this.$toast('success', this.$t('share.linkCopied'))
        // 移除焦点
        this.$refs.copyLink.blur()
      }
    }
  }
}
</script>

<style scoped>
.link-clums {
  display:table-cell;
  vertical-align:middle;
  font-size: 15px;
  color: #000000;
}
.link-wrapper{
  display: flex;
  align-items: center;
}
.link {
  vertical-align: middle;
  display: inline-block;
  max-width: calc(100% - 38px);
  overflow: hidden;
  text-overflow: ellipsis;
}
.copyLink {
  margin-left: 8px;
  border-radius: 4px;
  width: 30px;
  height: 28px;
  cursor: pointer;
  opacity: .75;
}
.copyLink:hover {
  background-color: rgba(229,228,233,.8);
  opacity: 1;
}
.copyLink:active {
  background-color: rgba(211,212,219,.7);
}
</style>
