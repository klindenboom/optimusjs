define('crazy/sub/folder/path/submodule',[],function(){
	console.log("Partial Loaded")
});
define('page/page',['global','crazy/sub/folder/path/submodule'],function(){
	console.log("Page module loaded");
});
