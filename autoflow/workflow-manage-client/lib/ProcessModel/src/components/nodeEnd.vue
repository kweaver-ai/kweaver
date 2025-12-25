<template>
  <div class="end-node">
    <div class="end-node-circle"/>
    <div class="node-wrap-box" :style="{width: viewProcess ? '300px' : '230px',cursor: viewProcess ? 'grab' : 'pointer' }">
      <div class="content">
        <div class="text">{{ $t('sync.endProcess') }}</div>
      </div>
    </div>
  </div>
</template>
<script>
export default {
  name: 'nodeEnd',
  props: {
    viewProcess: {
      required: false,
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
    }
  }
}
</script>
