{{requirejs}}

if(typeof(jQuery) === 'undefined'){
{{jquery}}
}

{{optimusconfig}}

{{mainmodule}}

{{scriptloader}}

// usage: log('inside coolFunc',this,arguments);
// http://paulirish.com/2009/log-a-lightweight-wrapper-for-consolelog/
window.log = function(){
    if({{debug}}){ // turn off log display in production
        log.history = log.history || [];   // store logs to an array for reference
        log.history.push(arguments);
        if(this.console){
            console.log( Array.prototype.slice.call(arguments) );
        }
    }
};
// Rewrite of QLoader to incorporate script tag injection
var QLoader={
    modules:[],
    start:function(){
        log("QLoader","Start");
        this.getAllModules();
        if(typeof(window.loadscript)!=='undefined'){
            this.preloadModules();
        }else{
            this.requireModules();
        }
    },
    getAllModules:function(){
        var scripts=document.getElementsByTagName('script');
        var i=scripts.length;

        while(i--){
            var stag=scripts[i];
            if(stag){
                var modlist=stag.getAttribute('data-module-list');
                
                if(typeof(modlist)!=='undefined'){
                    var mods=String(modlist).split(',');
                    this.modules=this.modules.concat(mods);
                }
            }
        }
        log("QLoader","getAllModules",this.modules);
    },
    preloadModules:function(){
        var $this=this;
        if($this.modules.length>1){ // Do not preload the global module (already injected)
            log("QLoader","preloadModules");
            var modsToLoad=[];
            for(var i=1;i<$this.modules.length;i++){
                modsToLoad.push(req_config.paths[this.modules[i]]+".js"); // depends on optimus paths
            }
            modsToLoad.push($.proxy($this.requireModules,$this)); // add callback to require modules
            log("QLoader","PreloadModules","Modules to load",modsToLoad);
            window.loadscript.apply(this,modsToLoad); // inject script tags and then require modules
        }else{
            this.requireModules();
        }
    },
    requireModules:function(){
        log("QLoader","requireModules",this.modules);
        require(this.modules,function(){
            log("QLoader","requireModules","All modules loaded successfully");
        });
    }
};

QLoader.start();