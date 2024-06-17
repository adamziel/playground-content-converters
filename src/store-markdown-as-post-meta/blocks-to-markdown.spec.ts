import { blocks2markdown } from './markdown-to-blocks';
import {
	ensureDOMPpolyfill,
	ensureCoreBlocksRegistered,
} from '../convert-data-formats/converters';
import { parse } from '@wordpress/blocks';

describe('blocks2markdown', () => {
	beforeAll(async () => {
		await ensureDOMPpolyfill();
		await ensureCoreBlocksRegistered();
	});
	it('should leave two blank lines after HTML blocks', () => {
		const parsed = parse(`
<!-- wp:html -->
<img src="https://user-images.githubusercontent.com/3068563/108868727-428db880-75d5-11eb-84a9-2c0b749a22ad.png" alt="NVDA options with Speech viewer enabled" width="640">
<!-- /wp:html -->

<!-- wp:paragraph -->
<p>While in the Gutenberg editor, with NVDA activated, you can press &lt;kbd>Insert+F7&lt;/kbd> to open the Elements List where you can find elements grouped by their types, such as links, headings, form fields, buttons and landmarks.</p>
<!-- /wp:paragraph -->
        `);
		const blocks = blocks2markdown(parsed);
		expect(blocks)
			.toEqual(`<img src="https://user-images.githubusercontent.com/3068563/108868727-428db880-75d5-11eb-84a9-2c0b749a22ad.png" alt="NVDA options with Speech viewer enabled" width="640">

While in the Gutenberg editor, with NVDA activated, you can press <kbd>Insert+F7</kbd> to open the Elements List where you can find elements grouped by their types, such as links, headings, form fields, buttons and landmarks.

`);
	});

	it('should store unserializable blocks as fenced code snippets', () => {
		const parsed = parse(`
        <!-- wp:columns -->
        <div class="wp-block-columns"><!-- wp:column -->
        <div class="wp-block-column"><!-- wp:paragraph -->
        <p>I'm a paragraph</p>
        <!-- /wp:paragraph --></div>
        <!-- /wp:column -->
        
        <!-- wp:column -->
        <div class="wp-block-column"><!-- wp:quote -->
        <blockquote class="wp-block-quote"><!-- wp:paragraph -->
        <p>I'm a quote!</p>
        <!-- /wp:paragraph --></blockquote>
        <!-- /wp:quote --></div>
        <!-- /wp:column --></div>
        <!-- /wp:columns -->
        `);
		const blocks = blocks2markdown(parsed);
		expect(blocks).toEqual(
			'```block\n' +
				`<!-- wp:columns -->\n<div class=\"wp-block-columns\"><!-- wp:column -->\n` +
				`<div class=\"wp-block-column\"><!-- wp:paragraph -->\n<p>I'm a paragraph</p>\n` +
				`<!-- /wp:paragraph --></div>\n<!-- /wp:column -->\n\n<!-- wp:column -->\n` +
				`<div class=\"wp-block-column\"><!-- wp:quote -->\n<blockquote class=\"wp-block-quote\">` +
				`<!-- wp:paragraph -->\n<p>I'm a quote!</p>\n<!-- /wp:paragraph --></blockquote>\n` +
				`<!-- /wp:quote --></div>\n<!-- /wp:column --></div>\n<!-- /wp:columns -->\n` +
				'```\n\n'
		);
	});

	it.only('should serialize a table block as a markdown table', () => {
		const parsed = parse(
			`<!-- wp:table -->
        <figure class="wp-block-table"><table><thead><tr><th class="has-text-align-right" data-align="right"><em>Header left</em></th><th>Header right</th></tr></thead><tbody><tr><td class="has-text-align-right" data-align="right">row 1 col 1</td><td>row 1 col 2</td></tr><tr><td class="has-text-align-right" data-align="right">row 2 col 1</td><td>row 2 col 2</td></tr></tbody></table></figure>
<!-- /wp:table -->`,
            {
                // @TODO: figure out why the block parser complains about table block validation
				__unstableSkipMigrationLogs: true,
			}
        );
		const markdown = blocks2markdown(parsed);
		expect(markdown).toEqual(
			[
				'| *Header left* | Header right |',
				'| ------------: | ------------ |',
				'| row 1 col 1   | row 1 col 2  |',
				'| row 2 col 1   | row 2 col 2  |',
			].join('\n') + '\n\n'
		);
	});
});
