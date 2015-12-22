var DataRequest = function (start, end, crunched, audio)
{

    /*
     * Fields
     */

    var name             = null;
    var name_with_prefix = null;

    /*
     * Events
     */

    var on_load_success = function ()
    {
        Module['removeRunDependency'](name_with_prefix);
    };

    var on_load_error = function ()
    {
        if (audio)
        {
            Module['removeRunDependency'](name_with_prefix); // workaround for chromium bug 124926 (still no audio with this, but at least we don't hang)
        }
        else
        {
            Module.printErr('Preloading file ' + name + ' failed');
        }
    };

    /*
     * Methods
     */

    this["open"] = function (mode, name_value)
    {
        name             = name_value;
        name_with_prefix = 'fp ' + name_with_prefix;

        DataRequest.requests_list.push(this);

        Module['addRunDependency'](name_with_prefix);
    };

    this["send"] = function ()
    {
        //do nothing
    };

    this["onload"] = function ()
    {
        var byteArray = DataRequest.byteArray.subarray(start, end);

        this.finish(byteArray);
    };

    this["finish"] = function (byteArray)
    {
        // canOwn this data in the filesystem, it is a slide into the heap that will never change
        Module['FS_createPreloadedFile'](name, null, byteArray, true, true, on_load_success, on_load_error, false, true);
    }
};

/*
 * Static fields
 */

DataRequest.requests_list = [];