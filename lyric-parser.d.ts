declare module "lyric-parser" {
  interface LyricLine {
    time: number;
    lineNum: number;
    lineText: string;
    txt: string;
  }

  type Callback = (line: LyricLine) => void;

  export default class LyricParser {
    constructor(lrc: string, callback: Callback);
    lines: LyricLine[];
    time: number;
    currentLine: number;
    seek(time: number): void;
  }
}