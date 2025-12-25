<!-- 移动端登录拦截页面 -->
<template>
  <div>
    <div
         class="user-group-empty-box"
         :style="'height: ' +150 + 'px;padding-top: ' + 150 + 'px;'">
      <div class="icon" style="width: 288px;height: 288px"></div>

      <p style="text-align: center;margin-top:8px;font-size: 16px">{{ $t('move.errorMsg') }}</p>
    </div>
  </div>
</template>
