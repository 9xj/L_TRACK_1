function display_login(message) {
  trigger_loading(false);
  if (document.getElementById("msg")) {
    document.getElementById("msg").innerHTML = message;
    document.getElementById("login").style.display = "block";
    document.getElementById("logout").style.display = "none";
  }
}

function display_logout(userName) {
  trigger_loading(false);
  if (document.getElementById("msg")) {
    document.getElementById("msg").innerHTML =
      "You are signed in as '" + userName + "'";
  }
}

function display_error(errorMessage) {
  trigger_loading(false);
  if (document.getElementById("msg")) {
    document.getElementById("msg").innerHTML = errorMessage;
    document.getElementById("login").style.display = "block";
  }
}

function trigger_loading(show_loading) {
  if (document.getElementById("wrapper")) {
    if (show_loading) {
      document.getElementById("wrapper").style.display = "none";
      document.getElementById("loading").style.display = "block";
    } else {
      document.getElementById("wrapper").style.display = "block";
      document.getElementById("loading").style.display = "none";
    }
  }
}

function parse_response(responseText) {
  try {
    var result = JSON.parse(responseText);
    if ("data" in result) {
      return result["data"];
    } else {
      return { error: "Invalid JSON response." };
    }
  } catch (err) {
    return { error: "Invalid JSON response." };
  }
}

function handle_response(response) {
  var responseJson = parse_response(response);
  if ("error" in responseJson) {
    display_error(responseJson["error"]);
  } else {
    try {
      if (responseJson["loggedin"] && responseJson["user"] != null) {
        display_logout(responseJson["user"]);
      } else {
        display_login("You are not signed in.");
      }
    } catch (err) {
      console.log("handle_response:", err);
      display_error("An error occurred.");
    }
  }
}

function status() {
  trigger_loading(true);
  var xhr = new XMLHttpRequest();
  xhr.open("GET", "http://chromelogin.linewize.net/status", true);
  xhr.onreadystatechange = function () {
    if (xhr.readyState == 4) {
      if (xhr.status == 200) {
        handle_response(xhr.responseText);
      } else {
        console.log("Status error:", xhr.statusText);
        display_error("An error occurred while checking the user status.");
      }
    }
  };
  xhr.send();
}

document.addEventListener("DOMContentLoaded", function () {
  document.getElementById("login").onclick = function () {
    trigger_loading(true);
    chrome.extension.sendMessage({ greeting: "SignIn" }, function (response) {
      status();
    });
  };

  if (typeof chrome.runtime.getManifest == "function") {
    document.getElementById("footer").innerHTML =
      "Version: " + chrome.runtime.getManifest().version;
  }
  status();
});
