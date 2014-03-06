if(typeof(jQuery) === 'undefined'){
{{jquery}}
}

{{requirejs}}

{{optimusconfig}}

{{mainmodule}}

(function(){
    var scripts=document.getElementsByTagName('script');
    var i=scripts.length;

    while(i--){
        var stag=scripts[i];
        if(stag){
            var modlist=stag.getAttribute('data-module-list')
            if(modlist){
                var mods=modlist.split(',');

                require(mods,function(){

                    // Maybe unnecessary to do anything here
                });
            }
        }
    }
})();

