window.initialPortValues["signalFromJS"] = "DUMMY";

window.initializers.push(function (elmRuntime) {
    elmRuntime.ports.signalToJS.subscribe(function () {
        clear();
        console.log(document.getElementById("output"));
        var s = window.document.getElementById("input").textContent;
        elmRuntime.ports.signalFromJS.send(s);
        tex();
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
    var temp;
    while (nodes) {
        temp = nodes[0];
        if (temp.nodetype) {
            node.removeChild(temp);
        }
        else {
            break;
        }
    }
}
