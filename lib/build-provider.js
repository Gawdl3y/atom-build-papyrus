'use babel';
'use strict';

import fs from 'fs';
import path from 'path';
import EventEmitter from 'events';
import { CompositeDisposable } from 'atom';

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
		this.disposables = new CompositeDisposable();
		GAMES.forEach((game, index, array) => {
			if(index === 0) return;
			this.disposables.add(atom.config.onDidChange('build-papyrus.' + game.slug + 'CompilerPath', (newValue) => {
				if(this.doesCompilerExist(index) && this.game === index) this.emit('refresh');
			}));
		});

		// Listen for the default game changing for projects
		this.disposables.add(atom.config.onDidChange('build-papyrus.defaultGame', (newValue) => {
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
		this.disposables.dispose();
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
				const baseName = path.basename(fileName);
				if(!this.configFile && (baseName === '.build-papyrus.json' || baseName === '.build-papyrus.cson' || baseName === '.build-papyrus.yml')) {
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
			if(this.configFile) {
				this.config = PapyrusBuildProvider.loadConfigFile(this.configFile);

				if(this.game === GAME_UNKNOWN) {
					if(this.mode === MODE_CONFIG && !this.config.game && !this.config.compiler) return reject(new Error('Either "game" or "compiler" must be specified in the Papyrus config file.'));

					// Get the game from the config
					if(this.config.game) {
						this.config.game = this.config.game.toLowerCase();
						this.game = GAMES.findIndex(game => game.slug === this.config.game);
						if(this.game === -1) {
							this.game = GAME_UNKNOWN;
							return reject(new Error('Invalid "game" specified in the Papyrus config file. Must be one of "skyrim" or "fallout4".'));
						}
					}

					// Get the default game for projects
					if(this.game === GAME_UNKNOWN && this.mode === MODE_PROJECT) {
						if(!this.setGameFromDefault()) return reject(new Error('Invalid default game in build-papyrus settings'));
					}
				}

				// If the game is still unknown or the compiler setting is set, validate the custom compiler
				if(this.game === GAME_UNKNOWN || this.config.compiler) {
					try {
						if(!this.config.compiler || !fs.statSync(this.config.compiler).isFile()) {
							return reject(new Error('"compiler" must be specified and a valid path to a file in the Papyrus config file since "game" isn\'t specified.'));
						}
					} catch(e) {
						return reject(new Error('"compiler" must be a valid path to a file in the Papyrus config file.'));
					}
				}
			} else {
				// Get the default game for projects
				if(this.mode === MODE_PROJECT) {
					if(!this.setGameFromDefault()) return reject(new Error('Invalid default game in build-papyrus settings.'));
				}
			}

			if(this.game === GAME_UNKNOWN || this.doesCompilerExist()) {
				if(this.mode === MODE_CONFIG) {
					// Validate some stuff
					if(!Array.isArray(this.config.imports)) return reject(new Error('"imports" must be specified as an array in the Papyrus config file.'));
					if(this.config.output && !fs.statSync(this.config.output).isDirectory()) return reject(new Error('"output" must be a valid directory in the Papyrus config file.'));
					if(this.game === GAME_UNKNOWN && !this.config.flags) return reject(new Error('"flags" must be specified in the Papyrus config file.'));

					// Build arguments array
					const args = [
						'{FILE_ACTIVE}',
						'-import=' + this.config.imports.join(';'),
						'-output=' + (this.config.output ? this.config.output : '.'),
						'-flags=' + (this.game === GAME_UNKNOWN || this.config.flags ? this.config.flags : GAMES[this.game].flags)
					];
					if(typeof this.config.optimize === 'undefined' || this.config.optimize) args.push('-optimize');
					if(this.config.release) args.push('-release');
					if(this.config.final) args.push('-final');

					// Make build configuration
					return resolve([{
						exec: this.game === GAME_UNKNOWN || this.config.compiler ? this.config.compiler : atom.config.get('build-papyrus.' + GAMES[this.game].slug + 'CompilerPath'),
						cwd: this.cwd,
						sh: false,
						args: args,
						errorMatch: ERROR_MATCH
					}]);
				} else if(this.mode === MODE_PROJECT) {
					// Make Papyrus project file build configuration
					return resolve([{
						exec: this.game === GAME_UNKNOWN || this.config.compiler ? this.config.compiler : atom.config.get('build-papyrus.' + GAMES[this.game].slug + 'CompilerPath'),
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
		if(this.game === -1) {
			this.game = GAME_UNKNOWN;
			return false;
		}
		return true;
	}

	closeFileWatchers() {
		this.fileWatchers.forEach((watcher, index, array) => {
			watcher.close();
			delete array[index];
		});
	}

	static loadConfigFile(configFile) {
		switch(path.extname(configFile)) {
			case '.json':
				return JSON.parse(fs.readFileSync(configFile));
			case '.cson':
				return require('cson-parser').parse(fs.readFileSync(configFile));
			case '.yml':
				return require('js-yaml').safeLoad(fs.readFileSync(configFile));
			default:
				return null;
		}
	}
}
