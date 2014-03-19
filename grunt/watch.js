module.exports={
	html:{
		files:[
		'test/src/**/*.html'
		],
		tasks: ['copy:dev','ssi:dev'],
		options:{
			spawn:false 
		}
	}
}