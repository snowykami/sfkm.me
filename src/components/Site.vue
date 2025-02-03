<script setup lang="ts">
import { defineProps} from 'vue';

defineProps({
    name: String,
    description: String,
    url: String,
})
</script>

<template>
    <a target="_blank" class="site container ui react-ui size" :href="url">
        <div class="container" id="site">
        <div class="site-name">{{ name }}</div>
        <div class="site-url">{{ url }}</div>
    </div>
    </a>
</template>

<style lang="css" scoped>
.site{
    border-bottom: none;
    padding-bottom: 0;
}

.site-name{
    font-size: 1em;
    font-weight: bold;
    margin-bottom: 0.5em;
}

.site-url{
    font-size: 0.8em;
    color: #666;
}
</style>