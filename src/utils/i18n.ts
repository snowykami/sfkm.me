import { ref, computed, type ComputedRef } from "vue";

const langData: Record<string, Record<string, string>> = {
    "zh-CN": {
        "title": "Snowykami的索引站",
        "h1": "<h2>你好呀，这里是<span id='nickname'>Snowykami</span></h2>",
        "h2": "<h2>欢迎来到我的索引站</h2>",

        "p1": "后端开发者，也可能是全栈",
        "p2": "在轻雪工作室和红岩网校工作",
        "p3": "来自中国重庆",
        "p4": "Minecraft，原神及更多...",
        "p5": "使用Go，Python，TypeScript/JavaScript，C/C++等语言",

        "sites": "相关站点",
        "contacts": "联络方式",

        // site names
        "liteyukilab.name": "轻雪社区",
        "liteyukilab.description": "轻雪社区，去中心化社交网络",
        "blog.name": "我的博客",
        "blog.description": "Snowykami的个人博客",
        "cdn.name": "内容分发网络",
        "cdn.description": "网站内容分发网络",
        "thisrepo.name": "此网页源码",
        "thisrepo.description": "这个网页的源代码",
        "liteyuki-main.name": "轻雪主站",
        "liteyuki-main.description": "轻雪工作室主站",
        "netdisk.name": "轻雪网盘",
        "netdisk.description": "网盘",

        "tag.cloudnative": "云原生",
        "tag.devops": "DevOps",
        "tag.minecraft": "Minecraft",
        "tag.genshin": "原神",
        "tag.railway": "轨道交通",
        "tag.liteyuki": "轻雪",
        "tag.backend": "后端开发",
        "tag.frontend": "前端开发",
        "tag.homelab": "家里云",
    },
    "en": {
        "title": "Snowykami's Index Site",
        "h1": "<h2>Hi, I'm <span id='nickname'>Snowykami</span></h2>",
        "h2": "<h2>Welcome to my index site</h2>",

        "p1": "Backend Developer, maybe Full Stack",
        "p2": "Work at Liteyuki and Redrock",
        "p3": "From Chongqing, China",
        "p4": "Minecraft, Genshin Impact and more...",
        "p5": "Go, Python, TypeScript/JavaScript, C/C++ and more languages",

        "sites": "Sites",
        "contacts": "Contacts",

        // site names
        "liteyukilab.name": "Liteyuki Lab",
        "liteyukilab.description": "Liteyuki Lab, a decentralized social network",
        "blog.name": "My Blog",
        "blog.description": "Snowykami's blog",
        "cdn.name": "Content Delivery Network",
        "cdn.description": "Website content delivery network",
        "thisrepo.name": "This Repo",
        "thisrepo.description": "The source code of this page",
        "liteyuki-main.name": "Liteyuki Site",
        "liteyuki-main.description": "Liteyuki Main",
        "netdisk.name": "Netdisk",
        "netdisk.description": "Netdisk",

        "tag.cloudnative": "Cloud Native",
        "tag.devops": "DevOps",
        "tag.minecraft": "Minecraft",
        "tag.genshin": "Genshin Impact",
        "tag.railway": "Railway",
        "tag.liteyuki": "Liteyuki",
        "tag.backend": "Backend",
        "tag.frontend": "Frontend",
        "tag.homelab": "Homelab",

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