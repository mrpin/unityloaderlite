//todo: review and test
var unityhelperdb = function ()
{
    var self = {};

    var indexedDB  = window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB;
    var DB_NAME    = 'EM_PRELOAD_CACHE';
    var DB_VERSION = 1;

    var db = null;

    var unity_loader = null;
    var file_helper  = null;

    /*
     * Fields
     */

    var store_name_metadata = null;
    var store_name_package  = null;

    /*
     * Events
     */

    var on_cached_package_checked = function (use_cached)
    {
        var package_name = unity_loader.data_file_name;

        Module.preloadResults[package_name] = {fromCache: use_cached};

        var message = 'loading ' + package_name + ' from ';

        message += use_cached ? 'cache' : 'remote';

        unity_log(message);

        if (use_cached)
        {
            fetch_cached_package(unity_loader.process_package_data, unity_loader.on_load_package_error);
        }
        else
        {
            file_helper.load_remote_package(cache_remote_package);
        }
    };

    var on_db_upgraded = function (event)
    {
        db = event.target.result;

        var store_names = db.objectStoreNames;

        try_remove_from_store(store_names, store_name_package);
        try_remove_from_store(store_names, store_name_metadata);

        var store_params =
            {
                autoIncrement: false
            };

        db.createObjectStore(store_name_package, store_params);
        db.createObjectStore(store_name_metadata, store_params);
    };

    var on_db_opened = function (event)
    {
        db = event.target.result;

        check_cached_package();
    };

    var on_db_open_error = function (error)
    {
        unity_loader.on_load_package_error(error);
    };

    /*
     * Methods
     */

    self["post_init"] = function ()
    {
        unity_loader = unityloaderlite;
        file_helper  = unityhelperfileloader;
    };

    self["open_database"] = function (name_metadata, name_package)
    {
        store_name_metadata = name_metadata;
        store_name_package  = name_package;

        var open_request = null;

        try
        {
            open_request = indexedDB.open(DB_NAME, DB_VERSION);

            open_request.onupgradeneeded = on_db_upgraded;
            open_request.onsuccess       = on_db_opened;
            open_request.onerror         = on_db_open_error;

        } catch (e)
        {
            onerror(e);
        }
    };

    /* Check if there's a cached package, and if so whether it's the latest available */
    function check_cached_package()
    {
        var path_full       = unity_loader.get_path_data_full();
        var package_version = unity_loader.package_version;

        var metadata = get_store_object(store_name_metadata, false);

        var get_request = metadata.get(path_full);

        get_request.onsuccess = function (event)
        {
            var result = event.target.result;

            on_cached_package_checked(result == null ? false : package_version === result.package_version);
        };

        get_request.onerror = function (error)
        {
            unity_loader.on_load_package_error(error);
        };
    }

    var fetch_cached_package = function (callback, errback)
    {
        var path_full = unity_loader.get_path_data_full();

        var packages = get_store_object(store_name_package, false);

        var request = packages.get(path_full);

        request.onsuccess = function (event)
        {
            callback(event.target.result);
        };

        request.onerror = function (error)
        {
            errback(error);
        };
    };


    function cache_remote_package(package_data)
    {
        var path_full = unity_loader.get_path_data_full();

        var callback = function (e)
        {
            unity_loader.process_package_data(package_data);
        };

        cache_package(package_data, path_full, callback);
    }

    function cache_package(package_data, path_full, callback)
    {
        var packages          = get_store_object(store_name_package, true);
        var putPackageRequest = packages.put(package_data, path_full);

        putPackageRequest.onsuccess = function (event)
        {
            cache_package_metadata(path_full, callback);
        };

        putPackageRequest.onerror = callback;
    }

    function cache_package_metadata(path_full, callback)
    {
        var package_meta = {package_version: unity_loader.package_version};

        var metadata = get_store_object(store_name_metadata, true);

        var put_request = metadata.put(package_meta, path_full);

        put_request.onsuccess = callback;
        put_request.onerror   = callback;
    }

    var get_store_object = function (store_name, need_write)
    {
        var transaction = db.transaction([store_name], need_write ? "readwrite" : "readonly");

        return transaction.objectStore(store_name);
    };

    var try_remove_from_store = function (object_store_names, name)
    {
        if (!object_store_names.contains(name))
        {
            return;
        }

        db.deleteObjectStore(name);
    };

    return self;
}();

