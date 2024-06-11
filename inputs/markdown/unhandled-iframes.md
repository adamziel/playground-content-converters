#  Pair the site editor's nested iframe to the Service Worker.

Without the patch below, the site editor initiates network requests that
aren't routed through the service worker. That's a known browser issue:

* https://bugs.chromium.org/p/chromium/issues/detail?id=880768
* https://bugzilla.mozilla.org/show_bug.cgi?id=1293277
* https://github.com/w3c/ServiceWorker/issues/765

The problem with iframes using srcDoc and src="about:blank" as they
fail to inherit the root site's service worker.

Gutenberg loads the site editor using <iframe srcDoc="<!doctype html">
to force the standards mode and not the quirks mode:

https://github.com/WordPress/gutenberg/pull/38855

This commit patches the site editor to achieve the same result via
<iframe src="/doctype.html"> and a doctype.html file containing just
`<!doctype html>`. This allows the iframe to inherit the service worker
and correctly load all the css, js, fonts, images, and other assets.
 
Ideally this issue would be fixed directly in Gutenberg and the patch
below would be removed.
 
See https://github.com/WordPress/wordpress-playground/issues/42 for more details
 
## Why does this code live in the service worker?

There's many ways to install the Gutenberg plugin:

* Install plugin step
* Import a site
* Install Gutenberg from the plugin directory
* Upload a Gutenberg zip

It's too difficult to patch Gutenberg in all these cases, so we blanket-patch
all the scripts requested over the network whose names seem to indicate they're
related to the Gutenberg plugin.
 