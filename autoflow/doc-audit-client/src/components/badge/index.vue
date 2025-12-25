<template>
  <div
    :class="['badge', status , {en: $i18n.locale === 'en-us'}]"
    :style="{ fontSize: fontSize + 'px' }"
    :data-text="text"
  />
</template>
<script>
export default {
  name: 'Badge',
  props: {
    status: {
      type: String,
      default: 'transfer'
    },
    text: {
      type: String,
      default: ''
    },
    fontSize: {
      type: Number,
      default: 64
    }
  }
}
</script>
<style scoped>
.badge {
  width: 1em;
  height: 1em;
  border-radius: 0.5em;
  display: flex;
  justify-content: center;
  align-items: center;
  position: relative;
}
.badge::before {
  content: '';
  display: block;
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  border-radius: inherit;
  box-shadow: inherit;
  transform: scale(0.6);
}

.badge::after {
  display: flex;
  justify-content: center;
  align-items: center;
  position: absolute;
  font-size: 12px;
  top: 50%;
  left: 0;
  right: 0;
  transform: translateY(-50%);
  background: white;
  font-weight: bold;
  white-space: nowrap;
}
.badge.transfer {
  box-shadow: 0 0 0 0.0625em #daf0d5 inset;
  color: #4bbe47;
}
.badge.sendback {
  box-shadow: 0 0 0 0.0625em rgba(254, 102, 106, 0.2) inset;
  color: rgb(255, 100, 106);;
}
.badge::after {
  content: attr(data-text);
}
.badge.en::after {
  left: -24px;
}
</style>
