"use client";

import React, { useState, useEffect, useRef } from "react";
import { AppProps } from "../BaseApp";
import { t } from "i18next";

export const WINDOW_ID = "traceroute";

interface HopResult {
    hop: number;
    addr: string | null;
    hostname: string | null;
    rtt: number | null;
    status: string;
    timestamp: number;
}

interface TracerouteResponse {
    id: string;
    destination: string;
    max_hops: number;
    timeout: number;
    status: string;
    completed: boolean;
    hops: HopResult[];
}

export default function Traceroute({ }: AppProps) {
    const [destination, setDestination] = useState<string>("");
    const [apiUrl, setApiUrl] = useState<string>("");
    const [apiToken, setApiToken] = useState<string>("");
    const [maxHops, setMaxHops] = useState<number>(30);
    const [timeout, setTimeout] = useState<number>(1.0);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [traceId, setTraceId] = useState<string | null>(null);
    const [results, setResults] = useState<HopResult[]>([]);
    const [completed, setCompleted] = useState<boolean>(false);
    const [saveSettings, setSaveSettings] = useState<boolean>(true);

    const eventSourceRef = useRef<EventSource | null>(null);
    const resultsContainerRef = useRef<HTMLDivElement>(null);

    // 从本地存储加载设置
    useEffect(() => {
        const savedApiUrl = localStorage.getItem("traceroute_api_url");
        const savedApiToken = localStorage.getItem("traceroute_api_token");
        const savedMaxHops = localStorage.getItem("traceroute_max_hops");
        const savedTimeout = localStorage.getItem("traceroute_timeout");

        if (savedApiUrl) setApiUrl(savedApiUrl);
        if (savedApiToken) setApiToken(savedApiToken);
        if (savedMaxHops) setMaxHops(parseInt(savedMaxHops));
        if (savedTimeout) setTimeout(parseFloat(savedTimeout));
    }, []);

    // 保存设置到本地存储
    const saveSettingsToLocalStorage = () => {
        if (saveSettings) {
            localStorage.setItem("traceroute_api_url", apiUrl);
            localStorage.setItem("traceroute_api_token", apiToken);
            localStorage.setItem("traceroute_max_hops", maxHops.toString());
            localStorage.setItem("traceroute_timeout", timeout.toString());
        }
    };

    // 开始 traceroute
    const startTraceroute = async () => {
        // 参数验证
        if (!destination) {
            setError("请输入目标 IP 或域名");
            return;
        }

        if (!apiUrl) {
            setError("请输入 Traceroute API 地址");
            return;
        }

        if (!apiToken) {
            setError("请输入 Traceroute API 令牌");
            return;
        }

        // 保存设置
        saveSettingsToLocalStorage();

        // 重置状态
        setError(null);
        setTraceId(null);
        setResults([]);
        setCompleted(false);
        setLoading(true);

        try {
            // 请求 traceroute 开始
            const response = await fetch(`${apiUrl}/traceroute?token=${apiToken}`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    destination,
                    max_hops: maxHops,
                    timeout,
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || "请求失败");
            }

            const data: TracerouteResponse = await response.json();
            setTraceId(data.id);

            // 使用 SSE 接收实时结果
            startEventSource(data.id);
        } catch (err) {
            setError(err instanceof Error ? err.message : "发生未知错误");
            setLoading(false);
        }
    };

    // 启动 EventSource 来接收实时更新
    const startEventSource = (id: string) => {
        // 关闭之前的连接
        if (eventSourceRef.current) {
            eventSourceRef.current.close();
        }

        const es = new EventSource(`${apiUrl}/traceroute/${id}/stream`);
        eventSourceRef.current = es;

        es.onmessage = (event) => {
            const data = JSON.parse(event.data);

            if (data.completed !== undefined) {
                // 完成消息
                setCompleted(true);
                setLoading(false);
                es.close();
            } else {
                // 常规跳点数据
                setResults((prev) => {
                    // 检查是否已存在相同的跳点
                    const exists = prev.some(hop => hop.hop === data.hop);
                    if (exists) {
                        return prev.map(hop => hop.hop === data.hop ? data : hop);
                    } else {
                        return [...prev, data];
                    }
                });
            }
        };

        es.onerror = () => {
            setError("数据流连接错误");
            setLoading(false);
            es.close();
        };

        es.addEventListener("close", () => {
            setLoading(false);
        });
    };

    // 组件卸载时关闭 EventSource
    useEffect(() => {
        return () => {
            if (eventSourceRef.current) {
                eventSourceRef.current.close();
            }
        };
    }, []);

    // 停止追踪
    const stopTraceroute = () => {
        // 关闭 EventSource 连接
        if (eventSourceRef.current) {
            eventSourceRef.current.close();
            eventSourceRef.current = null;
        }

        // 更新状态
        setLoading(false);
        setCompleted(true);
        setError("追踪已手动停止");
    };

    return (
        <div className="flex flex-col h-full p-4 overflow-hidden">
            <h1 className="text-2xl font-bold mb-4">{t("traceroute.title", "Traceroute 工具")}</h1>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                {/* 目标输入 */}
                <div className="flex flex-col">
                    <label htmlFor="destination" className="mb-1 font-medium">
                        目标 IP 或域名
                    </label>
                    <input
                        id="destination"
                        type="text"
                        value={destination}
                        onChange={(e) => setDestination(e.target.value)}
                        placeholder="例如: google.com 或 8.8.8.8"
                        className="border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-600"
                    />
                </div>

                {/* API 设置 */}
                <div className="flex flex-col">
                    <label htmlFor="apiUrl" className="mb-1 font-medium">
                        Traceroute API 地址
                    </label>
                    <input
                        id="apiUrl"
                        type="text"
                        value={apiUrl}
                        onChange={(e) => setApiUrl(e.target.value)}
                        placeholder="例如: https://api.example.com"
                        className="border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-600"
                    />
                </div>

                <div className="flex flex-col">
                    <label htmlFor="apiToken" className="mb-1 font-medium">
                        API 令牌
                    </label>
                    <input
                        id="apiToken"
                        type="password"
                        value={apiToken}
                        onChange={(e) => setApiToken(e.target.value)}
                        placeholder="API 令牌"
                        className="border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-600"
                    />
                </div>

                {/* 高级设置 */}
                <div className="flex flex-col">
                    <div className="flex justify-between">
                        <label htmlFor="maxHops" className="mb-1 font-medium">
                            最大跳数
                        </label>
                        <span>{maxHops}</span>
                    </div>
                    <input
                        id="maxHops"
                        type="range"
                        min="5"
                        max="50"
                        value={maxHops}
                        onChange={(e) => setMaxHops(parseInt(e.target.value))}
                        className="w-full"
                    />
                </div>

                <div className="flex flex-col">
                    <div className="flex justify-between">
                        <label htmlFor="timeout" className="mb-1 font-medium">
                            超时 (秒)
                        </label>
                        <span>{timeout.toFixed(1)}</span>
                    </div>
                    <input
                        id="timeout"
                        type="range"
                        min="0.5"
                        max="5"
                        step="0.1"
                        value={timeout}
                        onChange={(e) => setTimeout(parseFloat(e.target.value))}
                        className="w-full"
                    />
                </div>
            </div>

            {/* 保存设置复选框 */}
            <div className="flex items-center mb-4">
                <input
                    id="saveSettings"
                    type="checkbox"
                    checked={saveSettings}
                    onChange={(e) => setSaveSettings(e.target.checked)}
                    className="mr-2"
                />
                <label htmlFor="saveSettings">保存设置</label>
            </div>

            {/* 错误消息 */}
            {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded mb-4 dark:bg-red-900 dark:text-red-100">
                    {error}
                </div>
            )}

            {/* 按钮区域 */}
            <div className="flex space-x-4 mb-4">
                <button
                    onClick={startTraceroute}
                    disabled={loading}
                    className={`px-4 py-2 rounded font-medium ${loading
                        ? "bg-gray-300 cursor-not-allowed dark:bg-gray-700"
                        : "bg-blue-500 hover:bg-blue-600 text-white dark:bg-blue-600 dark:hover:bg-blue-700"
                        }`}
                >
                    {loading ? "追踪中..." : "开始追踪"}
                </button>

                {loading && (
                    <button
                        onClick={stopTraceroute}
                        className="px-4 py-2 rounded font-medium bg-red-500 hover:bg-red-600 text-white dark:bg-red-600 dark:hover:bg-red-700"
                    >
                        停止追踪
                    </button>
                )}
            </div>

            {/* 结果显示 */}
            {traceId && (
                <div className="mt-4 flex-1 flex flex-col min-h-0">
                    <div className="text-sm text-gray-500 mb-2 dark:text-gray-400">
                        追踪 ID: {traceId}
                        {completed && <span className="ml-2 text-green-500">(已完成)</span>}
                    </div>

                    <div 
                        ref={resultsContainerRef}
                        className="border rounded flex-1 overflow-auto dark:border-gray-600"
                        style={{ overflowY: 'auto' }}
                    >
                        <table className="w-full table-fixed">
                            <thead className="sticky top-0 bg-white dark:bg-gray-800 z-10">
                                <tr className="border-b dark:border-gray-600">
                                    <th className="text-left py-2 px-2 w-12">跳点</th>
                                    <th className="text-left py-2 px-2">IP 地址</th>
                                    <th className="text-left py-2 px-2">主机名</th>
                                    <th className="text-left py-2 px-2 w-28">响应时间</th>
                                    <th className="text-left py-2 px-2 w-28">状态</th>
                                </tr>
                            </thead>
                            <tbody>
                                {results.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="py-4 text-center text-gray-500 dark:text-gray-400">
                                            {loading ? "等待数据..." : "没有结果"}
                                        </td>
                                    </tr>
                                ) : (
                                    results
                                        .sort((a, b) => a.hop - b.hop)
                                        .map((hop) => (
                                            <tr key={hop.hop} className="border-b dark:border-gray-700">
                                                <td className="py-2 px-2">{hop.hop}</td>
                                                <td className="py-2 px-2 font-mono text-sm truncate">
                                                    {hop.addr || '*'}
                                                </td>
                                                <td className="py-2 px-2 font-mono text-sm truncate">
                                                    {(hop.hostname && hop.hostname !== "未知")
                                                        ? hop.hostname
                                                        : hop.addr ? '-' : '*'}
                                                </td>
                                                <td className="py-2 px-2 font-mono text-sm">
                                                    {hop.rtt !== null ? `${hop.rtt.toFixed(2)}ms` : '*'}
                                                </td>
                                                <td className="py-2 px-2 font-mono text-sm truncate">
                                                    {hop.status || '超时'}
                                                </td>
                                            </tr>
                                        ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}