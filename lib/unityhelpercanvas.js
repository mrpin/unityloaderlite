unity.helper_canvas = function ()
{
    var self = {};

    /*
     * Fields
     */

    var gl_context = null;

    var timeout_resize_canvas = null;

    //need for calculate canvas size
    var canvas_wrapper = null;

    self["canvas"] = null;


    /*
     * Events
     */

    var on_window_resized = function (e)
    {
        var delay = 100;//in ms

        if (timeout_resize_canvas != null)
        {
            clearTimeout(timeout_resize_canvas);
            timeout_resize_canvas = null;
        }

        timeout_resize_canvas = setTimeout(self["resize_canvas"], delay);
    };


    /*
     * Methods
     */

    self["create_canvas"] = function (params)
    {
        var id = params["id"];

        var attributes = {};

        attributes["id"] = id;

        var width  = assert_property(params, "width");
        var height = assert_property(params, "height");

        //attributes["width"]  = width;
        //attributes["height"] = height;

        if (params["disable_context_menu"])
        {
            attributes["oncontextmenu"] = "event.preventDefault()";
        }

        attributes["class"] = "emscripten";

        var tag_for_replace = document.getElementById(id);

        unity_assert(tag_for_replace != null, 'not found tag with id ' + id);

        canvas_wrapper = document.createElement('div');

        var parent = tag_for_replace.parentNode;

        parent.replaceChild(canvas_wrapper, tag_for_replace);

        var tag = document.createElement('canvas');

        for (var key in attributes)
        {
            tag.setAttribute(key, attributes[key]);
        }

        canvas_wrapper.appendChild(tag);

        apply_size_to(canvas_wrapper, width, height);
        apply_size_to(tag, width, height);

        gl_context = self.get_gl_context(tag);

        self["canvas"] = tag;

        window.addEventListener('resize', on_window_resized);
    };

    var apply_size_to = function (tag, width, height)
    {
        var style = tag.style;

        style.width  = width;
        style.height = height;

        tag.setAttribute("width", width);
        tag.setAttribute("height", height);
    };

    var getContext = function (target, context_name)
    {
        var result = target.getContext(context_name);

        if (result == null)
        {
            unity_log("Browser has no idea what " + context_name + " context");
        }

        return result;
    };

    self["get_gl_context"] = function (target)
    {
        var result = null;

        if (target == null)
        {
            unity_log("can't get context from null");

            return;
        }

        if (!window.WebGLRenderingContext)
        {
            // Browser has no idea what WebGL is. Suggest they
            // get a new browser by presenting the user with link to
            // http://get.webgl.org
            //do nothing
            unity_log("Browser has no idea what WebGL");
        }
        else
        {
            result = getContext(target, "webgl") || getContext(target, "experimental-webgl");
        }

        return result;
    };

    self["resize_canvas"] = function ()
    {
        var canvas = self["canvas"];

        if (gl_context == null || canvas == null || canvas_wrapper == null)
        {
            return;
        }

        var width  = canvas_wrapper.clientWidth;
        var height = canvas_wrapper.clientHeight;

        // Change the size of the canvas to match the size it's being displayed
        canvas.width  = width;
        canvas.height = height;

        gl_context.viewport(0, 0, width, height);
    };


    return self;
}();