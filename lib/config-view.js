'use babel';
'use strict';

import { View, TextEditorView, SelectListView } from 'atom-space-pen-views';

export default class ConfigView extends View {
	initialize(cwd, file, emitter) {
		this.panel = null;
		this.cwd = cwd;
		this.file = file;
		this.emitter = emitter;
	}

	content() {
		this.div({ class: 'build-papyrus' }, () => {
			this.label('Game');
			this.subview('game', new SelectListView());

			this.label('Compiler');
			this.subview('compiler', new TextEditorView({ mini: true }));

			this.label('Imports');
			this.div({ class: 'build-papyrus-imports' }, () => {

			});

			this.label('Output');
			this.subview('output', new TextEditorView({ mini: true }));

			this.label('Flags');
			this.subview('flags', new TextEditorView({ mini: true }));

			this.div(() => {
				this.label('Optimize', () => {
					this.input({ type: 'checkbox', outlet: 'optimize' });
				});
			});

			this.div(() => {
				this.label('Release', () => {
					this.input({ type: 'checkbox', outlet: 'release' });
				});
			});

			this.div(() => {
				this.label('Final', () => {
					this.input({ type: 'checkbox', outlet: 'final' });
				});
			});

			this.div({ class: 'block pull-right' }, () => {
				this.button({ class: 'inline-block-tight btn', outlet: 'cancelButton', click: 'close' }, 'Cancel');
				this.button({ class: 'inline-block-tight btn', outlet: 'saveButton', click: 'confirm' }, 'Save');
			});
		});
	}

	attach() {
		super.attach();
		if(!this.panel) this.panel = atom.workspace.addModalPanel({ item: this });
	}

	close() {
		this.detach();
		this.panel.destroy();
		this.panel = null;
		this.disposables.dispose();
	}
}
