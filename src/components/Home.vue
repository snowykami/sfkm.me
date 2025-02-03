<script setup lang="ts">
import Left from './Left.vue';
import Right from './Right.vue';
</script>

<template>
    <div id="home">
        <Left />
        <Right />
    </div>
</template>

<style lang="css">
#home {
    display: flex;
    justify-content: center;
    align-items: center;
    height: 100vh;
}

@media (min-width: 769px) {
    #left {
        width: 30%;
        margin-right: 10px;
    }

    #right {
        width: 70%;
        margin-left: 10px;
    }
}


/* phone */
@media (max-width: 768px) {
    #home {
        flex-direction: column;
    }
b 
    #left, #right {
        width: 100%;
        margin: 0;
    }
}
</style>