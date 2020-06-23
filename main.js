var secureIdentityRequired = false;

function log_message(message) {
  console.log("[lwext] " + message);
}

function login() {
  log_message("Attempting to authenticate with appliance");
  log_message("Requesting identity token from chrome");

  if (!secureIdentityRequired) {
    chrome.identity.getProfileUserInfo(function (obejct) {
      log_message("Chrome provided a email identity via ::getProfileUserInfo");
      log_message("Identity retrieved was: " + obejct.email);
      log_message(obejct.email);
      log_message("Sending request to chromelogin.linewize");

      var xhr = new XMLHttpRequest();
      xhr.open(
        "GET",
        "http://chromelogin.linewize.net?gto=" +
          obejct.email +
          "&signedin=true",
        true
      );
      xhr.onreadystatechange = function () {
        if (xhr.readyState == 4) {
          if (xhr.status == 200) {
            log_message("chromelogin.linewize returned success");
          } else if (xhr.status == 403) {
            secureIdentityRequired = true;
            log_message(
              "chromelogin.linewize returned a failure, 403 was issued"
            );
            log_message("setting secureIdentityRequired and trying again");

            login();
          } else {
            log_message(
              "chromelogin.linewize returned a failure, " + xhr.statusText
            );
          }
        }
      };
      xhr.send();
    });
  } else {
    chrome.identity.getAuthToken({ interactive: true }, function (token) {
      if (chrome.runtime.lastError) {
        log_message(
          "Chrome rejected the request for an identity token, lets try again!!"
        );
        login();
      } else {
        if (token != undefined) {
          log_message(
            "Chrome provided an identity token via oauth ::getAuthToken"
          );
          log_message("Identity retrieved was: " + token);
          log_message("Sending request to chromelogin.linewize");

          var xhr = new XMLHttpRequest();
          xhr.open(
            "GET",
            "http://chromelogin.linewize.net?gto=" + token + "&signedin=true",
            true
          );
          xhr.onreadystatechange = function () {
            if (xhr.readyState == 4) {
              if (xhr.status == 200) {
                log_message("Background Login successful.");
              } else {
                log_message("Background Login error:", xhr.statusText);
              }
            }
          };
          xhr.send();
        } else {
          log_message("Background Login error: No Chrome token.");
          login();
        }
      }
    });
  }
}

setInterval(function () {
  log_message("Login interval hit, running login again");
  login();
}, 600000);

chrome.extension.onMessage.addListener(function (
  request,
  sender,
  sendResponse
) {
  if (request.greeting === "SignIn") {
    login();
    sendResponse({});
  }
});

/* I have a fear that sometimes login() does not get called and I have seen that sometimes onStartup does not get called.
 * Thanks Google, your a trooper */
chrome.runtime.onStartup.addListener(function () {
  log_message("Extension was launched, running login");
  login();
});

login();
