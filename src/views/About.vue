<template>
  <div class="about">
    <h1>This is an about page</h1>
    <iframe
      :key="item.tag"
      v-once
      :src="www.baidu.com"
      frameborder="0"
    ></iframe>
  </div>
</template> 
<script lang="ts">
import { Component, Vue } from 'vue-property-decorator';
@Component({
  components: {
    About,
  },
})
export default class About extends Vue {
  public message: string = '消息';
  public queryInfo: any = {};
  private created() {
    console.log(this.message);
  }
}
</script>
