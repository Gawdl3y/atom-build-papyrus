'use babel';
'use strict';

import fs from 'fs';
import path from 'path';
import EventEmitter from 'events';

const MODE_PROJECT = 0;
const MODE_CONFIG = 1;

const GAMES = [
	{ title: 'Fallout 4', slug: 'f4' },
	{ title: 'Skyrim', slug: 'sk' }
];
const GAME_FALLOUT4 = 0;
const GAME_SKYRIM = 1;

export default class PapyrusBuildProvider extends EventEmitter {
	constructor(cwd) {
		super();

		// Add listeners for game compiler settings to notify of validity
		this.disposables = [];
		GAMES.forEach((game, index, array) => {
			this.disposables.push(atom.config.onDidChange('build-papyrus.' + game.slug + 'CompilerPath', () => {
				if(this.doesCompilerExist(index) && this.game === index) this.emit('refresh');
			}));
		});

		// Initialise all the things
		this.cwd = cwd;
		this.mode = null;
		this.game = null;
		this.file = null;
		this.gameNotifications = [null, null];
		this.fileWatchers = [];
	}

	destructor() {
		this.disposables.forEach((disposable, index, array) => {
			disposable.dispose();
			delete array[index];
		});
		this.closeFileWatchers();
	}

	getNiceName() {
		return 'Papyrus';
	}

	isEligible() {
		this.file = null;
		this.closeFileWatchers();

		const files = fs.readdirSync(this.cwd);
		for(const fileName of files) {
			const filePath = path.join(this.cwd, fileName);
			if(path.extname(fileName).toLowerCase() === '.ppj' && fs.statSync(filePath).isFile()) {
				this.mode = MODE_PROJECT;
				this.game = GAME_FALLOUT4;
				this.file = filePath;
				return true;
			} else if(path.basename(fileName) === '.papyrus.json' && fs.statSync(filePath).isFile()) {
				this.mode = MODE_CONFIG;
				this.game = GAME_SKYRIM;
				this.file = filePath;
				this.fileWatchers.push(fs.watch(this.file, () => this.emit('refresh')));
				return true;
			}
		}

		return false;
	}

	settings() {
		return new Promise((resolve, reject) => {
			if(this.doesCompilerExist(this.game)) {
				if(this.mode === MODE_PROJECT) {
					// Handle Papyrus project file compilation
					const compiler = atom.config.get('build-papyrus.f4CompilerPath');
					return resolve([{
						exec: compiler,
						cwd: this.cwd,
						sh: false,
						args: [
							this.file
						],
						env: {},
						errorMatch: '\n(?<file>[A-Za-z0-9_:\\-\\.\\/ \\\\]+\\.(psc|PSC))\\((?<line>[0-9]+),(?<col>[0-9]+)\\): (?<message>.+)'
					}]);
				} else if(this.mode === MODE_CONFIG) {
					// Handle config file compilation
					return reject(new Error('Config file compilation is not yet implemented.'));
				}
			}

			return reject(new Error('Invalid Papyrus compiler path.'));
		});
	}

	doesCompilerExist(game = -1, showNotification = true) {
		if(game === -1) game = this.game;
		const compiler = game === GAME_FALLOUT4 ? atom.config.get('build-papyrus.f4CompilerPath') : atom.config.get('build-papyrus.skCompilerPath');
		let compilerExists = false;
		try {
			compilerExists = fs.statSync(compiler).isFile();
		} finally {
			if(showNotification) {
				if(!compilerExists) {
					// Path is invalid; show notification
					if(!this.gameNotifications[game]) {
						this.gameNotifications[game] = atom.notifications.addError('The ' + GAMES[game].title + ' compiler path is not a valid file. Make sure it\'s the full path to the executable.', {
							dismissable: true,
							buttons: [{
								text: 'Open settings',
								onDidClick: () => atom.workspace.open('atom://config/packages/build-papyrus')
							}]
						});
						this.gameNotifications[game].onDidDismiss(() => { this.gameNotifications[game] = null; });
					}
				} else {
					// Path is valid; remove the notification
					if(this.gameNotifications[game]) this.gameNotifications[game].dismiss();
				}
			}
			return compilerExists;
		}
	}

	closeFileWatchers() {
		this.fileWatchers.forEach((watcher, index, array) => {
			watcher.close();
			delete array[index];
		});
	}
}
