<template>
  <div>
    <iframe width="100%" :height="height" frameborder="no" border="no" src="redoc.html"></iframe>
  </div>
</template>

<script>
export default {
  name: 'Redoc',
  data() {
    return {
      height: window.innerHeight * 0.99
    }
  }
}
</script>

<style scoped>

</style>
