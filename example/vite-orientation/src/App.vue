<template>
  <div>
    <h2>orientation demo</h2>
    <div class="opt">
      <button
        class="reset"
        @click="reset"
      >reset</button>
    </div>
    <div class="orientation"></div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import registerOrientation from 'sensors-orientation'
import 'sensors-orientation/dist/index.css'


const manager = ref(null)

function reset() {
    manager.value.resetDeviceOrientation();
}

// 生命周期钩子
onMounted(() => {
  manager.value = registerOrientation(document.querySelector('.orientation'));
  manager.value.onChangeDeviceOrientation(args=>{
    console.error('onChangeDeviceOrientation', args);
  })
})


</script>
<style scoped>
.logo {
  height: 6em;
  padding: 1.5em;
  will-change: filter;
  transition: filter 300ms;
}
.logo:hover {
  filter: drop-shadow(0 0 2em #646cffaa);
}
.logo.vue:hover {
  filter: drop-shadow(0 0 2em #42b883aa);
}
</style>
