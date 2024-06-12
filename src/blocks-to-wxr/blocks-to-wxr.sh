#!/bin/bash

set -e

BLOCK_MARKUP_PATH=$1
OUTPUT_PATH=$2
SCRIPT_PATH="$(dirname "$(realpath "$0")")"

bunx @wp-playground/cli@latest \
    server \
    --mount=$BLOCK_MARKUP_PATH:/block-markup \
    --mount=$OUTPUT_PATH:/output \
    --mount=$SCRIPT_PATH/block-markup-importer:/wordpress/wp-content/plugins/block-markup-importer \
    --blueprint=$SCRIPT_PATH/block-markup-importer/blueprint.json
