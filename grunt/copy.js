module.exports={
	dev:{
		files:[
			{expand: true, cwd: 'test/src/',src: ['**/*.html'], dest: 'test/www/'}
		]
	},
	dist:{
		files:[
			{expand: true, cwd: 'test/src/',src: ['**/*.html'], dest: 'test/www/'}
		]
	}
}