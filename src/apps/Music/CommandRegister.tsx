"use client";
import { useEffect, useRef } from "react";
import { TerminalCommandExtraCtx, useTerminalCommand, useTerminalUnregisterCommand } from "@/contexts/TerminalCommandContext";
import { useMusic } from "@/contexts/MusicContext";
import { CommandArg } from "@/utils/commands";
import { t } from "i18next";

export default function MusicCommandRegister() {
    const register = useTerminalCommand();
    const unregister = useTerminalUnregisterCommand(); // 新增：获取注销命令函数
    const {
        handleMusicCommand,
        onLrcLineChange,
        displayLrc,
        currentSong,
        currentSongIndex,
    } = useMusic();
    
    // 跟踪命令是否已注册
    const isRegistered = useRef(false);

    // 音乐相关命令
    useEffect(() => {
        // 每次状态变化时重新注册命令
        // 先注销已有命令
        unregister("music");
        unregister("musiclrc");
        
        // 重新注册命令
        register({
            name: "music",
            alias: ["m"],
            description: t("terminal.commands.music.description"),
            run: async (ctx: CommandArg) => {
                const subCommand = ctx.args[1] || "";
                return handleMusicCommand(subCommand, ctx.args.slice(2));
            }
        });

        // 注册歌词显示命令
        register({
            name: "musiclrc",
            description: t("terminal.commands.musiclrc.description"),
            run: async (ctx: CommandArg, extraCtx?: TerminalCommandExtraCtx) => {
                if (!extraCtx) return t("terminal.commands.musiclrc.unsupported");
                const idx = extraCtx.updateLine(`<div class="text-green-400">LRC: ${displayLrc}</div>`);
                onLrcLineChange((_line, text) => {
                    extraCtx.updateLine(`<div class="text-green-400">LRC: ${text}</div>`, idx);
                });
                return null;
            }
        });
        
        isRegistered.current = true;
        
        // 清理函数
        return () => {
            unregister("music");
            unregister("musiclrc");
        };
    }, [
        register, 
        unregister,
        handleMusicCommand, 
        onLrcLineChange, 
        displayLrc,
        currentSong,  // 添加这些关键依赖
        currentSongIndex
    ]);

    return null;
}