import { Contact, Friend, Project, Site, Skill, SkillBadge } from '@/types'

// data
import data from "@/data/i18n.json"
import musicData from "@/data/musics.json"
import contactsJson from '@/data/contacts.json'
import friendsJson from '@/data/friends.json'
import projectsJson from '@/data/projects.json'
import skillsJson from '@/data/skills.json'
import { Song, SongOrPromise } from '@/types/music'
import { BackgroundContext } from '@/types/background'
import { ExternalLink, Github, Mail, Tv, Twitter } from 'lucide-react'
import { fetchSongSrcFromNCM, fetchSongSrcFromQQ } from './utils/music'
import { SiNpm, SiPypi, SiDocker } from "react-icons/si";
import { TbBrandNeteaseMusic } from "react-icons/tb";
import { BiPlanet } from "react-icons/bi";
import { RiQqLine } from "react-icons/ri";

interface Config {
    // 网站元数据，此处大部分数据都支持填写常量或者i18n化函数
    meta: {
        name: string
        title: string
        authors: string[]
        description: string
        keywords: string[]
        favicon?: string // 网站图标链接
    }
    profile: {
        descriptions: string[] // 个人简介描述数组
        sites: Site[]
        skillBadges: SkillBadge[] // 技能徽章数组
    }
    contacts: Contact[]
    friends: Friend[]
    friendsApplyLink?: string // 好友申请链接
    projects: Project[]
    skills: Skill[]
    musics: SongOrPromise[] // 音乐列表
    background?: (ctx: BackgroundContext) => string | Promise<string>;
    languageResources: Record<string, Record<string, Record<string, string | Record<string, unknown>>>>
}

const config: Config = {
    meta: {
        name: "Snowykami OS",
        title: "Snowykami OS",
        authors: ["Snowykami"],
        description: "Welcome to Snowykami OS, powered by Next.js and Tailwind CSS.",
        keywords: ["Next.js", "Tailwind CSS", "Snowykami OS", "Web Development"],
        favicon: "https://q.qlogo.cn/g?b=qq&nk=2751454815&s=640"
    },
    profile: {
        descriptions: [
            "profile.description1",
            "profile.description2",
            "profile.description3",
            "profile.description4",
            "profile.description5",
            "profile.description6"
        ],
        sites: [
            { label: "Blog", url: "https://blog.sfkm.me", icon: ExternalLink },
            { label: "GitHub", url: "https://github.com/snowykami", icon: Github },
            { label: "AList", url: "https://als.liteyuki.org", icon: ExternalLink },
            { label: "CDN", url: "https://cdn.liteyuki.org", icon: ExternalLink },
        ],
        skillBadges: [
            // 浅色和深色都适配
            { key: "python", label: "Python", className: "bg-teal-100 dark:bg-teal-500/20 text-teal-700 dark:text-teal-300 hover:bg-teal-200 dark:hover:bg-teal-500/30 border-teal-200 dark:border-teal-500/30" },
            { key: "go", label: "Go", className: "bg-sky-100 dark:bg-sky-400/20 text-sky-700 dark:text-sky-300 hover:bg-sky-200 dark:hover:bg-sky-400/30 border-sky-200 dark:border-sky-400/30" },
            { key: "docker", label: "Docker", className: "bg-blue-100 dark:bg-blue-400/20 text-blue-700 dark:text-blue-200 hover:bg-blue-200 dark:hover:bg-blue-400/30 border-blue-200 dark:border-blue-400/30" },
            { key: "k8s", label: "Kubernetes", className: "bg-indigo-100 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-200 dark:hover:bg-indigo-500/30 border-indigo-200 dark:border-indigo-500/30" },
            { key: "cloud", label: "Cloud Native", className: "bg-cyan-100 dark:bg-cyan-400/20 text-cyan-700 dark:text-cyan-300 hover:bg-cyan-200 dark:hover:bg-cyan-400/30 border-cyan-200 dark:border-cyan-400/30" },
            { key: "typescript", label: "TypeScript", className: "bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-500/30 border-blue-200 dark:border-blue-500/30" },
            { key: "vue", label: "Vue.js", className: "bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-200 dark:hover:bg-emerald-500/30 border-emerald-200 dark:border-emerald-500/30" },
            { key: "linux", label: "Linux", className: "bg-gray-100 dark:bg-gray-500/20 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-500/30 border-gray-200 dark:border-gray-500/30" },
            { key: "devops", label: "DevOps", className: "bg-purple-100 dark:bg-purple-500/20 text-purple-700 dark:text-purple-300 hover:bg-purple-200 dark:hover:bg-purple-500/30 border-purple-200 dark:border-purple-500/30" },
        ]
    },
    contacts: [
        { icon: Mail, label: "contacts.email", value: "a@sfkm.me", link: "mailto:a@sfkm.me" },
        { icon: Github, label: "GitHub", value: "github.com/snowykami", link: "https://github.com/snowykami" },
        { icon: BiPlanet, label: "contacts.liteyukilab", value: "snowykami@lab.liteyuki.icu", link: "https://lab.liteyuki.org/@snowykami" },
        { icon: Tv, label: "bilibili", value: "snowykami", link: "https://space.bilibili.com/233938750" },
        { icon: RiQqLine, label: "QQ", value: "2751454815", link: "https://qm.qq.com/q/wjsV7ysAkS" },
        { icon: TbBrandNeteaseMusic, label: "contacts.ncm", value: "snowykami", link: "https://music.163.com/#/user/home?id=1491388449" },
        { icon: Twitter, label: "X", value: "@snowykami1145", link: "https://x.com/snowykami1145" },
        { icon: SiNpm, label: "NPM", value: "snowykami", link: "https://www.npmjs.com/~snowykami" },
        { icon: SiPypi, label: "Pypi", value: "SnowyKami", link: "https://pypi.org/user/SnowyKami/" },
        { icon: SiDocker, label: "Docker Hub", value: "snowykami", link: "https://hub.docker.com/u/snowykami" },
        ...(contactsJson as Contact[])
    ],
    friends: [...(friendsJson as Friend[])],
    friendsApplyLink: "https://github.com/snowykami/sfkm.me/issues/new?labels=friend-link&template=apply-friend-link-zh.yaml&title=友链申请: 你的站点名称",
    projects: [
        {
            name: "projects.liteyukibot.name",
            description: "projects.liteyukibot.description",
            tags: ["Python", "FastAPI", "WebSocket", "NoneBot2"],
            status: "active",
            link: "https://bot.liteyuki.org"
        },
        {
            name: "projects.magipoke.name",
            description: "projects.magipoke.description",
            tags: ["Go", "CloudWeGo", "Kotlin", "Swift", "Objective-C"],
            status: "active",
            link: "https://app.redrock.team/#/"
        },
        {
            name: "projects.serverstatus.name",
            description: "projects.serverstatus.description",
            tags: ["Vue.js", "Go", "Tailwind"],
            status: "completed",
            link: "https://status.liteyuki.org"
        },
        {
            name: "projects.litedoc.name",
            description: "projects.litedoc.description",
            tags: ["Python", "Markdown", "vitepress"],
            status: "completed",
            link: "https://github.com/LiteyukiStudio/litedoc"
        },
        ...(projectsJson as Project[])
    ],
    skills: [
        { name: "Python", level: 90, category: "backend" },
        { name: "Go", level: 80, category: "backend" },
        { name: "TypeScript", level: 85, category: "frontend" },
        { name: "Vue.js", level: 80, category: "frontend" },
        { name: "FastAPI", level: 85, category: "backend" },
        { name: "Docker", level: 80, category: "devops" },
        { name: "Kubernetes", level: 50, category: "devops" },
        { name: "Linux", level: 80, category: "database" },
        { name: "PostgreSQL", level: 70, category: "database" },
        { name: "Redis", level: 75, category: "database" },
        ...(skillsJson as Skill[])
    ],
    musics: [
        ...(musicData as Song[]).map((song) => {
            if (song.source === "ncm") {
                song.src = fetchSongSrcFromNCM(song.id);
            } else if (song.source === "qq") {
                song.src = fetchSongSrcFromQQ(song.id);
            }
            return song
        })
    ],
    background: async (ctx: BackgroundContext) => {
        if (ctx.isMobile) {
            const randomIndex = Math.floor(Math.random() * 3) + 1; // 随机选择背景图
            if (ctx.mode === "light") {
                return `url('https://cdn.liteyuki.org/snowykami/light_${randomIndex}.png')`;
            } else if (ctx.mode === "dark") {
                return `url('https://cdn.liteyuki.org/snowykami/dark_${randomIndex}.png')`;
            }
        }
        return "url('https://cdn.liteyuki.org/blog/background.png')"
    },
    languageResources: {
        zh: {
            translation: {
                name: "简体中文",
                about: {
                    title: "关于此名片",
                    description1: "这是一个仿 macOS 风格的个人名片页面，支持多窗口、Dock、菜单栏、主题切换等功能。",
                    description2: "基础部分是由vercel v0生成，后续大部分由作者本人进行维护和更新(不太会react qwq)。",
                    description3: "如果你喜欢这个项目，欢迎在<a href='https://github.com/snowykami/sfkm.me'>GitHub</a>上给个Star！",
                },
                browser: {
                    title: "浏览器",
                },
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
                liteyukilab: {
                    title: "轻雪社区",
                },
                marquee: {
                    sentence1: "试试拖拽和缩放窗口吧！",
                    sentence2: "桌面端推荐使用全屏模式哦",
                    sentence3: "点击左上角的头像有更多好玩的哦",
                    sentence4: "网站源代码已经开源在GitHub上了",
                    sentence5: "听听歌如何呢？只需点击播放按钮，还有歌词哦！",
                },
                menu: {
                    about: "关于",
                    language: "语言切换",
                    exit: "退出(或请手动关闭)"
                },
                music: {
                    title: "音乐",
                    album: "专辑",
                    artist: "歌手",
                    loading: "加载中...",
                    lyric: "歌词",
                    next: "下一首",
                    noartist: "暂无歌手",
                    nocover: "暂无封面",
                    nolyric: "暂无歌词",
                    noplay: "暂无播放",
                    nosongs: "暂无歌曲",
                    notitle: "暂无标题",
                    nowPlaying: "现正播放",
                    pause: "暂停",
                    play: "播放",
                    playlist: "播放列表",
                    prev: "上一首",
                    pure: "纯音乐，请欣赏",
                    volume: "音量",
                    wiki: "百科",
                    similar: "相似歌曲",
                    search: "搜索歌曲",
                    mode: {
                        loop: "列表循环",
                        single: "单曲循环",
                        shuffle: "随机播放",
                        order: "顺序播放",
                    },
                    from: {
                        ncm: "网易云音乐",
                        qq: "QQ音乐",
                        liteyuki: "轻雪网盘",
                        unknown: "未知来源",
                        undefined: "未定义来源",
                    }

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
                        description: "掌上重邮，一个涵盖学校生活的多功能应用，APP在各个平台使用原生技术开发，后端使用云原生微服务架构",
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
                },
                terminal: {
                    title: "终端",
                    prompt: "欢迎使用虚空终端！输入 <code>help</code> 查看可用命令。",
                    error: "命令执行出错：{{error}}",
                    unknown: "未知命令：{{command}}",

                    commands: {
                        about: {
                            description: "显示关于此名片的信息",
                            usage: "使用 <code>about</code> 查看相关信息",
                            content: "这是一个仿真终端，可以干一些操作网页的事情"
                        },
                        cat: {
                            description: "显示文件内容",
                        },
                        cd: {
                            description: "切换当前工作目录",
                        },
                        chlang: {
                            description: "切换语言, chlang <language>",
                            usage: "使用 <code>chlang [language]</code> 切换语言，支持 'zh', 'en', 'ja' 等",
                            available: "可用语言：{{langs}}",
                            result: "语言已切换为 {{lang}}",
                        },
                        chtheme: {
                            description: "在亮色/暗色切换主题",
                            result: "主题已切换为 {{theme}}",
                            light: "亮色",
                            dark: "暗色",
                        },
                        clear: {
                            description: "清除终端内容",
                        },
                        echo: {
                            description: "输出文本到终端",
                            usage: "使用 <code>echo [text]</code> 输出指定文本",
                        },
                        exit: {
                            description: "退出终端",
                        },
                        help: {
                            description: "显示可用命令列表",
                            usage: "使用 <code>help [command]</code> 查看特定命令的帮助信息",
                        },
                        kill: {
                            description: "kill <window-id>结束页面上的窗口",
                            noId: "请提供窗口 ID",
                            notFound: "未找到 ID 为 {{id}} 的窗口",
                            killed: "已结束窗口 {{id}}",
                        },
                        ls: {
                            description: "列出当前目录下的文件和目录",
                        },
                        node: {
                            description: "进入 Node.js 交互模式或执行单行语句",
                            exit: "退出 Node.js 交互模式",
                            enter: "进入 Node.js 交互模式，输入 <code>exit</code> 退出",
                        },
                        path: {
                            notfound: "路径 {{path}} 不存在",
                            notdir: "{{path}} 不是一个目录",
                            notfile: "{{path}} 不是一个文件",
                            pleaseinputpath: "请输入有效的路径",
                        },
                        refresh: {
                            description: "刷新当前页面",
                            usage: "使用 <code>refresh</code> 刷新页面",
                            result: "页面已刷新",
                        },
                        noDesc: "无描述",
                        music: {
                            description: "音乐控制命令",
                            help: "子命令: next, prev, pp, ended",
                            next: "已切换到下一首音乐",
                            prev: "已切换到上一首音乐",
                            ended: "已结束当前音乐",
                            playpause: "已切换音乐播放/暂停状态",
                            unknown: "未知子命令：{{subCommand}}. {{help}}",
                            nowPlaying: "现正播放",
                        },
                        musiclrc: {
                            description: "在终端持续显示当前播放的歌词",
                            unsupported: "终端不支持动态输出"
                        },
                        curl: {
                            description: "模拟 curl 请求，支持常用参数（-X, -H, -d, --data, --header, --json, -i 等）",
                            noUrl: "请提供 URL",
                            failed: "请求失败: {{error}}"
                        },
                        pwd: {
                            description: "显示当前工作目录",
                            result: "当前工作目录：{{path}}"
                        },
                        win: {
                            description: "窗口管理器",
                            noWindow: "当前没有打开的窗口",
                            noId: "请提供窗口 ID",
                            notFound: "未找到 ID 为 {{id}} 的窗口",
                            closed: "已关闭窗口 {{title}}",
                            hidden: "已隐藏窗口 {{title}}",
                            maximized: "已最大化窗口 {{title}}",
                            minimized: "已最小化窗口 {{title}}",
                            restored: "已还原窗口 {{title}}",
                            topped: "已将窗口 {{title}} 置顶",
                            reset: "已重置所有窗口状态",
                            resetAndRefresh: "已重置所有窗口状态并刷新页面",
                            unknown: "未知子命令: {{subCommand}}. 可用子命令: ls, close, hide, max, min, reset, open",
                            opened: "已打开窗口 {{title}}",
                            title: "标题",
                            size: "大小",
                            status: "状态",
                            statusminimized: "最小化",
                            statusmaximized: "最大化",
                            statushidden: "隐藏",
                            statusnormal: "正常",
                        },
                    },
                },
                traceroute: {
                    title: "Traceroute",
                },
                ui: {
                    close: "关闭",
                    minimize: "最小化",
                    maximize: "最大化",
                    releaseToMaximize: "释放以最大化",
                },
                vscode: {
                    title: "微软大战代码"
                },
                // ...其它中文翻译
                ...data["zh"]
            },
        },
        en: {
            translation: {
                name: "English",
                about: {
                    title: "About This Card",
                    description1: "This is a macOS-style personal card page that supports multiple windows, Dock, menu bar, theme switching, and more.",
                    description2: "The basic part is generated by vercel v0, and most of the subsequent maintenance and updates are done by the author himself (not very good at React qwq).",
                    description3: "If you like this project, feel free to give it a star on <a href='https://github.com/snowykami/sfkm.me'>GitHub</a>!",
                },
                browser: {
                    title: "Browser",
                },
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
                liteyukilab: {
                    title: "Liteyuki Lab",
                },
                marquee: {
                    sentence1: "Try dragging and resizing the windows!",
                    sentence2: "For a better experience, it's recommended to use fullscreen mode on desktop",
                    sentence3: "Click the avatar in the top left for more fun!",
                    sentence4: "The source code of this site is open on GitHub",
                    sentence5: "How about listening to some music? Just click the play button, lyrics included!",

                },
                menu: {
                    about: "About",
                    language: "Language Switch",
                    exit: "Exit (or please close manually)"
                },
                music: {
                    title: "Music",
                    album: "Album",
                    artist: "Artist",
                    loading: "Loading...",
                    lyric: "Lyrics",
                    next: "Next",
                    noartist: "No artist",
                    nocover: "No cover",
                    nolyric: "No lyrics",
                    noplay: "No music playing",
                    nosongs: "No songs",
                    notitle: "No title",
                    nowPlaying: "Now Playing",
                    pause: "Pause",
                    play: "Play",
                    playlist: "Playlist",
                    prev: "Previous",
                    pure: "Pure music, no lyrics",
                    volume: "Volume",
                    wiki: "Wiki",
                    similar: "Similar Songs",
                    search: "Search Songs",
                    mode: {
                        loop: "Loop All",
                        single: "Repeat One",
                        shuffle: "Shuffle",
                        order: "Order",
                    },
                    from: {
                        ncm: "NetEase Cloud Music",
                        qq: "QQ Music",
                        liteyuki: "Liteyuki Drive",
                        unknown: "Unknown Source",
                        undefined: "Undefined Source",
                    }
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
                terminal: {
                    title: "Terminal",
                    prompt: "Welcome to the Void Terminal! Enter <code>help</code> to see available commands.",
                    error: "Command execution error: {{error}}",
                    unknown: "Unknown command: {{command}}",
                    commands: {
                        about: {
                            description: "Display information about this card",
                            usage: "Use <code>about</code> to view related information",
                            content: "This is a simulated terminal that can perform some web operations",
                        },
                        cat: {
                            description: "Display the content of a file",
                        },
                        cd: {
                            description: "Change the current working directory",
                        },
                        chlang: {
                            description: "Switch language, chlang <language>",
                            usage: "Use <code>chlang [language]</code> to switch language, supports 'zh', 'en', 'ja', etc.",
                            available: "Available languages: {{langs}}",
                            result: "Language switched to {{lang}}",
                        },
                        chtheme: {
                            description: "Switch theme between light and dark",
                            result: "Theme switched to {{theme}}",
                            light: "Light",
                            dark: "Dark",
                        },
                        clear: {
                            description: "Clear terminal content",
                        },
                        echo: {
                            description: "Output text to the terminal",
                            usage: "Use <code>echo [text]</code> to output specified text",
                        },
                        exit: {
                            description: "Exit the terminal",
                        },
                        help: {
                            description: "Display a list of available commands",
                            usage: "Use <code>help [command]</code> to view help for a specific command",
                        },
                        kill: {
                            description: "kill <window-id> to close a window on the page",
                            noId: "Please provide a window ID",
                            notFound: "No window found with ID {{id}}",
                            killed: "Closed window with ID {{id}}",
                        },
                        ls: {
                            description: "List files and directories in the current directory",
                        },
                        node: {
                            description: "Enter Node.js interactive mode or execute a single line of code",
                            exit: "Exit Node.js interactive mode",
                            enter: "Enter Node.js interactive mode, type <code>exit</code> to exit",
                        },
                        path: {
                            notfound: "Path {{path}} does not exist",
                            notdir: "{{path}} is not a directory",
                            notfile: "{{path}} is not a file",
                            pleaseinputpath: "Please enter a valid path",
                        },
                        pwd: {
                            description: "Display the current working directory",
                            result: "Current working directory: {{path}}",
                        },
                        refresh: {
                            description: "Refresh the current page",
                            usage: "Use <code>refresh</code> to refresh the page",
                            result: "Page refreshed",
                        },
                        noDesc: "No description",
                        music: {
                            description: "Music control commands",
                            help: "Subcommands: next, prev, pp, ended",
                            next: "Switched to the next song",
                            prev: "Switched to the previous song",
                            ended: "Ended the current song",
                            playpause: "Toggled music play/pause state",
                            unknown: "Unknown subcommand: {{subCommand}}. {{help}}",
                            nowPlaying: "Now Playing",
                        },
                        musiclrc: {
                            description: "Continuously display the currently playing lyrics in the terminal",
                            unsupported: "The terminal does not support dynamic output",
                        },
                        curl: {
                            description: "Simulate a curl request, supports common options (-X, -H, -d, --data, --header, --json, -i, etc.)",
                            noUrl: "Please provide a URL",
                            failed: "Request failed: {{error}}",
                        },
                        win: {
                            description: "Window manager",
                            noWindow: "No windows are currently open",
                            noId: "Please provide a window ID",
                            notFound: "No window found with ID {{id}}",
                            closed: "Closed window {{title}}",
                            hidden: "Hidden window {{title}}",
                            maximized: "Maximized window {{title}}",
                            minimized: "Minimized window {{title}}",
                            restored: "Restored window {{title}}",
                            topped: "Brought window {{title}} to the top",
                            reset: "All window states have been reset",
                            resetAndRefresh: "All window states have been reset and the page refreshed",
                            unknown: "Unknown subcommand: {{subCommand}}. Available subcommands: ls, close, hide, max, min, reset, open",
                            opened: "Opened window {{title}}",
                            title: "Title",
                            size: "Size",
                            status: "Status",
                            statusminimized: "Minimized",
                            statusmaximized: "Maximized",
                            statushidden: "Hidden",
                            statusnormal: "Normal",
                        },
                    },
                },
                traceroute: {
                    title: "Traceroute",
                },
                ui: {
                    close: "Close",
                    minimize: "Minimize",
                    maximize: "Maximize",
                    releaseToMaximize: "Release to maximize",
                },
                vscode: {
                    title: "Microsoft VS Code"
                },
                ...data["en"]
                // ...其它英文翻译
            },
        },
        ja: {
            translation: {
                name: "日本語",
                about: {
                    title: "この名刺について",
                    description1: "これはmacOSスタイルの個人名刺ページで、複数のウィンドウ、Dock、メニューバー、テーマ切り替えなどの機能をサポートしています。",
                    description2: "基本部分はvercel v0によって生成され、その後の大部分は作者本人がメンテナンスと更新を行っています（Reactはあまり得意ではありません qwq）。",
                    description3: "このプロジェクトが気に入ったら、<a href='https://github.com/snowykami/sfkm.me'>GitHub</a>でスターをつけてください！",
                },
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
                liteyukilab: {
                    title: "Liteyuki Lab",
                },
                marquee: {
                    sentence1: "ウィンドウをドラッグ＆リサイズしてみてください！",
                    sentence2: "デスクトップではフルスクリーンモードを使用することをお勧めします",
                    sentence3: "左上のアバターをクリックすると、もっと楽しいことがありますよ！",
                    sentence4: "このサイトのソースコードはGitHubで公開されています",
                    sentence5: "音楽を聴いてみませんか？ただ再生ボタンをクリックするだけで、歌詞も表示されます！",
                },
                menu: {
                    about: "概要",
                    language: "言語切り替え",
                    exit: "終了（または手動で閉じてください）"
                },
                music: {
                    title: "音楽",
                    album: "アルバム",
                    artist: "アーティスト",
                    loading: "読み込み中...",
                    lyric: "歌詞",
                    next: "次へ",
                    noartist: "アーティストはありません",
                    nocover: "カバーなし",
                    nolyric: "歌詞はありません",
                    noplay: "音楽は再生されていません",
                    nosongs: "曲はありません",
                    notitle: "タイトルはありません",
                    nowPlaying: "再生中",
                    pause: "一時停止",
                    play: "再生",
                    playlist: "プレイリスト",
                    prev: "前へ",
                    pure: "純音楽、歌詞なし",
                    volume: "音量",
                    wiki: "ウィキ",
                    similar: "類似の曲",
                    search: "曲を検索",
                    mode: {
                        loop: "リストループ",
                        single: "単曲リピート",
                        shuffle: "シャッフル再生",
                        order: "順番再生",
                    },
                    from: {
                        ncm: "NetEase Cloud Music",
                        qq: "QQ Music",
                        liteyuki: "Liteyuki Drive",
                        unknown: "不明なソース",
                        undefined: "未定義のソース",
                    }
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
                terminal: {
                    title: "ターミナル",
                    prompt: "虚空ターミナルへようこそ！<code>help</code> を入力して利用可能なコマンドを確認してください。",
                    error: "コマンド実行エラー：{{error}}",
                    unknown: "不明なコマンド：{{command}}",
                    commands: {
                        about: {
                            description: "この名刺に関する情報を表示",
                            usage: "<code>about</code> を使用して関連情報を表示",
                            content: "これはウェブ操作を行うことができるシミュレートされたターミナルです",
                        },
                        cat: {
                            description: "ファイルの内容を表示",
                        },
                        cd: {
                            description: "現在の作業ディレクトリを変更",
                        },
                        chlang: {
                            description: "言語を切り替える, chlang <language>",
                            usage: "<code>chlang [language]</code> を使用して言語を切り替えます。'zh', 'en', 'ja' などをサポート",
                            available: "利用可能な言語：{{langs}}",
                            result: "言語が {{lang}} に切り替わりました",
                        },
                        chtheme: {
                            description: "ライトテーマとダークテーマを切り替える",
                            result: "テーマが {{theme}} に切り替わりました",
                            light: "ライト",
                            dark: "ダーク",
                        },
                        clear: {
                            description: "ターミナルの内容をクリア",
                        },
                        echo: {
                            description: "テキストをターミナルに出力",
                            usage: "<code>echo [text]</code> を使用して指定されたテキストを出力",
                        },
                        exit: {
                            description: "ターミナルを終了",
                        },
                        help: {
                            description: "利用可能なコマンドのリストを表示",
                            usage: "<code>help [command]</code> を使用して特定のコマンドのヘルプを表示",
                        },
                        kill: {
                            description: "kill <window-id>でページ上のウィンドウを閉じる",
                            noId: "ウィンドウ ID を指定してください",
                            notFound: "ID {{id}} のウィンドウが見つかりません",
                            killed: "ウィンドウ {{id}} を閉じました",
                        },
                        ls: {
                            description: "現在のディレクトリ内のファイルとディレクトリをリスト表示",
                        },
                        node: {
                            description: "Node.js インタラクティブモードに入るか、単一行のコードを実行",
                            exit: "Node.js インタラクティブモードを終了",
                            enter: "Node.js インタラクティブモードに入る。<code>exit</code> を入力して終了",
                        },
                        path: {
                            notfound: "パス {{path}} は存在しません",
                            notdir: "{{path}} はディレクトリではありません",    
                            notfile: "{{path}} はファイルではありません",
                            pleaseinputpath: "有効なパスを入力してください",
                        },
                        pwd: {
                            description: "現在の作業ディレクトリを表示",
                            result: "現在の作業ディレクトリ：{{path}}",
                        },
                        refresh: {
                            description: "現在のページをリフレッシュ",
                            usage: "<code>refresh</code> を使用してページをリフレッシュ",
                            result: "ページがリフレッシュされました",
                        },
                        noDesc: "説明なし",
                        music: {
                            description: "音楽コントロールコマンド",
                            help: "サブコマンド: next, prev, pp, ended",
                            next: "次の曲に切り替えました",
                            prev: "前の曲に切り替えました",
                            ended: "現在の曲を終了しました",
                            playpause: "音楽の再生/一時停止状態を切り替えました",
                            unknown: "不明なサブコマンド：{{subCommand}}. {{help}}",
                            nowPlaying: "再生中",
                        },
                        musiclrc: {
                            description: "ターミナルで現在再生中の歌詞を継続的に表示",
                            unsupported: "ターミナルは動的出力をサポートしていません",
                        },
                        curl: {
                            description: "curl リクエストをシミュレート。一般的なオプション (-X, -H, -d, --data, --header, --json, -i など) をサポート",
                            noUrl: "URL を指定してください",
                            failed: "リクエスト失敗：{{error}}",
                        },
                        win: {
                            description: "ウィンドウマネージャー",
                            noWindow: "現在開いているウィンドウはありません",
                            noId: "ウィンドウ ID を指定してください",
                            notFound: "ID {{id}} のウィンドウが見つかりません",
                            closed: "ウィンドウ {{title}} を閉じました",
                            hidden: "ウィンドウ {{title}} を非表示にしました",
                            maximized: "ウィンドウ {{title}} を最大化しました",
                            minimized: "ウィンドウ {{title}} を最小化しました",
                            restored: "ウィンドウ {{title}} を元に戻しました",
                            topped: "ウィンドウ {{title}} を最前面にしました",
                            reset: "すべてのウィンドウ状態をリセットしました",
                            resetAndRefresh: "すべてのウィンドウ状態をリセットし、ページをリフレッシュしました",
                            unknown: "不明なサブコマンド：{{subCommand}}. 利用可能なサブコマンド：ls, close, hide, max, min, reset, open",
                            opened: "ウィンドウ {{title}} を開きました",
                            title: "タイトル",
                            size: "サイズ",
                            status: "ステータス",
                            statusminimized: "最小化",
                            statusmaximized: "最大化",
                            statushidden: "非表示",
                            statusnormal: "通常",
                        },
                    },
                },
                traceroute: {
                    title: "Traceroute",
                },
                ui: {
                    close: "閉じる",
                    minimize: "最小化",
                    maximize: "最大化",
                    releaseToMaximize: "最大化するにはリリースしてください",
                },
                vscode: {
                    title: "Microsoft VS Code"
                },
                ...data["ja"]
                // ...其它日文翻译
            },
        }
    }
}
export default config