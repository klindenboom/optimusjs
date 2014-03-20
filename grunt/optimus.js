module.exports={
  dev:{
    options:{
      development:true,
      paths:{
      },
      shim:{
      },
      watchtask:'optimusjs',
      jshinttask:'optimusjs',
      exclude : 'exclude/**/*',
      inDir: 'test/src/js/',
      outDir: 'test/www/',
      relativeDir: 'test/src',
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
  },
  dist:{
    options:{
      development:false,
      paths:{
      },
      shim:{
      },
      exclude : 'exclude/**/*',
      inDir: 'test/src/js/',
      outDir: 'test/www/',
      relativeDir: 'test/src',
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