unity.UnityProgress = function (canvas)
{
    var self = {};

    var is_shown = true;

    var progress_map = {};

    var parent_canvas = canvas.parentNode;

    var create_tag_and_append = function (tag_name, parent)
    {
        var result = document.createElement(tag_name);

        if (parent == null)
        {
            result.style.position = "absolute";
            parent                = parent_canvas;
        }
        else
        {
            result.style.position = "relative";
        }

        parent.appendChild(result);

        return result;
    };

    var background             = create_tag_and_append("div");
    var backgroundStyle        = background.style;
    backgroundStyle.background = "#000000";

    var progress_bar_bg = create_tag_and_append('div', background);
    var progress_view   = create_tag_and_append('div', progress_bar_bg);
    var label_value     = create_tag_and_append('span', progress_bar_bg);

    var init_progress_bar_bg = function ()
    {
        var style = progress_bar_bg.style;

        style.background   = '#ffffff';
        style.borderRadius = 13 + 'px';

        style.padding = 3 + 'px';

        style.width  = 50 + "%";
        style.height = 20 + "px";

        style.left = 25 + "%";
        style.top  = 50 + "%";
    };

    var init_progress_view = function ()
    {
        var style = progress_view.style;

        style.backgroundColor = 'orange';
        style.width           = 0 + '%';
        style.height          = 20 + 'px';
        style.borderRadius    = 10 + 'px';
    };

    var init_label_value = function ()
    {
        var style = label_value.style;

        style.color      = 'white';
        style.fontFamily = 'sans-serif';

        style.top  = -18 + 'px';
        style.left = 5 + 'px';

        style.fontFamily = 'sans-serif';
    };

    var set_style_display_to = function (tag, value)
    {
        tag.style.display = value
    };

    self.hide = function ()
    {
        if (!is_shown)
        {
            return;
        }

        set_style_display_to(background, 'none');

        is_shown = false;
    };

    self.show = function ()
    {
        if (is_shown)
        {
            return;
        }

        set_style_display_to(background, 'inline');

        is_shown = true;
    };

    self.set_progress = function (key, value)
    {
        key = key.trim().toLowerCase();

        value = Math.min(value, 100);
        value = Math.max(value, 0);

        value = value.toFixed(2);

        if(progress_map[key] == value)
        {
            return;
        }

        progress_map[key] = value;

        var progress_total = 0;

        var progresses_count = 0;

        for (var key in progress_map)
        {
            progress_total += progress_map[key];

            progresses_count++;
        }

        progress_total /= progresses_count;

        progress_total = Math.round(progress_total * 100) / 100;

        var progress_text = progress_total + '%';

        progress_view.style.width = progress_text;

        label_value.textContent = progress_text;
    };

    self.set_progress_message = function (value)
    {
        //tood:finish
    };

    self.update = function ()
    {
        backgroundStyle.top    = canvas.offsetTop + 'px';
        backgroundStyle.left   = canvas.offsetLeft + 'px';
        backgroundStyle.width  = canvas.offsetWidth + 'px';
        backgroundStyle.height = canvas.offsetHeight + 'px';
    };

    self.report_progress = function ()
    {
        for (var key in progress_map)
        {
            var value = progress_map[key];

            if (value == 100)
            {
                continue;
            }

            unity_log(key + " progress is " + value);
        }
    };

    init_progress_bar_bg();
    init_progress_view();
    init_label_value();

    self.update();

    return self;
};