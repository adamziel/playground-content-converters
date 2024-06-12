import * as fs from 'fs';
import * as path from 'path';

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
