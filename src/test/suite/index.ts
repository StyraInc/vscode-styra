import * as glob from 'glob';
import * as Mocha from 'mocha';
import * as path from 'path';

// 2023-01-15 removed mocha and @types/mocha packages so these integration testd will no longer run.
// Why? Because of conflicts with jest (reference: https://stackoverflow.com/a/64202454)
// that manifested as a series of errors in the Github check a la:
//   Error: node_modules/@types/jest/index.d.ts(34,13): error TS2403: Subsequent variable declarations must have the same type.
//            Variable 'beforeEach' must be of type 'HookFunction', but here has type 'Lifecycle'.
// Can switch this over to jest down the road, per Soloydenko's article
// (https://medium.com/@soloydenko/end-to-end-testing-vs-code-extensions-via-jest-828e5edfeb75)
// Also see https://stackoverflow.com/q/49615315

export function run(): Promise<void> {
	// Create the mocha test
	const mocha = new Mocha({
		ui: 'tdd',
		color: true
	});

	const testsRoot = path.resolve(__dirname, '..');

	return new Promise((c, e) => {
		glob('**/**.test.js', { cwd: testsRoot }, (err, files) => {
			if (err) {
				return e(err);
			}

			// Add files to the test suite
			files.forEach(f => mocha.addFile(path.resolve(testsRoot, f)));

			try {
				// Run the mocha test
				mocha.run(failures => {
					if (failures > 0) {
						e(new Error(`${failures} tests failed.`));
					} else {
						c();
					}
				});
			} catch (err) {
				console.error(err);
				e(err);
			}
		});
	});
}
