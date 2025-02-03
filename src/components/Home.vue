<script setup lang="ts">
import Left from './Left.vue';
import Right from './Right.vue';
import LanguageSwitcher from './LanguageSwitcher.vue';
import macOSTab from './macOSTab.vue';
</script>

<template>
    <div id="home-window">
        <macOSTab />
        <div id="home" class="container ui">
            <Left />
            <Right />
        </div>
        <LanguageSwitcher />
        <footer>
            <p>© {{ new Date().getFullYear() }} Snowykami. All rights reserved.</p>
        </footer>
    </div>

</template>

<style lang="css">
#home {
    background-color: rgba(0, 0, 0, 0.3);
    display: flex;
    justify-content: center;
    align-items: flex-start;
    height: auto;
    border-top-left-radius: 0;
    border-top-right-radius: 0;
}

@media (min-width: 769px) {
    #left {
        width: 20vw;
        max-width: 200px;
    }

    #right {
        width: 60vw;
        max-width: 600px;
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

footer {
  color: white;
  text-align: center;
}
</style>