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