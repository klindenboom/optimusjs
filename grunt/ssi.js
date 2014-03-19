module.exports={
	dev:{
	    options: {
	    	baseDir:"test/www"
	    },
	    files: [{
	          expand: true,
	          cwd: 'test/src',
	          src: ['**/*.html'],
	          dest: 'test/www',
		}]
	}
};