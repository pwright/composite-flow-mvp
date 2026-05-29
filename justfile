set shell := ["bash", "-eu", "-o", "pipefail", "-c"]

install:
    npm install --no-audit --no-fund --verbose

dev:
    npm run dev

build:
    npm run build

preview:
    npm run preview

export-sample:
    npm run export:sample

test:
    npm run test:normalizer

# Pipe-safe conversion from YAML to normalized graph JSON.
# Usage: just flow input.yaml output.json
flow input output:
    node scripts/compose-to-flow.mjs {{input}} -o {{output}}

# Golden-test workflow: regenerate then inspect with git diff.
golden:
    npm run export:sample
    npm run test:normalizer
