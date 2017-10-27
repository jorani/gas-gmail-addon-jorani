/*
 * A GMail addon based on Google Application Script
 *
 * This project requires OAuth2 library
 * 
 * Prerequisites:
 * 1. Deploy this script in your organization and note the {SCRIPT ID}.
 * 2. Create an OAuth2 client in your Jorani instance
 *     redirect url must include {SCRIPT ID} as in:
 *     https://script.google.com/macros/d/{SCRIPT ID}/usercallback
 * 3. Report CLIENT_ID and CLIENT_SECRET in the beginning of script.
 * 4. Report BASE_URL of your Jorani instance.
 * 5. Each user must add this addon from their GMail settings.
 *    they can use the {SCRIPT ID} that you communicate to them
 *
 * Authorizations:
 * a. GMail will ask a lot of permission (User storage, fetch external
 *    API, read the content of the current email, etc.).
 * b. Then user will be prompted its Jorani login and passowrd the first
 *    time. 
 *
 * Copyright (c) 2017 Benjamin BALET
 * 
 * license http://opensource.org/licenses/AGPL-3.0 AGPL-3.0
 */


//Access to 3rd party API
//https://developers.google.com/gmail/add-ons/how-tos/non-google-services
//Add the library OAuth2 : https://github.com/googlesamples/apps-script-oauth2
var CLIENT_ID = 'gmail';
var CLIENT_SECRET = 'B4QfXTFQLgB5YcQ78tPH';
var BASE_URL = 'https://demo.jorani.org/';
var AUTHORIZATION_URL = BASE_URL + 'api/authorization/authorize';
var TOKEN_URL = BASE_URL + 'api/token';
//Redirect URI has the following form/example :
//https://script.google.com/macros/d/{SCRIPT ID}/usercallback
//https://script.google.com/macros/d/1HQyfaugLxrGlcz0m1i3njFE1d6qLSIT9zlGIfMWl90nSYstX6PytdqOs/usercallback

//Google Apps Script
//Introduction and Quickstart example : https://developers.google.com/gmail/add-ons/

//App scopes : https://developers.google.com/gmail/add-ons/concepts/scopes

//Lib i18n
//Extraction des chaînes à traduire:
//xgettext --keyword=_ --language=C -o mesages.pot gcode.js
//https://github.com/WOnder93/i18n-gas/

/**
 * Returns the array of cards that should be rendered for the current
 * e-mail thread. The name of this function is specified in the
 * manifest 'onTriggerFunction' field, indicating that this function
 * runs every time the add-on is started.
 *
 * @param {Object} e data provided by the Gmail UI.
 * @returns {Card[]}
 */
function buildAddOn(e) { 
  // Activate temporary Gmail add-on scopes.
  var accessToken = e.messageMetadata.accessToken;
  GmailApp.setCurrentMessageAccessToken(accessToken);

  var messageId = e.messageMetadata.messageId;
  var message = GmailApp.getMessageById(messageId);
  var body = message.getBody();
  var cards = [];
  
  //Detect if the message is a leave request from Jorani
  var regex = /hr\/counters\/collaborators\/(\d+)"/g;
  var match = regex.exec(body);
  
  if (match) {
    employeeId = match[1];
    
    //Extract Leave Request Id
    //https://demo.jorani.org/requests/accept/263
    var regex = /\/requests\/accept\/(\d+)"/g;
    var leaveRequestID = regex.exec(body)[1];
    
    cards.push(buildSummaryCard(employeeId, leaveRequestID));
  } else {
    // Present a blank card if the email is not from Jorani
    cards.push(CardService.newCardBuilder()
      .setHeader(CardService.newCardHeader()
        .setTitle(_('Please select a leave request email from Jorani'))).build());
  }
  return cards;
}

/**
* Build a simple card with a button that sends a notification.
* @return {Card}
*/
function buildSummaryCard(employeeId) {
  
  var employeeObj = getEmployee(employeeId);
  var fullName = employeeObj.firstname + ' ' +  employeeObj.lastname;
  var summaryObj = getLeaveSummaryForEmployee(employeeId);
  Logger.log(JSON.stringify(summaryObj, null, 2));
  
  //Convert fontawesom icons to base64 images : http://fa2png.io/
  var card = CardService.newCardBuilder();
  card.setHeader(CardService.newCardHeader()
                 .setTitle(fullName)
                 .setImageStyle(CardService.ImageStyle.CIRCLE)
                 .setImageUrl("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABwAAAAcCAMAAABF0y+mAAAA3lBMVEUAAAD1gR71gR71gR71gR71gR71gR71gR71gR71gR71gR71gR71gR71gR71gR71gR71gR71gR71gR71gR71gR71gR71gR71gR71gR71gR71gR71gR71gR71gR71gR71gR71gR71gR71gR71gR71gR71gR71gR71gR71gR71gR71gR71gR71gR71gR71gR71gR71gR71gR71gR71gR71gR71gR71gR71gR71gR71gR71gR71gR71gR71gR71gR71gR71gR71gR71gR71gR71gR71gR71gR71gR71gR71gR6AGFcAAAAASXRSTlMAAQIDBAUICQoLDA4RGBkaHB0eICYoKTA7QEdKS09XXV5fYWJpa290dXh7fH+Cj5KVmKOlpquytbq8xdHV19re5Onr7e/z9ff94sDuoAAAANFJREFUGBltwYdWwkAQBdCXuCaKSFQUK9gLKnZBVLAAmvf/PwRnQk52N3MvLGZtqxZCFd9xJr00KKuNmBkswxePmfsI4bln4QiuRVp+4FqnLYajQVsVjoS2CI4wZWEIzxULe/CYIXO9AL7KJzM9A9fK+XOycPxL8ms/2H46jFDYScn0xGCpGiG+JTmpI7fKzMtZ6+KNYhJhrsuyNjIVKv5DiF1qNiA61DQh+tTcQAyoeYAYU/MK8UdNF6JPTQfigJpNiOCdZY+YM9cjur5PA8xMAeg2epxMHLKdAAAAAElFTkSuQmCC")
                );
  var section = CardService.newCardSection()
    .setHeader("<font color=\"#3097d1\">" + _('Leave summary') + "</font>");
  
  var summaryTable = "";
  for (var k in summaryObj){
    if (k.indexOf('Catch up for ') !== -1 ) {
      var translatedTitle = k.replace("Catch up for", _("Catch up for"));
      summaryTable += "<b>" + translatedTitle + " :</b>: " +summaryObj[k][1] + "<br>";
      summaryTable += "<i>" +summaryObj[k][2] + "</i><br>";
    } else {
      summaryTable += "<b>" + k + " :</b><br>";
      var credit = summaryObj[k][1] - summaryObj[k][0];
      summaryTable += "<i>" + _("taken") + "</i> : " + summaryObj[k][0] + "<br>";
      summaryTable += "<i>" + _("entitled") + "</i> : " + summaryObj[k][1] + "<br>";
      summaryTable += "<i>" + _("available") + "</i> : " + credit + "<br>";
    }
  }  
  section.addWidget(CardService.newTextParagraph().setText(summaryTable));

  var buttonSet = CardService.newButtonSet();
  var threadLink = CardService.newOpenLink()
    .setUrl(BASE_URL + '/hr/counters/collaborators/' + employeeId)
    .setOpenAs(CardService.OpenAs.FULL_SIZE);
  var button = CardService.newTextButton()
    .setText(_('Leave balance'))
    .setOpenLink(threadLink);
  buttonSet.addButton(button);
  
  var threadLink = CardService.newOpenLink()
    .setUrl(BASE_URL)
    .setOpenAs(CardService.OpenAs.FULL_SIZE);
  var button = CardService.newTextButton()
    .setText(_('Jorani'))
    .setOpenLink(threadLink);
  buttonSet.addButton(button);
  
  section.addWidget(buttonSet);

  card.addSection(section);
  return card.build();
}

/**
 * Returns an object containing the leave summary of an
 * employee
 *
 * @param {Integer} employeeId Identifier of an aemployee
 * @returns {Object} 
 */
function getLeaveSummaryForEmployee(employeeId) {
  var service = getService();
  if (service.hasAccess()) {
    var url = BASE_URL + 'api/leavessummary/' + employeeId;
    var response = UrlFetchApp.fetch(url, {
      headers: {
        Authorization: 'Bearer ' + service.getAccessToken()
      }
    });
    var result = JSON.parse(response.getContentText());
    return result;
  } else {
    var authorizationUrl = service.getAuthorizationUrl();
    // Invoke the authorization flow using the default authorization prompt card.
    CardService.newAuthorizationException()
        .setAuthorizationUrl(authorizationUrl)
        .setResourceDisplayName("Jorani Authorization form")
        .throwException();
  }
}

/**
 * Returns all the properties of an employee
 *
 * @param {Integer} employeeId Identifier of an aemployee
 * @returns {Object} 
 */
function getEmployee(employeeId) {
  var service = getService();
  if (service.hasAccess()) {
    var url = BASE_URL + 'api/users/' + employeeId;
    var response = UrlFetchApp.fetch(url, {
      headers: {
        Authorization: 'Bearer ' + service.getAccessToken()
      }
    });
    var result = JSON.parse(response.getContentText());
    return result;
  } else {
    var authorizationUrl = service.getAuthorizationUrl();
    // Invoke the authorization flow using the default authorization prompt card.
    CardService.newAuthorizationException()
        .setAuthorizationUrl(authorizationUrl)
        .setResourceDisplayName("Jorani Authorization form")
        .throwException();
  }
}

/**
 * Reset the authorization state, so that it can be re-tested.
 */
function reset() {
  var service = getService();
  service.reset();
}

/**
 * Configures the service.
 */
function getService() {
  return OAuth2.createService('Jorani')
      .setAuthorizationBaseUrl(AUTHORIZATION_URL)
      .setTokenUrl(TOKEN_URL)
      .setClientId(CLIENT_ID)
      .setClientSecret(CLIENT_SECRET)
      .setCallbackFunction('authCallback')
      .setCache(CacheService.getUserCache())
      .setPropertyStore(PropertiesService.getUserProperties())
}

/**
 * Handles the OAuth callback.
 */
function authCallback(request) {
  var service = getService();
  var authorized = service.handleCallback(request);
  if (authorized) {
    return HtmlService.createHtmlOutput('Success!');
  } else {
    return HtmlService.createHtmlOutput('Denied');
  }
}
