'use babel';
'use strict';

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
			this.disposables = [];
			this.disposables.push(atom.config.onDidChange('build-papyrus.f4CompilerPath', () => {
				if(this.doesCompilerExist(true)) this.emit('refresh');
			}));
		}

		destructor() {
			this.disposables.forEach((disposable, index, array) => {
				disposable.dispose();
				delete array[index];
			});
		}

		getNiceName() {
			return 'papyrus';
		}

		isEligible() {
			const files = fs.readdirSync(this.cwd);
			for(const fileName of files) {
				const filePath = path.join(this.cwd, fileName);
				if(path.extname(fileName).toLowerCase() === '.ppj' && fs.statSync(filePath).isFile()) {
					this.projectFile = filePath;
					return true;
				}
			}
			this.projectFile = null;
			return false;
		}

		settings() {
			return new Promise((resolve, reject) => {
				if(this.doesCompilerExist(true)) {
					const compiler = atom.config.get('build-papyrus.f4CompilerPath');
					return resolve([{
						exec: compiler,
						cwd: this.cwd,
						sh: false,
						args: [
							this.projectFile
						],
						env: {},
						errorMatch: '\n(?<file>[A-Za-z0-9_:\\-\\.\\/ \\\\]+\\.(psc|PSC))\\((?<line>[0-9]+),(?<col>[0-9]+)\\): (?<message>.+)'
					}]);
				}

				return reject(new Error('Invalid Papyrus compiler path.'));
			});
		}

		doesCompilerExist(showNotification = false) {
			const compiler = atom.config.get('build-papyrus.f4CompilerPath');
			let compilerExists = false;
			try {
				compilerExists = fs.statSync(compiler).isFile();
			} finally {
				if(showNotification) {
					if(!compilerExists) {
						// Path is invalid; show notification
						if(!this.notification) {
							this.notification = atom.notifications.addError('The Papyrus compiler path is not a valid file. Make sure it\'s the full path to the executable.', {
								dismissable: true,
								buttons: [{
									text: 'Open settings',
									onDidClick: () => atom.workspace.open('atom://config/packages/build-papyrus/f4CompilerPath')
								}]
							});
							this.notification.onDidDismiss(() => { this.notification = null; });
						}
					} else {
						// Path is valid; remove the notification
						if(this.notification) {
							this.notification.dismiss();
							this.notification = null;
						}
					}
				}
				return compilerExists;
			}
		}
	};
}
