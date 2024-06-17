/**
 * Markdown table parser, as described in the GitHub Flavored Markdown specification.
 * @see https://github.github.com/gfm/#tables-extension-
 */

export type ColumnAlignment = 'left' | 'right' | 'center' | null;
export type Table = {
	headers: string[];
	alignments: ColumnAlignment[];
	rows: string[][];
};

// const generator = parseParagraph(`
// | Header 1 | Header 2 |
// | -------- | -------- |
// | Row 1    | Row 2    |
// `);
// const blocks = Array.from(generator);
/**
 * Parses a markdown paragraph, while looking for tables.
 *
 * @param markdown
 */
export function* parseParagraph(markdown: string) {
	let at = 0;

    let textStartsAt = at;
    let nextLineAt;
    const textNode = [];
	while (true) {
        if (at >= markdown.length) {
            // @TODO: We're backtracking here, it would be nice to only do a single pass.
            const text = markdown.substring(textStartsAt, at).replace(/\s+/g, ' ').trim();
            if (text.length > 0) {
                yield {
                    type: 'text',
                    text,
                };
            }
			break;
		}
		nextLineAt = markdown.indexOf('\n', at);
		if (nextLineAt === -1) {
			nextLineAt = markdown.length;
        }
        
        // Skip the line – there's no table to parse.
        // We know, because tables must start with a pipe character. 
        if (markdown[at] !== '|') {
            at = nextLineAt + 1;
            continue;
        }

        let tableStartsAt = at;

        // This could be a start of a table
        const header = parseTableRow(markdown, at);
        if (null === header) {
            // Not a table – let's consume the data as text and move on.
            at = nextLineAt + 1;
            continue;
        }
        at = header.endOffset + 1;

        const alignments = parseDelimiters(markdown, at);
        if (null === alignments) {
            // Not a table – let's consume the data as text and move on.
            at = nextLineAt + 1;
            continue;
        }
        at = alignments.endOffset + 1;

        // At this point we have a table. We don't know if it has any rows yet,
        // but it is a table.

        // If we were parsing text, let's yield it now.
        if (textStartsAt !== tableStartsAt) {
            // @TODO: We're backtracking here, it would be nice to only do a single pass.
            const text = markdown.substring(textStartsAt, tableStartsAt).replace(/\s+/g, ' ').trim();
            if (text.length > 0) {
                yield {
                    type: 'text',
                    text,
                };
            }
        }

        // Parse the table rows.
        const rows: string[][] = [];
        while (true) {
            const row = parseTableRow(markdown, at);
            if (null === row) {
                break;
            }
            rows.push(row.cells);
            at = row.endOffset + 1;
        }

        yield {
            type: 'table',
            headers: header.cells,
            alignments: alignments.alignments,
            rows,
        };

        textStartsAt = at;
	}
}

/**
 * > The delimiter row consists of cells whose only content are hyphens (-),
 * > and optionally, a leading or trailing colon (:), or both, to indicate left,
 * > right, or center alignment respectively.
 *
 * @see https://github.github.com/gfm/#delimiter-row
 */
export function parseTableRow(markdown: string, at: number = 0) {
    const cells: string[] = [];

	let lineEnd = markdown.indexOf('\n', at);
	if (lineEnd === -1) {
		lineEnd = markdown.length;
	}

	// The row is indented, bale.
	if (at < lineEnd && markdown[at] === ' ') {
        return null;
	}

	if (markdown[at] === '|') {
		// The first cell may optionally start with a pipe character.
		// Let's skip the pipe character and all the whitespace after it.
		++at;
		while (at < lineEnd && markdown[at] === ' ') {
			++at;
		}
	} 

	if (at >= lineEnd) {
        return null;
    }
    
    let textStart = at;
    let textNodes: string[] = [];
    while (true) {
        if (at >= lineEnd) {
            // Row's end – store the contents and finish
            textNodes.push(markdown.substring(textStart, at));
            cells.push(textNodes.join('').trim());
            textNodes = [];
            break;
        } else if (markdown[at] === '|') {
            // Cell's end – store the contents
            textNodes.push(markdown.substring(textStart, at));
            cells.push(textNodes.join('').trim());
            textNodes = [];
            ++at;
            textStart = at;

            // Skip all the whitespace
            while (at < lineEnd && markdown[at] === ' ') {
                ++at;
            }

            if(at === lineEnd) {
                // Row ends before the next cell starts, we're done
                break;
            }
        } else if (markdown[at] === '\\') {
            // Escape sequence – skip the next character
            textNodes.push(markdown.substring(textStart, at));
            textStart = at + 1;
            at += 2;
        } else {
            ++at;
        }
    }

    // Must have at least one cell
    if (cells.length === 0) {
        return null;
    }

	return {
		cells,
		endOffset: at,
	};
}

/**
 * > The delimiter row consists of cells whose only content are hyphens (-),
 * > and optionally, a leading or trailing colon (:), or both, to indicate left,
 * > right, or center alignment respectively.
 *
 * @see https://github.github.com/gfm/#delimiter-row
 */
export function parseDelimiters(markdown: string, at: number = 0) {
	const alignments: ColumnAlignment[] = [];
	function pushAlignment(leftColon, rightColon) {
		alignments.push(
			leftColon && rightColon
				? 'center'
				: leftColon
				? 'left'
				: rightColon
				? 'right'
				: null
		);
	}

	let lineEnd = markdown.indexOf('\n', at);
	if (lineEnd === -1) {
		lineEnd = markdown.length;
	}

	// Skip the initial whitespace
	while (at < lineEnd && markdown[at] === ' ') {
		++at;
	}

	if (markdown[at] === '|') {
		// The first cell may optionally start with a pipe character.

		// Let's skip the pipe character and all the whitespace after it.
		++at;
		while (at < lineEnd && markdown[at] === ' ') {
			++at;
		}
	} else if (at !== 0) {
		// This row is indented, but the first cell doesn't start with a pipe character.
		// This isn't allowed, let's bale out.
		return null;
    }
    
	while (at < lineEnd) {
		let leftColon = false;
		let rightColon = false;

		if (markdown[at] === ':') {
			// We just started the first cell with a colon for alignment
			leftColon = true;
			++at;

			// A colon must be followed by at least one hyphen
			if (markdown[at] !== '-') {
				return null;
			}
		} else if (markdown[at] === '-') {
			// We just started the first cell. Let's not move the pointer
			// and let the next while() loop consume the hyphens.
		} else {
			return null;
		}

		// Skip all the hyphens
		let hyphens = 0;
		while (at < lineEnd && markdown[at] === '-') {
			++at;
			++hyphens;
		}

		// Can't have a cell without hyphens
		if (hyphens === 0) {
			return null;
		}

		// Finished parsing the row
		if (at >= lineEnd) {
			pushAlignment(leftColon, rightColon);
			break;
		}

		// Consume the optional right colon.
		if (markdown[at] === ':') {
            rightColon = true;
            ++at;
		}

		pushAlignment(leftColon, rightColon);

		// Skip all the whitespace
		while (at < lineEnd && markdown[at] === ' ') {
			++at;
		}

		if (markdown[at] === '|') {
			// We just finished parsing the cell, skip the pipe character and all the whitespace.
			++at;
			while (at < lineEnd && markdown[at] === ' ') {
				++at;
			}
		} else if (at === lineEnd) {
			// We just finished parsing the entire row.
			break;
		} else {
			// Unexpected character, let's bale.
			return null;
		}
    }
    
    // Must have at least one alignment
    if (alignments.length === 0) {
        return null;
    }

	return {
		alignments,
		endOffset: at,
	};
}
