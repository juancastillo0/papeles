import fs from "fs";
import path from "path";
import readline from "readline";

function valsToString(vals: [string, string][]) {
  return vals
    .reduce<string[]>((p, [type, name]) => {
      return p.concat(
        `${name}${type}`,
        `${name}${type}Variables`,
        `${name}Document`
      );
    }, [])
    .join(",\n  ");
}

const codeConstants = {
  Imports: (vals: [string, string][]) => `
import { ApolloClient, MutationOptions } from "apollo-client";
import { NormalizedCacheObject } from "apollo-cache-inmemory";
import {${valsToString(vals)}
  } from "../generated/graphql";
  
type OtherOptions<T, K> = Omit<MutationOptions<T, K>, "mutation" | "variables">;\n`,

  Class: (className: string) => `
export class ${className} {
  constructor(public client: ApolloClient<NormalizedCacheObject>) {}`,

  Mutation: `
  mutate<T, K>(mutation: any) {
    return (variables: K, options: OtherOptions<T, K> = {}) =>
      this.client.mutate<T, K>({ mutation, variables, ...options });
  }`,
  Query: `
  query<T, K>(query: any) {
    return (variables: K, options: OtherOptions<T, K> = {}) =>
      this.client.query<T, K>({ query, variables, ...options });
  }`,
  Subscription: `
  subscribe<T, K>(query: any) {
    return (variables: K, options: OtherOptions<T, K> = {}) =>
      this.client.subscribe<T, K>({ query, variables, ...options });
  }`
};

const mapStringToFunction = {
  Mutation: "mutate",
  Subscription: "subscribe",
  Query: "query"
};

function cleanLine(line: string) {
  const type = line.split(" ")[0];
  return [
    type[0].toUpperCase() + type.substring(1),
    line
      .split(" ")[1]!
      .split("(")[0]
      .split("{")[0]
  ];
}

function processDir(dir: string) {
  const readInterface = readline.createInterface({
    input: fs.createReadStream(dir),
    output: process.stdout,
    terminal: false
  });

  const haveLines: { [key: string]: boolean } = {
    Mutation: false,
    Subscription: false,
    Query: false
  };
  const lines: [string, string][] = [];

  readInterface.on("line", _line => {
    const line = _line.trim();
    if (
      Object.keys(mapStringToFunction).some(
        v => line.indexOf(v.toLowerCase()) === 0
      )
    ) {
      const [type, name] = cleanLine(line);
      haveLines[type as keyof typeof mapStringToFunction] = true;
      lines.push([type, name]);
    }
  });

  const dirs = dir.split("\\");
  const dirName = dirs[dirs.length - 2];
  const className = dirName[0].toUpperCase() + dirName.substring(1) + "Api";

  readInterface.on("close", () => {
    const strings: string[] = [];
    strings.push(codeConstants.Imports(lines));
    strings.push(codeConstants.Class(className));

    Object.entries(haveLines).forEach(([k, v]) => {
      if (v) {
        strings.push(codeConstants[k as keyof typeof mapStringToFunction]);
      }
    });

    for (const [type, name] of lines) {
      strings.push(`
  ${name[0].toLowerCase() + name.substring(1)} = this.${
        mapStringToFunction[type as keyof typeof mapStringToFunction]
      }<
    ${name}${type},
    ${name}${type}Variables
  >(${name}Document);`);
    }

    strings.push("}");

    fs.writeFile(
      path.join(...dirs.slice(0, dirs.length - 1), `${className}.ts`),
      strings.join("\n"),
      err => {
        if (err) throw err;
      }
    );
  });
}

const maindir = "src";
function search(currDir: string) {
  const dirs = fs.readdirSync(currDir) as string[];
  for (const _dir of dirs) {
    const dir = path.join(currDir, _dir);
    if (dir.includes(".graphql")) {
      processDir(dir);
    } else if (!dir.includes(".")) {
      search(dir);
    }
  }
}

search(maindir);
export {};
