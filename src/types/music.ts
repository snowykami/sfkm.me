export interface Song {
    title: string
    src: string | Promise<string> | (() => Promise<string>)
    artist?: string
    album?: string
    lrc?: string | Promise<string>
    cover?: string
    offset?: number
    source?: string // 来源标识符，例如 "ncm" 或 "qq"
    albumLink?: string // 专辑链接
    artistLink?: string // 艺术家链接
    songLink?: string // 歌曲链接
    id: string // 歌曲ID
    [key: string]: unknown // 允许其他属性
}

export type SongOrPromise = Song | Promise<Song> | (() => Promise<Song>)