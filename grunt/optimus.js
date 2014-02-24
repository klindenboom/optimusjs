module.exports={
  dev:{
    options:{
      copyonly:true,
      paths:{
      },
      shim:{
      },
      exclude : 'exclude/**/*',
      inDir: 'test/src/js/',
      outDir: 'test/www/',
      relativeDir: 'test/src',
      loader: 'test/www/js/qloader.js',
      subprefix : '_',
      global : "global",
      optimize : "none", //uglify or none
      config:{// for dynamic mode
        baseUrl:'./',
        waitSeconds: 15
      },
      configfile : "requirepaths.out",
      excludeforsub:  ['global']
    }
  }
};