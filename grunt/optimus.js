module.exports={
  dev:{
    options:{
<<<<<<< HEAD
      src: 'test/src',
      dest: 'test/www',
      config: 'test/src/config.json',
      integrateWatch:true,
      watchID:'optimusjs',
      watchTasks:['qloader:dev']
=======
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
>>>>>>> 5a381e9e4a83efab2892d419b4ae0d3fb85523b9
    }
  },
  dist:{
    options:{
      src: 'test/src',
      dest: 'test/www',
      config: 'test/src/config.json'
    }
  }
};