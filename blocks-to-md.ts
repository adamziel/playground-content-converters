import { blocks2markdown } from './markdown';
import fs from 'fs';
import { parse } from '@wordpress/blocks';

import { JSDOM } from 'jsdom'

const dom = new JSDOM(`<!DOCTYPE html>`, {pretendToBeVisual: true})
global.window = dom.window
global.window.matchMedia = () => new EventTarget();
global.document = window.document

const { registerCoreBlocks } = await import('@wordpress/block-library');
registerCoreBlocks();

const filePath = process.argv[2];

const blockMarkup = fs.readFileSync(filePath, 'utf8');
const blocks = parse(blockMarkup);
const markdown = blocks2markdown(blocks);

console.log(markdown);
export { };