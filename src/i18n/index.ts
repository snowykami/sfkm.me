import { profile } from "console"
import i18n from "i18next"
import { initReactI18next } from "react-i18next"

i18n.use(initReactI18next).init({
    resources: {
        zh: {
            translation: {
                contacts: {
                    title: "联系方式",
                    bilibili: "Bilibili",
                    email: "邮箱",
                    github: "GitHub",
                    liteyukilab: "轻雪社区",
                    ncm: "网易云音乐",
                    offline: "当前离线",
                    online: "当前在线",
                    onlinestatus: "在线状态",
                    onlinetime: "通常在UTC+8时间 {{duration}} 在线",
                    x: "X",
                },
                greeting: "你好，世界！",
                profile: {
                    title: "个人资料",
                    location: "中国 重庆",
                    subname: "远野千束",
                    tag: "标签",
                },
                projects: {
                    title: "项目展示",
                    exploer: "探索更多项目",
                },
                skills: {
                    title: "技能详情",
                    backend: "后端",
                    database: "数据库",
                    devops: "运维",
                    frontend: "前端",
                    learning: "学习中",
                }
                // ...其它中文翻译
            },
        },
        en: {
            translation: {
                contacts: {
                    title: "Contacts",
                    bilibili: "Bilibili",
                    email: "Email",
                    github: "GitHub",
                    liteyukilab: "Liteyuki Lab",
                    ncm: "NetEase Cloud Music",
                    offline: "Offline",
                    online: "Online",
                    onlinestatus: "Online Status",
                    onlinetime: "Usually online at UTC+8 {{duration}}",
                    x: "X",
                },
                greeting: "Hello, world!",
                profile: {
                    title: "Profile",
                    location: "Chongqing, China",
                    subname: "Toono Chisato",
                    tag: "Tags",
                },
                projects: {
                    title: "Projects",
                    exploer: "Explore more projects",
                },
                skills: {
                    title: "Skills",
                    backend: "Backend",
                    database: "Database",
                    devops: "DevOps",
                    frontend: "Frontend",
                    learning: "Learning",
                },
                // ...其它英文翻译
            },
        },
        ja: {
            translation: {
                contacts: {
                    title: "連絡先",
                    bilibili: "ビリビリ",
                    email: "メール",
                    github: "GitHub",
                    liteyukilab: "Liteyuki Lab",
                    ncm: "NetEase Cloud Music",
                    offline: "現在オフライン",
                    online: "現在オンライン",
                    onlinestatus: "オンラインステータス",
                    onlinetime: "通常はUTC+8時間帯の{{duration}}にオンライン",
                    x: "X",
                },
                greeting: "こんにちは、世界！",
                profile: {
                    title: "プロフィール",
                    location: "中国 重慶",
                    subname: "遠野千束",
                    tag: "タグ",
                },
                projects: {
                    title: "プロジェクト",
                    exploer: "もっとプロジェクトを探す",
                },
                skills: {
                    title: "スキル",
                    backend: "バックエンド",
                    database: "データベース",
                    devops: "DevOps",
                    frontend: "フロントエンド",
                    learning: "学習中",
                },
                // ...其它日文翻译
            },
        }
    },
    lng: typeof window !== "undefined"
        ? localStorage.getItem("language") || "zh"
        : "zh",
    // ...
    fallbackLng: "zh",
    interpolation: {
        escapeValue: false,
    },
})

export default i18n