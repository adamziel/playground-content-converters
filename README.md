# Static File Editor

This experimental repo explores:

* Converting data between WordPress blocks and popular formats (e.g., Markdown).
* Editing those static files using the WordPress block editor.

[<kbd> <br>Demo: Edit Gutenberg Handbook in the browser<br> </kbd>](https://playground.wordpress.net/?gh-ensure-auth=yes&ghexport-repo-url=https%3A%2F%2Fgithub.com%2Fwordpress%2Fgutenberg&ghexport-content-type=custom-paths&ghexport-path=docs&ghexport-commit-message=Documentation+update&ghexport-playground-root=%2Fwordpress%2Fwp-content%2Fstatic-files/docs&ghexport-repo-root=%2Fdocs&blueprint-url=https://raw.githubusercontent.com/adamziel/playground-content-converters/21ecd28/src/blueprint-web-browser-gutenberg-handbook.json&ghexport-pr-action=create&ghexport-allow-include-zip=no)

## Setup

Use [Bun](https://bun.sh/) to work with project. 

Once you have Bun installed, you can install the project dependencies:

```shell
> bun install
```

Congrats, you're all set!

## Starting the editor

To edit the example markdown file structure in the `markdown` directory, they need to be converted to blocks first. Here's two 

### Convert .md -> blocks in the CLI

To start the editor, run the following command:

```shell
# To convert .md -> Blocks in CLI and then start Playground:
$ bash src/run-markdown-editor-convert-markdown-in-cli.sh ./markdown

# To start Playground and convert .md -> Blocks using browser as the 
# JavaScript runtime:
$ bash src/run-markdown-editor-convert-markdown-in-browser.sh ./markdown
# And then go to http://127.0.0.1:9400/wp-admin/post-new.php to finish
# the conversion process.
```

## Converting Formats

`bun bin/convert.ts` is a CLI tool that converts between data formats.

```shell
$ bun bin/convert.ts

Options:
  --from     Input format
                       [string] [required] [choices: "markdown", "block-markup"]
  --to       Output format
                       [string] [required] [choices: "markdown", "block-markup"]
  --source   Source file or directory path (or stdin data)              [string]
  --target   Destination file or directory path (required if source is a directory
                                                                        [string]
```

Keep reading for examples of how to use this tool.

### Markdown to Blocks

```shell
$ echo '# Hello, world!' > hello.md
$ bun bin/convert.ts --source=inputs/markdown/hello.md --from=markdown --to=block-markup
<!-- wp:heading {"level":1} -->
<h1 class="wp-block-heading">Hello, world!</h1>
<!-- /wp:heading -->
```

Kudos to @dmsnell who made it possible in https://github.com/dmsnell/blocky-formats.

### Blocks to Markdown

```shell
$ echo '<!-- wp:heading {"level":1} --><h1 class="wp-block-heading">Hello, world!</h1><!-- /wp:heading -->' | bun bin/convert.ts --from=block-markup --to=markdown
# Hello, world!

```

Kudos to @dmsnell who made it possible in https://github.com/dmsnell/blocky-formats.

### Blocks to WXR

`bin/blocks-to-wxr.ts` converts a directory tree of block markup files into a single WXR file. The files
must have a `.blockhtml` extension.

For example:

```shell
$ bun bin/blocks-to-wxr.ts --source=./inputs/block-markup --outdir=./output-dir
$ ls output-dir
mywordpresswebsite.wordpress.2024-06-11.000.xml
$ cat output-dir/mywordpresswebsite.wordpress.2024-06-11.000.xml | grep -B1 -A1 'Hello' 
<content:encoded><![CDATA[<!-- wp:heading {"level":1} -->
<h1 class="wp-block-heading">Hello, world!</h1>
<!-- /wp:heading -->
]]></content:encoded>
```

## Related projects

* [Rewrite WXR](https://github.com/adamziel/wxr-normalize/blob/trunk/rewrite-wxr.php) Rewrites URLs in a WXR file while keeping track of the URLs found. See the related [Blueprints repo PR](https://github.com/WordPress/blueprints/pull/52).
* [Site Transfer Protocol](https://core.trac.wordpress.org/ticket/60375)
* [Playground Documentation Workflow](https://github.com/adamziel/playground-docs-workflow)
* [Edit Visually browser extension](https://github.com/WordPress/playground-tools/pull/298)
* [Data Liberation](https://wordpress.org/data-liberation/)

