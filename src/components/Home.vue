<script setup lang="ts">
import Left from './Left.vue';
import Right from './Right.vue';
import LanguageSwitcher from './LanguageSwitcher.vue';
</script>

<template>
    <div id="home" class="container ui">
        <Left />
        <Right />
    </div>
    <LanguageSwitcher />
</template>

<style lang="css">
#home {
    display: flex;
    justify-content: center;
    align-items: center;
    height: auto;
}

@media (min-width: 769px) {
    #left {
        width: 20vw;
    }

    #right {
        width: 60vw;
    }
}


/* phone */
@media (max-width: 768px) {
    #home {
        flex-direction: column;
    }

    #left,
    #right {
        width: 75vw;
        margin: 0;
    }
}
</style>