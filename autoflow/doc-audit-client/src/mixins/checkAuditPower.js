
import { fecthAuthority as fecthTask} from '@/api/audit'
export default {
  data () {
    return {
    }
  },
  mounted () {
  },
  methods: {
    // 检查当前待办是否有效
    checkFlow (params) {
      let self = this
      self.loading = true
      return new Promise(function (resolve, reject) {
        fecthTask(params).then(res => {
          self.loading = false
          if (!res.data.result) {
            reject(res)
          } else {
            resolve(true)
          }
        }).catch(res => {
          reject(res)
          self.loading = false
        })
      })
    }
  }
}
