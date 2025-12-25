<template>
  <div class="no_qx_box">

    <div class="conts">
      <div class="cell_img"><img src="../../../public/images/cp_bg_7.png" /></div>
      <div class="cell_text">
        <p class="text_1">抱歉，您没有访问权限！</p>
        <p class="text_2">We are sorry,you have no access permissions!</p>
      </div>
    </div><!--conts-->

    <img class="bg_fixed_bottom" src="../../../public/images/cp_bg_4.png" />

  </div><!--no_qx_box-->
</template>
<script>
export default {
  name: '404',
  data () {
    return {

    }
  },
  created () {
    document.title = '没有访问权限'
  }
}
</script>
<style>
  /*no_qx_box无访问权限*/
  .no_qx_box{
    position:fixed;
    width:100%;
    height:100%;
    text-align:center;
    margin:0;
    background: url(../../../public/images/cp_bg_1.jpg) no-repeat #850e38 center;
    background-size: 90%;
  }
  .no_qx_box .conts{
    display:table;
    width:auto;
    position:fixed;
    top:calc(50% - 55px);
    left:calc(50% - 219.5px);
    z-index:2;
  }
  .no_qx_box .conts .cell_img{
    display:table-cell;
    vertical-align: middle;
    width:120px;
  }
  .no_qx_box .conts .cell_img>img{
    width:85px;
  }
  .no_qx_box .conts .cell_text{
    display:table-cell;
    vertical-align: middle;
  }
  .no_qx_box .conts .cell_text .text_1{
    text-align:left;
    font-size: 30px;
    color: #fff;
    line-height:  1;
  }
  .no_qx_box .conts .cell_text .text_2{
    text-align:left;
    font-size: 14px;
    color: rgba(252, 242, 34, 0.6);
    margin: 13px 0 0 0;
    line-height:  1;
  }
  .no_qx_box .bg_fixed_bottom{
    position:fixed;
    bottom:0;
    left:0;
    width:100%;
  }
</style>
