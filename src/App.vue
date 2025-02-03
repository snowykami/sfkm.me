<script setup lang="ts">
import Home from './components/Home.vue'
</script>

<template>
<Home/>
<footer>
  <p>© {{ new Date().getFullYear() }} Snowykami. All rights reserved.</p>
</footer>
</template>

<style scoped>
footer {
  color: white;
  text-align: center;
}


</style>
