import React, { useState, useRef, useEffect } from "react";
import {
  useTerminalCommand,
  useTerminalMatch,
  useTerminalCommands,
} from "@/contexts/TerminalCommandContext";
import TerminalCommandRegister from "./CommandRegister";
import { CommandArg, parseCommand } from "@/utils/commands";
import { t } from "i18next";

const HISTORY_KEY = "terminal_history";
const MAX_LINES = 100;
const MAX_HISTORY = 100;

// 虚拟文件系统类型
type FileNode = { type: "file"; content: string };
type DirNode = { type: "dir"; children: Record<string, FileSystemNode> };
type FileSystemNode = FileNode | DirNode;

// 虚拟文件系统结构
const initialFS: Record<string, FileSystemNode> = {
  "/": {
    type: "dir",
    children: {
      User: {
        type: "dir",
        children: {
          snowykami: {
            type: "dir",
            children: {
              "readme.txt": {
                type: "file",
                content: "Welcome to Snowykami Terminal!",
              },
            },
          },
        },
      },
      etc: { type: "dir", children: {} },
      bin: {
        type: "dir",
        children: {
          ls: { type: "file", content: "ls command" },
          cd: { type: "file", content: "cd command" },
          cat: { type: "file", content: "cat command" },
          pwd: { type: "file", content: "pwd command" },
          clear: { type: "file", content: "clear command" },
          node: { type: "file", content: "node REPL" },
        },
      },
      "about.txt": { type: "file", content: "This is a fake terminal." },
    },
  },
};

function resolvePath(path: string, cwd: string): string {
  if (path.startsWith("/")) return path;
  if (cwd.endsWith("/")) return cwd + path;
  return cwd + "/" + path;
}
function normalizePath(path: string): string {
  const parts = path.split("/").filter(Boolean);
  const stack: string[] = [];
  for (const part of parts) {
    if (part === ".") continue;
    if (part === "..") stack.pop();
    else stack.push(part);
  }
  return "/" + stack.join("/");
}

// 命令参数类型（根据 parseCommand 返回结构调整）

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

  // 虚拟文件系统和当前目录
  const [fs] = useState(initialFS);
  const [cwd, setCwd] = useState("/User/snowykami");

  const commandWord = input.trim().split(/\s+/)[0];
  const hasMatch =
    commandWord.length > 0 &&
    commands.some(
      (cmd) =>
        cmd.name.startsWith(commandWord) ||
        (cmd.alias && cmd.alias.some((a: string) => a.startsWith(commandWord))),
    );
  const inputColor = hasMatch ? "text-green-500" : "text-gray-200";

  const nodeContextRef = useRef<Record<string, unknown>>({});

  const HOME = "/User/snowykami";

  const updateLine = (content: string, idx?: number) => {
    let lineIdx = idx;
    setLines((prev) => {
      const copy = [...prev];
      if (typeof idx === "number" && idx >= 0 && idx < copy.length) {
        copy[idx] = content;
      } else {
        copy.push(content);
        lineIdx = copy.length - 1;
      }
      return copy.length > MAX_LINES
        ? copy.slice(copy.length - MAX_LINES)
        : copy;
    });
    return lineIdx!;
  };

  // 注册虚拟目录相关命令
  useEffect(() => {
    register({
      name: "pwd",
      description: t("terminal.commands.pwd.description"),
      run: () => cwd,
    });
    register({
      name: "ls",
      alias: ["la"],
      description: t("terminal.commands.ls.description"),
      run: (args: CommandArg) => {
        // 只取第一个不是命令名的参数
        const param = args.args?.find((arg) => arg !== "ls");
        let path = param ? resolvePath(param, cwd) : cwd;
        path = normalizePath(path);
        let node: FileSystemNode = fs["/"];
        if (path !== "/") {
          for (const part of path.split("/").filter(Boolean)) {
            if (node.type !== "dir" || !node.children?.[part])
              return t("terminal.commands.path.notfound", {
                path,
              });
            node = node.children[part];
          }
        }
        if (node.type !== "dir")
          return t("terminal.commands.path.notdir", { path });
        return Object.keys(node.children).join("  ");
      },
    });
    register({
      name: "cd",
      description: t("terminal.commands.cd.description"),
      run: (args: CommandArg) => {
        const param = args.args?.find((arg) => arg !== "cd");
        let path = param ? resolvePath(param, cwd) : "/";
        path = normalizePath(path);
        let node: FileSystemNode = fs["/"];
        if (path !== "/") {
          for (const part of path.split("/").filter(Boolean)) {
            if (node.type !== "dir" || !node.children?.[part])
              return t("terminal.commands.path.notfound", {
                path,
              });
            node = node.children[part];
          }
        }
        if (node.type !== "dir")
          return t("terminal.commands.path.notdir", { path });
        setCwd(path);
        return "";
      },
    });
    register({
      name: "cat",
      description: t("terminal.commands.cat.description"),
      run: (args: CommandArg) => {
        const param = args.args?.find((arg) => arg !== "cat");
        let path = param ?? "";
        if (!path) return "cat: 请输入文件名";
        path = resolvePath(path, cwd);
        path = normalizePath(path);
        let node: FileSystemNode = fs["/"];
        const parts = path.split("/").filter(Boolean);
        for (let i = 0; i < parts.length; ++i) {
          if (node.type !== "dir" || !node.children?.[parts[i]])
            return t("terminal.commands.path.notfound", { path });
          node = node.children[parts[i]];
        }
        if (node.type !== "file")
          return t("terminal.commands.path.notfile", { path });
        return node.content;
      },
    });
    register({
      name: "clear",
      description: t("terminal.commands.clear.description"),
      run: () => {
        setLines([]);
        return "";
      },
    });
    // ...如有更多命令可继续添加...
  }, [register, cwd, fs]);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [lines]);

  const runInNodeContext = (code: string) => {
    const context = nodeContextRef.current;
    return Function(
      "context",
      `
            with(context) {
                return eval(\`${code.replace(/`/g, "\\`")}\`);
            }
        `,
    )(context);
  };

  const addLines = (newLines: string[]) => {
    setLines((prev) => {
      const next = [...prev, ...newLines];
      return next.length > MAX_LINES
        ? next.slice(next.length - MAX_LINES)
        : next;
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
                : JSON.stringify(result, null, 2),
          ]);
        } catch (err) {
          addLines([
            t("terminal.error", {
              error: err instanceof Error ? err.message : String(err),
            }),
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
        t("terminal.commands.node.enter", {
          version: process.versions?.node ?? "",
        }),
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
          const r = await command.run(parseCommand(cmd), {
            updateLine,
          });
          result = typeof r === "string" ? r : "";
        } catch (err) {
          result = t("terminal.error", {
            error: err instanceof Error ? err.message : String(err),
          });
          error = true;
        }
      } else {
        result = t("terminal.unknown", { command: cmd });
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
      // 命令补全
      if (words.length === 1) {
        const matched = commands.filter(
          (cmd) =>
            cmd.name.startsWith(cur) ||
            (cmd.alias && cmd.alias.some((a) => a.startsWith(cur))),
        );
        if (matched.length === 1) {
          words[0] = matched[0].name;
          setInput(words.join(" ") + " ");
        } else if (matched.length > 1) {
          addLines([matched.map((cmd) => cmd.name).join("    ")]);
        }
        return;
      }
      // 参数补全（目录/文件名，严格遵循目录树）
      const cmdName = words[0];
      const argInput = words[words.length - 1];
      if (["ls", "cd", "cat"].includes(cmdName)) {
        // 处理绝对/相对路径
        let basePath = cwd;
        let prefix = argInput;
        if (prefix.startsWith("/")) {
          // 绝对路径
          const idx = prefix.lastIndexOf("/");
          basePath = prefix.slice(0, idx) || "/";
          prefix = prefix.slice(idx + 1);
        } else if (prefix.includes("/")) {
          // 相对路径
          const idx = prefix.lastIndexOf("/");
          basePath = resolvePath(prefix.slice(0, idx), cwd);
          prefix = prefix.slice(idx + 1);
        }
        basePath = normalizePath(basePath);
        let node: FileSystemNode = fs["/"];
        if (basePath !== "/") {
          for (const part of basePath.split("/").filter(Boolean)) {
            if (node.type !== "dir" || !node.children?.[part]) return;
            node = node.children[part];
          }
        }
        if (node.type === "dir") {
          const candidates = Object.keys(node.children).filter((name) =>
            name.startsWith(prefix),
          );
          if (candidates.length === 1) {
            // 只剩一个候选，直接补全
            const completed =
              candidates[0] +
              (node.children[candidates[0]].type === "dir" ? "/" : "");
            if (argInput.includes("/")) {
              words[words.length - 1] =
                argInput.slice(0, argInput.lastIndexOf("/") + 1) + completed;
            } else {
              words[words.length - 1] = completed;
            }
            setInput(words.join(" ") + " ");
          } else if (candidates.length > 1) {
            addLines([
              candidates
                .map(
                  (name) =>
                    name + (node.children[name].type === "dir" ? "/" : ""),
                )
                .join("    "),
            ]);
          }
        }
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
      className="bg-zinc-900/80 text-gray-200 font-mono h-full flex flex-col overflow-hidden select-text"
      tabIndex={0}
      style={{ outline: "none" }}
      onClick={() => inputRef.current?.focus()}
      ref={containerRef}
    >
      <div className="flex-1 overflow-y-auto p-4 pb-20 box-border">
        {lines.filter(Boolean).map((line, i) => (
          <div
            key={i}
            className="break-all leading-relaxed"
            dangerouslySetInnerHTML={{
              __html: String(line ?? "").replace(/\n/g, ""),
            }}
          />
        ))}
        <form onSubmit={handleSubmit} className="flex items-center mt-1">
          <span className="mr-2 text-blue-400 flex items-center">
            {session === "node" ? (
              "node >"
            ) : cwd === HOME ? (
              <>
                <span title="Home" className="mr-1">
                  🏠
                </span>
                <span className="text-blue-400">~</span>
                <span className="text-blue-400">&nbsp;&gt;</span>
              </>
            ) : (
              <>
                <span>{cwd}</span>
                <span className="text-blue-400">&nbsp;&gt;</span>
              </>
            )}
          </span>
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => {
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
