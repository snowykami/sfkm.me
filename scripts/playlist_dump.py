import asyncio
import base64
from typing import Literal
from urllib.parse import unquote
import aiofiles
import os
import httpx
from pydantic import BaseModel
import json
import time

SOURCES_PATH = "./data/playlists"
TARGET_PATH = "./data/musics.json"
# 并发限制，防止API过载
MAX_CONCURRENT_REQUESTS = 5
# 请求间隔（秒）
REQUEST_DELAY = 0.5

# 手动包直接解析playlist为列表，抓包在网易云是{}，qq音乐暂时没法抓，只能手动
# 这里存放一些手动覆写数据，例如某首歌没有歌词时，可以在这里添加其他来源的歌词，以及歌词偏移量
# https://interface.music.163.com/weapi/v6/playlist/detail?csrf_token=f285f8518c521fddc048480b0ad713d7
PREDATA = {
    "16877261721": {
        "lrcmid": "16877261721",
        "offset": 0,
    },
    "1969519579": {
        "lrcmid": "1996929972",
    },
}


class Song(BaseModel):
    title: str = ""
    artist: str = ""  # name
    album: str = ""  # url
    lrc: str = ""
    src: str = ""  # 添加src字段用于音频URL
    cover: str = ""  # url
    offset: int = 0
    source: str = ""
    albumLink: str = ""
    artistLink: str = ""
    songLink: str = ""
    quality: str = "high"  # 添加quality字段用于音质
    id: str = ""  # 添加id字段用于唯一标识


class SongInfo(BaseModel):
    id: str
    offset: int = 0
    lrcmid: str = ""
    source_type: str = ""


def base64_to_string(base64_str: str) -> str:
    """将Base64字符串转换为普通字符串，简化错误处理"""
    if not base64_str:
        return ""
    # 清理输入
    clean_base64 = "".join(c for c in base64_str if c.isalnum() or c in "+/=")
    try:
        # 主解码路径
        decoded_bytes = base64.b64decode(clean_base64)
        return unquote(decoded_bytes.decode("utf-8", errors="replace"))
    except Exception as e:
        # 单一备用路径，不再打印详细错误，简化日志
        try:
            # 尝试直接解码
            return base64.b64decode(clean_base64).decode("utf-8", errors="replace")
        except:
            # 如果所有尝试都失败，返回友好的错误信息
            return "[无法解析的歌词]"


async def fetch_lyric_from_ncm_official(mid: str) -> str | None:
    """从网易云音乐官方API获取歌词"""
    try:
        async with httpx.AsyncClient(
            timeout=10.0,
            headers={
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/70.0.3538.110 Safari/537.36"
            },
        ) as client:
            lrc_response = await client.get(
                f"https://ncm.api.liteyuki.org/api/song/media?id={mid}"
            )
            lrc_response.raise_for_status()
            lrc_data = json.loads(lrc_response.text)
            if lrc_data.get("nolyric", False):
                return "[00:00.00]music.pure"
            # 检查返回数据结构
            if "lyric" in lrc_data and lrc_data["lyric"]:
                return lrc_data["lyric"]  # 官方API直接返回文本，不需要base64解码
            return None
    except Exception as e:
        print(f"官方API调用出错: {mid} - {e}")
        return None


async def fetch_lyric_from_ncm_liteyuki(mid: str) -> str | None:
    """从liteyuki API获取网易云音乐歌词"""
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            lrc_response = await client.get(
                f"https://music.api.liteyuki.org/music/?action=netease&module=get_lyrc&mid={mid}"
            )
            lrc_response.raise_for_status()
            lrc_data = lrc_response.json()
            # 检查返回数据结构
            if not lrc_data.get("data") or not lrc_data["data"].get("lyric"):
                return None
            return base64_to_string(lrc_data["data"]["lyric"])
    except Exception as e:
        print(f"liteyuki API调用出错: {mid} - {e}")
        return None


async def fetch_lyric_from_ncm(
    mid: str,
    channel: Literal["liteyuki", "official", "both"] = "both",
    max_retries: int = 3,
) -> str:
    """从网易云音乐获取歌词，支持重试和多渠道

    Args:
        mid: 歌曲ID
        channel: 获取渠道，可选 "official"(官方)、"liteyuki"(第三方)或"both"(两者都尝试)，默认both
        max_retries: 最大重试次数，默认5次
    """
    # 优先尝试官方渠道
    if channel == "official" or channel == "both":
        retries = 0
        while retries <= max_retries:
            lrc = await fetch_lyric_from_ncm_official(mid)
            if lrc:
                return lrc

            if retries < max_retries:
                retries += 1
                wait_time = 1 * (2**retries)  # 指数退避策略
                # print(f"官方API歌词获取失败，第{retries}次重试 (等待{wait_time}秒): {mid}")
                await asyncio.sleep(wait_time)
            else:
                # print(f"官方API歌词获取失败，已达最大重试次数: {mid}")
                # 如果只使用官方渠道，则返回空；否则尝试liteyuki渠道
                if channel == "official":
                    return ""
                break  # 跳出循环，尝试liteyuki渠道

    # 如果官方渠道失败或者指定使用liteyuki渠道，则尝试liteyuki渠道
    if channel == "liteyuki" or channel == "both":
        retries = 0  # 重置重试次数
        while retries <= max_retries:
            lrc = await fetch_lyric_from_ncm_liteyuki(mid)
            if lrc:
                return lrc

            if retries < max_retries:
                retries += 1
                wait_time = 1 * (2**retries)  # 指数退避策略
                # print(f"liteyuki API歌词获取失败，第{retries}次重试 (等待{wait_time}秒): {mid}")
                await asyncio.sleep(wait_time)
            else:
                # print(f"liteyuki API歌词获取失败，已达最大重试次数: {mid}")
                return ""

    return ""


async def fetch_lyric_from_qq(mid: str) -> str:
    """从QQ音乐获取歌词"""
    async with httpx.AsyncClient() as client:
        try:
            lrc_response = await client.get(
                f"https://music.api.liteyuki.org/music/?action=qq&module=get_lyrc&mid={mid}"
            )
            lrc_response.raise_for_status()
            lrc_data = lrc_response.json()

            # 检查返回数据结构
            if not lrc_data.get("data") or not lrc_data["data"].get("lyric"):
                print(f"歌词数据结构不完整: {lrc_data}")
                return ""

            return base64_to_string(lrc_data["data"]["lyric"])
        except Exception as e:
            print(f"获取QQ音乐歌词出错: {e} {mid}")
            return ""


async def fetch_songs_from_ncm(
    mids: list[str],
    offset_map: dict[str, int] | None = None,
    lrcmid_map: dict[str, str] | None = None,
    max_retries: int = 3,
) -> list[Song]:
    """批量从网易云音乐获取歌曲信息，支持重试机制"""
    if not mids:
        return []

    offset_map = offset_map or {}
    lrcmid_map = lrcmid_map or {}

    print(f"Fetching {len(mids)} songs from NCM")
    mids_str = ",".join(mids)

    retries = 0
    last_error = None

    while retries <= max_retries:
        try:
            async with httpx.AsyncClient(
                timeout=60.0,
                headers={
                    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/70.0.3538.110 Safari/537.36"
                },
            ) as client:
                song_response = await client.get(
                    f"https://music.api.liteyuki.org/music/?action=netease&module=get_url&mids={mids_str}"
                )
                song_response.raise_for_status()
                song_data = song_response.json()

                if not song_data.get("data"):
                    if retries < max_retries:
                        retries += 1
                        wait_time = 1 * (2**retries)  # 指数退避策略
                        print(
                            f"获取歌曲信息失败: 数据为空，第{retries}次重试 (等待{wait_time}秒)"
                        )
                        await asyncio.sleep(wait_time)
                        continue
                    else:
                        print(f"获取歌曲信息失败: 数据为空 - {song_data}, {mids}")
                        return []

                songs = []

                # 创建任务列表获取歌词
                lyric_tasks = {}
                for mid in mids:
                    lyric_mid = lrcmid_map.get(mid, mid)
                    lyric_tasks[mid] = asyncio.create_task(
                        fetch_lyric_from_ncm(lyric_mid)
                    )

                # 创建歌曲对象列表
                for song_info in song_data["data"]:
                    mid = str(song_info.get("mid", ""))
                    if not mid or mid not in mids:
                        continue

                    # 检查是否有有效的音频源链接
                    src = song_info.get("url", "").replace("http://", "https://")
                    if not src:
                        print(
                            f"跳过没有音频源的歌曲: {song_info.get('song', 'Unknown')} (ID: {mid})"
                        )
                        continue

                    # 等待对应的歌词任务完成
                    lrc = ""
                    if mid in lyric_tasks:
                        try:
                            lrc = await lyric_tasks[mid]
                            if lrc == "":
                                print(
                                    f"可能是纯音乐: {song_info.get('song', 'Unknown')} - {song_info.get('singer', 'Unknown Artist')} (ID: {mid})"
                                )
                        except Exception as e:
                            print(f"获取歌词出错: {mid} - {e}")
                    if song_info.get("song") is None:
                        continue
                    song = Song(
                        title=song_info.get("song", "Unknown"),
                        album=song_info.get("album", "Unknown Album"),
                        artist=song_info.get("singer", "Unknown Artist"),
                        src=src,
                        lrc=lrc,
                        cover=song_info.get("cover", ""),
                        source="ncm",
                        songLink=song_info.get("link", ""),
                        offset=offset_map.get(mid, 0),
                        id=mid,
                    )
                    songs.append(song)

                return songs

        except Exception as e:
            last_error = e
            if retries < max_retries:
                retries += 1
                wait_time = 1 * (2**retries)  # 指数退避策略
                print(
                    f"批量获取网易云音乐歌曲信息出错，第{retries}次重试 (等待{wait_time}秒): {e}"
                )
                await asyncio.sleep(wait_time)
            else:
                print(f"批量获取网易云音乐歌曲信息出错，已达最大重试次数: {e}")
                return []

    print(f"批量获取网易云音乐歌曲信息失败: {last_error}")
    return []


async def fetch_songs_from_qqmusic(
    mids: list[str],
    offset_map: dict[str, int] | None = None,
    lrcmid_map: dict[str, str] | None = None,
    max_retries: int = 3,
) -> list[Song]:
    """批量从QQ音乐获取歌曲信息，支持重试机制"""
    if not mids:
        return []

    offset_map = offset_map or {}
    lrcmid_map = lrcmid_map or {}

    print(f"Fetching {len(mids)} songs from QQ Music")
    mids_str = ",".join(mids)

    retries = 0
    last_error = None

    while retries <= max_retries:
        try:
            async with httpx.AsyncClient(
                timeout=60.0,
                headers={
                    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/70.0.3538.110 Safari/537.36"
                },
            ) as client:
                song_response = await client.get(
                    f"https://music.api.liteyuki.org/music/?action=qq&module=get_url&mids={mids_str}"
                )
                song_response.raise_for_status()
                song_data = song_response.json()

                if not song_data.get("data"):
                    if retries < max_retries:
                        retries += 1
                        wait_time = 1 * (2**retries)  # 指数退避策略
                        print(
                            f"获取QQ音乐歌曲信息失败: 数据为空，第{retries}次重试 (等待{wait_time}秒)"
                        )
                        await asyncio.sleep(wait_time)
                        continue
                    else:
                        print(f"获取QQ音乐歌曲信息失败: 数据为空 - {song_data}")
                        return []

                songs = []

                # 创建任务列表获取歌词
                lyric_tasks = {}
                for mid in mids:
                    lyric_mid = lrcmid_map.get(mid, mid)
                    lyric_tasks[mid] = asyncio.create_task(
                        fetch_lyric_from_qq(lyric_mid)
                    )

                # 创建歌曲对象列表
                for song_info in song_data["data"]:
                    mid = str(song_info.get("mid", ""))
                    if not mid or mid not in mids:
                        continue

                    # 检查是否有有效的音频源链接
                    src = song_info.get("url", "").replace("http://", "https://")
                    if not src:
                        print(
                            f"跳过没有音频源的歌曲: {song_info.get('song', 'Unknown')} (ID: {mid})"
                        )
                        continue

                    # 等待对应的歌词任务完成
                    lrc = ""
                    if mid in lyric_tasks:
                        try:
                            lrc = await lyric_tasks[mid]
                            if lrc == "":
                                print(
                                    f"可能是纯音乐: {song_info.get('song', 'Unknown')} - {song_info.get('singer', 'Unknown Artist')} (ID: {mid})"
                                )
                        except Exception as e:
                            print(f"获取QQ音乐歌词出错: {mid} - {e}")

                    song = Song(
                        id=mid,
                        title=song_info.get("song", "Unknown"),
                        album=song_info.get("album", "Unknown Album"),
                        artist=song_info.get("singer", "Unknown Artist"),
                        src=src,
                        lrc=lrc,
                        cover=song_info.get("cover", ""),
                        source="qq",
                        songLink=song_info.get("link", ""),
                        offset=offset_map.get(mid, 0),
                    )
                    songs.append(song)

                return songs

        except Exception as e:
            last_error = e
            if retries < max_retries:
                retries += 1
                wait_time = 1 * (2**retries)  # 指数退避策略
                print(
                    f"批量获取QQ音乐歌曲信息出错，第{retries}次重试 (等待{wait_time}秒): {e}"
                )
                await asyncio.sleep(wait_time)
            else:
                print(f"批量获取QQ音乐歌曲信息出错，已达最大重试次数: {e}")
                return []

    print(f"批量获取QQ音乐歌曲信息失败: {last_error}")
    return []


async def process_chunk(
    songs_info: list[SongInfo], existing_song_ids: set[str], force: bool = False
) -> list[Song]:
    """处理一批歌曲信息"""
    # 首先过滤掉已存在的歌曲
    if not force:
        filtered_songs_info = []
        skipped_count = 0
        for song_info in songs_info:
            if song_info.id in existing_song_ids:
                print(f"跳过已存在的歌曲: {song_info.id}")
                skipped_count += 1
            else:
                filtered_songs_info.append(song_info)

        if skipped_count > 0:
            print(f"共跳过 {skipped_count} 首已存在歌曲")

        songs_info = filtered_songs_info

    # 如果所有歌曲都被过滤，直接返回空列表
    if not songs_info:
        return []

    # 按来源分组
    ncm_songs = []
    qq_songs = []

    ncm_mids = []
    qq_mids = []
    ncm_offsets = {}
    qq_offsets = {}
    ncm_lrcmids = {}
    qq_lrcmids = {}

    for song_info in songs_info:
        if song_info.source_type == "ncm":
            ncm_songs.append(song_info)
            ncm_mids.append(song_info.id)
            ncm_offsets[song_info.id] = song_info.offset
            if song_info.lrcmid:
                ncm_lrcmids[song_info.id] = song_info.lrcmid
        elif song_info.source_type == "qq":
            qq_songs.append(song_info)
            qq_mids.append(song_info.id)
            qq_offsets[song_info.id] = song_info.offset
            if song_info.lrcmid:
                qq_lrcmids[song_info.id] = song_info.lrcmid

    # 创建任务
    tasks = []
    if ncm_mids:
        tasks.append(fetch_songs_from_ncm(ncm_mids, ncm_offsets, ncm_lrcmids))
    if qq_mids:
        tasks.append(fetch_songs_from_qqmusic(qq_mids, qq_offsets, qq_lrcmids))

    # 并发执行任务
    results = await asyncio.gather(*tasks, return_exceptions=True)

    # 处理结果
    songs: list[Song] = []
    for result in results:
        if isinstance(result, Exception):
            print(f"获取歌曲失败: {result}")
        elif isinstance(result, list):
            songs.extend(result)
        else:
            print(f"未知类型的结果: {type(result)}，已跳过")

    return songs


async def download(force: bool = False, new_playlist: bool = False):
    """下载所有歌曲信息，支持并发处理"""
    start_time = time.time()

    # 读取现有歌曲
    existing_song_ids = set()
    existing_songs = []
    if not new_playlist:
        try:
            if os.path.exists(TARGET_PATH):
                async with aiofiles.open(TARGET_PATH, "r", encoding="utf-8") as f:
                    try:
                        existing_songs = json.loads(await f.read())
                        # 只保留有音频源的歌曲
                        valid_existing_songs = []
                        for song in existing_songs:
                            if song.get("src"):
                                valid_existing_songs.append(song)
                                existing_song_ids.add(song.get("id"))
                            else:
                                print(
                                    f"移除现有没有音频源的歌曲: {song.get('title', 'Unknown')} (ID: {song.get('id', 'Unknown')})"
                                )

                        existing_songs = valid_existing_songs
                        print(f"加载了 {len(existing_song_ids)} 首有效现有歌曲")
                    except json.JSONDecodeError:
                        print("现有歌曲文件解析失败，将创建新文件")
                        existing_songs = []
        except Exception as e:
            print(f"读取现有歌曲文件出错: {e}")
            existing_songs = []
    else:
        print("创建全新歌单，不保留现有歌曲")

    all_songs_info = []

    # 读取所有歌单文件
    if not os.path.exists(SOURCES_PATH):
        print(f"目录 {SOURCES_PATH} 不存在")
        return

    for filename in os.listdir(SOURCES_PATH):
        if not filename.endswith(".json"):
            continue

        file_path = os.path.join(SOURCES_PATH, filename)
        print(f"处理歌单文件: {filename}")

        try:
            async with aiofiles.open(file_path, "r", encoding="utf-8") as f:
                json_obj = json.loads(await f.read())
                source_type = json_obj.get("type", "")  # 可能是"ncm"或"qq"

                if not source_type:
                    print(f"歌单文件 {filename} 缺少类型信息，跳过")
                    continue

                for track in json_obj.get("playlist", {}).get("tracks", []):
                    track_id = str(track.get("id", ""))
                    if not track_id:
                        continue

                    # 从 PREDATA 或歌单数据中获取偏移量和歌词 ID
                    offset = track.get(
                        "offset", PREDATA.get(track_id, {}).get("offset", 0)
                    )
                    lrcmid = track.get(
                        "lrcmid", PREDATA.get(track_id, {}).get("lrcmid", "")
                    )

                    all_songs_info.append(
                        SongInfo(
                            id=track_id,
                            offset=offset,
                            lrcmid=lrcmid,
                            source_type=source_type,
                        )
                    )
        except Exception as e:
            print(f"处理歌单文件 {filename} 出错: {e}")

    print(f"共找到 {len(all_songs_info)} 首歌曲需要处理")

    # 分批处理，避免一次请求过多
    batch_size = 10
    all_songs: list[Song] = []
    semaphore = asyncio.Semaphore(MAX_CONCURRENT_REQUESTS)

    async def process_with_semaphore(chunk):
        async with semaphore:
            result = await process_chunk(chunk, existing_song_ids, force)
            # 添加延迟，避免API限流
            await asyncio.sleep(REQUEST_DELAY)
            return result

    # 创建任务列表
    tasks = []
    for i in range(0, len(all_songs_info), batch_size):
        chunk = all_songs_info[i : i + batch_size]
        tasks.append(process_with_semaphore(chunk))

    # 处理所有任务
    chunks_results = await asyncio.gather(*tasks)

    # 合并结果
    for chunk_songs in chunks_results:
        all_songs.extend(chunk_songs)

    # 保存结果
    if all_songs:
        # 合并新歌曲和现有歌曲
        combined_songs = []
        existing_song_dict = {
            song.get("id"): song for song in existing_songs if song.get("id")
        }

        # 添加新歌曲，不替换现有的同ID歌曲（除非使用force模式）
        skipped_count = 0
        replaced_count = 0
        for song in all_songs:
            # 确保新添加的歌曲有 src
            if not song.src:
                print(f"跳过没有音频源的新歌曲: {song.title} (ID: {song.id})")
                skipped_count += 1
                continue

            # 如果是强制模式，或者歌曲ID不在现有歌曲中，添加到合并列表
            song_dict = song.model_dump(by_alias=True)
            combined_songs.append(song_dict)

            # 如果是强制模式且歌曲已存在，从现有歌曲字典中删除，后面不会再添加
            if force and song.id in existing_song_dict:
                del existing_song_dict[song.id]
                replaced_count += 1

        # 添加剩余的现有歌曲（如果不是强制模式，所有现有歌曲都会保留）
        for song in existing_song_dict.values():
            combined_songs.append(song)

        # 保存到文件
        os.makedirs(os.path.dirname(TARGET_PATH), exist_ok=True)
        async with aiofiles.open(TARGET_PATH, "w", encoding="utf-8") as f:
            await f.write(json.dumps(combined_songs, ensure_ascii=False, indent=2))

        if force and replaced_count > 0:
            print(f"强制模式：替换了 {replaced_count} 首现有歌曲")

        print(
            f"共下载 {len(all_songs) - skipped_count} 首新歌曲（跳过 {skipped_count} 首无效歌曲），总共保存 {len(combined_songs)} 首歌曲"
        )
    else:
        print("没有下载任何新歌曲")

    elapsed_time = time.time() - start_time
    print(f"下载完成，耗时 {elapsed_time:.2f} 秒")


async def main():
    # 检测命令行参数
    force = False
    new_playlist = False

    for arg in os.sys.argv[1:]:
        if arg == "-f" or arg == "--force":
            force = True
            print("强制重新下载所有歌曲")
        elif arg == "-n" or arg == "--new":
            new_playlist = True
            print("创建全新歌单（不保留现有歌曲）")

    await download(force=force, new_playlist=new_playlist)


if __name__ == "__main__":
    asyncio.run(main())
