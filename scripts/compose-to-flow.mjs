#!/usr/bin/env node
import fs from "node:fs/promises";
import process from "node:process";
import { instantiateGraph, parseComposeYaml, toSerializableGraph } from "../src/compose/composeModel.js";

function usage() {
  return `Usage:
  compose-to-flow.mjs [input.yaml|-] [-o output.json] [--root block/name]

Reads YAML from a file or stdin and writes normalized graph JSON to stdout or -o.
Diagnostics are written to stderr so stdout remains pipe-safe.`;
}

async function main(argv) {
  const args = [...argv];
  let input = "-";
  let output = null;
  let root = null;

  while (args.length) {
    const arg = args.shift();
    if (arg === "-h" || arg === "--help") {
      console.error(usage());
      return 0;
    }
    if (arg === "-o" || arg === "--output") {
      output = args.shift();
      if (!output) throw new Error("Missing value for -o/--output");
      continue;
    }
    if (arg === "--root") {
      root = args.shift();
      if (!root) throw new Error("Missing value for --root");
      continue;
    }
    input = arg;
  }

  console.error(`[compose-to-flow] reading ${input === "-" ? "stdin" : input}`);
  const text = input === "-" ? await readStdin() : await fs.readFile(input, "utf8");
  const model = parseComposeYaml(text);
  const graph = instantiateGraph(model, root ?? model.root);
  const json = `${JSON.stringify(toSerializableGraph(graph), null, 2)}\n`;

  if (output) {
    console.error(`[compose-to-flow] writing ${output}`);
    await fs.writeFile(output, json, "utf8");
  } else {
    process.stdout.write(json);
  }

  console.error(`[compose-to-flow] done: ${graph.instances.length} instances, ${graph.bindings.length} bindings`);
  return graph.problems.some((p) => p.level === "error") ? 2 : 0;
}

async function readStdin() {
  const chunks = [];
  for await (const chunk of process.stdin) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks).toString("utf8");
}

main(process.argv.slice(2))
  .then((code) => { process.exitCode = code; })
  .catch((error) => {
    console.error(`[compose-to-flow] error: ${error.message}`);
    process.exitCode = 1;
  });
