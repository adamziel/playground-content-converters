import * as fs from 'fs';
import * as path from 'path';

export interface ConvertOptions {
	inputDir: string;
	inputExtension: string;
	outputDir: string;
	outputExtension: string;
	convert: (fileContents: string) => string | Promise<string>;
}

export async function convertDirectory(options: ConvertOptions): Promise<void> {
	const inputDir = path.normalize(options.inputDir);
	const filesPaths = iterateDirectory(inputDir);

	for (const filePath of filesPaths) {
		if (filePath.endsWith(options.inputExtension)) {
			const content = fs.readFileSync(filePath, 'utf-8');
			const output = await options.convert(content);

			let outputPath = path.join(
				options.outputDir,
				filePath.substring(inputDir.length).replace(/^\//, '')
			);
			const lastDot = outputPath.lastIndexOf('.');
			outputPath =
				outputPath.substring(0, lastDot) + options.outputExtension;

			fs.mkdirSync(path.dirname(outputPath), { recursive: true });
			fs.writeFileSync(outputPath, output);
		}
	}
}

export function* iterateDirectory(dir: string): Generator<string> {
	const entries = fs.readdirSync(dir, { withFileTypes: true });

	for (const entry of entries) {
		const fullPath = path.join(dir, entry.name);

		if (entry.isDirectory()) {
			// Recur into the directory
			yield* iterateDirectory(fullPath);
		} else {
			// Yield file path
			yield fullPath;
		}
	}
}
