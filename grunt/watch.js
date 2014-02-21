module.exports={
	html:{
		files:[
		'test/src/**/*.html'
		],
		tasks: ['copy:html'],
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