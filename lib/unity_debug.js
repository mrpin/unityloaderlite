//I hate global variables.
//todo: remove this global #$#@#$
var didShowErrorMessage = false;

if (typeof window.onerror != 'function')
{
    window.onerror = function UnityErrorHandler(err, url, line)
    {
        if (Module.errorhandler && Module.errorhandler(err, url, line))
        {
            // error handled by the user
            return;
        }

        var is_error_contains = function (value)
        {
            return err.indexOf(value) != -1;
        };

        var message_invoke = "invoking error handler due to\n" + err;

        console.log(message_invoke);

        if (typeof dump == 'function')
        {
            dump(message_invoke);
        }

        if (didShowErrorMessage)
            return;

        // Firefox has a bug where it's IndexedDB implementation will throw UnknownErrors, which are harmless, and should not be shown.
        if (is_error_contains("UnknownError"))
        {
            return;
        }

        // Ignore error when application terminated with return code 0
        if (is_error_contains("Program terminated with exit(0)"))
        {
            return;
        }

        didShowErrorMessage = true;

        var alert_message = null;

        if (is_error_contains("DISABLE_EXCEPTION_CATCHING"))
        {
            alert_message = "An exception has occured, but exception handling has been disabled in this build. If you are the developer of this content, enable exceptions in your project's WebGL player settings to be able to catch the exception or see the stack trace.";
        }
        else if (is_error_contains("Cannot enlarge memory arrays"))
        {
            alert_message = "Out of memory. If you are the developer of this content, try allocating more memory to your WebGL build in the WebGL player settings.";
        }
        else if (is_error_contains("Invalid array buffer length") || is_error_contains("out of memory"))
        {
            alert_message = "The browser could not allocate enough memory for the WebGL content. If you are the developer of this content, try allocating less memory to your WebGL build in the WebGL player settings.";
        }
        else if (is_error_contains("Script error.") && document.URL.indexOf("file:") == 0)
        {
            alert_message = "It seems your browser does not support running Unity WebGL content from file:// urls. Please upload it to an http server, or try a different browser.";
        }
        else
        {
            //just error, do nothing
        }

        if(alert_message != null)
        {
            alert(alert_message);
        }
    }
}


function unity_assert(condition, msg)
{
    if (!condition)
    {
        console.log("stack trace:" + new Error().stack);

        throw new Error(msg);
    }
}

function assert_property(target, property_name)
{
    var result = target[property_name];

    if (result == null)
    {
        unity_assert(false, 'not found property ' + property_name + ' in object');
    }

    return result;
}

function unity_log(message)
{
    if (!unityloaderlite.verbose_mode)
    {
        return;
    }

    console.log(message);
}