/*
* grunt-qloader
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
var crypto=require('crypto');

module.exports=function(grunt){
	// For loading local copies of necessary scripts
	var _modulepath = path.normalize(__dirname);

	// FileRev qloader.js so we can generate the SSI properly
	var psuedofilerev=function(file){
		var filerev=grunt.filerev;
		var options=merge({
			encoding: 'utf8',
			algorithm: 'md5',
			length: 8
		},grunt.config.get('filerev.options'));

		var dirname;
        var hash = crypto.createHash(options.algorithm).update(grunt.file.read(file), options.encoding).digest('hex');
        var suffix = hash.slice(0, options.length);
        var ext = path.extname(file);
        var newName = [path.basename(file, ext), suffix, ext.slice(1)].join('.');
        var resultPath;

		dirname = path.dirname(file);
		resultPath = path.resolve(dirname, newName);
		fs.renameSync(file, resultPath);

        filerev.summary[path.normalize(file)] = path.join(dirname, newName);
        grunt.log.writeln('✔ ' + file + ' changed to ' + newName);
        grunt.filerev=filerev;
        return path.join(dirname,newName);
	};

	/**
	* QLoader task (qloader)
	* Generates the initial payload for the page JS, with content customized per environment
	* options:
	**/
	grunt.registerMultiTask('qloader','Generate initial JavaScript payload for your site',function(){
		var options		=	merge({
			useAlmond:false,
			injectGlobalModule:false,
			useFileRev:false,
			target:false,
			ssi:false,
			basePath:false,
			disableLogging:false
		},this.options());
		// Merge paths passed in with defaults
		var paths = merge({
			config:_modulepath+"/../loader/empty.js",
			require:_modulepath+"/../loader/require.js",
			almond:_modulepath+"/../loader/almond.js",
			template:_modulepath+"/../loader/loader.js",
			jquery:_modulepath+"/../loader/jquery.min.js",
			loadscript:_modulepath+"/../loader/scriptloader.min.js",
			global:_modulepath+"/../loader/empty.js",
			logger:_modulepath+"/../loader/logger.js"
		},options.paths);

		// Load File Content for each of the paths
		grunt.log.writeln("Reading input files".green);
		var filecontent={};
		var pathlist=Object.keys(paths);
		pathlist.forEach(function(e,k,a){
			// Load each file content piece and store, if the path exists
			if(fs.existsSync(path.normalize(paths[e]))){
				filecontent[e]=String(fs.readFileSync(path.normalize(paths[e])));
				grunt.log.writeln("- ".white + "read in ".blue + e + " @".blue + filecontent[e].length);
			}else{
				grunt.log.writeln("File not found for [".yellow + e + "]:".yellow+path.normalize(paths[e]));
			}
		});

		// Turn debugging in logger on and off
		filecontent.logger=String(filecontent.logger).replace('{{debug}}',''+(!options.disableLogging));

		grunt.log.writeln("Generating QLoader".green);
		var output=filecontent.template;
		output=String(output).replace(/\{\{([^}]+)\}\}/g,function(match){
			match=match.replace("{{","").replace("}}","");
			grunt.log.writeln(" - ".white+"replacing ".blue+match+ " in template".blue);

			switch(match){
				case 'REQUIRE_OR_ALMOND':
					// Special tag for almond / require
					return options.useAlmond?filecontent.almond:filecontent.require;
				break;
				case 'debug':
					return ''+(!options.disableLogging);
				break;
				case 'MAIN_MODULE':
					// Special tag for the main module
					if(options.injectGlobalModule){
						// If grunt-filerev replaced the global module, grab the new path from the summary
						if(typeof(grunt.filerev.summary)!=='undefined' && options.useFileRev && typeof(grunt.filerev.summary[path.normalize(paths.global)])!=='undefined'){
							filecontent.global = fs.readFileSync(grunt.filerev.summary[path.normalize(paths.global)]);
						}
						return filecontent.global;
					}else{ // Not injecting the module
						return "/** No global module injection **/";
					}
				break;
				case 'LOAD_SCRIPT':
					if(options.useAlmond){
						return filecontent.loadscript;
					}else{
						return "/** No load script **/";
					}

				break;
				default:
					if(typeof(filecontent[match])!=='undefined'){
						return filecontent[match];
					}else{
						return "";
					}
				break;
			}
		});
		
		var file = path.join(options.basePath,options.target);
		mkpath.sync(path.dirname(file));
		fs.writeFileSync(file,output);
		// Optionally rev the resulting file
		if(options.useFileRev){
			grunt.log.writeln("Rev QLoader output file:".green);
			file=psuedofilerev(file);
			grunt.log.writeln("- ".white + " new filename = ".blue + file);
		}
		// Optionally store the resulting path in an SSI include
		if(options.ssi!==false){
			var newpath = path.join(path.dirname(options.target),path.basename(file));
			var ssipath = path.join(options.basePath,options.ssi);
			mkpath.sync(path.dirname(ssipath));
			fs.writeFileSync(ssipath,newpath);
			grunt.log.writeln("Generated SSI include file".green);
			grunt.log.writeln("- ".white + " contents = ".blue + newpath);
		}
	});
};