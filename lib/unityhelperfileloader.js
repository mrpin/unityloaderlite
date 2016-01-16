unity.helper_file_loader = function ()
{
    var self = {};

    /*
     * Fields
     */

    var files_in_queue = [];

    var is_load_now = false;

    var compatibility_helper = null;
    var unity_loader         = null;

    /*
     * Events
     */

    var on_blob_patched = function (e, onload)
    {
        var patchedcode = e.target.result.replace(/Math_fround\(/g, '(');
        var patchedblob = new Blob([patchedcode], {type: 'text/javascript'});

        load_js_blob(patchedblob, onload);
    };

    /*
     * Methods
     */

    self['post_init'] = function ()
    {
        compatibility_helper = unity.helper_compatibility;
        unity_loader         = unityloaderlite;
    };

    self["load_js_code"] = function (code, onload)
    {
        var blob = new Blob([code], {type: 'text/javascript'});

        // In Chrome, Math.fround is supported, but too slow and using too much AST memory when parsing.
        if (!Math.fround || compatibility_helper.is_browser("Chrome"))
        {
            unity_log('optimizing out Math.fround calls');

            var file_reader = new FileReader();

            file_reader.onload = function (e)
            {
                on_blob_patched(e, onload)
            };

            file_reader.readAsText(blob);
        }
        else
        {
            load_js_blob(blob, onload);
        }
    };

    var load_js_blob = function (blob, onload)
    {
        var script = document.createElement('script');

        script.src    = URL.createObjectURL(blob);
        script.onload = onload;

        document.body.appendChild(script);
    };

    var try_load_file_from_queue = function ()
    {
        if (files_in_queue.length == 0)
        {
            return;
        }

        var file_info = files_in_queue.shift();

        self.load_file(file_info["url"], file_info["need_decompress"], file_info["callback"]);
    };

    self['load_remote_package'] = function (callback)
    {
        self.load_file(unity_loader.url_data, unity_loader.need_decompress, callback);
    };

    self["load_js"] = function (url, need_decompress, callback)
    {
        var on_load_wrapper = function (response)
        {
            self.load_js_code(response, callback);
        };

        self.load_file(url, need_decompress, on_load_wrapper);
    };

    self["load_file"] = function (url, need_decompress, callback)
    {
        if (is_load_now)
        {
            unity_loader.set_progress(url, 0);

            var file_info =
                {
                    url            : url,
                    need_decompress: need_decompress,
                    callback       : callback
                };

            files_in_queue.push(file_info);

            return;
        }

        is_load_now = true;

        unity_log("try load: " + url);

        var start = new Date().getTime();

        var xhr = new XMLHttpRequest();
        xhr.open('GET', url, true);

        xhr.onprogress = function (event)
        {
            unity_loader.update_download_progress(url, event);
        };

        xhr.responseType = 'arraybuffer';

        xhr.onload = function ()
        {
            unity_assert(xhr.status == 0 || xhr.status == 200, "can't load file " + url);

            var data = new Uint8Array(xhr.response);

            var message = url + " file loaded ";

            if (need_decompress)
            {
                message += message + "and decompressed ";

                try
                {
                    data = new Zlib.Gunzip(data);

                    data = data.decompress();
                }
                catch (e)
                {
                    unity_assert(false, "can't decompress " + url + " with error " + e);
                }
            }

            if (callback != null)
            {
                callback(data);
            }

            is_load_now = false;

            var end = new Date().getTime();

            unity_log(message + " in " + (end - start) + "ms");

            try_load_file_from_queue();
        };

        xhr.onerror = function ()
        {
            // when using file:// protocol, onerror callback may be called if the file does not exist
            unity_assert(false);
        };

        try
        {
            xhr.send(null);
        }
        catch (err)
        {
            // when using file:// protocol, send may throw an exception if the file does not exist
            unity_assert(false);
        }
    };

    return self;
}();