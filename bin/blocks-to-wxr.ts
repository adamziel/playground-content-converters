import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import { execSync } from 'child_process';
import { spawnSync } from 'child_process';

// Define the shape of the CLI arguments using an interface
interface CliOptions {
	source?: string;
	outdir?: string;
}

// Setup yargs to parse CLI arguments with type annotations
const argv: CliOptions = yargs(hideBin(process.argv))
	.option('source', {
		type: 'string',
		description: 'Source directory path',
		demandOption: true,
	})
	.option('outdir', {
		type: 'string',
		description:
			'Destination file or directory path (required if source is a directory)',
		demandOption: true,
	})
	.parseSync() as CliOptions;

const source = argv.source;
const outdir = argv.outdir;

const shellScriptPath = new URL(
	'../src/blocks-to-wxr/blocks-to-wxr.sh',
	import.meta.url
).pathname;
const result = spawnSync('bash', [shellScriptPath, source, outdir]);
if (result.error) {
	console.error('Error executing script:', result.error);
} else {
	console.log('Script executed successfully');
}
