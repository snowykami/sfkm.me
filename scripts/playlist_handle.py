import asyncio
import base64
from dataclasses import dataclass
from typing import Literal
from urllib.parse import unquote, quote
import aiofiles
import os
import httpx
from pydantic import BaseModel
import json
import time


SOURCES_PATH = "./data/playlists"
TARGET_PATH = "./data/musics.json"

class ResolvedSong(BaseModel):
    title: str
    artist: str = ""
    album: str = ""
    lrc: str = ""
    src: str = ""
    cover: str = ""
    offset: int = 0
    source: Literal["ncm", "qq"] = "ncm"
    albumLink: str = ""
    artistLink: str = ""
    songLink: str = ""
    alias: list[str] = []
    quality: str = ""
    id: str = ""

async def fetch_lyric_from_ncm(song: ResolvedSong, max_retries: int = 5, base_delay: float = 0.5) -> str:
    url = f"https://music.163.com/api/song/media?id={song.id}"
    for attempt in range(max_retries):
        async with httpx.AsyncClient() as client:
            try:
                response = await client.get(url)
                if response.status_code == 200:
                    data = response.json()
                    lyric = data.get("lyric", "")
                    nolyric = data.get("nolyric", False)
                    if nolyric:
                        lyric = "[00:00.00]music.pure"
                    if lyric or nolyric:
                        return lyric
                # 状态码异常或没有歌词且 nolyric 不为 True 时重试
            except Exception:
                pass
        await asyncio.sleep(base_delay * (2 ** attempt))
    return ""


async def main():
    existing_data: list[ResolvedSong] = []
    async with aiofiles.open(TARGET_PATH, 'r', encoding='utf-8') as f:
        content = await f.read()
        existing_data = [ResolvedSong(**i) for i in json.loads(content)]
        existing_ids = [song.id for song in existing_data]

    for file in os.listdir(SOURCES_PATH):
        if file.endswith(".json"):
            async with aiofiles.open(os.path.join(SOURCES_PATH, file), 'r', encoding='utf-8') as f:
                content = await f.read()
                json_data = json.loads(content)
                resolved_songs: list[ResolvedSong] = []
                count = 0
                for song in json_data["playlist"]["tracks"]:
                    try:
                        cached = False
                        if str(song.get("id", "")) in existing_ids:
                            cached = True
                            resolved_song = existing_data[existing_ids.index(str(song.get("id", "")))]
                        else:
                            resolved_song = ResolvedSong(
                                title=song.get("name", ""),
                                artist=",".join(artist["name"] for artist in song.get("ar", [])),
                                album=song.get("al", {}).get("name", ""),
                                alias=song.get("alia", []),
                                cover=song.get("al", {}).get("picUrl", ""),
                                songLink=f"https://music.163.com/#/song?id={song.get('id', '')}",
                                source="ncm",
                                id=str(song.get("id", ""))
                            )
                            resolved_song.src = f"https://cdn.liteyuki.org/snowykami/music/{quote(resolved_song.artist)}%20-%20{quote(resolved_song.title)}.mp3"
                            resolved_song.lrc = await fetch_lyric_from_ncm(resolved_song)
                        resolved_songs.append(resolved_song)
                        count += 1
                        print(f"Resolved: {count} - {"cached" if cached else "added"} - {resolved_song.title}")
                    except Exception as e:
                        print(f"Error resolving song {song.get('id', '')}: {e}")
                async with aiofiles.open(TARGET_PATH, 'w', encoding='utf-8') as f:
                    await f.write(json.dumps([song.model_dump() for song in resolved_songs], ensure_ascii=False, indent=4))

if __name__ == "__main__":
    asyncio.run(main())