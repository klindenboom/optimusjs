/*
 * grunt-optimusjs
 * RequireJS configuration generator
 *
 * Copyright (c) 2014 Arne Strout, contributors
 * Licensed under the MIT license.
 */

'use strict';
// Required Modules
var path = require('path');
var fs = require('fs');
var colors = require('colors');
var prettyjson=require('prettyjson');
var merge = require('merge');
var mkpath = require('mkpath');
var util = require('util');

module.exports=function(grunt){
	/**
	_getModuleMeta(filepath)
	@param string filepath The path to an AMD module file.
	@returns object The metadata for that AMD module (module id and RJS relative path for paths object)
	**/
	function _getModuleMeta(filepath,options){
		var relativePath = path.relative(options.src,filepath);
		var modulePath = path.relative(path.join(options.src,options.jsDir),filepath);
		var isPartial = path.basename(filepath).substr(0,options.partialPrefix.length) === options.partialPrefix;
		relativePath = path.join(path.dirname(relativePath),path.basename(relativePath,'.js'));
		var modname= path.basename(modulePath,'.js');
		if(isPartial){
			modname=modname.substr(options.partialPrefix.length);
		}
		modulePath=path.join(path.dirname(modulePath),modname);
		var isGlobal = path.normalize(modulePath) == path.normalize(options.global);

		return {
			path:relativePath,
			id:modulePath,
			isPartial:isPartial,
			isGlobal:isGlobal
		};
	}

	/**
	_getFileDependencies(files,deps,options,cfg)
	Recursively collect dependencies of a file or set of files
	@param array files An array of filenames
	@param deps 
	**/
	function _getFileDependencies(files,deps,options,cfg){
		var i=0,dep,meta;
		while(i<deps.length){
			dep=deps[i];
			if(files.indexOf(dep)<0){
				files.push(dep);
				meta = _getModuleData(dep,options);
				files=_getFileDependencies(files,cfg.dependencies[meta.id],options,cfg);
			}
			i++;
		}
		return files;
	}

	/**
	_onWatchEvent(action,filepath,target)
	Callback for watch events, triggered when JS files are changed.
	This allows optimus to watch and conditionally update files on change.
	**/
	var _onWatchEvent=function(action,filepath,target,wid){
		// Only perform optimizations for optimus JS targets
		if(target == wid[1]){
			var t=wid[1].split('-');
			t=t[t.length-1]; // TODO: assumes that there are no dashes in the name eg: ':dev' not ':op-dev'
			var cfg=grunt.config.get(['optimus',t]);
			cfg.watchcall=action;
			cfg.watchtarget=filepath;
			grunt.config.set(['optimus',t],cfg);

			// JSHint only this file
			if(typeof(cfg.options.jshintID)!=='undefined' && typeof(cfg.options.integrateJSHint)!=='undefined' && cfg.options.integrateJSHint){
				grunt.config(['jshint',cfg.options.jshintID],filepath);
			}
			grunt.log.writeln("OptimusJS: Watch Event fired for: "+target);
		}
	};

	/**
	grunt-optimusjs - optimus task
	Generates rjs configuration data dynamically based on convention.
	**/
	grunt.registerMultiTask('optimus','Build r.js configurations, convention over configuration approach',function(){
		var options = merge({
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
			watchTasks: false, // Array of supplemental tasks to fire on change of file eg: ['qlaoder:dev']
			watchReload: true, // Livereload after update
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
			nextSteps:[], // Any further tasks to run after process is completed
			absolutePaths:true // Whether paths should be relative or absolute
		},this.options());
		var i=0;
		var cfg = grunt.config.get(['optimus',this.target]);
		var rjsConfig = grunt.config.get('requirejs');
		var rjsOptions = typeof(rjsConfig) !== 'undefined'?(rjsConfig.options?rjsConfig.options:{}):{};

		// Inject the excludes into partial and full excludes
		for(i=0;i<options.excludes.length;i++){
			if(options.excludesInPartials.indexOf(options.excludes[i])<0){
				options.excludesInPartials.push(options.excludes[i]);
			}
			if(options.excludesInGlobal.indexOf(options.excludes[i])<0){
				options.excludesInGlobal.push(options.excludes[i]);
			}
		}

		if(!cfg.paths){
			cfg.paths={};
		}

		// If a config file is specified, load it and merge it into the global options for rjs
		if(!cfg.configLoaded && options.config){
			if(typeof(options.config)==='string'){
				var loadedConfig = grunt.file.readJSON(options.config);
				rjsOptions = merge(rjsOptions,loadedConfig);
			}else if(typeof(options.config)==='object'){
				rjsOptions = merge(rjsOptions,options.config);
			}
			if(!rjsOptions.paths){
				rjsOptions.paths={};
			}
			cfg.paths=merge(rjsOptions.paths,cfg.paths);
			cfg.configLoaded = true;
		}
		// Apply any explicit overrides
		if(typeof(options.requireOptions) === 'object'){
			rjsOptions = merge(rjsOptions,options.requireOptions);
		}


		
		var glob=[path.join(options.src,options.jsDir,'**/*.js')];
		for(i=0;i<options.excludePaths.length;i++){
			glob.push('!'+path.join(options.src,options.jsDir,options.excludePaths[i]));
		}

		// All JS files in the target folder
		var files = grunt.file.expand(glob);

		// If first run, or rebuild is needed, rebuild the config paths from scratch
		if(cfg.watchcall!=="changed"){
			// Map Dependencies
			cfg.dependencies={};
			grunt.log.writeln("\n\nOptimusJS".yellow + ": Mapping module dependencies".green);
			files.forEach(function(file){
				var contents = grunt.file.read(file);
				var dependencyRegex = /define\s*\(\s*\[([\s\S]*?)\]/m;
				var dependencies = contents.match(dependencyRegex);
				var meta = _getModuleMeta(file,options);

				// Process dependencies into an array
				if(dependencies && dependencies.length>1){
					dependencies = dependencies[1];
					dependencies = dependencies.replace(/[\n|\t|\"|\'|\s]/g,'');
					dependencies = dependencies.split(',');

					grunt.log.writeln(meta.id.blue+":\n".white+prettyjson.render(dependencies));
				}else{
					dependencies=[];
				}

				// If there are dependencies, add an entry that this module is dependent on them
				if(dependencies.length>0){
					dependencies.forEach(function(dependency){
						if(!cfg.dependencies[dependency]){
							cfg.dependencies[dependency]=[];
						}

						if(cfg.dependencies[dependency].indexOf(file)<0){
							cfg.dependencies[dependency].push(file);
						}
					});
				}

				// If the module being processed is the global module add it's dependencies
				// to the list of those modules excluded in non global modules.
				if(meta.id == options.global){
					for(i=0;i<dependencies.length;i++){
						if(options.excludesInPartials.indexOf(dependencies[i])<0){
							options.excludesInPartials.push(dependencies[i]);
						}
					}
				}
				grunt.log.writeln(">> ".yellow + meta.id + " = ".blue + meta.path);
				cfg.paths[meta.id] = meta.path;
			}); // END: Dependency mapping
		}// END: Rebuild from scratch
		else { // Built from watch task
			// Construct a list of modules to compile
			// Always build Global just in case.
			files=[cfg.watchtarget,path.join(options.src,options.jsDir,options.global+'.js')];
			// Make sure all dependent modules get compiled
			var watchTargetMeta  = _getModuleMeta(cfg.watchtarget,options);
			var watchTargetDeps = cfg.dependencies[watchTargetMeta.id];
			if(watchTargetDeps && watchTargetDeps.length>0){
				files=_getFileDependencies(files,watchTargetDeps,options,cfg);
			}
		}

		/** File list and dependencies complete **/

		// If compile flag is set, generate RequireJS config
		if(options.compile === true){
			grunt.log.writeln("Generating RequireJS configuration for all modules".green);			

			rjsConfig.options=rjsOptions;
			grunt.config.set('requirejs',rjsConfig);
			rjsConfig=grunt.config.get('requirejs');

			// Generate config for each "first level" module
			files.forEach(function(file){
				var mod = _getModuleMeta(file,options);
				if(!mod.isPartial){
					grunt.log.writeln(' >>'.yellow + (mod.id).green + (mod.isGlobal?" :: Is Global Module".yellow:''));
					var o={
						options:{
							baseUrl:'./'+options.src,
							paths:cfg.paths,
							name:mod.id,
							out:path.join(options.dest,mod.path+'.js'),
							optimize:options.optimize,
							exclude:mod.isGlobal?options.excludesInGlobal:options.excludesInPartials
						}
					};

					// If a contextual config file exists, load it, merge it on the left
					if(grunt.file.exists(options.src,mod.path+options.configSuffix)){
						var mcfg=grunt.file.readJSON(path.join(options.src,mod.path+options.configSuffix));
						if(typeof(mcfg) === 'object'){
							o=merge(mcfg,o);
						}
					}

					rjsConfig[mod.id]=o;
				}
			});

			// Update the requirejs configuration
			grunt.config.set('requirejs',rjsConfig);
			// Processing Complete
			grunt.log.writeln("\nOptimusJS: RequireJS Configuration Generated".green);
			grunt.log.writeln("configuration:\n".blue+prettyjson.render(rjsConfig));
		}else{
			// Processing Complete
			grunt.log.writeln("\nOptimusJS: RequireJS Configuration Skipped".green);
			grunt.log.writeln("paths:\n".blue+prettyjson.render(cfg.paths));
		}

		
		// Next Steps
		var nextSteps=options.nextSteps.slice();
		// jshint
		if(options.automaticJSHint){
			nextSteps.push('jshint:'+options.jshintID);
		}
		// requirejs
		if(options.compile && options.automaticRequire){
			nextSteps.push('requirejs');
		}
		// filerev
		if(options.automaticRev){
			nextSteps.push('filerev');
		}
		// optimus-post
		if(options.automaticPost){
			nextSteps.push('optimus-post:'+this.target);
		}
		// If not executing requirejs, just copy all JS files before continuing
		if(!options.compile){
			grunt.log.writeln("\nOptimusJS: Copying JS for development".green);
			files.forEach(function(file){
				var pout = path.join(options.dest,path.relative(path.join(options.src),file));
				grunt.log.writeln(' >>'.yellow + (path.basename(pout)).blue);
				mkpath.sync(path.dirname(pout));
				fs.createReadStream(file).pipe(fs.createWriteStream(pout));
			});
		}
		// If any next steps, run them
		if(nextSteps.length>0){
			grunt.task.run(nextSteps);
		}

		// grunt-contrib-watch integration
		if(typeof(options.watchID) !== 'undefined' && !cfg.watching && typeof(options.integrateWatch) !== 'undefined' && options.integrateWatch){
			var wid=['watch',options.watchID+'-'+this.target];
			var wtasks=options.watchTasks;
			if(!util.isArray(wtasks))wtasks=[];

			wtasks.unshift('optimus:'+this.target);
			if(typeof(cfg.options.integrateJSHint)!=='undefined' && cfg.options.integrateJSHint){
				wtasks.unshift('jshint:'+cfg.options.jshintID);
			}
			options.watchTasks=wtasks;
			var watch=grunt.config.get(wid);
			if(typeof(watch)!=='object')watch={};
			watch.files=glob;
			watch.tasks=wtasks;
			watch.options={spawn:false,debounceDelay:50,livereload:options.watchReload};
			grunt.config.set(wid,watch);
			grunt.event.on('watch',function(a,f,t){
				_onWatchEvent(a,f,t,wid);
			});
			cfg.watching=true;
			grunt.log.writeln("\nOptimusJS: Added watch task ["+wid+"]\n"+prettyjson.render(watch));
		}

		// Clear rebuild flag
		cfg.watchcall=false;
		grunt.config.set(['optimus',this.target],cfg);
		grunt.config.set(['optimus-post',this.target],{options:options,cfg:cfg});
	});


	/**
	optimus-post
	Processes filerev results, and exports resulting config file with necessary paths
	**/
	grunt.registerMultiTask('optimus-post','Output config data and handle filerev paths',function(){
		var options=this.data.options;
		var cfg = this.data.cfg;
		var paths=merge({},cfg.paths); // make a copy

		grunt.log.writeln("OptimusJS:".yellow + "Generating configuration file".green);
		grunt.log.writeln("---------------------------------------".grey);

		// If there is a filerev manifest, update the paths in config
		if(typeof(grunt.filerev)!=='undefined' && typeof(grunt.filerev.summary)!=='undefined'){
			var manifest = grunt.filerev.summary;
			grunt.log.writeln("Updating paths using grunt-filerev manifest".yellow);
			for(var key in paths){
				var filepath = path.join(options.dest,paths[key]+'.js');
				if(typeof(manifest[filepath])!== 'undefined'){
					grunt.log.writeln(">>".yellow + path.basename(filepath) + " to ".yellow + path.basename(manifest[filepath]));
					paths[key] = path.join(path.dirname(paths[key]),path.basename(manifest[filepath],'.js'));
				}
			}
			grunt.log.writeln("--- done with filerev updates ----".grey);
		}

		
		if(options.absolutePaths){
			for(key in paths){
				// make the path absolute
				paths[key] = '/'+paths[key];
			}
		}

		var s="/* Generated by OptimusJS */\n\nvar req_config="+JSON.stringify({paths:paths},null,4)+";\nrequire.config(req_config);\n\n\n";
		grunt.log.writeln(">> ".yellow + "Writing configuration to ".blue + path.join(options.jsDir,options.target));
		grunt.file.write(path.join(options.dest,options.jsDir,options.target),s);
	});
};