module.exports={
	html:{
		files:[
		'test/src/**/*.html'
		],
		tasks: ['copy:dev'],
		options:{
			spawn:false 
		}
	},
	js:{
		files:[
		'test/src/js/**/*.js'
		],
       tasks: ['optimus'],
        options:{
        	spawn:false
        }
    }
}