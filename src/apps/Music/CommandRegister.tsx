'use client'
import type {
  TerminalCommandExtraCtx,
} from '@/contexts/TerminalCommandContext'
import type { CommandArg } from '@/utils/commands'
import { t } from 'i18next'
import { useEffect, useRef } from 'react'
import { useMusic } from '@/contexts/MusicContext'
import {
  useTerminalCommand,
  useTerminalUnregisterCommand,
} from '@/contexts/TerminalCommandContext'

export default function MusicCommandRegister() {
  const register = useTerminalCommand()
  const unregister = useTerminalUnregisterCommand() // 新增:获取注销命令函数
  const {
    currentLyric,
    currentTrack,
    currentIndex,
  } = useMusic()

  // 跟踪命令是否已注册
  const isRegistered = useRef(false)

  // 音乐相关命令
  useEffect(() => {
    // 每次状态变化时重新注册命令
    // 先注销已有命令
    unregister('music')

    // 重新注册命令
    register({
      name: 'music',
      alias: ['m'],
      description: t('terminal.commands.music.description'),
      run: async (ctx: CommandArg, extraCtx?: TerminalCommandExtraCtx) => {
        const subCommand = ctx.args[1] || ''
        if (subCommand === 'lrc') {
          if (!extraCtx)
            return t('terminal.commands.musiclrc.unsupported')
          // 只插入一行歌词
          // TODO: 需要重新实现歌词变化监听功能
          // 因为 MusicContext 没有提供 onLrcLineChange API
          // 可以考虑使用 useEffect 监听 currentLyric 变化
          return null
        }
        // TODO: 需要重新实现音乐命令处理功能
        // 因为 MusicContext 没有提供 handleMusicCommand API
        // 可以根据 subCommand 直接调用 MusicContext 提供的方法(如 play, pause, next, prev 等)
        return `音乐命令 "${subCommand}" 暂不支持，需要重新实现`
      },
    })

    isRegistered.current = true

    // 清理函数
    return () => {
      unregister('music')
    }
  }, [
    register,
    unregister,
    currentLyric,
    currentTrack, // 修正:使用 currentTrack 代替 currentSong
    currentIndex, // 修正:使用 currentIndex 代替 currentSongIndex
  ])

  return null
}
