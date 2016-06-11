'use babel';
'use strict';

import config from './config';
import PapyrusBuildProvider from './build-provider';

export default {
	config: config,

	provideBuilder() {
		return PapyrusBuildProvider;
	}
};
