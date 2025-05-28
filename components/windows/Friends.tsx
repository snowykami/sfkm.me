import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Users, ExternalLink } from "lucide-react"
import { Button } from "../ui/button"
import Image from "next/image"
import Friends from "@/data/friends.json"
import { useTranslation } from "react-i18next"

interface Friend {
    name: string
    link: string
    avatar: string
    description?: string
    tag?: string
}

const friends: Friend[] = Friends

function shuffle<T>(arr: T[]): T[] {
    const a = arr.slice()
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1))
        ;[a[i], a[j]] = [a[j], a[i]]
    }
    return a
}

export default function FriendsContent() {
    const { t } = useTranslation()
    const [list, setList] = useState(friends)

    // 只在客户端打乱，避免 hydration mismatch
    useEffect(() => {
        setList(shuffle(friends))
    }, [])

    return (
        <CardContent className="p-6 transition-colors">
            {/* 标题栏固定 */}
            <div className="flex items-center mb-4">
                <Users className="w-5 h-5 text-slate-500 dark:text-slate-400 mr-2" />
                <h2 className="text-lg font-semibold text-slate-800 dark:text-white flex-1">{t('friends.title')}</h2>
                <Button
                    className="bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 transition-colors h-8 px-3"
                    asChild
                >
                    <a href="https://github.com/snowykami/sfkm.me#友链" target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="w-4 h-4 mr-2" />
                        {t('friends.apply')}
                    </a>
                </Button>
            </div>
            {/* 列表可滚动，标题和按钮不会跟随滚动 */}
            <div className="flex flex-col gap-2 max-h-[60vh] overflow-y-auto pr-1">
                {list.map((friend) => (
                    <Card
                        key={friend.link}
                        className="bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 transition-colors hover:bg-slate-200 hover:dark:bg-slate-700/70 cursor-pointer"
                    >
                        <CardContent className="px-2 py-0">
                            <div className="flex items-center gap-2">
                                <a
                                    href={friend.link}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex-shrink-0"
                                    title={t(friend.name)}
                                >
                                    <Image
                                        src={friend.avatar}
                                        alt={t(friend.name)}
                                        width={32}
                                        height={32}
                                        className="w-8 h-8 rounded-full border border-slate-300 dark:border-slate-600 bg-white object-cover"
                                    />
                                </a>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <a
                                            href={friend.link}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="font-semibold text-slate-800 dark:text-white hover:underline truncate"
                                        >
                                            {t(friend.name)}
                                        </a>
                                        {friend.tag && (
                                            <Badge
                                                variant="outline"
                                                className="text-xs text-slate-500 dark:text-slate-400 border-slate-300 dark:border-slate-600"
                                            >
                                                {t(friend.tag)}
                                            </Badge>
                                        )}
                                    </div>
                                    <div className="text-slate-950 dark:text-slate-300 text-sm truncate">
                                        {friend.description ? t(friend.description) : ""}
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </CardContent>
    )
}