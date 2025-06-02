import React, { useRef, useState, useEffect, ReactNode } from "react";

// 定义一个默认的滚动速度（像素/秒），当没有指定速度或时长时使用
const DEFAULT_MARQUEE_SPEED_PX_PER_SEC = 30;
// 定义默认的每轮开始前暂停时间（秒）
const DEFAULT_PAUSE_BEFORE_REPEAT_SEC = 2;

interface MarqueeProps {
    children: ReactNode;
    /**
     * 滚动速度 (像素/秒)。如果同时指定了 durationSec，则 durationSec 优先。
     */
    speedPxPerSec?: number;
    /**
     * 单次滚动的时长 (秒)。如果指定了此参数，将忽略 speedPxPerSec。
     */
    durationSec?: number;
    /**
     * 每轮滚动开始前的暂停时间 (秒)。默认为 2 秒。
     */
    pauseBeforeRepeatSec?: number;
}

export function Marquee({ children, speedPxPerSec, durationSec, pauseBeforeRepeatSec = DEFAULT_PAUSE_BEFORE_REPEAT_SEC }: MarqueeProps) {
    // 外部容器引用，用于测量宽度和设置 overflow: hidden
    const containerRef = useRef<HTMLDivElement>(null);
    // 内容元素引用，用于测量内容宽度
    const contentRef = useRef<HTMLDivElement>(null);

    // 状态：内容是否溢出容器
    const [isOverflowing, setIsOverflowing] = useState(false);
    // 状态：动态生成的动画样式
    const [animationStyle, setAnimationStyle] = useState({});

    useEffect(() => {
        const updateMarquee = () => {
            if (containerRef.current && contentRef.current) {
                const containerWidth = containerRef.current.offsetWidth;
                const contentWidth = contentRef.current.scrollWidth;

                if (contentWidth > containerWidth) {
                    setIsOverflowing(true);

                    const startPos = 0;
                    const endPos = -contentWidth;
                    const scrollDistance = contentWidth;

                    let scrollDuration: number;
                    const pauseDuration = pauseBeforeRepeatSec;

                    if (durationSec !== undefined) {
                        scrollDuration = durationSec;
                    } else if (speedPxPerSec !== undefined) {
                        scrollDuration = scrollDistance / speedPxPerSec;
                    } else {
                        scrollDuration = scrollDistance / DEFAULT_MARQUEE_SPEED_PX_PER_SEC;
                    }

                    const totalDuration = scrollDuration + pauseDuration;
                    // 避免除以零的情况
                    const pausePercentage = totalDuration > 0 ? (pauseDuration / totalDuration) * 100 : 0;

                    setAnimationStyle({
                        '--marquee-start': `${startPos}px`,
                        '--marquee-end': `${endPos}px`,
                        '--pause-percentage': `${pausePercentage}%`,
                        animation: `marquee ${totalDuration}s linear infinite`,
                    } as React.CSSProperties);

                } else {
                    setIsOverflowing(false);
                    setAnimationStyle({
                        animation: 'none',
                        transform: 'none',
                    });
                }
            }
        };

        // 组件挂载后立即执行一次测量和设置
        updateMarquee();

        // 使用 ResizeObserver 监听容器大小变化，以便在窗口调整时重新计算
        const containerObserver = new ResizeObserver(updateMarquee);
        if (containerRef.current) {
            containerObserver.observe(containerRef.current);
        }

        // 使用 MutationObserver 监听内容变化（例如文本内容改变），以便重新计算宽度
        const mutationObserver = new MutationObserver(updateMarquee);
        if (contentRef.current) {
            mutationObserver.observe(contentRef.current, { childList: true, subtree: true, characterData: true });
        }


        // 清理函数：在组件卸载或依赖项变化时停止监听
        return () => {
            containerObserver.disconnect();
            mutationObserver.disconnect();
        };
    }, [children, speedPxPerSec, durationSec, pauseBeforeRepeatSec]); // 添加新的 props 作为依赖项


    return (
        <div
            ref={containerRef}
            className="relative overflow-hidden whitespace-nowrap"
            style={{ width: "100%" }}
        >
            {/* 单个内容元素，应用动态动画样式 */}
            <div
                ref={contentRef}
                className={`inline-block ${isOverflowing ? "animate-marquee" : ""}`}
                style={animationStyle} // 应用动态样式
            >
                {children}
            </div>
            <style jsx>{`
                .animate-marquee {
                    /* 动画属性（名称、时长、timing-function、iteration-count）由 style prop 动态设置 */
                }

                /* 定义关键帧，使用 CSS 变量作为起始和结束的 transform 值 */
                @keyframes marquee {
                    0% {
                        transform: translateX(var(--marquee-start, 0px));
                    }
                    /* 在暂停百分比之前保持在起始位置 */
                    var(--pause-percentage, 0%) {
                         transform: translateX(var(--marquee-start, 0px));
                    }
                    /* 从暂停百分比开始，滚动到结束位置 */
                    100% {
                        transform: translateX(var(--marquee-end, 0px));
                    }
                }
            `}</style>
        </div>
    );
}