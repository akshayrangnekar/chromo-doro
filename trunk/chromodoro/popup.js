
ChromoDoroPopup = (function(ackFor) {
  
  var self = this;
  popup = document.createElement('iframe');

  var startTop = -200;
  var targetTop = 5;

  popup.style.position = 'fixed';
  popup.style.top = startTop+'px';
  popup.style.right = '5px';
  popup.style.background = 'white';
  //popup.style.padding = '10px';
  popup.style.border = '1px solid gray';
  popup.style.width = '190px';
  popup.style.height = '100px';
  popup.style.zIndex = '9999';
  
  popup.style.WebkitBoxShadow = '4px 4px 3px rgba(0, 0, 0, 0.25)';

  popup.id = popup.name = 'ChromoDoroIframe';
  popup.src = 'about:blank';
  
  document.body.appendChild(popup);

  var doc = popup.contentDocument;


  doc.open();
  doc.write("<html><head><style>");
  doc.write("body { font-family:arial; font-size:0.95em; padding-top:3px; text-align:center; }");
  doc.write("button { font-size:1.05em; line-height:170%; } ");
  doc.write("h2 { margin-bottom:0.5em; } ");
  doc.write("</style><body>");
  if (ackFor == 'rest') {
    doc.write("<h2>You're done!</h2><span>Now <button id=\"ack\">take a break</button>.</span>");
  }
  if (ackFor == 'work') {
    doc.write("<h2>Get ready!</h2><span>And get <button id=\"ack\">back to work</button>.</span>");
  }

  doc.write('<audio src="beep.ogg" id="beep" ></audio>');
  doc.write('<script>document.getElementById(\'beep\').play();</script>');

  doc.write("</body></html>");
  doc.close();
  

  doc.getElementById('ack').addEventListener("click", function() {
      self.ackRest();
    }, false);

  progress = 0.0;
  
  this.scrollIn = function() {
    var popupTop = startTop + (progress * (targetTop-startTop));
    popup.style.top = Math.round(popupTop) + 'px';
    
    progress += ((1.0-progress) / 1.4) + 0.001;
    
    if (popupTop < targetTop) {    
      this.timeout = setTimeout("chromoDoroPopup.scrollIn()", 80);
    } else {
      //this.timeout = setTimeout("ChromoDoroPopup.hide()", 3000);
    }
  }
  
  this.scrollIn();

	this.hide = function() {
    popup.parentNode.removeChild(popup);
  }
  
  
  this.ackRest = function() {
    self.hide();
    chrome.extension.sendRequest({name: "ackRest"}, function(response) {
      
    });
  }

});



chrome.extension.onRequest.addListener(
  function(request, sender, sendResponse) {
    console.log(request);
    if (request.popup == "hide") {
      if (window.chromoDoroPopup) {
        window.chromoDoroPopup.hide();
        sendResponse({understood: "ok"});
      }
    }
  });


chrome.extension.sendRequest({popupReady: true}, function(response) {
  console.log(response);
  window.chromoDoroPopup = new ChromoDoroPopup(response.showAckFor);
});
