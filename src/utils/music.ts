import { Song } from "@/types/music"

type AnySongSource = {
    type: string
    id: string
    lrcmid?: string
    offset?: number
    lrc?: string
}

function base64ToString(base64: string): string {
    // 如果输入为空，直接返回空字符串
    if (!base64) return '';

    try {
        // 移除可能存在的换行符、空格等
        const cleanBase64 = base64.replace(/[\n\r\s]/g, '');

        // 确保是有效的 Base64 字符串
        const validBase64 = cleanBase64.replace(/[^A-Za-z0-9+/=]/g, '');

        // 标准方法
        return decodeURIComponent(escape(atob(validBase64)));
    } catch (error) {
        // 处理可能的解码错误
        console.error('Base64 decoding failed:', error);
        try {
            console.log("标准解码失败，尝试替代方法");
            // 移除可能存在的换行符、空格等
            const cleanBase64 = base64.replace(/[\n\r\s]/g, '');

            // 确保是有效的 Base64 字符串
            const validBase64 = cleanBase64.replace(/[^A-Za-z0-9+/=]/g, '');

            // 使用更健壮的方法处理 UTF-8 编码
            const binaryString = atob(validBase64);
            const bytes = new Uint8Array(binaryString.length);
            for (let i = 0; i < binaryString.length; i++) {
                bytes[i] = binaryString.charCodeAt(i);
            }
            return new TextDecoder('utf-8').decode(bytes);
        } catch (innerError) {
            console.error('Base64 decoding failed:', innerError);
            return '[无法解析的歌词]'; // 返回一个明确的错误提示
        }
    }
}

// 创建一个带有错误处理的获取歌词函数
async function fetchLyricFromNCM(mid: string): Promise<string> {
    const lrcResponse = await fetch(`https://ncm.api.liteyuki.org/api/song/media?id=${mid}`)
    if (!lrcResponse.ok) throw new Error("获取歌词失败")
    return await lrcResponse.json().then((data) => {
        // 检查返回数据结构
        return data.lyric
    })
}

async function fetchLyricFromQQ(mid: string): Promise<string> {
    try {
        const lrcResponse = await fetch(`https://music.api.liteyuki.org/music/?action=qq&module=get_lyrc&mid=${mid}`)
        if (!lrcResponse.ok) throw new Error("获取歌词失败: " + mid)
        const lrcData = await lrcResponse.json()
        // 检查返回数据结构
        if (!lrcData.data || !lrcData.data.lyric) {
            console.warn("歌词数据结构不完整:", lrcData);
            return "[歌词获取失败]";
        }
        return base64ToString(lrcData.data.lyric);
    } catch (error) {
        console.error("获取QQ音乐歌词出错:", error);
        return "[歌词获取失败]";
    }
}

// 优化后的网易云音乐获取函数
export async function fetchSongFromNCM(mid: string, offset: number = 0, lyricmid: string = ""): Promise<Song> {
    console.log(`Fetching song with mid: ${mid}, offset: ${offset}`)
    const songResponse = await fetch(`https://music.api.liteyuki.org/music/?action=netease&module=get_url&mids=${mid}`)
    if (!songResponse.ok) throw new Error("获取歌曲信息失败")
    const songData = await songResponse.json()

    return {
        title: songData.data[0].song || "Unknown",
        album: songData.data[0].album || "Unknown Album",
        artist: songData.data[0].singer || "Unknown Artist",
        src: songData.data[0].url.replace("http://", "https://"),
        // 延迟加载歌词 - 使用函数返回Promise
        lrc: fetchLyricFromNCM(lyricmid || mid),
        cover: songData.data[0].cover,
        source: "ncm",
        songLink: songData.data[0].link || "",
        id: mid,
        offset,
    }
}

// 优化后的QQ音乐获取函数
export async function fetchSongFromQQMusic(mid: string, offset: number = 0, lyricmid: string = ""): Promise<Song> {
    console.log(`Fetching song with mid: ${mid}, offset: ${offset}`)
    const songResponse = await fetch(`https://music.api.liteyuki.org/music/?action=qq&module=get_url&mids=${mid}`)
    if (!songResponse.ok) throw new Error("获取歌曲信息失败")
    const songData = await songResponse.json()

    return {
        title: songData.data[0].song || "Unknown",
        album: songData.data[0].album || "Unknown Album",
        artist: songData.data[0].singer || "Unknown Artist",
        src: songData.data[0].url.replace("http://", "https://"),
        // 延迟加载歌词 - 使用函数返回Promise
        lrc: fetchLyricFromQQ(lyricmid || mid),
        cover: songData.data[0].cover,
        songLink: songData.data[0].link || "",
        source: "qq",
        id: mid,
        offset,
    }
}


export async function fetchSongFromData(data: AnySongSource): Promise<Song> {
    if (data.type === "ncm") {
        return fetchSongFromNCM(data.id, data.offset, data.lrcmid)
    } else if (data.type == "qq") {
        return fetchSongFromQQMusic(data.id, data.offset, data.lrcmid)
    }
    else {
        throw new Error(`Unsupported song type: ${data.type}`)
    }
}

/**
 * 通用的带重试功能的请求函数
 * @param fetchFn 执行请求的函数
 * @param maxRetries 最大重试次数
 * @param retryDelay 重试间隔(ms)
 * @returns 返回请求结果
 */
async function fetchWithRetry<T>(
    fetchFn: () => Promise<T>,
    maxRetries: number = 10,
    retryDelay: number = 100 // 初始为0.2秒
): Promise<T> {
    let lastError: unknown;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
            return await fetchFn();
        } catch (error) {
            lastError = error;

            if (attempt === maxRetries) {
                console.error(`达到最大重试次数(${maxRetries})，请求失败:`, error);
                break;
            }

            console.warn(`请求失败，${retryDelay / 1000}秒后进行第${attempt + 1}次重试...`, error);

            await new Promise(resolve => setTimeout(resolve, retryDelay));

            // 指数退避：每次乘以1.2的幂
            retryDelay = Math.min(100 * Math.pow(1.2, attempt + 1), 10000);
        }
    }

    throw lastError;
}

/**
 * 创建一个带重试功能的懒加载网易云音乐 URL 的函数
 * @param mid 音乐ID
 * @returns 返回一个函数，调用该函数时才会请求实际的音乐URL
 */
export function fetchSongSrcFromNCM(mid: string): () => Promise<string> {
    return async () => {
        console.log(`[Music] 懒加载网易云音乐 URL: ${mid}`);

        // 第一个接口（不重试）
        const fetchFromYpm = async (): Promise<string> => {
            const response = await fetch(`https://ypm.liteyuki.org/api/song/url?id=${mid}`);
            if (!response.ok) throw new Error(`获取网易云音乐URL失败: HTTP ${response.status}`);
            const data = await response.json();
            if (!data || !data.data || !data.data[0] || !data.data[0].url) throw new Error('获取网易云音乐URL失败: 数据结构不完整');
            const url = data.data[0].url.replace("http://", "https://");
            if (!url || typeof url !== 'string' || !url.startsWith('http')) throw new Error(`无效的音频 URL: ${url}`);
            return url;
        };

        // 第二个接口（带重试）
        const fetchFromBackup = async (): Promise<string> => {
            const fetchUrl = async (): Promise<string> => {
                const response = await fetch(`https://music.api.liteyuki.org/music/?action=netease&module=get_url&mids=${mid}`);
                if (!response.ok) throw new Error(`备用接口获取网易云音乐URL失败: HTTP ${response.status}`);
                const data = await response.json();
                if (!data || !data.data || !data.data[0] || !data.data[0].url) throw new Error('备用接口获取网易云音乐URL失败: 数据结构不完整');
                const url = data.data[0].url.replace("http://", "https://");
                if (!url || typeof url !== 'string' || !url.startsWith('http')) throw new Error(`备用接口返回无效的音频 URL: ${url}`);
                return url;
            };
            return await fetchWithRetry(fetchUrl, 3, 1000);
        };

        try {
            // 只请求一次第一个接口
            const url = await fetchFromYpm();
            if (url.includes("music.126")) {
                console.log(`[Music] 网易云音乐URL加载成功: ${url.substring(0, 50)}...`);
                return url;
            } else {
                // url 不包含 music.126，立即用备用接口
                console.warn("[Music] 第一个接口返回的URL不包含 music.126，尝试备用接口");
                const backupUrl = await fetchFromBackup();
                console.log(`[Music] 网易云音乐URL(备用)加载成功: ${backupUrl.substring(0, 50)}...`);
                return backupUrl;
            }
        } catch (error) {
            // 第一个接口失败，直接用备用接口
            console.warn("[Music] 第一个接口失败，尝试备用接口", error);
            const backupUrl = await fetchFromBackup();
            console.log(`[Music] 网易云音乐URL(备用)加载成功: ${backupUrl.substring(0, 50)}...`);
            return backupUrl;
        }
    };
}

/**
 * 创建一个带重试功能的懒加载QQ音乐 URL 的函数
 * @param mid 音乐ID
 * @returns 返回一个函数，调用该函数时才会请求实际的音乐URL
 */
export function fetchSongSrcFromQQ(mid: string): () => Promise<string> {
    return async () => {
        console.log(`[Music] 懒加载QQ音乐 URL: ${mid}`);

        // 定义实际的请求函数
        const fetchUrl = async (): Promise<string> => {
            const response = await fetch(`https://music.api.liteyuki.org/music/?action=qq&module=get_url&mids=${mid}`);

            if (!response.ok) {
                throw new Error(`获取QQ音乐URL失败: HTTP ${response.status}`);
            }

            const data = await response.json();

            if (!data || !data.data || !data.data[0] || !data.data[0].url) {
                console.error("API返回数据结构不符合预期:", data);
                throw new Error('获取QQ音乐URL失败: 数据结构不完整');
            }

            // 确保使用 HTTPS URL
            const url = data.data[0].url.replace("http://", "https://");

            if (!url || typeof url !== 'string' || !url.startsWith('http')) {
                console.error("API返回的URL无效:", url);
                throw new Error(`无效的音频 URL: ${url}`);
            }

            return url;
        };

        try {
            // 使用重试函数执行请求
            const url = await fetchWithRetry(fetchUrl, 3, 1000);
            console.log(`[Music] QQ音乐URL加载成功: ${url.substring(0, 50)}...`);
            return url;
        } catch (error) {
            console.error(`[Music] 获取QQ音乐URL失败(所有重试均失败):`, error);
            throw error;
        }
    };
}