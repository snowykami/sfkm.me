"use client";
import { useEffect } from "react";
import {
  useTerminalCommand,
  useTerminalCommands,
  useTerminalFind,
} from "@/contexts/TerminalCommandContext";
import { useDevice } from "@/contexts/DeviceContext";
import { useWindowManager } from "@/contexts/WindowManagerContext";
import { CommandArg } from "@/utils/commands";
import { t } from "i18next";
import config from "@/config";
import { mediumWindowState } from ".";
import MusicCommandRegister from "./Music/CommandRegister";

export default function TerminalCommandRegister() {
  const register = useTerminalCommand();
  const commands = useTerminalCommands();
  const findCommand = useTerminalFind();
  const { mode, toggleMode, lang, setLang } = useDevice();

  const {
    resetLocalWindows,
    windows,
    closeWindow,
    bringToFront,
    updateWindow,
    getWindowById,
    openWindow,
  } = useWindowManager();

  // 注册通用命令
  useEffect(() => {
    register({
      name: "help",
      alias: ["hop"],
      description: t("terminal.commands.help.description"),
      run: (ctx: CommandArg) => {
        const query = ctx.args[1] || ctx.args[0];
        if (!query || query === "help" || query === "hop") {
          return commands
            .map(
              (cmd) =>
                `${cmd.name} - ${cmd.description || t("terminal.commands.noDesc")}`,
            )
            .join("<br>");
        }
        const cmd = findCommand(query);
        if (cmd) {
          return `${cmd.name} - ${cmd.description || t("terminal.commands.noDesc")}`;
        }
        return t("terminal.unknown", { command: query });
      },
    });
    register({
      name: "echo",
      description: t("terminal.commands.echo.description"),
      run: (ctx: CommandArg) => ctx.raw.slice(5),
    });
    register({
      name: "exit",
      alias: ["quit", "q"],
      description: t("terminal.commands.exit.description"),
      run: () => {
        closeWindow("terminal");
        return "";
      },
    });
    register({
      name: "about",
      description: t("terminal.commands.about.description"),
      run: () => t("terminal.commands.about.content"),
    });
    register({
      name: "node",
      description: t("terminal.commands.node.description"),
      run: async (ctx: CommandArg) => {
        const code = ctx.args.slice(1).join(" ");
        if (!code) {
          return t("terminal.commands.node.usage");
        }
        try {
          const sandbox = {
            console: console,
            setTimeout: setTimeout,
            clearTimeout: clearTimeout,
            setInterval: setInterval,
            clearInterval: clearInterval,
            result: undefined,
          };
          const result = Function(
            ...Object.keys(sandbox),
            `
                        try {
                            return ${code};
                        } catch(e) {
                            if(e instanceof SyntaxError) {
                                ${code};
                                return undefined;
                            }
                            throw e;
                        }
                    `,
          )(...Object.values(sandbox));
          if (result === undefined) {
            return t("terminal.commands.node.undefined");
          } else if (typeof result === "object") {
            return JSON.stringify(result, null, 2);
          } else {
            return String(result);
          }
        } catch (err) {
          return t("terminal.error", {
            error: err instanceof Error ? err.message : String(err),
          });
        }
      },
    });
    register({
      name: "chtheme",
      description: t("terminal.commands.chtheme.description"),
      run: async () => {
        const html = document.documentElement;
        const isNowDark = html.classList.contains("dark");
        toggleMode();
        return t("terminal.commands.chtheme.result", {
          theme: isNowDark
            ? t("terminal.commands.chtheme.light")
            : t("terminal.commands.chtheme.dark"),
        });
      },
    });
    register({
      name: "chlang",
      description: t("terminal.commands.chlang.description"),
      run: (ctx: CommandArg) => {
        const newLang = ctx.args[1];
        if (!newLang)
          return t("terminal.commands.chlang.available", {
            langs: Object.keys(config.languageResources).join(", "),
          });
        setLang(newLang);
        return t("terminal.commands.chlang.result", {
          lang: newLang,
        });
      },
    });
    register({
      name: "refresh",
      alias: ["rf"],
      description: t("terminal.commands.refresh.description"),
      run: async () => {
        window.location.reload();
        return t("terminal.commands.refresh.result");
      },
    });
  }, [
    register,
    commands,
    mode,
    toggleMode,
    lang,
    setLang,
    resetLocalWindows,
    findCommand,
    closeWindow,
  ]);

  // curl 命令
  register({
    name: "curl",
    description: t("terminal.commands.curl.description"),
    run: async (ctx: CommandArg) => {
      let url = "";
      let method = "GET";
      const headers: Record<string, string> = {};
      let body: unknown = undefined;
      let showHeader = false;

      for (let i = 1; i < ctx.args.length; i++) {
        const arg = ctx.args[i];
        if (arg === "-X" || arg === "--request") {
          method = ctx.args[i + 1]?.toUpperCase() || "GET";
          i++;
        } else if (arg === "-H" || arg === "--header") {
          const header = ctx.args[i + 1];
          if (header && header.includes(":")) {
            const [k, ...v] = header.split(":");
            headers[k.trim()] = v.join(":").trim();
          }
          i++;
        } else if (arg === "-d" || arg === "--data" || arg === "--data-raw") {
          body = ctx.args[i + 1];
          if (body && !headers["Content-Type"]) {
            headers["Content-Type"] = "application/x-www-form-urlencoded";
          }
          i++;
        } else if (arg === "--json") {
          body = ctx.args[i + 1];
          if (body) {
            headers["Content-Type"] = "application/json";
          }
          i++;
        } else if (arg === "-i") {
          showHeader = true;
        } else if (!arg.startsWith("-") && !url) {
          url = arg;
        }
      }

      if (!url) return t("terminal.commands.curl.noUrl");
      if (url && !/^https?:\/\//.test(url)) {
        url = "https://" + url;
      }

      try {
        const resp = await fetch(url, {
          method,
          headers,
          body:
            method !== "GET" && body !== undefined
              ? typeof body === "string"
                ? body
                : JSON.stringify(body)
              : undefined,
        });
        const text = await resp.text();
        let output = "";
        if (showHeader) {
          output += `HTTP/${resp.headers.get("x-http-version") || "1.1"} ${resp.status} ${resp.statusText}\n`;
          resp.headers.forEach((v, k) => {
            output += `${k}: ${v}\n`;
          });
          output += "\n";
        }
        try {
          output += JSON.stringify(JSON.parse(text), null, 2);
        } catch {
          output += text;
        }
        return output;
      } catch (err) {
        return t("terminal.commands.curl.failed", {
          error: err instanceof Error ? err.message : String(err),
        });
      }
    },
  });

  // win 命令
  register({
    name: "win",
    description: t("terminal.commands.win.description"),
    run: async (ctx: CommandArg) => {
      const subCommand = ctx.args[1];
      if (["ls", "list"].includes(subCommand)) {
        const filteredWindows = windows.filter(
          (w) => w.visible || ctx.flags.includes("a"),
        );
        console.log(windows);
        if (filteredWindows.length === 0) {
          return t("terminal.commands.win.noWindow");
        }

        // 使用 HTML 表格格式化输出
        let tableHtml = `<table class="terminal-table" style="width: 100%; border-collapse: collapse;">
                    <thead>
                      <tr>
                        <th style="text-align: left; padding-right: 1em;">ID</th>
                        <th style="text-align: left; padding-right: 1em;">${t("terminal.commands.win.title")}</th>
                        <th style="text-align: left; padding-right: 1em;">${t("terminal.commands.win.size")}</th>
                        <th style="text-align: left;">${t("terminal.commands.win.status")}</th>
                      </tr>
                    </thead>
                    <tbody>`;
        filteredWindows.forEach((win) => {
          const status = [];
          if (win.minimized)
            status.push(t("terminal.commands.win.statusminimized"));
          if (win.maximized)
            status.push(t("terminal.commands.win.statusmaximized"));
          if (!win.visible)
            status.push(t("terminal.commands.win.statushidden"));
          if (status.length === 0 && win.visible)
            status.push(t("terminal.commands.win.statusnormal"));

          const cleanedTitle = String(win.title || "") // 确保是字符串并处理 null/undefined
            .trim() // 移除首尾空白
            .replace(/\s+/g, " "); // 将一个或多个连续空白字符（包括换行）替换为单个空格

          tableHtml += `<tr>
                                    <td style="padding-right: 1em;">${win.id}</td>
                                    <td style="padding-right: 1em;">${t(cleanedTitle)}</td> 
                                    <td style="padding-right: 1em;">${win.size?.width || "N/A"}x${win.size?.height || "N/A"}</td>
                                    <td>${status.join(", ")}</td>
                                  </tr>`;
        });
        tableHtml += `</tbody></table>`;
        console.log(tableHtml);
        return tableHtml.trim();
      } else if (["close", "c"].includes(subCommand)) {
        const id = ctx.args[2];
        if (!id) return t("terminal.commands.win.noId");
        const win = getWindowById(id);
        if (!win) return t("terminal.commands.win.notFound", { id });
        closeWindow(win.id);
        return t("terminal.commands.win.closed", { title: win.title });
      } else if (["hide", "h"].includes(subCommand)) {
        const id = ctx.args[2];
        if (!id) return t("terminal.commands.win.noId");
        const win = getWindowById(id);
        if (!win) return t("terminal.commands.win.notFound", { id });
        updateWindow(win.id, { minimized: true });
        return t("terminal.commands.win.hidden", { title: win.title });
      } else if (["max", "maximize", "m"].includes(subCommand)) {
        const id = ctx.args[2];
        if (!id) return t("terminal.commands.win.noId");
        const win = getWindowById(id);
        if (!win) return t("terminal.commands.win.notFound", { id });
        const isMax = !!win.maximized;
        updateWindow(win.id, { maximized: !isMax, minimized: false });
        return isMax
          ? t("terminal.commands.win.restored", { title: win.title })
          : t("terminal.commands.win.maximized", {
              title: win.title,
            });
      } else if (["min", "minimize"].includes(subCommand)) {
        const id = ctx.args[2];
        if (!id) return t("terminal.commands.win.noId");
        const win = getWindowById(id);
        if (!win) return t("terminal.commands.win.notFound", { id });
        const isMin = !!win.minimized;
        updateWindow(win.id, { minimized: !isMin, maximized: false });
        return isMin
          ? t("terminal.commands.win.restored", { title: win.title })
          : t("terminal.commands.win.minimized", {
              title: win.title,
            });
      } else if (["open", "o"].includes(subCommand)) {
        const id = ctx.args[2];
        if (!id) return t("terminal.commands.win.noId");
        openWindow(id, mediumWindowState);
        return t("terminal.commands.win.opened", { title: id });
      } else if (["top", "t"].includes(subCommand)) {
        const id = ctx.args[2];
        if (!id) return t("terminal.commands.win.noId");
        const win = getWindowById(id);
        if (!win) return t("terminal.commands.win.notFound", { id });
        bringToFront(win.id);
        return t("terminal.commands.win.topped", { title: win.title });
      } else if (["reset", "r"].includes(subCommand)) {
        resetLocalWindows();
        if (ctx.flags.includes("f") || ctx.kwargs?.force) {
          window.location.reload();
          return t("terminal.commands.win.resetAndRefresh");
        }
        return t("terminal.commands.win.reset");
      }
      return t("terminal.commands.win.unknown", { subCommand });
    },
  });

  // kill 命令，关闭窗口
  register({
    name: "kill",
    description: t("terminal.commands.kill.description"),
    run: async (ctx: CommandArg) => {
      const id = ctx.args[1];
      if (!id) return t("terminal.commands.kill.noId");
      const win = getWindowById(id);
      if (!win) return t("terminal.commands.kill.notFound", { id });
      closeWindow(win.id);
      return t("terminal.commands.kill.killed", { id: win.id });
    },
  });
  return (
    <div>
      <MusicCommandRegister />
      {/* 其他命令注册可以放在这里 */}
    </div>
  );
}
