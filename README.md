# Content Converters

This experimental repo explores moving data between WordPress and popular formats.

It uses PHP and JavaScript to do the conversion.

## Installation

Use [Bun](https://bun.sh/) to work with project. 

Once you have Bun installed, you can install the project dependencies:

```shell
> bun install
```

Congrats, you're all set!

## Markdown to Blocks

md-to-blocks.ts converts a single markdown file into block markup. Kudos to @dmsnell who made it possible in https://github.com/dmsnell/blocky-formats.

Example:

```shell
$ echo '# Hello, world!' > hello.md
$ bun md-to-blocks.ts hello.md > blocks/hello.blockhtml
<!-- wp:heading {"level":1} -->
<h1 class="wp-block-heading">Hello, world!</h1>
<!-- /wp:heading -->
```

## Blocks to Markdown

blocks-to-md.ts converts a single block markup file into markdown. Kutos to @dmsnell who made it possible in https://github.com/dmsnell/blocky-formats. For example:

```shell
$ echo '<!-- wp:heading {"level":1} --><h1 class="wp-block-heading">Hello, world!</h1><!-- /wp:heading -->' > hello.blockhtml
$ bun blocks-to-md.ts hello.blockhtml
# Hello, world!


```


## Blocks to WXR

blocks-to-wxr.sh converts a directory tree block markup files into a single WXR file. The files
must have a `.blockhtml` extension.

For example:

```shell
$ bash blocks-to-wxr.sh ./blocks ./output-dir
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

