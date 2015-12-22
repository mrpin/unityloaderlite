//todo: need test + move to unityloaderlite
function SetFullscreen(fullscreen)
{
    if (typeof JSEvents === 'undefined')
    {
        console.log("Player not loaded yet.");
        return;
    }

    var tmp                                 = JSEvents.canPerformEventHandlerRequests;
    JSEvents.canPerformEventHandlerRequests = function ()
    {
        return 1;
    };
    Module.cwrap('SetFullscreen', 'void', ['number'])(fullscreen);
    JSEvents.canPerformEventHandlerRequests = tmp;
}