import React, { useRef, useState, useEffect, ReactNode } from "react";

// 定义默认参数
const DEFAULT_MARQUEE_SPEED_PX_PER_SEC = 30;
const DEFAULT_PAUSE_BEFORE_REPEAT_SEC = 2;

interface MarqueeProps {
    children: ReactNode;
    speedPxPerSec?: number;
    durationSec?: number;
    pauseBeforeRepeatSec?: number;
}

export function Marquee({ 
    children, 
    speedPxPerSec, 
    durationSec, 
    pauseBeforeRepeatSec = DEFAULT_PAUSE_BEFORE_REPEAT_SEC 
}: MarqueeProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const contentRef = useRef<HTMLDivElement>(null);
    const [isOverflowing, setIsOverflowing] = useState(false);
    const [uniqueId] = useState(() => `marquee-${Math.random().toString(36).substring(2, 9)}`);

    useEffect(() => {
        const updateMarquee = () => {
            if (!containerRef.current || !contentRef.current) return;
            
            const containerWidth = containerRef.current.offsetWidth;
            const contentWidth = contentRef.current.scrollWidth;

            // 检测是否溢出
            const overflowing = contentWidth > containerWidth;
            setIsOverflowing(overflowing);
            
            if (!overflowing) {
                if (contentRef.current) {
                    contentRef.current.style.animation = 'none';
                    contentRef.current.style.transform = 'none';
                }
                return;
            }

            // 计算动画参数
            const scrollDistance = contentWidth;
            
            // 计算滚动时间
            let scrollDuration: number;
            if (durationSec !== undefined) {
                scrollDuration = durationSec;
            } else if (speedPxPerSec !== undefined && speedPxPerSec > 0) {
                scrollDuration = scrollDistance / speedPxPerSec;
            } else {
                scrollDuration = scrollDistance / DEFAULT_MARQUEE_SPEED_PX_PER_SEC;
            }

            const totalDuration = scrollDuration + pauseBeforeRepeatSec;
            
            // 应用动画样式
            if (contentRef.current) {
                contentRef.current.style.animation = `${uniqueId} ${totalDuration}s linear infinite`;
            }
        };

        // 立即执行一次
        updateMarquee();

        // 监听容器大小变化
        const resizeObserver = new ResizeObserver(updateMarquee);
        if (containerRef.current) {
            resizeObserver.observe(containerRef.current);
        }

        // 监听内容变化
        const mutationObserver = new MutationObserver(updateMarquee);
        if (contentRef.current) {
            mutationObserver.observe(contentRef.current, { 
                childList: true, 
                subtree: true, 
                characterData: true 
            });
        }

        // 定义动画
        let scrollDurationForKeyframe = 1;
        if (durationSec !== undefined) {
            scrollDurationForKeyframe = durationSec;
        } else if (speedPxPerSec !== undefined && speedPxPerSec > 0 && contentRef.current) {
            scrollDurationForKeyframe = contentRef.current.scrollWidth / speedPxPerSec;
        } else if (contentRef.current) {
            scrollDurationForKeyframe = contentRef.current.scrollWidth / DEFAULT_MARQUEE_SPEED_PX_PER_SEC;
        }
        const pausePercent = (pauseBeforeRepeatSec / (pauseBeforeRepeatSec + scrollDurationForKeyframe)) * 100;

        const styleEl = document.createElement('style');
        styleEl.innerHTML = `
            @keyframes ${uniqueId} {
                0%, ${pausePercent}% {
                    transform: translateX(0);
                }
                100% {
                    transform: translateX(calc(-100% - 40px));
                }
            }
        `;
        document.head.appendChild(styleEl);

        // 清理函数
        return () => {
            resizeObserver.disconnect();
            mutationObserver.disconnect();
            styleEl.remove();
        };
    }, [children, speedPxPerSec, durationSec, pauseBeforeRepeatSec, uniqueId]);

    return (
        <div
            ref={containerRef}
            className="overflow-hidden whitespace-nowrap max-w-full"
            style={{ width: "100%" }}
        >
            <div
                ref={contentRef}
                className="inline-block"
                style={{
                    whiteSpace: "nowrap",
                    willChange: "transform",
                    transform: "translateX(0)",
                    paddingRight: isOverflowing ? "40px" : "0"
                }}
            >
                {children}
                {isOverflowing && <span style={{ opacity: 0 }}>-</span>}
            </div>
        </div>
    );
}