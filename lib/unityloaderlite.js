var unityloaderlite = function ()
{
    var self = {};

    /*
     * Fields
     */

    var store_name_metadata = "METADATA";
    var store_name_package  = "PACKAGES";

    self["need_decompress"] = true;
    self["package_version"] = 0;
    self["verbose_mode"]    = false;
    self["data_file_name"]  = null;

    var path = null;

    var preloader = null;

    var compatibility_helper = null;
    var file_helper          = null;
    var db_helper            = null;


    self["url_bin"]  = null;
    self["url_mem"]  = null;
    self["url_data"] = null;

    var gl_context = null;

    var timeout_resize_canvas = null;


    /*
     * Properties
     */

    var get_path = function ()
    {
        if (path == null)
        {
            var encodeFunction = null;
            var pathname       = null;

            if (typeof window === 'object')
            {
                encodeFunction = window['encodeURIComponent'];
                pathname       = window.location.pathname.toString();
            }
            else if (typeof location !== 'undefined')
            {
                // worker
                encodeFunction = encodeURIComponent;
                pathname       = location.pathname.toString();
            }
            else
            {
                unity_assert(false, 'using preloaded data can only be done on a web page or in a web worker');
            }

            path = encodeFunction(pathname.substring(0, pathname.lastIndexOf('/')) + '/')
        }

        return path;
    };

    self["get_path_data_full"] = function ()
    {
        return get_path() + self.data_file_name;
    };

    /*
     * Events
     */

    self["on_load_package_error"] = function (e)
    {
        unity_log("load package error: " + e);

        file_helper.load_remote_package(self.process_package_data);
    };

    var on_memory_file_loaded = function (response)
    {
        var memory_handler = Module["memoryInitializerRequest"];

        memory_handler.response = response;

        if (memory_handler.callback)
        {
            memory_handler.callback();
        }
    };

    var on_window_resized = function (e)
    {
        var delay = 100;//in ms

        if (timeout_resize_canvas != null)
        {
            clearTimeout(timeout_resize_canvas);
            timeout_resize_canvas = null;
        }

        timeout_resize_canvas = setTimeout(resize_canvas, delay);
    };


    var resize_canvas = function ()
    {
        if (gl_context == null || gl_context.canvas == null)
        {
            return;
        }

        var canvas = gl_context.canvas;

        // only change the size of the canvas if the size it's being displayed
        // has changed.
        var width  = canvas.clientWidth;
        var height = canvas.clientHeight;

        if (canvas.width != width || canvas.height != height)
        {
            // Change the size of the canvas to match the size it's being displayed
            canvas.width  = width;
            canvas.height = height;
        }
    };

    /*
     * Methods
     */

    self["embedWebGL"] = function (params)
    {
        params = get_fixed_params(params);

        post_init();

        self.package_version = params['package_version'];
        self.verbose_mode    = params['verbose'];

        compatibility_helper.compatibility_check();

        init_module(params);

        init_preloader(params);

        self.set_progress('prepare_module', 0);//need for avoid bug with progress
        self.set_progress_message('start downloading');

        self.need_decompress = params["need_decompress"];

        if (self.need_decompress)
        {
            console.log("NOTE: You can remove decompress delay if you configure your web server to host files using gzip compression.");
        }

        file_helper.load_js(self.url_bin, self.need_decompress);
        file_helper.load_file(self.url_mem, self.need_decompress, on_memory_file_loaded);

        Module.expectedDataFileDownloads++;

        if (Module['calledRun'])
        {
            runWithFS();
        }
        else
        {
            // FS is not initialized yet, wait for it
            Module["preRun"].push(runWithFS);
        }

        init_gl_context();

        window.addEventListener('resize', on_window_resized);
    };

    var post_init = function ()
    {
        file_helper          = unityhelperfileloader;
        db_helper            = unityhelperdb;
        compatibility_helper = unityhelpercompatibility;

        var instances_for_post_init =
                [
                    unityhelperfileloader,
                    unityhelperdb
                ];

        for (var i = 0; i < instances_for_post_init.length; i++)
        {
            var obj = instances_for_post_init[i];
            obj.post_init();
        }
    };

    var init_gl_context = function ()
    {
        gl_context = unityhelpercompatibility.get_gl_context(Module.canvas);

        if (gl_context == null || gl_context.canvas == null)
        {
            return;
        }

        var gl_canvas = gl_context.canvas;

        gl_context.viewport(0, 0, gl_canvas.width, gl_canvas.height);
    };

    var try_set_default_value = function (target, property_name, value)
    {
        if (typeof target[property_name] !== 'undefined')
        {
            return;
        }

        target[property_name] = value;
    };

    var get_fixed_params = function (params)
    {
        var result = params || {};

        try_set_default_value(result, 'show_preloader', true);
        try_set_default_value(result, 'id', 'canvas');
        try_set_default_value(result, 'need_decompress', true);
        try_set_default_value(result, 'memory', 256 * 1024 * 1024);
        try_set_default_value(result, 'verbose', false);

        self["url_bin"]  = assert_property(result, 'url_bin');
        self["url_data"] = assert_property(result, 'url_data');
        self["url_mem"]  = assert_property(result, 'url_mem');

        self.data_file_name = self.url_data.substr(self.url_data.lastIndexOf('/') + 1);

        assert_property(result, 'package_version');

        return result;
    };

    var init_preloader = function (params)
    {
        preloader = new UnityProgress(Module.canvas);

        if (!params["show_preloader"])
        {
            preloader.hide();
        }
    };

    function runWithFS()
    {
        var create_path = function (dir, name)
        {
            Module['FS_createPath'](dir, name, true, true);
        };

        create_path('/', 'Il2CppData');
        create_path('/Il2CppData', 'Metadata');
        create_path('/', 'Resources');
        create_path('/', 'Managed');
        create_path('/Managed', 'mono');
        create_path('/Managed/mono', '2.0');

        //todo: review on other versions of unity
        new DataRequest(0, 92265, 0, 0).open('GET', '/data.unity3d');
        new DataRequest(92265, 92284, 0, 0).open('GET', '/methods_pointedto_by_uievents.xml');
        new DataRequest(92284, 1268276, 0, 0).open('GET', '/Il2CppData/Metadata/global-metadata.dat');
        new DataRequest(1268276, 2763576, 0, 0).open('GET', '/Resources/unity_default_resources');
        new DataRequest(2763576, 2791202, 0, 0).open('GET', '/Managed/mono/2.0/machine.config');

        Module['addRunDependency']('datafile_' + self.data_file_name);

        db_helper.open_database(store_name_metadata, store_name_package);

        Module['setStatus']('Downloading...');
    }

    self['process_package_data'] = function (data)
    {
        Module.finishedDataFileDownloads++;

        unity_assert(data, 'Loading data file failed.');

        // Reuse the bytearray from the XHR as the source for file reads.
        DataRequest.byteArray = new Uint8Array(data);

        var requests_list = DataRequest.requests_list;

        for (var i = 0; i < requests_list.length; i++)
        {
            var request = requests_list[i];

            request.onload();
        }

        //clear array
        requests_list.length = 0;

        Module['removeRunDependency']('datafile_' + self.data_file_name);
    };

    /*
     * Preloader
     */

    self["update_download_progress"] = function (url, e)
    {
        var size = e.total == null ? 1 : e.total;

        var loaded = e.loaded == null ? 0 : e.loaded;

        self.set_progress(url, loaded / size * 100);
        self.set_progress_message('downloading data...');
    };

    self["hide_progress"] = function ()
    {
        preloader.hide();
    };

    self["set_progress"] = function (key, value)
    {
        unity_log(key + " now is " + value);

        preloader.set_progress(key, value);
    };

    self["set_progress_message"] = function (value)
    {
        unity_log(value);

        preloader.set_progress_message(value);
    };

    return self;
}();







