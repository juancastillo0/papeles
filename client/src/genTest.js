"use strict";
var __spreadArrays = (this && this.__spreadArrays) || function () {
    for (var s = 0, i = 0, il = arguments.length; i < il; i++) s += arguments[i].length;
    for (var r = Array(s), k = 0, i = 0; i < il; i++)
        for (var a = arguments[i], j = 0, jl = a.length; j < jl; j++, k++)
            r[k] = a[j];
    return r;
};
exports.__esModule = true;
var fs_1 = require("fs");
var path_1 = require("path");
var readline_1 = require("readline");
function valsToString(vals) {
    return vals
        .reduce(function (p, _a) {
        var type = _a[0], name = _a[1];
        return p.concat("" + name + type, "" + name + type + "Variables", name + "Document");
    }, [])
        .join(",\n  ");
}
var codeConstants = {
    Imports: function (vals) { return "\nimport { ApolloClient, MutationOptions } from \"apollo-client\";\nimport { NormalizedCacheObject } from \"apollo-cache-inmemory\";\nimport {" + valsToString(vals) + "\n  } from \"../generated/graphql\";\n  \ntype OtherOptions<T, K> = Omit<MutationOptions<T, K>, \"mutation\" | \"variables\">;\n"; },
    Class: function (className) { return "\nexport class " + className + " {\n  constructor(public client: ApolloClient<NormalizedCacheObject>) {}"; },
    Mutation: "\n  mutate<T, K>(mutation: any) {\n    return (variables: K, options: OtherOptions<T, K> = {}) =>\n      this.client.mutate<T, K>({ mutation, variables, ...options });\n  }",
    Query: "\n  query<T, K>(query: any) {\n    return (variables: K, options: OtherOptions<T, K> = {}) =>\n      this.client.query<T, K>({ query, variables, ...options });\n  }",
    Subscription: "\n  subscribe<T, K>(query: any) {\n    return (variables: K, options: OtherOptions<T, K> = {}) =>\n      this.client.subscribe<T, K>({ query, variables, ...options });\n  }"
};
var mapStringToFunction = {
    Mutation: "mutate",
    Subscription: "subscribe",
    Query: "query"
};
function cleanLine(line) {
    var type = line.split(" ")[0];
    return [
        type[0].toUpperCase() + type.substring(1),
        line
            .split(" ")[1]
            .split("(")[0]
            .split("{")[0]
    ];
}
function processDir(dir) {
    var readInterface = readline_1["default"].createInterface({
        input: fs_1["default"].createReadStream(dir),
        output: process.stdout,
        terminal: false
    });
    var haveLines = {
        Mutation: false,
        Subscription: false,
        Query: false
    };
    var lines = [];
    readInterface.on("line", function (_line) {
        var line = _line.trim();
        if (Object.keys(mapStringToFunction).some(function (v) { return line.indexOf(v.toLowerCase()) === 0; })) {
            var _a = cleanLine(line), type = _a[0], name_1 = _a[1];
            haveLines[type] = true;
            lines.push([type, name_1]);
        }
    });
    var dirs = dir.split("\\");
    var dirName = dirs[dirs.length - 2];
    var className = dirName[0].toUpperCase() + dirName.substring(1) + "Api";
    readInterface.on("close", function () {
        var strings = [];
        strings.push(codeConstants.Imports(lines));
        strings.push(codeConstants.Class(className));
        Object.entries(haveLines).forEach(function (_a) {
            var k = _a[0], v = _a[1];
            if (v) {
                strings.push(codeConstants[k]);
            }
        });
        for (var _i = 0, lines_1 = lines; _i < lines_1.length; _i++) {
            var _a = lines_1[_i], type = _a[0], name_2 = _a[1];
            strings.push("\n  " + (name_2[0].toLowerCase() + name_2.substring(1)) + " = this." + mapStringToFunction[type] + "<\n    " + name_2 + type + ",\n    " + name_2 + type + "Variables\n  >(" + name_2 + "Document);");
        }
        strings.push("}");
        fs_1["default"].writeFile(path_1["default"].join.apply(path_1["default"], __spreadArrays(dirs.slice(0, dirs.length - 1), [className + ".ts"])), strings.join("\n"), function (err) {
            if (err)
                throw err;
        });
    });
}
var maindir = "src";
function search(currDir) {
    var dirs = fs_1["default"].readdirSync(currDir);
    for (var _i = 0, dirs_1 = dirs; _i < dirs_1.length; _i++) {
        var _dir = dirs_1[_i];
        var dir = path_1["default"].join(currDir, _dir);
        if (dir.includes(".graphql")) {
            processDir(dir);
        }
        else if (!dir.includes(".")) {
            search(dir);
        }
    }
}
search(maindir);
