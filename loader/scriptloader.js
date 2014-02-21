//Steve Souders - http://www.stevesouders.com/blog/
//Dustin Diaz - http://www.dustindiaz.com/scriptjs/
window.loadscript = function() {
    if (!arguments.length) return;

    var head = document.getElementsByTagName('head')[0];
    var callback = null;
    var scripts = 0;
    var count = 0;

    //Loop through arguments
    for (var i = 0, len = arguments.length; i < len; i++) {
        var arg = arguments[i];
        
        //Load args up to the callback, rest ignored
        if (typeof(arg) === 'function') {
            callback = arg;
            scripts = i;
            break;
        }

        var el = document.createElement('script');
        el.type = 'text/javascript';

        el.onload = el.onreadystatechange = function () {
            if (el.readyState && el.readyState !== 'complete' && el.readyState !== 'loaded') return false;
            
            el.onload = el.onreadystatechange = null;
            count++;
            if (callback != null && count === scripts) callback();
        };

        el.async = true;
        el.src = arg;
        head.appendChild(el);
    }
};