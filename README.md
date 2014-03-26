#optimusjs

> Javascript Optimizer, wraps grunt-contrib-requirejs and several other packages to generate carefully optimized JS by environment with a convention over configuration approach (Very Alpha)

## Getting Started
This plugin requires Grunt `~0.4.0`

This plugin requires Grunt `~0.4.0`

If you haven't used [Grunt](http://gruntjs.com/) before, be sure to check out the [Getting Started](http://gruntjs.com/getting-started) guide, as it explains how to create a [Gruntfile](http://gruntjs.com/sample-gruntfile) as well as install and use Grunt plugins. Once you're familiar with that process, you may install this plugin with this command:

```shell
npm install grunt-optimusjs --save-dev
```

Once the plugin has been installed, it may be enabled inside your Gruntfile with this line of JavaScript:

```js
grunt.loadNpmTasks('grunt-optimusjs');
```

*This plugin was designed to work with Grunt 0.4.x. If you're still using grunt v0.3.x it's strongly recommended that [you upgrade](http://gruntjs.com/upgrading-from-0.3-to-0.4), but in case you can't please use [v0.3.3](https://github.com/gruntjs/grunt-contrib-requirejs/tree/grunt-0.3-stable).*



## optimus task
_Run this task with the `grunt optimus` command._

Task targets and options may be specified according to the grunt [Configuring tasks](http://gruntjs.com/configuring-tasks) guide.
### Options

```js
{
	global: 'global', // Global Module Name
	src: false, // FROM
	dest: false, // TO
	jsDir: 'js', // The folder path for JS modules
	target: 'requirepaths.out', // Output file
	partialPrefix: '_', // Pattern for files to not compile
	configSuffix: '.config.json', // Pattern for per module config
	config: false, // Path to RJS configuration JSON
	integrateWatch: false, // Whether to integrate with watch task
	watchID: 'optimusjs', // What ID to use if integrating with watch task
	integrateJSHint: false, // Whether to integrate with JSHint watch task
	jshintID: 'optimusjshint', // What ID to use if integrating with JSHint watch task
	tasks: false, // Tasks to execute after requirejs but before optimus-post
	automaticPost: true, // Whether to automatically call optimus-post
	automaticRequire: true, // Whether to automatically call require if compiling
	automaticRev: false, // Whether to automatically call filerev
	automaticJSHint: false, // Whether to automatically call jshint
	compile: false, // Whether to actually compile, or just to copy
	requireOptions:{}, // Any overrides for require defaults
	excludesInPartials:[], // Modules to exclude from all partial compiles
	excludesInGlobal:[], // Modules to exclude from global module compile
	excludes:[], // Modules to exclude from both
	excludePaths:['exclude'], // Paths not to search for modules
	optimize:'none', // none or uglify
	nextSteps:[] // Any further tasks to run after process is completed
}
```

## qloader task
_Run this task with the `grunt qloader` command._

Task targets and options may be specified according to the grunt [Configuring tasks](http://gruntjs.com/configuring-tasks) guide.
### Options

```js
{
	useAlmond:false, // Whether to inject Almond
	injectGlobalModule:false, // Whether to inject the global module
	useFileRev:false, // Whether to pull filerev manifest paths
	target:false, // The output file path
	ssi:false, // The SSI include file path
	basePath:false, // The folder to which target and ssi are relative
	disableLogging:false // Whether to disable logging
}
```



### Usage Examples

```js
module.exports={
	dev:{
		options:{
			useAlmond:false,
			injectGlobalModule:false,
			useFileRev:false,
			basePath:'test/www/',
			target:'js/qloader.js',
			ssi:'hashes/js/qloader.js.incl',
			disableLogging:false,
			
			paths:{
				global:'test/www/js/global.js',
				config:'test/www/js/requirepaths.out'
			}
		}
	},
	dist:{
		options:{
			useAlmond:true,
			injectGlobalModule:true,
			useFileRev:true,
			basePath:'test/www/',
			target:'js/qloader.js',
			ssi:'hashes/js/qloader.js.incl',
			disableLogging:true,
			
			paths:{
				global:'test/www/js/global.js',
				config:'test/www/js/requirepaths.out'
			}
		}
	}
};
```
