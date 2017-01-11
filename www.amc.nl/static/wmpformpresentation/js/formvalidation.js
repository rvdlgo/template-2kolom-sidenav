var FormValidation = function() {

  //
  // function to trigger a change of a fragment. The fragment will be validated and other fields are checked for
  // possible visual changes (shown or hidden)
  //
  function changeFragment(obj, validate) {
    var formId = obj.parents('form:first').attr("id");
    var step = WebmanagerFormStateRegistry[formId].currentStep();

    var inputName = obj.attr("name");
    var fragmentObj = FormsUtil.getObject(step, inputName);

    // set the value in the scope
    var newValue = getFragmentValue(obj);
    if (fragmentObj != null && fragmentObj.value != newValue) {
      
      // only trigger actions when the value is changed
      fragmentObj.value = newValue;
      fragmentObj.validated = false;

      // Revalidate the fragment
      if (validate) {
        validateFormFragment(obj, fragmentObj);
      }

      // (2) when a fragment has got a new value, check if other fields have to (dis)appear
      // Added hidden, because you can have a hidden counter (eg for the repeater) which needs to trigger the checkConditions
      var inputType = obj.attr("type");

      var changes = FormsUtil.checkConditions(step, '', formId);
      for (var i=0; i < changes.length;i++) {
        if (changes[i].value == 'show') {
          // throw high level event, so custom code can react on that
          $('#' + FormsUtil.normalize(changes[i].identifier)).trigger('IAF_ShowFormFragment');
        } else {
          // throw high level event, so custom code can react on that
          $('#' + FormsUtil.normalize(changes[i].identifier)).trigger('IAF_HideFormFragment');
        }
      }
    }

  }

  //
  // Function to validate a form fragment
  // Returns true if an error has occurred
  //
  function validateFormFragment(inputObj, fragmentObj) {
    var inputName = inputObj.attr("name");

    var hasError = false;
    if (fragmentObj != null && !fragmentObj.validated) {

      // validate the input: only when visible
      if (inputObj.is(":visible")) {
        var validationResult = fragmentObj.validate();

        // gather the errors
        var errors = FormsUtil.join(validationResult,',');
        hasError = (errors != '');

        var errorDivId = "error_" + FormsUtil.normalize(inputName);
        var errorObj = $("#" + errorDivId);
        if (errorObj.length > 0) {
          if (errors != '') {
            errorObj.trigger('IAF_ShowError',[errorDivId,validationResult]);
          } else {
            errorObj.trigger('IAF_HideError', errorDivId);
          }
        }
      }
    }
    return hasError;
  }


  //
  // Function for validating the form: the inputs are validated and the form is not submitted, when there are errors
  //
  function validateForm(formObj, step) {
    // loop over the inputs
    var hasError = false;
    $(':input', formObj).each(function() {
      var inputName = $(this).attr("name");
      var inputType = $(this).attr("type");
      if (inputName != '' && inputType != 'hidden' && inputType != 'button' && inputType != 'submit') {

        // sanity check
        var fragmentObj = FormsUtil.getObject(step, inputName);
        var fragmentError = validateFormFragment($(this), fragmentObj);
        if (fragmentError) {
          hasError = true;
        }

      }
    });
    return hasError;
  }

  //
  // function to trigger a submit. Before submitting, all values which are not visible are cleared.
  //
  function submitForm(formObj, step) {
    // (4) make the value empty to prevent to be routed to the same step
    // issue: http://jira.gxdeveloperweb.com/jira/browse/GXWMF-626

    formObj.unbind('submit');

    $(':input', formObj).each(function() {
      // skip the hidden inputs
      var inputName = $(this).attr("name");

      if (typeof inputName != 'undefined') {
		  var fragmentObj = FormsUtil.getObject(step, inputName);
		  if (fragmentObj != null && !fragmentObj.visible) {
		    // clear the value
		    switch(this.type) {
		      case 'password':
		      case 'select-multiple':
		      case 'select-one':
		      case 'text':
		      case 'textarea':
		        $(this).val('');
		        break;
		      case 'checkbox':
		      case 'radio':
		        $(this).removeAttr("checked");
		        // add an empty input type="hidden": this because the browser doesn't send an empty radio
		        formObj.append('<input type="hidden" name="' + inputName + '" value="" />');
		    }
		  }
      }
    });
    formObj.trigger('IAF_SubmitForm');
  };


  //
  // Utility functions with jQuery syntax, and thus not in the formutil.js
  // Get the value(s) for an object. This implementation differs per input type
  //
  function getFragmentValue(obj) {
    value = obj.val();

    if (obj.attr("type") == 'radio') {
      value = $('input[name=' + obj.attr("name") + ']:checked').val();
    }
    // for checkboxes we pass the array of values
    if (obj.attr("type") == 'checkbox') {
      values = $('input:checkbox[name=' + obj.attr("name") + ']:checked') || [];
      value = new Array();

      i=0;
      values.each(function() {
        value.push($(this).val());
        i++;
      });
    }
    return value;
  }

  //
  // Public methods and variables.
  //
  return {
    changeFragment:changeFragment,
    submitForm:submitForm,
    validateForm:validateForm,
    validateFormFragment:validateFormFragment,
    getFragmentValue:getFragmentValue
  }

}();
