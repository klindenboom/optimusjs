module.exports={
	html:{
		files:[
		'test/src/**/*.html'
		],
		tasks: ['copy:dev'],
		options:{
			spawn:false 
		}
	}
}