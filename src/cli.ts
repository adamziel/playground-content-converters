import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import * as fs from 'fs';
import * as readline from 'readline';
import { blockMarkupToMarkdown, markdownToBlockMarkup } from './converters';
import { iterateDirectory } from './convert-directory';
import path from 'path';

// Define the allowed formats
const formats = {
	markdown: {
		name: 'Markdown',
		extensions: ['.md', '.markdown'],
	},
	'block-markup': {
		name: 'Block markup',
		extensions: ['.blockhtml'],
	},
} as const;
type Format = keyof typeof formats;

const pipelines = {
	markdown: {
		'block-markup': markdownToBlockMarkup,
	},
	'block-markup': {
		markdown: blockMarkupToMarkdown,
	},
};

// Define the shape of the CLI arguments using an interface
interface CliOptions {
	from: Format;
	to: Format;
	source?: string;
	stdinData?: string;
	target?: string;
}

// Setup yargs to parse CLI arguments with type annotations
const argv: CliOptions = yargs(hideBin(process.argv))
	.option('from', {
		type: 'string',
		description: 'Input format',
		choices: Object.keys(formats),
		demandOption: true,
	})
	.option('to', {
		type: 'string',
		description: 'Output format',
		choices: Object.keys(formats),
		demandOption: true,
	})
	.option('source', {
		type: 'string',
		description: 'Source file or directory path (or stdin data)',
		demandOption: false,
	})
	.option('target', {
		type: 'string',
		description:
			'Destination file or directory path (required if source is a directory)',
		demandOption: false,
	})
	.check((argv) => {
		// Custom validation: If source is a directory, dest is required
		if (
			argv.source &&
			fs.lstatSync(argv.source).isDirectory() &&
			!argv.target
		) {
			throw new Error(
				'Destination path is required if source is a directory'
			);
		}
		if (pipelines[argv.from]?.[argv.to] === undefined) {
			throw new Error(
				`Conversion from ${argv.from} to ${argv.to} is not supported`
			);
		}
		return true;
	})
	.parseSync() as CliOptions;

// If source is not provided, read from stdin
if (!argv.source) {
	const stdinContent = await readStdin();
	if (!stdinContent) {
		throw new Error(
			'Source is required either as a file path or via stdin'
		);
	}
	argv.stdinData = stdinContent;
}

// Main conversion logic
const convertFileFormat = async (args: CliOptions) => {
	const isDirectory = args.source
		? fs.lstatSync(args.source).isDirectory()
		: false;
	const fromStdin = !!args.stdinData;
	const toStdout = !args.target;

	// Don't pollute stdout with log messages if writing to stdout
	if (!toStdout) {
		console.log(
			`Converting ${isDirectory ? 'directory ' : ''} ${
				args.source ?? 'stdin'
			} to ${isDirectory ? 'directory ' : ''} ${args.target ?? 'stdout'}`
		);
	}

	const mapper = pipelines[args.from][args.to];

	if (isDirectory) {
		const inputDir = path.normalize(args.source);
		const filesPaths = iterateDirectory(inputDir);
		const inputExtension = formats[args.from].extensions[0];
		const outputExtension = formats[args.to].extensions[0];

		for (const filePath of filesPaths) {
			const relativePath = filePath
				.substring(inputDir.length)
				.replace(/^\//, '');

			if (!filePath.endsWith(inputExtension)) {
				console.log(`Skipping ${relativePath}`);
				continue;
			}

			console.log(`Converting ${relativePath}`);

			let outputPath = path.join(args.target, relativePath);
			const lastDot = outputPath.lastIndexOf('.');
			outputPath = outputPath.substring(0, lastDot) + outputExtension;

			const content = fs.readFileSync(filePath, 'utf-8');
			const output = await mapper(content, relativePath);

			fs.mkdirSync(path.dirname(outputPath), { recursive: true });
			fs.writeFileSync(outputPath, output);
		}
		console.log('Conversion complete');
		return;
	}

	const input = fromStdin
		? args.stdinData!
		: fs.readFileSync(args.source!, 'utf-8');
	const output = await mapper(input);

	if (toStdout) {
		process.stdout.write(output);
	} else {
		fs.writeFileSync(args.target!, output);
		console.log('Conversion complete');
	}
};

function readStdin(): Promise<string> {
	return new Promise((resolve, reject) => {
		const rl = readline.createInterface({
			input: process.stdin,
			output: process.stdout,
			terminal: false,
		});

		let input = '';
		rl.on('line', (line) => {
			input += line + '\n';
		});

		rl.on('close', () => {
			resolve(input.trim());
		});

		rl.on('error', (err) => {
			reject(err);
		});
	});
}

export async function run() {
	return await convertFileFormat(argv);
}
