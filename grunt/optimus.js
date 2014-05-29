module.exports={
  dev:{
    options:{
      src: 'test/src',
      dest: 'test/www',
      config: 'test/src/config.json',
      integrateWatch:true,
      watchID:'optimusjs',
      watchTasks:['qloader:dev']
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