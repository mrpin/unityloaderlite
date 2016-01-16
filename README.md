# unityloaderlite
# license MIT

please see index.html

```javascript
    //use for development
    var add_request_data_to = function (requests, start, end, name)
    {
        var request_data =
            {
                start: start,
                end  : end,
                name : name
            };

        requests.push(request_data);
    };

    var params_webgl = {};

    //optional. id for canvas, default - 'canvas'
    params_webgl["id"] = "game_content"; 

    //required.
    params_webgl["width"] = 800;
    //required.
    params_webgl["height"] = '600px';

    //optional.  default - true
    params_webgl["disable_context_menu"] = true;

    // required.
    // ATTENTION: should be unique for each build.
    // Need for check different versions in cache.
    // I use timestamp when file uploaded to server.
    params_webgl["package_version"] = 1;

    //required.
    params_webgl["url_data"] = 'example/websockets_example.datagz';
    //required.
    params_webgl["url_mem"] = 'example/websockets_example.memgz';
    //required.
    params_webgl["url_bin"] = 'example/websockets_example.jsgz';

    //optional. default - 256 mb
    params_webgl["memory"] = 512 * 1024 * 1024;
    //optional. default - false. enable/disable verbose logging
    params_webgl["verbose"] = true;

     //optional. default - true. enable/disable caching. set true in production
    params_webgl["cache_enabled"] = false; 

    //optional.  default - true
    params_webgl["need_decompress"] = true;
    //optional.  default - true
    params_webgl["show_preloader"] = true;

    var requests_data = [];

    //got it from UnityLoader.js . Just try search ".unity3d" in your UnityLoader.js
   add_request_data_to(requests_data, 0,        92265, "/data.unity3d");
   add_request_data_to(requests_data, 92265,    92284, "/methods_pointedto_by_uievents.xml");
   add_request_data_to(requests_data, 92284,    1268276, "/Il2CppData/Metadata/global-metadata.dat");
   add_request_data_to(requests_data, 1268276,  2763576, "/Resources/unity_default_resources");
   add_request_data_to(requests_data, 2763576,  2791202, "/Managed/mono/2.0/machine.config");

    params_webgl["requests_data"] = requests_data;

    try 
    {
        unityloaderlite.embedWebGL(params_webgl);
    }
    catch(e)
    {
        console.log(e);
    }
 ```


