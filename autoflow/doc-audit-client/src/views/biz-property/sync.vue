<template>
    <div>
        <div class="text">
            <div class="clums">{{ $t('sync.targetPath') }}：</div>
            <div class="texts">
                  <span v-tooltip.bottom="{content: temp.apply_detail.target_path, container: '#element-ui-mount-content'}">{{ temp.apply_detail.target_path}}</span>
            </div>
        </div>
        <div class="text">
            <div class="clums">{{ $t('sync.mode') }}：</div>
            <div class="texts">{{ $t('sync.modes.' + temp.apply_detail.mode) }}</div>
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
  methods:{
  }
}
</script>
