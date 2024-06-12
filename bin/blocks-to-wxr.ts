import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import { spawnSync } from 'child_process';
import fs from 'fs';
import os from 'os';
import path from 'path';

// Define the shape of the CLI arguments using an interface
interface CliOptions {
	source?: string;
	target?: string;
}

// Setup yargs to parse CLI arguments with type annotations
const argv: CliOptions = yargs(hideBin(process.argv))
	.option('source', {
		type: 'string',
		description: 'Source directory path',
		demandOption: true,
	})
	.option('target', {
		type: 'string',
		description: 'Destination file or directory path',
		demandOption: true,
	})
	.parseSync() as CliOptions;

const source = argv.source;
const target = argv.target;

// Create a temporary directory
const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'temp-'));
try {
	const shellScriptPath = new URL(
		'../src/blocks-to-wxr/blocks-to-wxr.sh',
		import.meta.url
	).pathname;
	const result = spawnSync('bash', [shellScriptPath, source, tempDir], {
		stdio: 'inherit',
	});
	// Find the only ".xml" file in the temporary directory
	const files = fs.readdirSync(tempDir);
	const xmlFile = files.find((file) => path.extname(file) === '.xml');

	if (!xmlFile) {
		console.error('No XML file found in the temporary directory');
		process.exit(1);
	}

	// Move the XML file to the outdir
	const sourcePath = path.join(tempDir, xmlFile);
	const contents = fs.readFileSync(sourcePath);

	if (!fs.existsSync(target) || !fs.lstatSync(target).isDirectory()) {
		fs.writeFileSync(target, contents);
	} else {
		fs.writeFileSync(path.join(target, xmlFile), contents);
	}

	if (result.error) {
		console.error('Error executing script:', result.error);
	} else {
		console.log('WXR created successfully');
	}
} finally {
	// Cleanup: Remove the temporary directory
	fs.rmdirSync(tempDir, { recursive: true });
}
