<script setup lang="ts">
defineProps<{
    icon: string;
    link: string;
    scale: number;
}>();
</script>

<template>
    <a :href="link" target="_blank" rel="noopener noreferrer">
        <img class="contact-icon react-ui size" :src="icon" :height="30 * scale"  alt="icon" />
    </a>
</template>

<style lang="css" scoped>
.contact-icon{
    aspect-ratio: 1;
}

a {
    border-bottom: none;
}
</style>