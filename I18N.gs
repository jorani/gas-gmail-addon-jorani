/*
 * 18N.gs - a simple gettext library for GAS
 * 
 * Copyright (c) 2017 Benjamin BALET
 * Copyright (c) 2013 Ondrej Mosnáček
 * Based on GNU libintl implementation.
 * license http://opensource.org/licenses/AGPL-3.0 AGPL-3.0
 */

(function () {
  var locale;
  var getLocale = function() {
    if(locale === undefined)
      locale = Session.getActiveUserLocale() || 'en';
    return locale;
  };

  var catalogs = {};
  var defaultCatalog = 'messages';
  var textdomain = function(domainName) {
    if(domainName === undefined || domainName === null)
      return defaultCatalog;
    
    if(domainName === '')
      defaultCatalog = 'messages';
    else
      defaultCatalog = domainName;
  };

  var digettext = function(domainName, msgid1, msgid2, plural, n) {
    if(domainName === undefined || domainName === null)
      domainName = defaultCatalog;

    var catalog = catalogs[domainName];
    if(!catalog)
      return (plural && n != 1) ? msgid2 : msgid1;

    var locale = getLocale();
    if(!locale)
      return (plural && n != 1) ? msgid2 : msgid1;
    
    catalog = catalog[locale];
    if(!catalog)
      return (plural && n != 1) ? msgid2 : msgid1;

    var messages = catalog.messages || {};
    var message = messages[msgid1];
    if(!message)
      return (plural && n != 1) ? msgid2 : msgid1;

    if(plural) {
      var plural = catalog.plural || function(n) { return n == 1 ? 0 : 1; };
      var index = plural(n);
      return message.msgstr_plural[index];
    }
    else
      return message.msgstr;
  };
  
  var dgettext = function(domainName, msgid) {
    return digettext(domainName, msgid, null, false, 1);
  };
  var gettext = function(msgid) {
    return dgettext(null, msgid);
  };

  var dngettext = function(domainName, msgid1, msgid2, n) {
    return digettext(domainName, msgid1, msgid2, true, n);
  };
  var ngettext = function(msgid1, msgid2, n) {
    return dngettext(null, msgid1, msgid2, n);
  };
  
  I18N = {
    catalogs: catalogs,
    getLocale: getLocale,
    textdomain: textdomain,
    dgettext: dgettext,
    gettext: gettext,
    dngettext: dngettext,
    ngettext: ngettext,
  };
})();

var _ = I18N.gettext;
