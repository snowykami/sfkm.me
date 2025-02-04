<script setup lang="ts">
import { defineProps } from 'vue';

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
            <div class="site-url">{{ url?.replace("https://", "") }}</div>
        </div>
    </a>
</template>

<style lang="css" scoped>
a {
    border-bottom: none !important;
    text-decoration: none;
}

.site {
    padding-bottom: 0;
}

.site-name {
    font-size: 1em;
    font-weight: bold;
    margin-bottom: 0.5em;
}

.site-url {
    font-size: 0.8em;
    color: #b0b0b0;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    display: block;
}

.site:hover {
    background-color: var(--theme-color);
}
</style>