<script setup lang="ts">
import githubIcon from '../assets/contacts/github.svg';
import liteyukiLabIcon from '../assets/contacts/liteyuki-lab.svg';
import liteyukiGiteaIcon from '../assets/contacts/liteyuki-gitea.svg';
import bilibiliIcon from '../assets/contacts/bilibili.svg'
import ncmIcon from '../assets/contacts/ncm.svg'
import xIcon from '../assets/contacts/x.svg';

import Contact from './Contact.vue';
import Readme from './Readme.vue';
import Site from './Site.vue';
import { getText } from '../utils/i18n';

const sites = [
    {
        name: getText('liteyukilab.name'),
        description: getText('liteyukilab.description'),
        url: 'https://lab.liteyuki.icu'
    },
    {
        name: getText('blog.name'),
        description: getText('blog.description'),
        url: 'https://blog.sfkm.me'
    },
    {
        name: getText('cdn.name'),
        description: getText('cdn.description'),
        url: 'https://cdn.liteyuki.icu'
    },
    {
        name: getText('thisrepo.name'),
        description: getText('thisrepo.description'),
        url: 'https://github.com/snowykami/sfkm.me'
    },
    {
        name: getText('liteyuki-main.name'),
        description: getText('liteyuki-main.description'),
        url: 'https://liteyuki.icu'
    },
    {
        name: getText('netdisk.name'),
        description: getText('netdisk.description'),
        url: 'https://als.liteyuki.icu'
    },
]

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
    },
    {
        icon: xIcon,
        link: "https://x.com/snowykami1145"
    }
]
</script>

<template>
    <div class="container" id="right">
        <Readme />
        <h2>{{ getText('contacts') }}</h2>
        <div class="container" id="contacts">
            <Contact v-for="contact in contacts" :key="contact.link" :icon="contact.icon" :link="contact.link"
                :scale="contact.scale || 1.0" />
        </div>
        <h2>{{ getText('sites') }}</h2>
        <div class="container" id="sites">
            <Site v-for="site in sites" :key="site.url" :name="site.name.value" :description="site.description.value"
                :url="site.url" />
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

#sites {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(30%, 1fr));
    gap: 1rem;
    margin-top: 2rem;
}

#contacts {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 1.5rem;
}
</style>