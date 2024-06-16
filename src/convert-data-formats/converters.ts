export async function ensureDOMPpolyfill() {
	if ('document' in global) return;

	const { JSDOM } = await import('jsdom');
	const dom = new JSDOM(`<!DOCTYPE html>`, { pretendToBeVisual: true });
	(global as any).window = dom.window;
	(global as any)['Node'] = dom.window.Node;
	(global as any).window.matchMedia = () => new EventTarget() as any;
	(global as any).document = window.document;
}

let coreBlocksRegistered = false;
export async function ensureCoreBlocksRegistered() {
	if (coreBlocksRegistered) return;
	coreBlocksRegistered = true;
	const { registerCoreBlocks } = await import('@wordpress/block-library');
	registerCoreBlocks();

	const { parse, serialize } = await import('@wordpress/blocks');
	if (!('wp' in window)) {
		(global as any).wp = (window as any).wp = { blocks: { parse, serialize } };
	}
}

export async function blockMarkupToMarkdown(blockMarkups: string[] | string) {
	const { parse } = await import('@wordpress/blocks');
	const { blocks2markdown } = await import('../store-markdown-as-post-meta/markdown-to-blocks');
	await ensureDOMPpolyfill();
	await ensureCoreBlocksRegistered();
	return mapDocuments(blockMarkups, (blockMarkup) =>
		blocks2markdown(parse(blockMarkup))
	);
}
export async function markdownToBlockMarkup(markdowns: string[] | string) {
	const { createBlock, serialize } = await import('@wordpress/blocks');
	const { markdownToBlocks } = await import('../store-markdown-as-post-meta/markdown-to-blocks');
	await ensureDOMPpolyfill();
    await ensureCoreBlocksRegistered();

    const createBlocks = (blocks: any) =>
        blocks.map((block: any) =>
            createBlock(
                block.name,
                block.attributes,
                block.innerBlocks ? createBlocks(block.innerBlocks) : []
            )
        );

    return mapDocuments(markdowns, (markdown) => {
        return serialize(createBlocks(markdownToBlocks(markdown)));
    });
}

function mapDocuments(
	input: string | string[],
	mapper: (input: string) => string
) {
	if (Array.isArray(input)) {
		return input.map(mapper);
	}
	return mapper(input);
}
