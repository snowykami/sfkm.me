import React, { useRef, useState, useEffect, ReactNode } from "react";

const DEFAULT_MARQUEE_SPEED_PX_PER_SEC = 30;
const DEFAULT_PAUSE_BEFORE_REPEAT_SEC = 2;

interface MarqueeProps {
    children: ReactNode;
    speedPxPerSec?: number;
    durationSec?: number;
    pauseBeforeRepeatSec?: number;
    forceScroll?: boolean;
}

export function Marquee({ 
    children, 
    speedPxPerSec = DEFAULT_MARQUEE_SPEED_PX_PER_SEC, 
    durationSec, 
    pauseBeforeRepeatSec = DEFAULT_PAUSE_BEFORE_REPEAT_SEC,
    forceScroll = false
}: MarqueeProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const contentRef = useRef<HTMLDivElement>(null);
    const [isOverflowing, setIsOverflowing] = useState(false);
    const [contentWidth, setContentWidth] = useState(0);
    const [containerWidth, setContainerWidth] = useState(0);
    const [uniqueId] = useState(() => `marquee-${Math.random().toString(36).substring(2, 9)}`);

    // 检查是否需要滚动
    useEffect(() => {
        const checkOverflow = () => {
            if (!containerRef.current || !contentRef.current) return;
            
            // 获取容器宽度
            const newContainerWidth = containerRef.current.clientWidth;
            
            // 这里改用 scrollWidth 而不是复杂的计算
            const newContentWidth = contentRef.current.scrollWidth;
            
            setContainerWidth(newContainerWidth);
            setContentWidth(newContentWidth);
            setIsOverflowing(forceScroll || newContentWidth > newContainerWidth);
        };
        
        // 首次检查
        checkOverflow();
        
        // 设置短暂延迟再次检查，以防内容延迟渲染
        const timeoutId = setTimeout(checkOverflow, 100);
        
        // 设置调整大小时的处理
        const resizeObserver = new ResizeObserver(checkOverflow);
        if (containerRef.current) {
            resizeObserver.observe(containerRef.current);
        }
        if (contentRef.current) {
            resizeObserver.observe(contentRef.current);
        }
        
        return () => {
            clearTimeout(timeoutId);
            resizeObserver.disconnect();
        };
    }, [children, forceScroll]);

    // 创建动画样式
    useEffect(() => {
        if (!isOverflowing || contentWidth === 0) return;
        
        // 计算动画参数
        let scrollDuration: number;
        if (durationSec !== undefined) {
            scrollDuration = durationSec;
        } else {
            scrollDuration = contentWidth / speedPxPerSec;
        }
        
        const totalDuration = scrollDuration + pauseBeforeRepeatSec;
        const pausePercent = (pauseBeforeRepeatSec / totalDuration) * 100;
        
        // 创建CSS动画
        const styleEl = document.createElement('style');
        styleEl.innerHTML = `
            @keyframes ${uniqueId} {
                0%, ${pausePercent}% {
                    transform: translateX(0);
                }
                100% {
                    transform: translateX(calc(-${contentWidth}px - 20px));
                }
            }
        `;
        document.head.appendChild(styleEl);
        
        // 应用动画
        const contentElement = contentRef.current;
        if (contentElement) {
            contentElement.style.animation = `${uniqueId} ${totalDuration}s linear infinite`;
        }
        
        return () => {
            styleEl.remove();
            if (contentElement) {
                contentElement.style.animation = 'none';
            }
        };
    }, [isOverflowing, contentWidth, containerWidth, speedPxPerSec, durationSec, pauseBeforeRepeatSec, uniqueId]);

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
                    paddingRight: isOverflowing ? "20px" : "0"
                }}
            >
                {children}
                {isOverflowing && <span style={{ opacity: 0 }}>-</span>}
            </div>
        </div>
    );
}