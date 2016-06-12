'use babel';
'use strict';

import settings from './settings';
import PapyrusBuildProvider from './build-provider';

export default {
	config: settings,

	provideBuilder() {
		return PapyrusBuildProvider;
	}
};
