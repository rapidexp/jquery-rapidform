/**
 * ---------------------------------------------------------------
 * jQuery.rapidForm
 * version 1.1.0
 *
 * Author: by Yoshiyuki Mikome https://github.com/rapidexp/jquery-rapidform
 *
 * Copyright (c) 2014 Rapidex inc. (http://www.rapidex.co.jp)
 * Dual licensed under the MIT (MIT-LICENSE.txt)
 * and GPL (GPL-LICENSE.txt) licenses.
 *
 * Built for jQuery library
 * http://jquery.com
 *
 * Change the type of submit to "button" in the form set this plugin,
 * you will get validations via ajax and direct drawing.
 * jQuery UI Dialog will be available to you more effectively!
 *
 * ---------------------------------------------------------------
 * Bootstrap Form Elements
 *
 *  This plug in assumes a form field of the following structure.
 *
 *  When the field has an error, it sets has-error class in form-group,
 *  and appends a message to help-block.
 *  Of course you may customize with options.
 *
 *   <div class="form-group">
 *     <label class="col-..." for="name">Name</label>
 *     <div class="col-...">
 *       <input class="form-control" type="text" value="">
 *     </div>
 *     <div class="col-...">
 *       <span class="help-block" style="display;none">
 *         <i class="fa fa-waring"></li>
 *       <span>
 *     </div>
 *   </div>
 *
 * ---------------------------------------------------------------
 * Setting
 *
 * $('form').rapidForm(options)
 *
 * $('#add').click(function() {
 *    $.fn.rapidForm.clickAdd();
 * });
 *
 * $('body').on('click', '.edit', function() {
 *    $.fn.rapidForm.clickEdit($(this));
 * });
 *
 * ---------------------------------------------------------------
 * Options
 *
 *   Refer to the source text.
 *
 * ---------------------------------------------------------------
 * Template
 *  - The template is a line data including {valiable}.
 *  - You must exhibit where of the line a variable is included in
 *    with data-template attribute.
 *  - The data-raw attribute is sequence of the field values used when
 *    editing button was clicked.
 *
 * <tr id="template" style="display:none"
 *     data-template="{{{json_encode(array('.link a'=>'data-action,data-row','.name'=>'text'))}}}">
 *     <td class="link"><a data-action="user/hoge/{id}/edit" data-raw="">編集</a></td>
 *     <td class="name">{name}</td>
 * </tr>
 *
 * ---------------------------------------------------------------
 * Results of ajax
 *   You must return the following arrangements in the function of the controller.
 *
 *   reutrn json_encode(array('relaod' => true));
 *
 *   errors		Associative array of a field name and the message.
 *   reload		The true reloads a page.
 *   redirect	The url string of the redirection.
 *   raw		Associative array of a field name and the value when editiong.
 *
 * ---------------------------------------------------------------
 * Histories
 *
 * 1.1.2 (2014-09-17)
 *  - Change specifications of confirm agin.
 * 1.1.1 (2014-09-16)
 *  - Add suport of data-action on form.
 *  - Add parameter of title to click utirities.
 * 1.1.0 (2014-09-12)
 *  - Add a option of alert.
 *  - Change specifications of beforRemove.
 *
 * 1.0.0 (2014-09-11)
 */


;(function($) {

	$.fn.rapidForm = function(options) {

		var $forms = $(this),	// Elements
			$edit_button,
			defaults,			// Options
			opts,
			replace_variables,	// Private functions
			open_dialog;

		defaults = {

			// Forms

			submit:         '.submit',		// Selectors of each buttons
			submitContinue:	'.continue',
			remove:         '.remove',
			cancel:         '.cancel',
			formGroup:      '.form-group',	// Parent of form field
			helpBlock:      '.help-block',	// Container of error message
			formGroupClass: 'has-error',	// Class of parent when error
			helpBlockContent:  '<i class="fa fa-warning"></i> {message}',
			alert:			'#alert',
			alertSuccess:	'<div class="alert alert-success fade in">' +
							'<button type="button" class="close" data-dismiss="alert">' +
							'<i class="fa fa-times"></i>' +
							'</button>' +
							'<i class="fa-fw fa fa-check"></i>' +
							'<strong>Success!</strong> {message}' +
							'</div>',
			alertError:		'<div class="alert alert-danger fade in">' +
							'<button type="button" class="close" data-dismiss="alert">' +
							'<i class="fa fa-times"></i>' +
							'</button>' +
							'<i class="fa-fw fa fa-warning"></i>' +
							'<strong>Error!</strong> {message}' +
							'</div>',
			confirmRemove:	'Are you sure?',
			beforeRemove: function() {
				var d = new $.Deferred;
				(!opts.confirmRemove || confirm(opts.confirmRemove)) ? d.resolve() : d.reject();
				return d.promise();
			},
			confirmSubmit:	null,
			beforeSubmit: function() {
				var d = new $.Deferred;
				(!opts.confirmSubmit || confirm(opts.confirmSubmit)) ? d.resolve() : d.reject();
				return d.promise();
			},
			afterSubmit:	null,			// Callback after the submit

			// Dialogs

			dialog:         null,
			urlAdd:         null,			// Action of creating dialog
			titleAdd:       'Create',		// Title of creating dialog
			titleEdit:      'Edit',			// Title of editing dialog
			width:	        '80%',
			template:       '#template',    // Selectors of template
			container:      '#tbody',
			row:            'tr:visible',
			insertAfter:    null,			// To return index of insertion position
			insertBefore:	null,			//
			open:           null,			// Callback after dialog opeing
			heightTextare:	true			// Set height of text area
		};

		opts = $.extend({}, defaults, options);

		/**
		 * Replace $target used $template
		 *
		 * @param node $target
		 * @param array rules
		 * @param data
		 * $param $template
		 * @return node
		 */
		replace_variables = function($target, rules, data, $template) {
			var selector, $el_template, $el_target, attr;

			if (!$template) {
				$template = $target;
			}
			for (selector in rules) {
				$el_template = (selector) ? $template.find(selector) : $template;
				$el_target = (selector) ? $target.find(selector) : $template;

				if ($el_template.length) {
					attrs = rules[selector].split(/ *, */);
					for (i = 0; i < attrs.length; i++ ) {
						attr = attrs[i];
						switch(attr) {
						case 'text':
							$el_template.each(function(i) {
								var $this = $(this), re;
								if (str = $this.text()) {
									if (m = str.match(/\{(.+)\}/)) {
										key = m[1];
										if (data[key] != null) {
											re = RegExp('\{' + key + '\}');
											str = str.replace(re, data[key]);
											$el_target.eq(i).text(str);
										}
									}
								}
							});
							break;

						case 'data-raw':
							str = JSON.stringify(data);
							// Use the native method to write in HTML directly.
							$el_target.get(0).setAttribute('data-raw', str);
							break;

						default:
							$el_target.each(function(i) {
								var $this = $(this), re;
								if (str = $this.attr(attr)) {
									if (m = str.match(/\{(.+)\}/)) {
										key = m[1];
										if (data[key] != null) {
											re = RegExp('\{' + key + '\}');
											str = str.replace(re, data[key]);
											$el_target.eq(i).attr(attr, str);
										}
									}
								}
							});
							break;
						}
					}
				}
			}
		};

		//
		// Main funciton
		//

		$forms.each(function() {
			var $form = $(this);

			// Sumit

			$form.find(opts.submit + ',' + opts.submitContinue).filter(':button')
			.click(function() {
				opts.beforeSubmit($form).done(function() {
					var $button = $(this);
					// Remove last errors
					$form.find(opts.helpBlock).text('').hide();
					$form.find(opts.formGroup).removeClass(opts.formGroupClass);

					// Save via ajax
					$.ajax({
						url:  $form.attr('action'),
						data: new FormData($form[0]),
						contentType: false,	// FormData makes appropriate contentType
						processData: false, // Do not convert to query string for file transmission
						type: 'post',
						dataType: 'json'
					})
					.done(function(results) {
						var key, $formGroup, $helpBlock,
							$template, rules,
							$container, $target;

						// Draw errors in a form

						if (results && results.errors) {
							for(key in results.errors) {
								$formGroup = $form.find('[name="'+key+'"],[for="'+key+'"]').parents(opts.formGroup);
								$helpBlock = $formGroup.find(opts.helpBlock);
								$formGroup.addClass(opts.formGroupClass);
								$helpBlock.show().html(opts.helpBlockContent.replace(/\{message\}/, results.errors[key]));
							}
							return;
						}

						if (opts.afterSubmit) {
							opts.afterSubmit($form, results);
						}

						// Redirect

						if (results && results.reload) { location.reload(); return; }
						if (results && results.redirect) { location.href = results.redirect; return; }

						// Close dialog or Refresh form

						if (opts.dialog && $form.parents(opts.dialog).length &&
							$button.is(opts.submit)) {
							// Close a dialog without any errors
							$(opts.dialog).dialog('close');
						} else if (results && results.form == 'clear' ||
								   $button.is(opts.submitContinue)) {
							// Delete input values when form is in page.
							$form.find('input:not(:checkbox,:radio), textarea').val('');
						}

						// Alert message

						if (results && results.alertSuccess) {
							$(opts.alert).html(
								opts.alertSuccess.replace(/\{message\}/, results.alertSuccess));
						}

						if (results && results.alertError) {
							$(opts.alert).html(
								opts.alertError.replace(/\{message\}/, results.alertSuccess));
						}

						// Update a page with the template

						if (results && results.raw) {
							$template = $(opts.template).clone().show();
							rules = $template.data('template');
							$template.removeAttr('id data-template');

							// Editing
							if ($edit_button) {
								$current = $edit_button.parents(opts.row+':first');
								replace_variables($current, rules, results.raw, $template);
							}
							// Creating
							else {
								replace_variables($template, rules, results.raw);

								$container = $(opts.container);
								$target = null;
								if (opts.insertAfter) {
									index = opts.insertAfter($container, results.raw);
									if (index != null) {
										$target = $container.find(opts.row).eq(index);
										$template.insertAfter($target);
									}
								} else if (opts.insertBefore) {
									index = opts.insertBefore($container, results.raw);
									if (index != null) {
										$target = $container.find(opts.row).eq(index);
										$template.insertBefore($target);
									}
								}
								if (!$target)  {
									$template.appendTo($container);
								}
							}
						}
					});
				});
			});

			// Remove

			$form.find(opts.remove)//.unbind('click')
			.click(function() {
				opts.beforeRemove($form).done(function() {
					// Remove last errors
					$form.find(opts.helpBlock).text('').hide();
					$form.find(opts.formGroup).removeClass(opts.formGroupClass);

					// Perform via ajax
					$.ajax({
						url: $form.attr('action').replace(/\/edit$/, '/remove'),
						type: 'get',
						dataType: 'json'
					})
					.done(function(results) {
						var key, $formGroup, $helpBlock;
						// Draw errors in a form
						if (results && results.errors) {
							for(key in results.errors) {
								$formGroup = $form.find('[name="'+key+'"],[for="'+key+'"]').parents(opts.formGroup);
								$helpBlock = $formGroup.find(opts.helpBlock);
								$formGroup.addClass(opts.formGroupClass);
								$helpBlock.show().html(opts.helpBlockContent.replace(/\{message\}/, results.errors[key]));
							}
							return;
						}

						// Redirect
						if (results) {
							if (results.reload) { location.reload(); return; }
							if (results.redirect) { location.href = results.redirect; return; }
						}

						// Close a dialog without any errors
						if (opts.dialog && $form.parents(opts.dialog).length) {
							$(opts.dialog).dialog('close');
						}

						if ($edit_button) {
							$edit_button.parents(opts.row+':first').remove();
						}
					});
				});
			});

			// Control enter key without sumit

			if ($form.find(':submit').length == 0 &&　$form.find('.btn-primary:button').length > 0) {
				$form.find('input,textarea').keypress(function(ev) {
					var $this = $(ev.currentTarget),
						cc = ev.charCode || ev.keyCode;
					if (cc == 13) {
						// Allow in text area
						if ($this.is('textarea')) return;
						// Click primary button in input box
						if ($this.is(':not(:checkbox,:radio)')) {
							$form.find('.btn-primary:button').eq(0).click();
						}
						// Restrain an unidentified problem that a page changes in enter,
						// though there is not submit button.
						return false;
					}
				});
			}
		});

		//
		// Dialogs
		//

		open_dialog = function(dialog, title, url, rawData) {

			var $dialog = $(dialog),
				$form = $dialog.find('form');

			// Set url in action
			if (url) {
				$form.attr('action', url);
			} else if (url = $form.data('action')) {
				$form.attr('action', url);
			}

			// Set field values
			if (!$dialog.find(opts.helpBlock).text().length) {
				// Exclude if errors have benn already set at the time of page generation.

				$dialog.find('input, textarea, select').each(function() {
					var $el = $(this),
						name = $el.attr('name'),
						type = $el.attr('type'),
						m, row;

					if (type == 'radio' || type == 'checkbox') {
						if (rawData) $el.prop('checked', ($el.val() == rawData[name]));
					} else if (rawData){
						$el.val(str = rawData[name]);
						// Set heigth of textarea
						if (opts.heightTextare && $el.is('textarea') && str.length) {
							m = str.match(/\n/);
							row = (m) ? m.length + 1 : 1;
							$el.css('height', (row*3)+'em');
						}
					} else {
						$el.val('');
					}
				});
			}

			// View control such as deletiion buttons
			if (rawData) {
				// when editiong
				$remove = $dialog.find(opts.remove).show();
				if ($remove.is('a') && url) {
					$remove.attr('href', url.replace(/\/edit$/, '/remove')).show();
				}
				$dialog.find('.add-disabled').prop('disabled', false);
				$dialog.find('.edit-disabled').prop('disabled', true);
				$dialog.find('.add-hide').show();
				$dialog.find('.edit-hide').hide();
			} else {
				// when cleating
				$dialog.find('.remove').hide();
				$dialog.find('.add-disabled').prop('disabled', true);
				$dialog.find('.edit-disabled').prop('disabled', false);
				$dialog.find('.add-hide').hide();
				$dialog.find('.edit-hide').show();
			}

			// Open a dialog

			$dialog.dialog({
				title: title,
				width: opts.width,
				modal: true,
				open:  opts.open,
				close: function() {
					// Remove erros when closed
					$dialog.find(opts.helpBlock).text('').hide();
					$dialog.find(opts.formGroup).removeClass(opts.formGroupClass);
				}
			});
			$dialog.find(opts.cancel).filter(':button').unbind('click')
			.click(function() {
				$dialog.dialog('close');
			});
		};


		$.fn.rapidForm.clickAdd = function(title) {
			$edit_button = null;
			if (!title) title = opts.titleAdd;
			open_dialog(opts.dialog, title, opts.urlAdd);
		};

		$.fn.rapidForm.clickEdit = function(el, title) {
			$edit_button = el;
			if (!title) title = opts.titleEdit;
			var url, rawData;

			url = $edit_button.data('action');
			if (!url) {
				url = $edit_button.attr('href');
			}
			// Read not jQuery cash directly from DOM,
			// because data-raw will be renewed by editing.
			rawData = $.parseJSON($edit_button.attr('data-raw'));
			open_dialog(opts.dialog, title, url, rawData);
		};

		$.fn.rapidForm.clickCustom = function(dialog, title, url) {
			$edit_button = null;
			open_dialog(dialog, title, url);
		};


		// Set has-error when opening a page
		$(opts.helpBlock + ':visible').parents(opts.formGroup).addClass(opts.formGroupClass);

		return $forms;
	};

}) (jQuery);



