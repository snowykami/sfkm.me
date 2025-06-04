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

        // 重新注册命令
        register({
            name: "music",
            alias: ["m"],
            description: t("terminal.commands.music.description"),
            run: async (ctx: CommandArg, extraCtx?: TerminalCommandExtraCtx) => {
                const subCommand = ctx.args[1] || "";
                if (subCommand === "lrc") {
                    if (!extraCtx) return t("terminal.commands.musiclrc.unsupported");
                    // 只插入一行歌词
                    const idx = extraCtx.updateLine(`<div class="text-green-400">${displayLrc}</div>`);
                    // 每次歌词变化时只刷新这一行
                    onLrcLineChange((_line, text) => {
                        extraCtx.updateLine(`<div class="text-green-400">${text}</div>`, idx);
                    });
                    return null;
                }
                return handleMusicCommand(subCommand, ctx.args.slice(2));
            }
        });

        isRegistered.current = true;

        // 清理函数
        return () => {
            unregister("music");
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