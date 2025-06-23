"use client";

import { CommandArg } from "@/utils/commands";
import React, { createContext, useContext, useRef } from "react";

export type TerminalCommandExtraCtx = {
  updateLine: (content: string, idx?: number) => number;
};

export type TerminalContextType = {
  commands: TerminalCommand[];
  onCommand: (cmd: TerminalCommand) => void;
  unregisterCommand: (name: string) => void; // 新增：注销命令的方法
  matchCommand: (input: string) => TerminalCommand | undefined;
  findCommand: (name: string) => TerminalCommand | undefined;
};

const TerminalContext = createContext<TerminalContextType>({
  commands: [],
  onCommand: () => {},
  unregisterCommand: () => {}, // 新增：默认空函数
  matchCommand: () => undefined,
  findCommand: () => undefined,
});

export type TerminalCommand = {
  name: string; // 命令前缀
  alias?: string[]; // 可选别名
  description?: string;
  run: (
    ctx: CommandArg,
    extraCtx?: TerminalCommandExtraCtx,
  ) => Promise<string | null> | string;
};

export const TerminalProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const commandsRef = useRef<TerminalCommand[]>([]);

  // 注册命令
  const onCommand = (cmd: TerminalCommand) => {
    // 如果命令已存在，先移除旧命令
    const existingIndex = commandsRef.current.findIndex(
      (c) => c.name === cmd.name,
    );
    if (existingIndex !== -1) {
      commandsRef.current.splice(existingIndex, 1);
    }
    commandsRef.current.push(cmd);
  };

  // 新增：注销命令
  const unregisterCommand = (name: string) => {
    const index = commandsRef.current.findIndex((cmd) => cmd.name === name);
    if (index !== -1) {
      commandsRef.current.splice(index, 1);
    }
  };

  // 根据输入字符串匹配命令（支持 alias）
  const matchCommand = (input: string) => {
    const [cmdName] = input.trim().split(/\s+/); // 只取第一个单词
    return findCommand(cmdName);
  };

  // 根据命令名或别名查找命令
  const findCommand = (name: string) => {
    return commandsRef.current.find((cmd) => {
      if (cmd.name === name) return true;
      if (cmd.alias && cmd.alias.includes(name)) return true;
      return false;
    });
  };

  return (
    <TerminalContext.Provider
      value={{
        commands: commandsRef.current,
        onCommand,
        unregisterCommand, // 新增：暴露注销命令方法
        matchCommand,
        findCommand,
      }}
    >
      {children}
    </TerminalContext.Provider>
  );
};

// 注册命令
export const useTerminalCommand = () => {
  const ctx = useContext(TerminalContext);
  return ctx.onCommand;
};

// 新增：注销命令
export const useTerminalUnregisterCommand = () => {
  const ctx = useContext(TerminalContext);
  return ctx.unregisterCommand;
};

// 匹配命令（输入整行，自动取第一个单词）
export const useTerminalMatch = () => {
  const ctx = useContext(TerminalContext);
  return ctx.matchCommand;
};

// 查找命令（只查命令名或别名）
export const useTerminalFind = () => {
  const ctx = useContext(TerminalContext);
  return ctx.findCommand;
};

// 获取所有命令
export const useTerminalCommands = () => {
  const ctx = useContext(TerminalContext);
  return ctx.commands;
};
