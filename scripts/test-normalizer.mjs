#!/usr/bin/env node
import fs from "node:fs/promises";
import process from "node:process";
import { instantiateGraph, parseComposeYaml, toSerializableGraph } from "../src/compose/composeModel.js";

const samplePath = "public/examples/nearestprime.yaml";
const goldenPath = "tests/golden/nearestprime-flow.json";

async function main() {
  console.error(`[test-normalizer] reading ${samplePath}`);
  const text = await fs.readFile(samplePath, "utf8");
  const model = parseComposeYaml(text);
  const graph = toSerializableGraph(instantiateGraph(model, model.root));
  const actual = `${JSON.stringify(graph, null, 2)}\n`;

  let expected;
  try {
    expected = await fs.readFile(goldenPath, "utf8");
  } catch {
    console.error(`[test-normalizer] golden file missing: ${goldenPath}`);
    process.stdout.write(actual);
    process.exitCode = 1;
    return;
  }

  if (actual !== expected) {
    console.error("[test-normalizer] graph differs from golden output");
    await fs.writeFile("tests/golden/nearestprime-flow.actual.json", actual, "utf8");
    console.error("[test-normalizer] wrote tests/golden/nearestprime-flow.actual.json");
    process.exitCode = 1;
    return;
  }

  console.error("[test-normalizer] ok");
}

main().catch((error) => {
  console.error(`[test-normalizer] error: ${error.message}`);
  process.exitCode = 1;
});
