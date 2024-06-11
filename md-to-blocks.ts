import { markdownToBlocks } from './markdown';
import fs from 'fs';
import { createBlock, serialize } from '@wordpress/blocks';

import { JSDOM } from 'jsdom'

const dom = new JSDOM(`<!DOCTYPE html>`, {pretendToBeVisual: true})
global.window = dom.window
global.window.matchMedia = () => new EventTarget();
global.document = window.document

const { registerCoreBlocks } = await import('@wordpress/block-library');
registerCoreBlocks();

const filePath = process.argv[2];

const data = fs.readFileSync(filePath, 'utf8');
const blocks = markdownToBlocks(data);

const createBlocks = (blocks: any) =>
	blocks.map((block: any) =>
		createBlock(
			block.name,
			block.attributes,
			block.innerBlocks ? createBlocks(block.innerBlocks) : []
		)
	);

const blockMarkup = serialize(createBlocks(blocks));
console.log(blockMarkup);
export { };