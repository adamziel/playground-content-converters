#!/bin/bash

MARKDOWN_PATH=$1
SCRIPT_PATH="$(dirname "$(realpath "$0")")"

# bunx @wp-playground/cli@latest \
bun ../playground/packages/playground/cli/src/cli.ts \
    server \
    --wp=6.5 \
    --mount=$MARKDOWN_PATH:/data/markdown \
    --mount=$SCRIPT_PATH/convert-markdown-to-blocks-in-js:/wordpress/wp-content/plugins/convert-markdown-to-blocks-in-js \
    --mount=$SCRIPT_PATH/import-static-files:/wordpress/wp-content/plugins/import-static-files \
    --mount=$SCRIPT_PATH/store-markdown-as-post-meta:/wordpress/wp-content/plugins/store-markdown-as-post-meta \
    --mount=$SCRIPT_PATH/save-pages-as-static-files:/wordpress/wp-content/plugins/save-pages-as-static-files \
    --blueprint=$SCRIPT_PATH/blueprint-convert-markdown-in-browser.json
