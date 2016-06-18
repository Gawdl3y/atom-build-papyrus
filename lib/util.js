'use babel';
'use strict';

import fs from 'fs';
import path from 'path';

// Games and game indices
export const GAMES = [
	{ title: 'Unknown', slug: 'unknown', flags: '' },
	{ title: 'Skyrim', slug: 'skyrim', flags: 'TESV_Papyrus_Flags.flg' },
	{ title: 'Fallout 4', slug: 'fallout4', flags: 'Institute_Papyrus_Flags.flg' }
];
export const GAME_UNKNOWN = 0;
export const GAME_SKYRIM = 1;
export const GAME_FALLOUT4 = 2;

// The error match string for the Papyrus compiler's output
export const ERROR_MATCH = '\n(?<file>[A-Za-z0-9_:\\-\\.\\/ \\\\]+\\.(psc|PSC))\\((?<line>[0-9]+),(?<col>[0-9]+)\\): (?<message>.+)';

// Load a config file with JSON, CSON, or YAML
export function loadConfigFile(configFile) {
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

// Validate a game's compiler path, and handle notifying of its validity
const compilerNotifications = new Array(GAMES.length);
export function validateGameCompiler(game, showNotification = true) {
	if(game === GAME_UNKNOWN) return false;
	const compiler = atom.config.get('build-papyrus.' + GAMES[game].slug + 'CompilerPath');
	let compilerExists = false;
	try {
		compilerExists = fs.statSync(compiler).isFile();
	} finally {
		if(showNotification) {
			if(!compilerExists) {
				// Path is invalid; show notification
				if(!compilerNotifications[game]) {
					compilerNotifications[game] = atom.notifications.addError('The ' + GAMES[game].title + ' compiler path is not a valid file. Make sure it\'s the full path to the executable.', {
						dismissable: true,
						buttons: [{
							text: 'Open settings',
							onDidClick: () => atom.workspace.open('atom://config/packages/build-papyrus')
						}]
					});
					compilerNotifications[game].onDidDismiss(() => { compilerNotifications[game] = null; });
				}
			} else {
				// Path is valid; remove the notification
				if(compilerNotifications[game]) compilerNotifications[game].dismiss();
			}
		}
		return compilerExists;
	}
}
