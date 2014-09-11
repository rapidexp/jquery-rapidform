# jQuery.rapidForm

Author: by Yoshiyuki Mikome <https://github.com/rapidexp/jquery-rapidform>

Copyright (c) 2014 [Rapidx Inc.](http://www.rapidex.co.jp)

Dual licensed under the MIT (MIT-LICENSE.txt) and GPL (GPL-LICENSE.txt) licenses.

Built for [jQuery](http://jquery.com)

-----------------------------------------------------------------------------------------------


Change the type of submit to "button" in the form set this plugin, you will get validations via ajax and direct drawing.
jQuery UI Dialog will be available to you more effectively!

## Bootstrap Form Elements

This plugin assumes a form field of the following structure.

When the field has an error, it sets has-error class in form-group, and appends a message to help-block.
Of course you may customize with the plugin options.

    <div class="form-group">
      <label class="col-..." for="name">Name</label>
      <div class="col-...">
        <input class="form-control" type="text" value="">
      </div>
      <div class="col-...">
        <span class="help-block" style="display;none">
          <i class="fa fa-waring"></li>
        <span>
      </div>
    </div>


## Settings

    $('form').rapidForm(options)

    $('#add').click(function() {
       $.fn.rapidForm.clickAdd();
    });

    $('body').on('click', '.edit', function() {
        $.fn.rapidForm.clickEdit($(this));
    });


## Options

Refer to the source text.

## Template

* The template is a line data including {valiable}.
* You must exhibit where of the line a variable is included in with data-template attribute.
* The data-raw attribute is sequence of the field values used when editing button was clicked.

    <tr id="template" style="display:none"
        data-template="{{{json_encode(array('.link a'=>'data-action,data-row','.name'=>'text'))}}}">
        <td class="link"><a data-action="user/hoge/{id}/edit" data-raw="">編集</a></td>
        <td class="name">{name}</td>
    </tr>


## Results of ajax

You must return the following arrangements in the function of the controller.

    reutrn json_encode(array('relaod' => true));

### errors

Associative array of a field name and the message.

### reload

The true reloads a page.

### redirect

The url string of the redirection.

### raw

Associative array of a field name and the value when editiong.

