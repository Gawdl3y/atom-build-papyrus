'use babel';
'use strict';

import { CompositeDisposable } from 'atom';
import settings from './settings';
import PapyrusBuildProvider from './build-provider';
import { GAMES, validateGameCompiler } from './util';

let compilerDisposables;

export default {
	config: settings,

	activate() {
		// Listen for game compiler setting changes to validate them
		if(!compilerDisposables) {
			compilerDisposables = new CompositeDisposable();
			GAMES.forEach((game, index, array) => {
				if(index === 0) return;
				compilerDisposables.add(atom.config.onDidChange('build-papyrus.' + game.slug + 'CompilerPath', (newValue) => {
					validateGameCompiler(index);
				}));
			});
		}
	},

	deactivate() {
		compilerDisposables.dispose();
		compilerDisposables = null;
	},

	provideBuilder() {
		return PapyrusBuildProvider;
	}
};
