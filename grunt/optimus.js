module.exports={
  dev:{
    options:{
      development:true,
      ssi:'test/www/hashes/js/qloader.js.incl',
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
      loader: 'test/www/js/qloader.js',
      subprefix : '_',
      nojquery : true,
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
      ssi:'test/www/hashes/js/qloader.js.incl',
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