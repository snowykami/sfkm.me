<script setup lang="ts">
import githubIcon from '../assets/contacts/github.svg';
import Readme from './Readme.vue';
const contacts = [
    {
        icon: githubIcon,
        link: ''
    },
    {
        icon: githubIcon,
        link: ''
    },
    {
        icon: githubIcon,
        link: ''
    }
]
</script>

<template>
    <div class="container" id="right">
        <Readme />
        <div class="container" id="contacts">
            <div class="contact react-ui size" v-for="contact in contacts" :key="contact.link">
                <img class="contact-icon" :src="contact.icon" alt="contact" />
            </div>
        </div>
    </div>
</template>

<style lang="css">
#right {
    width: 100%;
}

#readme {
    color: white;
}

#contacts {
    display: flex;
    justify-content: center;
    gap: 1rem;
}

.contact {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 3rem;
    height: 3rem;
    border-radius: 50%;
    background-color: var(--container-background-color);
    box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
}

.contact-icon {
    width: 2rem;
}
</style>