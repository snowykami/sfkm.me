"use client"

import React, { useEffect, useRef, useState, useCallback } from "react"
import { useAudio } from '@/contexts/AudioContext'

export default function CircularAudioVisualizer() {
    // 使用全局音频上下文
    const { audioRef, isPlaying } = useAudio()
    const canvasRef = useRef<HTMLCanvasElement | null>(null)
    const animationRef = useRef<number | null>(null)
    const audioCtxRef = useRef<AudioContext | null>(null)
    const analyserRef = useRef<AnalyserNode | null>(null)
    const sourceRef = useRef<MediaElementAudioSourceNode | null>(null)
    const isSetupRef = useRef(false)
    const [isReady, setIsReady] = useState(false)

    // 调试辅助函数
    const logState = useCallback((message: string) => {
        console.log(`[AudioViz] ${message} | 播放状态:${isPlaying} | 初始化:${isSetupRef.current} | Ready:${isReady}`)
    }, [isPlaying, isReady])

    // 处理音频元素变化，确保正确初始化
    useEffect(() => {
        if (!audioRef.current) {
            logState("无音频元素")
            return
        }

        // 保存当前的音频引用，用于清理函数
        const audio = audioRef.current

        logState("音频元素已就绪，准备初始化")

        // 创建音频上下文
        const initAudioContext = () => {
            if (isSetupRef.current) {
                logState("已经初始化过，跳过")
                return
            }

            try {
                logState("开始初始化音频上下文")
                const AudioContextClass = window.AudioContext ||
                    (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext

                if (!AudioContextClass) {
                    console.error("[AudioViz] 浏览器不支持 AudioContext")
                    return
                }

                // 创建新的音频上下文
                audioCtxRef.current = new AudioContextClass()

                // 创建分析器
                const analyser = audioCtxRef.current.createAnalyser()
                analyser.fftSize = 128
                analyser.smoothingTimeConstant = 0.85
                analyserRef.current = analyser

                // 连接音频源 - 关键部分
                try {
                    if (!audio) {
                        logState("音频元素不存在，无法创建源")
                        return
                    }

                    logState(`尝试创建音频源 | 音频状态: ${audio.readyState}`)
                    sourceRef.current = audioCtxRef.current.createMediaElementSource(audio)
                    sourceRef.current.connect(analyser)
                    analyser.connect(audioCtxRef.current.destination)

                    isSetupRef.current = true
                    setIsReady(true)
                    logState("✅ 音频可视化器初始化成功")
                } catch (error) {
                    console.error("[AudioViz] 连接音频源失败:", error)

                    // 当发生错误时，尝试延迟重试一次
                    setTimeout(() => {
                        if (!isSetupRef.current && audioRef.current) {
                            try {
                                logState("重试连接音频源")
                                sourceRef.current = audioCtxRef.current!.createMediaElementSource(audioRef.current)
                                sourceRef.current.connect(analyser)
                                analyser.connect(audioCtxRef.current!.destination)
                                isSetupRef.current = true
                                setIsReady(true)
                                logState("✅ 重试连接成功")
                            } catch (retryError) {
                                console.error("[AudioViz] 重试连接失败:", retryError)
                            }
                        }
                    }, 1000)
                }
            } catch (error) {
                console.error("[AudioViz] 初始化音频上下文失败:", error)
            }
        }

        // 当音频元素加载完成或播放开始时尝试初始化
        const handleCanPlay = () => {
            logState("音频可以播放，尝试初始化")
            initAudioContext()
        }

        const handlePlay = () => {
            logState("音频开始播放")
            initAudioContext()

            // 确保 AudioContext 已恢复
            if (audioCtxRef.current?.state === "suspended") {
                audioCtxRef.current.resume().then(() => {
                    logState("AudioContext 已恢复")
                })
            }
        }

        // 监听音频事件
        audio.addEventListener('canplay', handleCanPlay)
        audio.addEventListener('play', handlePlay)

        // 立即尝试初始化一次
        initAudioContext()

        // 用户交互时恢复 AudioContext
        const resumeContext = () => {
            if (audioCtxRef.current?.state === "suspended") {
                audioCtxRef.current.resume().then(() => {
                    logState("通过用户交互恢复 AudioContext")
                })
            }
        }

        window.addEventListener("click", resumeContext)
        window.addEventListener("touchstart", resumeContext)

        return () => {
            audio.removeEventListener('canplay', handleCanPlay)
            audio.removeEventListener('play', handlePlay)
            window.removeEventListener("click", resumeContext)
            window.removeEventListener("touchstart", resumeContext)
        }
    }, [audioRef, logState]) // 正确添加依赖项

    // 强制重新初始化的机制
    useEffect(() => {
        const forceReinitialize = () => {
            logState("强制重新初始化")
            isSetupRef.current = false

            // 清理旧的连接
            if (sourceRef.current) {
                try {
                    sourceRef.current.disconnect()
                } catch {
                    // 忽略断开连接错误
                }
            }

            if (analyserRef.current) {
                try {
                    analyserRef.current.disconnect()
                } catch {
                    // 忽略断开连接错误
                }
            }

            if (audioCtxRef.current) {
                try {
                    audioCtxRef.current.close()
                } catch {
                    // 忽略关闭错误
                }
                audioCtxRef.current = null
            }

            setIsReady(false)
            sourceRef.current = null
            analyserRef.current = null

            // 在下一个事件循环中尝试重新初始化
            setTimeout(() => {
                if (audioRef.current) {
                    const AudioContextClass = window.AudioContext ||
                        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext

                    audioCtxRef.current = new AudioContextClass()
                    const analyser = audioCtxRef.current.createAnalyser()
                    analyser.fftSize = 128
                    analyser.smoothingTimeConstant = 0.85
                    analyserRef.current = analyser

                    try {
                        sourceRef.current = audioCtxRef.current.createMediaElementSource(audioRef.current)
                        sourceRef.current.connect(analyser)
                        analyser.connect(audioCtxRef.current.destination)
                        isSetupRef.current = true
                        setIsReady(true)
                        logState("✅ 强制重新初始化成功")
                    } catch (error) {
                        console.error("[AudioViz] 强制重新初始化失败:", error)
                    }
                }
            }, 100)
        }

        // 创建自定义事件来触发重新初始化
        window.addEventListener('reinitializeAudioVisualizer', forceReinitialize)

        return () => {
            window.removeEventListener('reinitializeAudioVisualizer', forceReinitialize)
        }
    }, [audioRef, logState]) // 添加依赖项

    // 绘制圆环可视化
    useEffect(() => {
        logState(`尝试渲染可视化 | 分析器就绪: ${!!analyserRef.current} | Canvas就绪: ${!!canvasRef.current}`)

        // 如果没有初始化完成或没有播放，不进行渲染
        if (!analyserRef.current || !canvasRef.current || !isPlaying || !isReady) {
            // 如果有动画正在进行，取消它
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current)
                animationRef.current = null
                logState("取消动画")
            }
            return
        }

        const analyser = analyserRef.current
        const canvas = canvasRef.current
        const ctx = canvas.getContext('2d')
        if (!ctx) {
            console.error("[AudioViz] 无法获取 Canvas 上下文")
            return
        }

        const bufferLength = analyser.frequencyBinCount
        const dataArray = new Uint8Array(bufferLength)

        logState(`开始渲染可视化 | 频率数: ${bufferLength}`)

        // 设置画布尺寸
        // 设置画布尺寸 - 修改此函数
        const setCanvasSize = () => {
            const container = canvas.parentElement
            if (container) {
                // 取容器宽度和高度的最小值，确保是正方形
                const size = Math.min(container.offsetWidth, container.offsetHeight)

                // 设置canvas元素的宽高属性（这控制实际绘图表面）
                canvas.width = size
                canvas.height = size

                // 修改Canvas的CSS样式以确保居中显示
                canvas.style.width = `${size}px`
                canvas.style.height = `${size}px`
                canvas.style.position = 'absolute'

                // 居中显示在父容器中
                const leftOffset = (container.offsetWidth - size) / 2
                const topOffset = (container.offsetHeight - size) / 2
                canvas.style.left = `${leftOffset}px`
                canvas.style.top = `${topOffset}px`

                logState(`设置画布尺寸: ${size}x${size}, 居中偏移: 左${leftOffset}px 上${topOffset}px`)
            } else {
                // 使用默认尺寸
                canvas.width = 300
                canvas.height = 300
                logState(`使用默认画布尺寸: 300x300`)
            }
        }
        setCanvasSize()

        // 监听窗口大小变化
        window.addEventListener('resize', setCanvasSize)

        // 绘制圆环
        function draw() {
            if (!ctx || !canvas || !analyser) return

            // 获取频率数据
            analyser.getByteFrequencyData(dataArray)

            // 清除画布
            ctx.clearRect(0, 0, canvas.width, canvas.height)

            // 设置圆环参数
            const centerX = canvas.width / 2
            const centerY = canvas.height / 2
            const maxRadius = Math.min(centerX, centerY) * 0.9
            const minRadius = maxRadius * 0.4 // 内圆半径

            // 绘制背景圆
            ctx.beginPath()
            ctx.arc(centerX, centerY, minRadius, 0, Math.PI * 2)
            ctx.fillStyle = 'rgba(60, 60, 70, 0.1)'
            ctx.fill()

            // 绘制频谱圆环
            for (let i = 0; i < bufferLength; i++) {
                // 计算角度
                const angle = (i / bufferLength) * Math.PI * 2

                // 计算半径 (基于频率值)
                const value = dataArray[i] / 255 // 归一化到 0-1
                const radius = minRadius + (maxRadius - minRadius) * Math.min(0.1 + value * 0.9, 1)

                // 计算坐标
                const x = centerX + Math.cos(angle) * radius
                const y = centerY + Math.sin(angle) * radius

                // 计算颜色 (蓝色到紫色渐变)
                const hue = 200 + (value * 80)
                const lightness = 50 + (value * 20)

                // 绘制线段 (从内圆到频谱点)
                ctx.beginPath()
                ctx.moveTo(
                    centerX + Math.cos(angle) * minRadius,
                    centerY + Math.sin(angle) * minRadius
                )
                ctx.lineTo(x, y)
                ctx.strokeStyle = `hsla(${hue}, 80%, ${lightness}%, ${0.4 + value * 0.6})`
                ctx.lineWidth = 2 + value * 3
                ctx.stroke()

                // 在频谱点绘制小圆点
                if (i % 4 === 0) {  // 每隔几个点绘制一次，避免过于密集
                    ctx.beginPath()
                    ctx.arc(x, y, 2 + value * 3, 0, Math.PI * 2)
                    ctx.fillStyle = `hsla(${hue}, 90%, ${lightness + 10}%, ${0.7 + value * 0.3})`
                    ctx.fill()
                }
            }

            // 绘制外圆环 (装饰性)
            ctx.beginPath()
            ctx.arc(centerX, centerY, maxRadius, 0, Math.PI * 2)
            ctx.strokeStyle = 'rgba(100, 120, 255, 0.15)'
            ctx.lineWidth = 2
            ctx.stroke()

            // 继续动画
            animationRef.current = requestAnimationFrame(draw)
        }

        // 开始动画
        draw()
        logState("✅ 开始动画")

        return () => {
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current)
                logState("清理动画")
            }
            window.removeEventListener('resize', setCanvasSize)
        }
    }, [isPlaying, isReady, logState]) // 添加依赖项

    return (
        <canvas
            ref={canvasRef}
            style={{
                // 不要设置 width 和 height 为100%，这会导致变形
                // 而是让setCanvasSize函数动态设置大小和位置
                position: 'absolute',
                zIndex: 0,
                pointerEvents: 'none',
                opacity: isPlaying && isReady ? 0.9 : 0,
                transition: 'opacity 0.5s ease-in-out'
            }}
        />
    )
}