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

    var helper_compatibility = null;
    var helper_file_loader   = null;
    var helper_db            = null;
    var helper_canvas        = null;

    var requests_data = null;

    var cache_enabled = null;

    self["url_bin"]  = null;
    self["url_mem"]  = null;
    self["url_data"] = null;

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
        if (e != null)
        {
            unity_log("load package error: " + e);
        }

        helper_file_loader.load_remote_package(self.process_package_data);
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


    /*
     * Methods
     */

    self["embedWebGL"] = function (params)
    {
        params = get_fixed_params(params);

        post_init();

        helper_canvas.create_canvas(params);

        //todo: create canvas

        self.package_version = params['package_version'];
        self.verbose_mode    = params['verbose'];

        helper_compatibility.compatibility_check();

        init_unity_module(params);

        init_preloader(params);

        self.set_progress('prepare_module', 0);//need for avoid bug with progress
        self.set_progress_message('start downloading');

        self.need_decompress = params["need_decompress"];

        if (self.need_decompress)
        {
            console.log("NOTE: You can remove decompress delay if you configure your web server to host files using gzip compression.");
        }

        helper_file_loader.load_js(self.url_bin, self.need_decompress);
        helper_file_loader.load_file(self.url_mem, self.need_decompress, on_memory_file_loaded);

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

    };

    var post_init = function ()
    {
        helper_file_loader   = unity.helper_file_loader;
        helper_db            = unity.helper_db;
        helper_compatibility = unity.helper_compatibility;
        helper_canvas        = unity.helper_canvas;

        var instances_for_post_init =
                [
                    unity.helper_file_loader,
                    unity.helper_db
                ];

        for (var i = 0; i < instances_for_post_init.length; i++)
        {
            var obj = instances_for_post_init[i];
            obj.post_init();
        }
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
        try_set_default_value(result, 'cache_enabled', true);

        self["url_bin"]  = assert_property(result, 'url_bin');
        self["url_data"] = assert_property(result, 'url_data');
        self["url_mem"]  = assert_property(result, 'url_mem');

        cache_enabled = assert_property(result, 'cache_enabled');

        requests_data = assert_property(result, 'requests_data');

        self.data_file_name = self.url_data.substr(self.url_data.lastIndexOf('/') + 1);

        assert_property(result, 'package_version');

        assert_property(result, 'width');
        assert_property(result, 'height');

        return result;
    };

    var init_preloader = function (params)
    {
        preloader = new unity.UnityProgress(Module.canvas);

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

        //todo:review for other builds
        create_path('/', 'Il2CppData');
        create_path('/Il2CppData', 'Metadata');
        create_path('/', 'Resources');
        create_path('/', 'Managed');
        create_path('/Managed', 'mono');
        create_path('/Managed/mono', '2.0');

        var request_class = unity.DataRequest;

        for (var i = 0; i < requests_data.length; i++)
        {
            var request_data = requests_data[i];

            var start = assert_property(request_data, 'start');
            var end   = assert_property(request_data, 'end');
            var name  = assert_property(request_data, 'name');

            new request_class(start, end, 0, 0).open('GET', name);
        }

        Module['addRunDependency']('datafile_' + self.data_file_name);

        if (cache_enabled)
        {
            helper_db.open_database(store_name_metadata, store_name_package);
        }
        else
        {
            self.on_load_package_error(null);
        }

        Module['setStatus']('Downloading...');

        helper_canvas.resize_canvas();
    }

    self['process_package_data'] = function (data)
    {
        Module.finishedDataFileDownloads++;

        unity_assert(data, 'Loading data file failed.');

        // Reuse the bytearray from the XHR as the source for file reads.
        var byte_array = new Uint8Array(data);

        var requests_list = unity.DataRequest.requests_list;

        for (var i = 0; i < requests_list.length; i++)
        {
            var request = requests_list[i];

            request.onload(byte_array);
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

    self["report_progress"] = function ()
    {
        preloader.report_progress();
    };

    return self;
}();







