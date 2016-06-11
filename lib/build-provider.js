'use babel';
'use strict';

import fs from 'fs';
import path from 'path';
import EventEmitter from 'events';

// Build modes
export const MODE_CONFIG = 0;
export const MODE_PROJECT = 1;

// Games and game indices
export const GAMES = [
	{ title: 'Unknown', slug: 'unknown', flags: '' },
	{ title: 'Skyrim', slug: 'skyrim', flags: 'TESV_Papyrus_Flags.flg' },
	{ title: 'Fallout 4', slug: 'fallout4', flags: 'Institute_Papyrus_Flags.flg' }
];
export const GAME_UNKNOWN = 0;
export const GAME_SKYRIM = 1;
export const GAME_FALLOUT4 = 2;

// The error match string for the compiler output
const ERROR_MATCH = '\n(?<file>[A-Za-z0-9_:\\-\\.\\/ \\\\]+\\.(psc|PSC))\\((?<line>[0-9]+),(?<col>[0-9]+)\\): (?<message>.+)';

export default class PapyrusBuildProvider extends EventEmitter {
	constructor(cwd) {
		super();

		// Add listeners for game compiler settings to notify of validity
		this.disposables = [];
		GAMES.forEach((game, index, array) => {
			if(index === 0) return;
			this.disposables.push(atom.config.onDidChange('build-papyrus.' + game.slug + 'CompilerPath', () => {
				if(this.doesCompilerExist(index) && this.game === index) this.emit('refresh');
			}));
		});

		// Listen for the default game changing for projects
		this.disposables.push(atom.config.onDidChange('build-papyrus.defaultGame', (newValue) => {
			if(this.mode === MODE_PROJECT) this.emit('refresh');
		}));

		// Initialise all the things
		this.cwd = cwd;
		this.mode = MODE_CONFIG;
		this.game = GAME_UNKNOWN;
		this.configFile = null;
		this.projectFile = null;
		this.gameNotifications = [null, null, null];
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
		this.configFile = null;
		this.projectFile = null;
		this.closeFileWatchers();

		// Search for .papyrus.json and Papyrus project files
		const files = fs.readdirSync(this.cwd);
		for(const fileName of files) {
			const filePath = path.join(this.cwd, fileName);
			if(fs.statSync(filePath).isFile()) {
				if(!this.configFile && path.basename(fileName) === '.papyrus.json') {
					this.configFile = filePath;
					this.fileWatchers.push(fs.watch(this.configFile, () => this.emit('refresh')));
				} else if(!this.projectFile && path.extname(fileName).toLowerCase() === '.ppj') {
					this.projectFile = filePath;
				}
			}
		}

		// Decide what mode we'll use
		this.game = GAME_UNKNOWN;
		if(this.projectFile) {
			this.mode = MODE_PROJECT;
			return true;
		} else if(this.configFile) {
			this.mode = MODE_CONFIG;
			return true;
		}

		return false;
	}

	settings() {
		return new Promise((resolve, reject) => {
			// Parse config file if necessary
			if(this.game === GAME_UNKNOWN) {
				if(this.configFile) {
					this.config = JSON.parse(fs.readFileSync(this.configFile));
					if(this.mode === MODE_CONFIG && !this.config.game && !this.config.compiler) return reject(new Error('Either game or compiler must be specified in .papyrus.json.'));

					// Get the game from the config
					if(this.config.game) {
						this.config.game = this.config.game.toLowerCase();
						this.game = GAMES.findIndex(obj => obj.slug === this.config.game);
						if(this.game === -1) return reject(new Error('Invalid game specified in .papyrus.json.'));
					} else {
						this.game = GAME_UNKNOWN;
					}

					// Get the default game for projects
					if(this.game === GAME_UNKNOWN && this.mode === MODE_PROJECT) {
						if(!this.setGameFromDefault()) return reject(new Error('Invalid default game in build-papyrus settings'));
					}

					// If the game is still unknown, we need a custom compiler path at the very least
					if(this.game === GAME_UNKNOWN) {
						if(!(this.config.compiler && fs.statSync(this.config.compiler).isFile())) return reject(new Error('Invalid compiler path in .papyrus.json.'));
					}
				} else {
					// Get the default game for projects
					if(this.mode === MODE_PROJECT) {
						if(!this.setGameFromDefault()) return reject(new Error('Invalid default game in build-papyrus settings'));
					}
				}
			}

			if(this.game === GAME_UNKNOWN || this.doesCompilerExist()) {
				if(this.mode === MODE_CONFIG) {
					// Validate some stuff
					if(!Array.isArray(this.config.imports)) return reject(new Error('Imports must be specified as an array in .papyrus.json.'));
					if(this.config.output && !fs.statSync(this.config.output).isDirectory()) return reject(new Error('Output must be a valid directory in .papyrus.json.'));
					if(this.game === GAME_UNKNOWN && !this.config.flags) return reject(new Error('Flags must be specified in .papyrus.json.'));

					// Build arguments array
					const args = [
						'{FILE_ACTIVE}',
						'-import=' + this.config.imports.join(';'),
						'-output=' + (this.config.output ? this.config.output : './'),
						'-flags=' + (this.game === GAME_UNKNOWN || this.config.flags ? this.config.flags : GAMES[this.game].flags)
					];
					if(typeof this.config.optimize === 'undefined' || this.config.optimize) args.push('-optimize');
					if(this.config.release) args.push('-release');
					if(this.config.final) args.push('-final');

					// Make build configuration
					return resolve([{
						exec: this.game !== GAME_UNKNOWN ? atom.config.get('build-papyrus.' + GAMES[this.game].slug + 'CompilerPath') : this.config.compiler,
						cwd: this.cwd,
						sh: false,
						args: args,
						errorMatch: ERROR_MATCH
					}]);
				} else if(this.mode === MODE_PROJECT) {
					// Make Papyrus project file build configuration
					return resolve([{
						exec: this.game !== GAME_UNKNOWN ? atom.config.get('build-papyrus.' + GAMES[this.game].slug + 'CompilerPath') : this.config.compiler,
						cwd: this.cwd,
						sh: false,
						args: [ this.projectFile ],
						errorMatch: ERROR_MATCH
					}]);
				}
			}

			return reject(new Error('Invalid ' + GAMES[this.game].title + ' compiler path.'));
		});
	}

	doesCompilerExist(game = -1, showNotification = true) {
		if(game === -1) game = this.game;
		if(game === GAME_UNKNOWN) return false;
		const compiler = atom.config.get('build-papyrus.' + GAMES[game].slug + 'CompilerPath');
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

	setGameFromDefault() {
		const defaultGame = atom.config.get('build-papyrus.defaultGame');
		this.game = GAMES.findIndex(obj => obj.slug === defaultGame);
		return this.game !== -1;
	}

	closeFileWatchers() {
		this.fileWatchers.forEach((watcher, index, array) => {
			watcher.close();
			delete array[index];
		});
	}
}
