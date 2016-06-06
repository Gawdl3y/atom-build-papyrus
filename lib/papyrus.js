'use babel';

import fs from 'fs';
import path from 'path';
import EventEmitter from 'events';

export const config = {
	f4CompilerPath: {
		title: 'Compiler path',
		description: 'The full path to the Fallout 4 `Papyrus Compiler.exe`',
		type: 'string',
		default: 'C:\\Program Files (x86)\\Steam\\SteamApps\\common\\Fallout 4\\Papyrus Compiler\\PapyrusCompiler.exe'
	}
};

export function provideBuilder() {
	return class PapyrusBuildProvider extends EventEmitter {
		constructor(cwd) {
			super();
			this.cwd = cwd;
		}

		getNiceName() {
			return 'Papyrus';
		}

		isEligible() {
			const files = fs.readdirSync(this.cwd);
			for(const fileName of files) {
				const filePath = path.join(this.cwd, fileName);
				if(path.extname(fileName).toLowerCase() === '.ppj' && fs.lstatSync(filePath).isFile()) {
					this.projectFile = filePath;
					return true;
				}
			}
			this.projectFile = null;
			return false;
		}

		settings() {
			return new Promise((resolve, reject) => {
				return resolve([{
					exec: atom.config.get('build-papyrus.f4CompilerPath'),
					cwd: this.cwd,
					sh: false,
					args: [
						this.projectFile
					],
					env: {},
					errorMatch: '\n(?<file>[A-Za-z0-9_:\\-\\.\\/ \\\\]+\\.(psc|PSC))\\((?<line>[0-9]+),(?<col>[0-9]+)\\): (?<message>.+)'
				}]);
			});
		}
	};
}
