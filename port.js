window.initialPortValues["signalFromJS"] = "DUMMY";

window.initializers.push(function (elmRuntime) {
    elmRuntime.ports.signalToJS.subscribe(function (info) {
        if (info == "clear") {
            clear();
        }
        else if (info == "tex") {
            tex();
        }
        else {
            var s = window.document.getElementById("input").value;
            console.log(s);
            elmRuntime.ports.signalFromJS.send(s);
        }
    });
});
                                         
function tex() {
    var script = document.createElement("script");
    script.id = "TexScript";
    script.type = "text/javascript";
    script.src  = "http://cdn.mathjax.org/mathjax/latest/MathJax.js?config=TeX-AMS-MML_HTMLorMML";
    var head = document.getElementsByTagName("head")[0];
    
    var node = document.getElementById("TexScript");
    if (node) {
        head.removeChild(node);
        head.appendChild(script);
    }
    else {
        head.appendChild(script);
    }
}

function clear() {
    var node = document.getElementById("output");
    var nodes = node.childNodes;
    console.log(nodes);
    var len = nodes.length;
    console.log(len);
    var i;
    var temp = nodes[0];
    while (node.firstChild) {
        node.removeChild(node.firstChild);
    }
    if (!temp.nodetype) {
        node.appendChild(temp);
    }
}
