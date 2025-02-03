import { ref, computed, type ComputedRef } from "vue";

const langData: Record<string, Record<string, string>> = {
    "zh-CN": {
        "title": "Snowykami的索引站",
        "h1": "<h2>你好呀，这里是<span id='nickname'>Snowykami</span></h2>",
        "h2": "<h2>欢迎来到我的索引站</h2>",

        "p1": "后端开发者",
        "p2": "在轻雪工作室和红岩网校工作",
        "p3": "来自中国重庆",
        "p4": "Minecraft，原神及更多...",

        "sites": "个人站点",
        "contacts": "联络方式",

        "liteyukilab.name": "轻雪社区",
        "liteyukilab.description": "轻雪社区，去中心化社交网络"
    },
    "en": {
        "title": "Snowykami's Index Site",
        "h1": "<h2>Hi, I'm <span id='nickname'>Snowykami</span></h2>",
        "h2": "<h2>Welcome to my index site</h2>",

        "p1": "Backend Developer",
        "p2": "Work at Liteyuki and Redrock",
        "p3": "From Chongqing, China",
        "p4": "Minecraft, Genshin Impact and more...",

        "sites": "Sites",
        "contacts": "Contacts",

        "liteyukilab.name": "Liteyuki Lab",
        "liteyukilab.description": "Liteyuki Lab, a decentralized social network"

    }
}

const languages: Record<string, string> = {
    "zh-CN": "简体中文",
    "en": "English"
}

const lang = ref(localStorage.getItem('lang')||'zh-CN');

export function getText(key: string): ComputedRef<string> {
    return computed(() => langData[lang.value][key] || key);
}

export function getLangs(): Record<string, string> {
    return languages;
}

export function setLang(l: string) {
    lang.value = l;
}