if({{debug}}){
	window.log=function(){
        log.history = log.history || [];   // store logs to an array for reference
        log.history.push(arguments);
        if(this.console){
            console.log( Array.prototype.slice.call(arguments) );
        }
    };
}else{
    var console = {
        log : function(){},
        warn : function(){},
        error : function(){},
        dir : function(){},
        trace : function(){},
        time : function(){},
        timeEnd : function(){}
    };
    window.log=function(){};
}
