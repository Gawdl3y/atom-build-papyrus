'use babel';
'use strict';

import fs from 'fs';
import path from 'path';
import EventEmitter from 'events';
import { CompositeDisposable } from 'atom';
import { GAMES, GAME_UNKNOWN, ERROR_MATCH, loadConfigFile, validateGameCompiler } from './util';

// Build modes
export const MODE_CONFIG = 0;
export const MODE_PROJECT = 1;

export default class PapyrusBuildProvider extends EventEmitter {
	constructor(cwd) {
		super();

		// Initialise all the things
		this.cwd = cwd;
		this.mode = MODE_CONFIG;
		this.game = GAME_UNKNOWN;
		this.configFile = null;
		this.projectFile = null;
		this.disposables = new CompositeDisposable();
		this.fileWatchers = [];

		// Add listeners for game compiler settings to refresh the build targets
		GAMES.forEach((game, index, array) => {
			if(index === 0) return;
			this.disposables.add(atom.config.onDidChange('build-papyrus.' + game.slug + 'CompilerPath', (newValue) => {
				if(this.game === index && this.validateGameCompiler(false)) this.emit('refresh');
			}));
		});

		// Listen for the default game changing for projects
		this.disposables.add(atom.config.onDidChange('build-papyrus.defaultGame', (newValue) => {
			if(this.mode === MODE_PROJECT) this.emit('refresh');
		}));
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
			if(this.configFile) this.config = loadConfigFile(this.configFile);
			if(this.config) {
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
				this.config = {};
				if(this.mode === MODE_PROJECT && !this.setGameFromDefault()) return reject(new Error('Invalid default game in build-papyrus settings.'));
			}

			if(this.game === GAME_UNKNOWN || this.validateGameCompiler()) {
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

					return resolve([ this.makeBuildConfig(args) ]);
				} else if(this.mode === MODE_PROJECT) {
					return resolve([ this.makeBuildConfig([ this.projectFile ]) ]);
				}
			}

			return reject(new Error('Invalid ' + GAMES[this.game].title + ' compiler path.'));
		});
	}

	makeBuildConfig(args) {
		return {
			exec: this.game === GAME_UNKNOWN || this.config.compiler ? this.config.compiler : atom.config.get('build-papyrus.' + GAMES[this.game].slug + 'CompilerPath'),
			cwd: this.cwd,
			sh: false,
			args: args,
			errorMatch: ERROR_MATCH
		};
	}

	validateGameCompiler(showNotification = true) {
		return validateGameCompiler(this.game, showNotification);
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
}
