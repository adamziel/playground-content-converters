#!/bin/bash

MARKDOWN_PATH=$1
SCRIPT_PATH="$(dirname "$(realpath "$0")")"

bun bin/convert.ts --from=markdown --to=block-markup --source=$MARKDOWN_PATH --target=$MARKDOWN_PATH

# bunx @wp-playground/cli@latest \
bun ../playground/packages/playground/cli/src/cli.ts \
    server \
    --wp=6.5 \
    --mount=$MARKDOWN_PATH:/data/markdown \
    --mount=$SCRIPT_PATH/import-static-files:/wordpress/wp-content/plugins/import-static-files \
    --mount=$SCRIPT_PATH/store-markdown-as-post-meta:/wordpress/wp-content/plugins/store-markdown-as-post-meta \
    --mount=$SCRIPT_PATH/save-pages-as-static-files:/wordpress/wp-content/plugins/save-pages-as-static-files \
    --mount-after-blueprint=$SCRIPT_PATH/builds/wporg-parent-2021/build:/wordpress/wp-content/themes/wporg-parent-2021/build \
    --mount-after-blueprint=$SCRIPT_PATH/builds/global-header-footer/build:/wordpress/wp-content/mu-plugins/blocks/global-header-footer/build \
    --blueprint=$SCRIPT_PATH/blueprint.json

    # --mount=$MARKDOWN_PATH:/markdown \
    # --mount=./markdown-output:/wordpress/wp-content/static-pages \