<template>
  <div>
    <a
      href="https://vitejs.dev"
      target="_blank"
    >
      <img
        src="/vite.svg"
        class="logo"
        alt="Vite logo"
      />
    </a>
    <h2>orientation demo</h2>
    <div class="orientation"></div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import registerOrientation from 'sensors-orientation'
import 'sensors-orientation/dist/index.css'


// 生命周期钩子
onMounted(() => {
  registerOrientation(document.querySelector('.orientation'))
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
