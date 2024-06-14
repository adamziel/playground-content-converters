// Import necessary WordPress packages
const { select, dispatch, subscribe } = window.wp.data;
const { addFilter } = window.wp.hooks;
const { serialize, parse } = window.wp.blocks;
const apiFetch = window.wp.apiFetch;

const markdownModule = import('./markdown-to-blocks.js');

/**
 * Add markdown to page meta on save
 */
apiFetch.use(async (options, next) => {
	const { method, data, path } = options;
	if (['POST', 'PUT'].includes(method) && path.startsWith('/wp/v2/pages')) {
		const { blocks2markdown } = await markdownModule;
		options.data = {
			...options.data,
			meta: {
				...(options.data.meta || {}),
				markdown_content: blocks2markdown(parse(options.data.content)),
			},
		};
	}
	return await next(options);
});
