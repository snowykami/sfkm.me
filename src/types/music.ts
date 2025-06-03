export interface Song {
    title: string
<<<<<<< HEAD
    src: string | (() => Promise<string>)
=======
    src: string | Promise<string> | (() => Promise<string>)
>>>>>>> 27086556a291c816f8bbc663113316a78a256163
    artist?: string
    album?: string
    lrc?: string | Promise<string>
    cover?: string
    offset?: number
    source?: string // 来源标识符，例如 "ncm" 或 "qq"
    albumLink?: string // 专辑链接
    artistLink?: string // 艺术家链接
    songLink?: string // 歌曲链接
<<<<<<< HEAD
    id: string // 唯一标识符
=======
    id: string // 歌曲ID
>>>>>>> 27086556a291c816f8bbc663113316a78a256163
    [key: string]: unknown // 允许其他属性
}

export type SongOrPromise = Song | Promise<Song> | (() => Promise<Song>)