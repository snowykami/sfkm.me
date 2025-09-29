import React, { useCallback, useState } from "react";
import { Button } from "@/components/ui/Button";
import { useWindowManager } from "@/contexts/WindowManagerContext";
import { AppProps } from "../BaseApp";
import { PlusCircle } from "lucide-react";

export default function EmptyApp({}: AppProps) {
  const { createTempWindow } = useWindowManager();
  // 使用状态跟踪已创建的窗口数量
  const [windowCount, setWindowCount] = useState(0);

  // 使用 useCallback 避免重复创建函数
  const handleOpenNewWindow = useCallback(() => {
    // 增加窗口计数
    const newCount = windowCount + 1;
    setWindowCount(newCount);

    // 使用窗口计数作为偏移系数

    const generatedId = `empty-window-${Date.now()}`;
    createTempWindow({
      id: generatedId,
      title: `新建窗口 #${newCount}`,
      size: { width: 400, height: 300 },
      // 不指定位置，让系统智能计算位置
      colorScheme: {
        bg: "bg-white",
        bgDark: "dark:bg-slate-800",
        titleBarBg: "bg-gradient-to-r from-blue-500 to-cyan-500",
        titleBarBgDark:
          "dark:bg-gradient-to-r dark:from-blue-600 dark:to-cyan-600",
        title: "text-white",
        titleDark: "dark:text-white",
        backdropBlur: true,
      },
      content: () => {
        // 捕获当前的窗口编号
        const currentWindowNumber = newCount;

        return (
          <div className="flex flex-col items-center justify-center h-full p-6">
            <div className="text-center space-y-4">
              <h2 className="text-xl font-semibold text-slate-800 dark:text-white">
                窗口 #{currentWindowNumber} 内容
              </h2>
              <p className="text-slate-600 dark:text-slate-300">
                这是通过 createTempWindow 创建的临时窗口
              </p>
              <div className="p-4 bg-slate-100 dark:bg-slate-700/50 rounded-lg text-sm text-slate-500 dark:text-slate-400">
                <code>窗口 ID: {generatedId}</code>
              </div>
              <Button
                onClick={() => {
                  // 递归创建更多窗口
                  handleOpenNewWindow();
                }}
                variant="outline"
                className="mt-4"
              >
                再开一个窗口
              </Button>
            </div>
          </div>
        );
      },
      onClose: () => console.log(`临时窗口 #${newCount} 已关闭`),
    });
  }, [createTempWindow, windowCount]);

  return (
    <div className="flex items-center justify-center h-full bg-gradient-to-br from-white to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="text-center space-y-8">
        <h1 className="text-2xl font-bold text-slate-800 dark:text-white">
          空应用示例
        </h1>
        <p className="text-slate-600 dark:text-slate-300 max-w-md">
          这是一个测试临时窗口功能的空应用组件。点击下方按钮可以打开一个新的
          macOS 风格窗口。
        </p>
        <Button
          onClick={handleOpenNewWindow}
          size="lg"
          className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white"
        >
          <PlusCircle className="w-5 h-5 mr-2" />
          打开新窗口
        </Button>
      </div>
    </div>
  );
}
