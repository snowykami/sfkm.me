export interface Song {
  title: string
  src: string | (() => Promise<string>)
  artist?: string
  album?: string
  lrc?: string | Promise<string>
  cover?: string
  offset?: number
  source?: string // 来源标识符，例如 "ncm" 或 "qq"
  albumLink?: string // 专辑链接
  artistLink?: string // 艺术家链接
  songLink?: string // 歌曲链接
  quality?: 'standard' | 'high' | 'exhigh' | 'lossless' | 'hires' // 音质标识，对应128，192，320，flac，hires
  alias?: string[] // 歌曲别名
  id: string // 唯一标识符
  [key: string]: unknown // 允许其他属性
}

export type SongOrPromise = Song | Promise<Song> | (() => Promise<Song>)
