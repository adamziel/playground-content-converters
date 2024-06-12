export async function ensureDOMPpolyfill() {
	if ('document' in global) return;

	const { JSDOM } = await import('jsdom');
	const dom = new JSDOM(`<!DOCTYPE html>`, { pretendToBeVisual: true });
	(global as any).window = dom.window;
	(global as any).window.matchMedia = () => new EventTarget() as any;
	(global as any).document = window.document;
}

let coreBlocksRegistered = false;
async function ensureCoreBlocksRegistered() {
	if (coreBlocksRegistered) return;
	coreBlocksRegistered = true;
	const { registerCoreBlocks } = await import('@wordpress/block-library');
	registerCoreBlocks();
}

export async function blockMarkupToMarkdown(blockMarkups: string[] | string) {
	const { parse } = await import('@wordpress/blocks');
	const { blocks2markdown } = await import('./markdown');
	await ensureDOMPpolyfill();
	await ensureCoreBlocksRegistered();
	return mapDocuments(blockMarkups, (blockMarkup) =>
		blocks2markdown(parse(blockMarkup))
	);
}
export async function markdownToBlockMarkup(markdowns: string[] | string) {
	const { createBlock, serialize } = await import('@wordpress/blocks');
	const { markdownToBlocks } = await import('./markdown');
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
