import i18n from "i18next"
import { initReactI18next } from "react-i18next"

const getDefaultLang = () => {
    if (typeof window !== "undefined") {
        // 优先 localStorage，其次浏览器语言
        return (
            localStorage.getItem("language") ||
            navigator.language.split("-")[0] ||
            "zh"
        )
    }
    return "zh"
}

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
                marquee: {
                    sentence1: "试试拖拽和缩放窗口吧！",
                    sentence2: "听听歌如何呢？只需点击播放按钮，还有歌词哦！",
                    sentence3: "点击左上角的头像有更多好玩的哦",
                    sentence4: "网站源代码已经开源在GitHub上了",
                },
                menu: {
                    about: "关于",
                    language: "语言切换",
                    exit: "退出(或请手动关闭)"
                },
                profile: {
                    title: "个人资料",
                    description1: "你好呀！",
                    description2: "欢迎来到我的主页",
                    description3: "山高月小，水落石出。",
                    description4: "浮生若梦，为欢几何？",
                    description5: "轻思若水，雪化生香。",
                    description6: "用桌面端打开有更奇妙的体验哦",
                    location: "中国 重庆",
                    sites: "网站索引",
                    subname: "远野千束",
                    tag: "标签",
                },
                projects: {
                    title: "项目展示",
                    explore: "探索更多项目",
                    litedoc: {
                        name: "Litedoc",
                        description: "便捷的Python模块markdown文档生成工具",
                    },
                    liteyukibot: {
                        name: "轻雪机器人",
                        description: "一个轻量级跨平台的Python聊天机器人框架",
                        link: "https://bot.liteyuki.org",
                    },
                    magipoke: {
                        name: "Magipoke APP",
                        description: "一个涵盖学校生活的多功能应用",
                        link: "https://app.redrock.team/#/",
                    },
                    serverstatus: {
                        name: "服务器状态",
                        description: "现代化的服务器状态监控面板",
                    },
                    status: {
                        active: "活跃开发",
                        completed: "已完成",
                        archived: "已归档",
                        discontinued: "已停止",
                        beta: "测试中",
                    }
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
                marquee: {
                    sentence1: "Try dragging and resizing the windows!",
                    sentence2: "How about listening to some music? Just click the play button, lyrics included!",
                    sentence3: "Click the avatar in the top left for more fun!",
                    sentence4: "The source code of this site is open on GitHub",
                },
                menu: {
                    about: "About",
                    language: "Language Switch",
                    exit: "Exit (or please close manually)"
                },
                profile: {
                    title: "Profile",
                    description1: "Hi there!",
                    description2: "Welcome to my homepage",
                    description3: "Mountains high, moon small, water falls, stones emerge.",
                    description4: "Life is but a dream, how much joy can we have?",
                    description5: "Light thoughts like water, snow melts and fragrance arises.",
                    description6: "Open on desktop for a more wonderful experience",
                    location: "Chongqing, China",
                    sites: "Site Index",
                    subname: "Toono Chisato",
                    tag: "Tags",
                },
                projects: {
                    title: "Projects",
                    explore: "Explore more projects",
                    litedoc: {
                        name: "Litedoc",
                        description: "A convenient markdown documentation generator for Python modules",
                    },
                    liteyukibot: {
                        name: "Liteyuki Bot",
                        description: "A lightweight cross-platform Python chat bot framework",
                        link: "https://bot.liteyuki.org/en",
                    },
                    magipoke: {
                        name: "Magipoke APP",
                        description: "A multifunctional app covering school life",
                        link: "https://app.redrock.team/#",
                    },
                    serverstatus: {
                        name: "Server Status",
                        description: "A modern server status monitoring panel",
                        link: "https://status.liteyuki.org",
                    },
                    status: {
                        active: "Active Development",
                        completed: "Completed",
                        archived: "Archived",
                        discontinued: "Discontinued",
                        beta: "Beta Testing",
                    }
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
                marquee: {
                    sentence1: "ウィンドウをドラッグ＆リサイズしてみてください！",
                    sentence2: "音楽を聴いてみませんか？ただ再生ボタンをクリックするだけで、歌詞も表示されます！",
                    sentence3: "左上のアバターをクリックすると、もっと楽しいことがありますよ！",
                    sentence4: "このサイトのソースコードはGitHubで公開されています",
                },
                menu: {
                    about: "概要",
                    language: "言語切り替え",
                    exit: "終了（または手動で閉じてください）"
                },
                profile: {
                    title: "プロフィール",
                    description1: "こんにちは！",
                    description2: "私のホームページへようこそ",
                    description3: "山は高く、月は小さく、水は落ち、石は出る。",
                    description4: "人生は夢のようなもの、どれだけの喜びがあるのか？",
                    description5: "軽い思いは水のように、雪は溶けて香りを生む。",
                    description6: "デスクトップ版で開くと、もっと素晴らしい体験ができますよ",
                    location: "中国 重慶",
                    sites: "サイトインデックス",
                    subname: "遠野千束",
                    tag: "タグ",
                },
                projects: {
                    title: "プロジェクト",
                    explore: "もっとプロジェクトを探す",
                    litedoc: {
                        name: "Litedoc",
                        description: "便利なPythonモジュールのMarkdownドキュメント生成ツール",
                    },
                    liteyukibot: {
                        name: "Liteユキ　ボット",
                        description: "軽量なクロスプラットフォームのPythonチャットボットフレームワーク",
                        link: "https://bot.liteyuki.org/ja",
                    },
                    magipoke: {
                        name: "マギぽけ APP",
                        description: "学校生活をカバーする多機能アプリ",
                        link: "https://app.redrock.team/#/ja",
                    },
                    serverstatus: {
                        name: "サーバーステータス",
                        description: "モダンなサーバーステータス監視パネル",
                    },
                    status: {
                        active: "アクティブ開発中",
                        completed: "完了",
                        archived: "アーカイブ済み",
                        discontinued: "開発終了",
                        beta: "ベータテスト中",
                    }
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
    lng: getDefaultLang(),
    fallbackLng: "zh",
    interpolation: {
        escapeValue: false,
    },
})

export default i18n