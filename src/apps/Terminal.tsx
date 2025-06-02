import React, { useState, useRef, useEffect } from "react";
import { useTerminalCommand, useTerminalMatch, useTerminalCommands } from "@/contexts/TerminalCommandContext";
import TerminalCommandRegister from './CommandRegister';
import { parseCommand } from "@/utils/commands";
import { t } from "i18next";

const HISTORY_KEY = "terminal_history";
const MAX_LINES = 100;
const MAX_HISTORY = 100;

export default function Terminal() {
    const [lines, setLines] = useState<string[]>([t("terminal.prompt")]);
    const [input, setInput] = useState("");
    const [history, setHistory] = useState<string[]>(() => {
        try {
            return JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]");
        } catch {
            return [];
        }
    });
    const [historyIndex, setHistoryIndex] = useState<number | null>(null);
    const [session, setSession] = useState<null | "node">(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const matchCommand = useTerminalMatch();
    const commands = useTerminalCommands();
    const register = useTerminalCommand();

    // 将之前的 hasMatch 判断替换为：
    const commandWord = input.trim().split(/\s+/)[0]; // 只获取第一个单词（命令部分）
    const hasMatch = commandWord.length > 0 && commands.some(cmd =>
        cmd.name.startsWith(commandWord) ||
        (cmd.alias && cmd.alias.some((a: string) => a.startsWith(commandWord)))
    );
    const inputColor = hasMatch ? "text-green-500" : "text-gray-200";

    // node 交互上下文
    const nodeContextRef = useRef<Record<string, unknown>>({});

    // 允许命令动态更新某一行
    const updateLine = (content: string, idx?: number) => {
        setLines(prev => {
            const copy = [...prev];
            if (typeof idx === "number" && idx >= 0 && idx < copy.length) {
                copy[idx] = content;
            } else {
                copy.push(content);
            }
            return copy.length > MAX_LINES ? copy.slice(copy.length - MAX_LINES) : copy;
        });
        return typeof idx === "number" ? idx : lines.length;
    };

    useEffect(() => {
        register({
            name: "clear",
            description: t("terminal.commands.clear.description"),
            run: () => {
                setLines([]);
                return "";
            },
        });
    }, [register, commands, setLines]);

    useEffect(() => {
        if (containerRef.current) {
            containerRef.current.scrollTop = containerRef.current.scrollHeight;
        }
    }, [lines]);

    const runInNodeContext = (code: string) => {
        const context = nodeContextRef.current;
        return Function("context", `
            with(context) {
                return eval(\`${code.replace(/`/g, "\\`")}\`);
            }
        `)(context);
    };

    const addLines = (newLines: string[]) => {
        setLines(prev => {
            const next = [...prev, ...newLines];
            return next.length > MAX_LINES ? next.slice(next.length - MAX_LINES) : next;
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const cmdText = input.trim();
        if (!cmdText) return;

        // node 交互模式
        if (session === "node") {
            addLines([`node > ${cmdText}`]);
            if (cmdText === "exit") {
                setSession(null);
                addLines([t("terminal.commands.node.exit")]);
                nodeContextRef.current = {};
            } else {
                try {
                    const result = runInNodeContext(cmdText);
                    addLines([
                        typeof result === "undefined"
                            ? ""
                            : typeof result === "string"
                                ? result
                                : JSON.stringify(result, null, 2)
                    ]);
                } catch (err) {
                    addLines([
                        t("terminal.error", {"error": (err instanceof Error ? err.message : String(err))}) 
                    ]);
                }
            }
            setInput("");
            inputRef.current?.focus();
            return;
        }

        // 普通命令模式，支持 && 和 ||
        let newHistory = history;
        if (!history.length || history[history.length - 1] !== cmdText) {
            newHistory = [...history, cmdText].slice(-MAX_HISTORY);
            setHistory(newHistory);
            localStorage.setItem(HISTORY_KEY, JSON.stringify(newHistory));
        }
        setHistoryIndex(null);

        // 进入 node session
        if (cmdText === "node") {
            setSession("node");
            addLines([
                `> ${cmdText}`,
                t("terminal.commands.node.enter", {"version": process.versions?.node ?? ""})
            ]);
            setInput("");
            inputRef.current?.focus();
            return;
        }

        // 解析 && 和 || 复合命令
        const parts: { cmd: string; op: "&&" | "||" | null }[] = [];
        let rest = cmdText;
        let lastOp: "&&" | "||" | null = null;
        while (rest.length) {
            const m = rest.match(/^(.*?)(\s*(&&|\|\|)\s*)(.*)$/);
            if (m) {
                parts.push({ cmd: m[1].trim(), op: lastOp });
                lastOp = m[3] as "&&" | "||";
                rest = m[4];
            } else {
                parts.push({ cmd: rest.trim(), op: lastOp });
                break;
            }
        }

        let lastResult: string | null = null;
        let lastError = false;
        for (let i = 0; i < parts.length; ++i) {
            const { cmd, op } = parts[i];
            // 判断是否需要执行
            if (i > 0) {
                if (op === "&&" && (lastError || !lastResult)) break;
                if (op === "||" && !(lastError || !lastResult)) break;
            }
            addLines([`> ${cmd}`]);
            let result = "";
            let error = false;
            const command = matchCommand(cmd);
            if (command) {
                try {
                    const r = await command.run(parseCommand(cmd), { updateLine });
                    result = typeof r === "string" ? r : "";
                } catch (err) {
                    result = t("terminal.error", { "error": (err instanceof Error ? err.message : String(err)) });
                    error = true;
                }
            } else {
                result = t("terminal.unknown", { "command": cmd });
                error = true;
            }
            if (result) {
                addLines([result]);
            }
            lastResult = result;
            lastError = error;
        }

        setInput("");
        inputRef.current?.focus();
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Tab") {
            e.preventDefault();
            const words = input.trim().split(/\s+/);
            const cur = words[0] || "";
            if (!cur) return;
            const matched = commands.filter(cmd =>
                cmd.name.startsWith(cur) ||
                (cmd.alias && cmd.alias.some(a => a.startsWith(cur)))
            );
            if (matched.length === 1) {
                words[0] = matched[0].name;
                setInput(words.join(" ") + " ");
            } else if (matched.length > 1) {
                addLines([
                    matched.map(cmd => cmd.name).join("    ")
                ]);
            }
            return;
        }
        if (e.key === "ArrowUp") {
            e.preventDefault();
            if (history.length === 0) return;
            let idx = historyIndex === null ? history.length - 1 : historyIndex - 1;
            if (idx < 0) idx = 0;
            setInput(history[idx]);
            setHistoryIndex(idx);
        } else if (e.key === "ArrowDown") {
            e.preventDefault();
            if (history.length === 0) return;
            const idx = historyIndex === null ? history.length : historyIndex + 1;
            if (idx >= history.length) {
                setInput("");
                setHistoryIndex(null);
            } else {
                setInput(history[idx]);
                setHistoryIndex(idx);
            }
        }
    };

    return (
        <div
            className="bg-zinc-900 text-gray-200 font-mono h-full flex flex-col overflow-hidden select-text"
            onClick={() => inputRef.current?.focus()}
        >
            <div
                ref={containerRef}
                className="flex-1 overflow-y-auto p-4 pb-20 box-border"
            >
                {lines.filter(Boolean).map((line, i) => (
                    <div
                        key={i}
                        className="break-all leading-relaxed"
                        dangerouslySetInnerHTML={{
                            __html: String(line ?? "").replace(/\n/g, "")
                        }}
                    />
                ))}
                <form onSubmit={handleSubmit} className="flex items-center mt-1">
                    <span className="mr-2 text-blue-400">
                        {session === "node" ? "node >" : ">"}
                    </span>
                    <input
                        ref={inputRef}
                        value={input}
                        onChange={e => {
                            setInput(e.target.value);
                            setHistoryIndex(null);
                        }}
                        onKeyDown={handleKeyDown}
                        className={`flex-1 bg-transparent border-none outline-none font-mono text-lg py-1 min-w-0 w-full caret-blue-400 ${inputColor}`}
                        autoFocus
                        autoComplete="off"
                        inputMode="text"
                        enterKeyHint="send"
                    />
                </form>
            </div>
            <TerminalCommandRegister />
        </div>
    );
}