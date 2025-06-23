export interface CommandArg {
  args: string[]; // ["npm", "run", "dev"] 解析为 npm run dev
  flags: string[]; // ["h", "v"] 解析为 -h -v
  kwargs: Record<string, string>; // {port: "3000", verbose: ""}
  raw: string; // npm run dev -h --port=3000 --verbose
}

export function parseCommand(input: string): CommandArg {
  const args: string[] = [];
  const flags: string[] = [];
  const kwargs: Record<string, string> = {};
  const tokens = input.match(/(?:[^\s"]+|"[^"]*")+/g) || [];
  let i = 0;
  while (i < tokens.length) {
    const token = tokens[i];
    if (token.startsWith("--")) {
      // --foo=bar 或 --foo bar
      const eqIdx = token.indexOf("=");
      if (eqIdx > 2) {
        const key = token.slice(2, eqIdx);
        const value = token.slice(eqIdx + 1).replace(/^"|"$/g, "");
        kwargs[key] = value;
      } else {
        const key = token.slice(2);
        const value =
          tokens[i + 1] && !tokens[i + 1].startsWith("-")
            ? tokens[i + 1].replace(/^"|"$/g, "")
            : "";
        kwargs[key] = value;
        if (value) i++;
      }
    } else if (
      token.startsWith("-") &&
      token.length > 1 &&
      !token.startsWith("--")
    ) {
      // -abc 解析为 a, b, c
      for (let j = 1; j < token.length; j++) {
        flags.push(token[j]);
      }
    } else {
      args.push(token.replace(/^"|"$/g, ""));
    }
    i++;
  }
  return { args, flags, kwargs, raw: input };
}
