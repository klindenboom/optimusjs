module.exports={
	static: {
		options: {
			protocol: "http", // Change to "http" for non-secure testing
			port: 6001,
			hostname: '*',
			base: 'test/www',
            middleware: function(connect,options,middlewares) {
            	var ssInclude=require('connect-include');
                // Here we insert connect-include, use the same pattern to add other middleware
                middlewares.push(ssInclude('test/www'));

                return middlewares;
            }
  		}
	}
}