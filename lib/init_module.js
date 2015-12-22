if (typeof  Module === 'undefined')
{
    var Module = {};
}

var init_module = function (params)
{
    var id = params["id"] || 'canvas';

    var url_bin  = params["url_bin"];
    var url_data = params["url_data"];
    var url_mem  = params["url_mem"];

    var unity_module = Module;

    unity_module.canvas = document.getElementById(id);

    unity_module.dataUrl = url_data;

    unity_module["TOTAL_MEMORY"] = params["memory"];

    unity_module.preRun  = [];
    unity_module.postRun = [];

    unity_module.preloadResults = {};

    unity_module.totalDependencies = 0;

    unity_module.expectedDataFileDownloads = 0;
    unity_module.finishedDataFileDownloads = 0;

    unity_module.memoryInitializerRequest =
    {
        response        : null,
        callback        : null,
        addEventListener: function (type, callback)
        {
            unity_assert(type == 'load', "Unexpected type");

            this.callback = callback;
        }
    };

    //todo:remove if unity player don't use it
    unity_module.locateFile = function (not_used)
    {
        return unity_module.dataUrl;
    };

    unity_module.print = function (text)
    {
        console.log(text);
    };

    unity_module.printErr = function (text)
    {
        console.error(text);
    };

    unity_module.setStatus = function (text)
    {
        if (!unity_module.setStatus.last)
        {
            unity_module.setStatus.last = {time: Date.now(), text: ''};
        }

        var unity_loader = unityloaderlite;

        unity_loader.set_progress_message(text);

        var regex = /([^(]+)\((\d+(\.\d+)?)\/(\d+)\)/;

        var m = text.match(regex);

        if (m)
        {
            var key = m[1];

            unity_loader.set_progress(key, parseInt(m[2]) / parseInt(m[4]) * 100);
        }

        //fucking-dirty-unity hack. who implemented this?
        if (text === "")
        {
            unity_loader.hide_progress();
        }
    };

    unity_module.monitorRunDependencies = function (left)
    {
        var total = Math.max(unity_module.totalDependencies, left);

        unity_module.totalDependencies = total;

        if (left)
        {
            unityloaderlite.set_progress("prepare_module", (total - left) * 100 / total);
        }
        else
        {
            unity_module.setStatus('All downloads complete.');
        }
    };
};