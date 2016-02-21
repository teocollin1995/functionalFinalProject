window.initialPortValues["signalFromJS"] = "DUMMY";

window.initializers.push(function (elmRuntime) {
    elmRuntime.ports.signalToJS.subscribe(function () {
        var s = window.document.getElementById("input").textContent;
        elmRuntime.ports.signalFromJS.send(s);
    });
});
                                         
