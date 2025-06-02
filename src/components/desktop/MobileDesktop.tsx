"use client";
import React, { useState, useEffect } from "react";
import { useApps } from "@/contexts/AppContext";
import { t } from "i18next";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import MobileWindow from "../windows/MobileWindow";
import { useDevice } from "@/contexts/DeviceContext";

export default function MobileDesktop() {
    const { apps } = useApps();
    const { isMobile, mode } = useDevice();
    const [currentIndex, setCurrentIndex] = useState<number | null>(null);
    const [isOpening, setIsOpening] = useState(false); // 新增状态：控制打开动画
    const [touchStart, setTouchStart] = useState(0);
    const [touchEnd, setTouchEnd] = useState(0);
    const [, setIsDragging] = useState(false); // 用于区分滑动和点击

    // 页面加载时根据 hash 自动打开
    useEffect(() => {
        if (!isMobile) return;
        const hash = window.location.hash.replace(/^#/, "");
        let idx = -1;
        if (hash) {
            idx = apps.findIndex(app => app.id === hash);
        }
        if (idx >= 0) {
            setCurrentIndex(idx);
        } else {
            const profileIdx = apps.findIndex(app => app.id === "profile");
            setCurrentIndex(profileIdx >= 0 ? profileIdx : null);
        }
    }, [apps, isMobile]);

    if (!isMobile) return null;

    // 滑动手势
    const handleTouchStart = (e: React.TouchEvent) => {
        setTouchStart(e.targetTouches[0].clientX);
        setTouchEnd(e.targetTouches[0].clientX); // 初始化 touchEnd，防止未滑动时触发误判
        setIsDragging(false); // 初始化拖动状态
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        setTouchEnd(e.targetTouches[0].clientX);
        if (Math.abs(touchStart - e.targetTouches[0].clientX) > 10) {
            setIsDragging(true); // 如果滑动距离超过 10px，标记为拖动
        }
    };

    const handleTouchEnd = () => {
        if (currentIndex === null) return;
        const distance = touchStart - touchEnd;

        // 判断滑动距离是否超过阈值
        if (distance > 50 && currentIndex < apps.length - 1) {
            setCurrentIndex(currentIndex + 1);
        } else if (distance < -50 && currentIndex > 0) {
            setCurrentIndex(currentIndex - 1);
        }

        setTouchStart(0);
        setTouchEnd(0);
        setIsDragging(false); // 重置拖动状态
    };

    const handleAppClick = (idx: number) => {
        setIsOpening(true); // 开始动画
        setTimeout(() => {
            setCurrentIndex(idx);
            window.location.hash = apps[idx].id;
            setIsOpening(false); // 动画结束后重置状态
        }, 300); // 动画持续时间
    };

    const goToPrevious = () => {
        if (currentIndex !== null && currentIndex > 0) {
            const newIndex = currentIndex - 1;
            setCurrentIndex(newIndex);
            window.location.hash = apps[newIndex].id; // 更新哈希
        }
    };

    const goToNext = () => {
        if (currentIndex !== null && currentIndex < apps.length - 1) {
            const newIndex = currentIndex + 1;
            setCurrentIndex(newIndex);
            window.location.hash = apps[newIndex].id; // 更新哈希
        }
    };

    // 滑动百分比
    const slidePercentage = currentIndex === null ? 0 : (100 / apps.length) * currentIndex;

    // 关闭按钮
    const handleClose = () => {
        setCurrentIndex(null); // 回到桌面
        window.location.hash = ""; // 清除 hash
    };

    // 桌面视图部分
    if (currentIndex === null) {
        return (
            <div className="fixed inset-0 bg-slate-100/90 dark:bg-slate-900/95 backdrop-blur-md z-40 px-4 pt-12">
                <div className="flex flex-wrap gap-4 mt-8 justify-center">
                    {apps.map((app, idx) => (
                        <button
                            key={app.id}
                            className={`w-16 h-16 rounded-xl flex flex-col items-center justify-center bg-white/80 dark:bg-slate-800/80 shadow transition-transform duration-300 ${isOpening ? "scale-110 opacity-0" : "scale-100 opacity-100"
                                }`}
                            onClick={() => handleAppClick(idx)}
                        >
                            {app.icon}
                            <span className="text-xs mt-1">{t(app.label) || app.id}</span>
                        </button>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 bg-slate-100/90 dark:bg-slate-900/95 backdrop-blur-md z-40 flex flex-col">
            {/* 顶部标题栏 */}
            <div className="bg-slate-100/80 dark:bg-slate-800/80 backdrop-blur-sm border-b border-slate-300/60 dark:border-slate-700/50 px-4 py-2 flex items-center justify-between">
                <button
                    onClick={goToPrevious}
                    disabled={currentIndex === 0}
                    className="p-2 rounded-lg bg-slate-300/50 dark:bg-slate-700/50 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-200/50 dark:hover:bg-slate-600/50 transition-colors"
                >
                    <ChevronLeft className="w-5 h-5 text-slate-800 dark:text-slate-300" />
                </button>
                <div className="flex-1 text-center">
                    <span className="text-slate-800 dark:text-slate-300 text-sm font-bold">
                        {t(apps[currentIndex]?.label) || apps[currentIndex]?.id}
                    </span>
                </div>
                <button
                    onClick={goToNext}
                    disabled={currentIndex === apps.length - 1}
                    className="p-2 rounded-lg bg-slate-300/50 dark:bg-slate-700/50 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-200/50 dark:hover:bg-slate-600/50 transition-colors"
                >
                    <ChevronRight className="w-5 h-5 text-slate-800 dark:text-slate-300" />
                </button>
            </div>

            {/* 滑动窗口区域 */}
            <div
                className="flex-1 flex transition-transform duration-300 ease-out pb-4 overflow-y-auto"
                style={{
                    transform: `translateX(-${slidePercentage}%)`,
                    width: `${apps.length * 100}%`,
                }}
                onTouchStart={handleTouchStart}
                onTouchMove={(e) => {
                    // 只处理横向滑动，忽略纵向滑动
                    if (Math.abs(e.targetTouches[0].clientX - touchStart) > Math.abs(e.targetTouches[0].clientY - touchStart)) {
                        handleTouchMove(e);
                    }
                }}
                onTouchEnd={handleTouchEnd}
            >
                {apps.map((app, idx) => (
                    <div
                        key={app.id}
                        className="h-full flex-shrink-0"
                        style={{ width: `${100 / apps.length}%` }}
                    >
                        <MobileWindow
                            id={app.id}
                            visible={currentIndex === idx}
                            scrollable={true} // 确保窗口内部可滚动
                        >
                            <app.entry windowId={app.id} />
                        </MobileWindow>
                    </div>
                ))}
            </div>
            {/* 页面指示器 */}
            <div className="absolute left-1/2 transform -translate-x-1/2 bottom-1 z-50 flex space-x-2">
                {apps.map((_, index) => (
                    <button
                        key={index}
                        onClick={() => {
                            setCurrentIndex(index);
                            window.location.hash = apps[index].id;
                        }}
                        className={`w-2 h-2 rounded-full transition-colors ${index === currentIndex
                            ? "bg-slate-800 dark:bg-slate-300"
                            : "bg-slate-400 dark:bg-slate-600"
                            }`}
                    />
                ))}
            </div>

            {/* 统一关闭按钮 */}
            <div className="fixed bottom-1 left-19/20 z-[9999]" style={{ transform: "translateX(-50%)" }}>
                <button
                    className={`
                        ${mode === "dark"
                            ? "bg-white/80 text-slate-700 hover:bg-gray-100/90"
                            : "bg-slate-800/80 text-slate-200 hover:bg-slate-700/90"}
                        backdrop-blur-md 
                        rounded-full w-8 h-8 
                        flex items-center justify-center 
                        shadow-lg
                        transition-colors duration-200
                        active:scale-95
                    `}
                    onClick={handleClose}
                >
                    <X className="h-4 w-4" />
                </button>
            </div>
        </div>
    );
}