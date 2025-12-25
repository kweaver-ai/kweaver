<template>
    <div>
        <div class="text">
            <div class="clums">{{ $t('common.detail.accessorName') }}：</div>
            <template v-if="temp.apply_type === 'inherit'">
                <div class="texts">{{ $t('share.accessor.all') }}</div>
            </template>
            <template v-else>
                <div class="texts">
                      <span v-tooltip.bottom="{content: temp.apply_detail.accessor_name, container: '#element-ui-mount-content'}">{{ temp.apply_detail.accessor_name}}</span>
                </div>
            </template>
        </div>
        <div class="text">
            <div class="clums">{{ $t('common.detail.role') }}：</div>
            <div class="texts">
                  <span v-tooltip.bottom="{content: roleStr, container: '#element-ui-mount-content'}">{{ roleStr}}</span>
            </div>
        </div>
        <div class="text">
            <div class="clums">{{ $t('common.detail.expiresAt') }}：</div>
            <div class="texts">{{ expiresAt }}</div>
        </div>
    </div>
</template>
<script>
export default {
  props: {
    temp: {
      type: Object,
      required: true
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
    }
  },
  methods:{
  }
}

</script>
