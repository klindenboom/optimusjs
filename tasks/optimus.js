/*
 * grunt-optimus
 * 
 *
 * Copyright (c) 2013 Arne Strout, contributors
 * Licensed under the MIT license.
 */

 'use strict';

 module.exports=function(grunt){
	// Required Modules
	var path = require('path');
	var fs = require('fs');
	var colors = require('colors');
	var prettyjson=require('prettyjson');
	var merge = require('merge');
	var mkpath = require('mkpath');

	var _globalout = ''; // for prepending config
	var _configfile = '';
	var _dependencies = {};
	var _outfile = '';
	var _rjsfile = __dirname + "/../loader/require.js";

	var getModuleIDFromPath=function(file,relativeDir,absoluteDir,subprefix){
		var fnp = file.split('/');
		var fn=fnp[fnp.length-1];
		var rel = relativeDir.split('/');
		var abs = absoluteDir.split('/');
		var frag = fnp.slice(rel.length,fnp.length-1).join('/');
		if(fn.indexOf('.')>-1)fn=fn.substr(0,fn.lastIndexOf('.'));
		var fr2 = frag.split('/').slice(abs.length-rel.length).join("/");
		var ofn=fn;
		if(fn.substr(0,subprefix.length) === subprefix)fn=fn.substr(subprefix.length);
		return 	[(fr2!=""?fr2+"/":"")+fn,(frag!=""?frag+"/":"")+ofn];
	}

	var addDependencies=function(files,deps,relativeDir,absoluteDir,subprefix){
		var i=0,d=_dependencies;
		while(i<deps.length){
			grunt.log.writeln('--'+i+'='+deps[i]);
			var dep=deps[i];
			if(files.indexOf(dep)<0){
				files.push(dep);
				var tid=getModuleIDFromPath(dep,relativeDir,absoluteDir,subprefix)[0];
				if(d[tid] && d[tid].length>0){
					grunt.log.writeln("adding dependencies for:"+tid);
					files=addDependencies(files,d[tid],relativeDir,subprefix);
				}
			}
			i++;
		}
		return files;
	}


	/**
	Optimus prepare
	Runs through all JS files and prepares a require configuration based on the file structure and some parameters.
	**/
	grunt.registerMultiTask('optimus','Build a configuration for the R.JS optimizer from JS folder structure',function(){
		var options = this.options();
		var global = options.global;
		var inDir = options.inDir; // eg: 'src/js/'
		var outDir = options.outDir; // eg: 'static/js/'
		var relativeDir = options.relativeDir;
		var absoluteDir = options.inDir.split('/');
		var subprefix = options.subprefix; // eg: '_'
		var configfile = options.configfile; // eg: 'requirepaths.out'
		var excludeforsub = options.excludeforsub;
		var exclude = options.exclude;
		var optimize = options.optimize; //uglify or none
		var files;
		var rj = grunt.config.get('requirejs');

		if(absoluteDir[absoluteDir.length-1]===""){
			absoluteDir.pop();
		}
		absoluteDir=absoluteDir.join('/');
		_outfile = options.loader;

		if(!rj){
			rj={options:{}};
			grunt.config.set('requirejs',rj);
		}
		
		var paths = options.paths!==undefined ? options.paths:{};
		var storage=grunt.config('require-storage');
		if(!storage){
			grunt.config('require-storage',{
				paths:paths,
				dependencies:_dependencies
			});
		}
		
		paths=grunt.config('require-storage.paths');
		_dependencies=grunt.config('require-storage.dependencies');
		if(!_dependencies){
			grunt.log.writeln("dependencies are empty".red);
			_dependencies={};
		}

		var watchcall = options.watchcall;
		var watchtarget = options.watchtarget;
		var target = this.target;

		// A file was added, we need to rebuild the paths
		if(watchcall==="added"){
			paths={};
			options.paths={};
			_dependencies={};
		}

		grunt.log.writeln("OPTIMUS : Preparing Javascript Configuration"+(watchcall?" WC["+watchcall+"]/"+watchtarget:"."));
		grunt.log.writeln("-----------------------------");
		
		// If a file was added, or this is the only call, build paths from scratch
		if(watchcall!=="changed"){
			//console.log("Starting paths:\n %j",paths);
			// Add optimus-post config entries
			var cfg = grunt.config.get('optimus');
			var postcfg = {};
			for(var itm in cfg){
				postcfg[itm]={};
			}
			grunt.config.set('optimus-post',postcfg);
			// end config entry generation

			if(!exclude){
				files=grunt.file.expand(''+inDir+"**/*.js");
			}else{
				files=grunt.file.expand([''+inDir+"**/*.js",'!'+inDir+exclude]);
			}
			grunt.log.writeln("\n\nFILES:".blue,files);
			grunt.log.writeln("\n\nGenerating module paths and dependencies".green.underline);
			grunt.util.async.forEach(files,function(file,next){
				// Get the dependencies
				var fcont = grunt.file.read(file);
				var pat = /define\s*\(\s*\[([\s\S]*?)\]/m;
				var deps = fcont.match(pat);

				//if(deps!==null){
				//	grunt.log.writeln("--list:\n"+prettyjson.render(deps));
				//}

				if(deps && deps.length>1){
					deps=deps[1];
					//grunt.log.writeln("dependencies:".yellow+deps);
					deps=deps.split("\n").join('').split("\t").join('').split('"').join('').split("'").join('').split(" ").join('').split(',');
					grunt.log.writeln(file,deps);
				}else{
					deps=[];
				}
				// store depencency
				if(deps.length>0){
					grunt.util.async.forEach(deps,function(dep,next){
						if(!_dependencies[dep])_dependencies[dep]=[];
						if(_dependencies[dep].indexOf(file)<0){
							_dependencies[dep].push(file);
							//grunt.log.writeln("added depency ".green+dep+" for ".green+file);
						}
					});
				}

				// Insert a path entry
				var fileid=getModuleIDFromPath(file,relativeDir,absoluteDir,subprefix);
				grunt.log.writeln('>>'.blue+"path[".green+fileid[0]+"] = '".green+fileid[1]+"'".green);
				paths[fileid[0]]=fileid[1];
				options.paths=paths;
			});
		}else{ // If resulting from a changed file, find where it is referenced.
			files=[watchtarget,options.relativeDir+"/"+options.global+".js"];
			var targetid=getModuleIDFromPath(watchtarget,relativeDir,absoluteDir,subprefix)[0];
			grunt.log.writeln("Target ID:"+targetid);
			var targetdeps=_dependencies[targetid];
			grunt.log.writeln("Dependencies:",targetdeps);
			if(targetdeps && targetdeps.length>0){
				files=addDependencies(files,targetdeps,relativeDir,subprefix);
			}
		}


		if(!options.copyonly){
			var rjo=rj.options?rj.options:{};

			if(options.shim){ // merge in the shim data from local config.
				rjo.shim = merge(rjo.shim,options.shim);
				options.shim=undefined; // clear once merged in
			}
			grunt.config.set('requirejs',{options:rjo});
			rj = grunt.config.get('requirejs');

			grunt.log.writeln("\n\nGenerating first level modules list".green.underline);
			grunt.util.async.forEach(files,function(file,next){
				var fnp = file.split('/');
				var fn=fnp[fnp.length-1];
				if(fn.substr(0,subprefix.length) !== subprefix){
					var fileid=getModuleIDFromPath(file,relativeDir,absoluteDir,subprefix);
					
					grunt.log.write(' >>'.yellow+(fileid[0]).green);
					
					var o={
						options:{
							baseUrl:'./'+relativeDir,
							paths:paths,
							name: fileid[0],
							out: outDir+fileid[1]+".js",
							optimize: options.optimize //uglify or none
						}
					};

					if(fn!==global){
						o.options.exclude=excludeforsub;
					}else{
						grunt.log.writeln((fileid[0]+" is the root/global module").grey);
						_globalout=o.options.out;
					}
					
					rj[fileid[0]]=o;
				}
			});

			grunt.config.set('requirejs',rj);
		}

		if(configfile && watchcall!=="changed"){
			var co=options.config?options.config:{};
			co.paths=paths;
			var s="/* Generated by require-prepare */\n\nrequire.config("+JSON.stringify(co,null,4)+");\n\n\n";
			grunt.log.writeln("Writing config file...".magenta);
			fs.writeFileSync(configfile,s);
			_configfile=configfile;
		}
		grunt.config(['require-storage','paths'],paths);
		grunt.config(['require-storage','dependencies'],_dependencies);
		grunt.log.writeln("\nOPTIMUS: Prepare complete".green);
		grunt.log.writeln("------------------------");
		grunt.log.writeln("RJ:"+prettyjson.render(rj));
		
		if(!options.copyonly){
			grunt.task.run("requirejs","optimus-post");
		}else{
			grunt.util.async.forEach(files,function(file,next){
				var outfile=file.split('/');
				var rel=relativeDir.split('/');
				var outfile=outDir+file.split('/').slice(rel.length).join("/");
				grunt.log.writeln("copying for development:".yellow+outfile);
				fs.createReadStream(file).pipe(fs.createWriteStream(outfile));
			});

			grunt.task.run("optimus-post");
		}
	});


	/**
	Require-Post
	Prepends the paths config to the global module if a config was generated
	**/
	grunt.registerMultiTask('optimus-post','Prepend config data if config data was generated',function(){
		grunt.log.writeln("\nPrepending Configuration".green);
		grunt.log.writeln("cfg:".grey+_configfile);
		grunt.log.writeln("-----------------------------------------------------");
		if(_configfile && _outfile){
			var cf = fs.readFileSync(_configfile);
			var rjf = fs.readFileSync(_rjsfile);
			var gf = fs.readFileSync(__dirname + "/../loader/loader.js");
			var p=_outfile.split('/');
			p.pop();
			p=p.join('/');
			grunt.log.writeln("Path:".blue+p);
			mkpath.sync(p);
			fs.writeFileSync(_outfile,String(gf).replace('{{optimusconfig}}',cf).replace('{{requirejs}}',rjf));
		}
	});
};