<script setup lang="ts">
import githubIcon from '../assets/contacts/github.svg';
import liteyukiLabIcon from '../assets/contacts/liteyuki-lab.svg';
import liteyukiGiteaIcon from '../assets/contacts/liteyuki-gitea.svg';
import bilibiliIcon from '../assets/contacts/bilibili.svg'
import ncmIcon from '../assets/contacts/ncm.svg'

import Contact from './Contact.vue';
import Readme from './Readme.vue';
import { getText } from '../utils/i18n';
const contacts = [
    {
        icon: githubIcon,
        link: 'https://github.com/snowykami'
    },
    {
        icon: liteyukiLabIcon,
        scale: 1.15,
        link: 'https://lab.liteyuki.icu/@snowykami'
    },
    {
        icon: liteyukiGiteaIcon,
        link: 'https://git.liteyuki.icu/snowykami'
    },
    {
        icon: bilibiliIcon,
        link: 'https://space.bilibili.com/233938750'
    },
    {
        icon: ncmIcon,
        link: "https://music.163.com/#/artist?id=46413018"
    }
]
</script>

<template>
    <div class="container" id="right">
        <Readme />
        <h2>{{ getText('contact') }}</h2>
        <div class="container" id="contacts">
            <Contact v-for="contact in contacts" :key="contact.link" :icon="contact.icon" :link="contact.link" :scale="contact.scale||1.0" />
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
    align-items: center;
    gap: 1.5rem;
}


</style>