import { markdownToBlocks } from './markdown-to-blocks';
import { ensureDOMPpolyfill } from '../convert-data-formats/converters';

describe('markdownToBlocks', () => {
	beforeAll(async () => {
		await ensureDOMPpolyfill();
	});


	it('should transform a markdown page', () => {
		const blocks = markdownToBlocks(`
# Block Editor Handbook

Welcome to the Block Editor Handbook.

The [**Block Editor**](https://wordpress.org/gutenberg/) is a modern paradigm for WordPress site building and publishing. It uses a modular system of **blocks** to compose and format content and is designed to create rich and flexible layouts for websites and digital products.

The Block Editor consists of several primary elements, as shown in the following figure:

![Quick view of the Block Editor](https://raw.githubusercontent.com/WordPress/gutenberg/trunk/docs/assets/overview-block-editor-2023.png)

The elements highlighted are:

1. **Inserter:** A panel for inserting blocks into the content canvas
2. **Content canvas:** The content editor, which holds content created with blocks
3. **Settings Panel** A panel for configuring a block’s settings when selected or the settings of the post

        `);
		expect(blocks).toMatchSnapshot();
	});

	it('should transform a markdown table', () => {
		const blocks = markdownToBlocks(`
Generally speaking, [the following labels](https://github.com/WordPress/gutenberg/labels) are very useful:

| Label                      | Reason                                                                                    |
| -------------------------- | ----------------------------------------------------------------------------------------- |
| \`[Type] Bug\`               | When an intended feature is broken.                                                       |
| \`[Type] Enhancement\`       | When someone is suggesting an enhancement to a current feature.                           |
| \`[Type] Help Request\`      | When someone is asking for general help with setup/implementation.                        |
| \`Needs Technical Feedback\` | When you see new features or API changes proposed.                                        |
| \`Needs More Info\`          | When it’s not clear what the issue is or it would help to provide additional details.     |
| \`Needs Testing\`            | When a new issue needs to be confirmed or old bugs seem like they are no longer relevant. |

[NVDA](https://www.nvaccess.org/about-nvda/) is a free screen reader for Windows.
        `);
		expect(blocks).toMatchSnapshot();
	});

	it('should parse a simple markdown table', () => {
		const blocks = markdownToBlocks(
			[`| Label |`, `| ----- |`, `| Value |`].join('\n')
		);
		expect(blocks).toMatchSnapshot();
	});

	it('should parse formats in a simple markdown table', () => {
		const blocks = markdownToBlocks(
			[`| **Label** |`, `| ----- |`, `| V **a*l*u** e |`].join('\n')
		);
		expect(blocks).toMatchSnapshot();
	});

	it('should preserve img alt text in inline images', () => {
		const blocks = markdownToBlocks(
			`Inline image ![Alt text](https://example.com/image.png "Image Title")`
		);
		expect(blocks).toEqual([
			{
				name: 'core/paragraph',
				attributes: {
					content: `Inline image <img src="https://example.com/image.png" title="Image Title" alt="Alt text">`
				},
				innerBlocks: [],
			},
		]);
	});

	it('should preserve img alt text and caption in block images', () => {
		const blocks = markdownToBlocks(
			`![Alt text](https://example.com/image.png "Image Title")`
		);
		expect(blocks).toEqual([
			{
				name: 'core/image',
				attributes: {
					url: 'https://example.com/image.png',
					alt: 'Alt text',
					caption: 'Image Title'
				},
				innerBlocks: [],
			},
		]);
	});
});
