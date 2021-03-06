## 1.4
- 1.4.4
	* Fixed the default game dropdown item labels in Atom 1.9.
- 1.4.3
	* Made the game compiler validity notification not appear when the provider is being loaded and the config file has the compiler specified
- 1.4.2
	* Made the current working directory for the compiler execution the directory of the compiler instead of the directory of the project/config file to work around an issue with the compiler
- 1.4.1
	* Updated readme with badges, some reformatting, and information about project file `release` and `final` values still being taken into account for the build targets
- 1.4.0
	* Added release and final release build targets for both project file and config file builds (but not for Skyrim)
	* Disabled project file builds for Skyrim
	* Added loads more information to the readme

## 1.3
- 1.3.0
	* Added the ability to choose between the project file or the config file when both are fully usable (`build:select-active-target` to select)
	* Fixed errors when the config file is empty
	* Lots of code restructuring and cleanup

## 1.2
- 1.2.5
	* Removed an incorrect space in the output default in readme (whoops, gotta make sure that documentation is accurate)
- 1.2.4
	* Removed slash from default output (was "./", now ".")
	* Minor code restructuring
- 1.2.3
	* Fixed compiler overriding for project file builds
- 1.2.2
	* Added changelog
- 1.2.1
	* Added new config file formats to readme
	* Added example config file to readme
- 1.2.0
	* Added support for CSON and YAML config files
	* Changed config file name to `.build-papyrus.json`, `.build-papyrus.cson`, or `.build-papyrus.yml`
	* Made the config file able to override the game and compiler path even when using a project file
	* Made the config file loading error messages a bit more useful

## 1.1
- 1.1.0
	* Added config file compilation (`.papyrus.json`)
	* Added Skyrim compiler path setting
	* Renamed the Fallout 4 compiler setting identifier (requires you to set it again)
	* Restructured code

## 1.0
- 1.0.3
	* Minor text changes
- 1.0.2
	* Added usage information to readme
- 1.0.1
	* Minor text changes
- 1.0.0
	* It's the first release, what's there to say?
