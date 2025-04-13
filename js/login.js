const poolData = {
  UserPoolId: 'ap-southeast-2_6cbsxULN7',
  ClientId: '4dulbnkvuuo6tf6092qfvvfssd'
};

const userPool = new AmazonCognitoIdentity.CognitoUserPool(poolData);
let cognitoUserGlobal;

function login() {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  const authDetails = new AmazonCognitoIdentity.AuthenticationDetails({
    Username: email,
    Password: password
  });

  const cognitoUser = new AmazonCognitoIdentity.CognitoUser({
    Username: email,
    Pool: userPool
  });

  cognitoUser.authenticateUser(authDetails, {
    onSuccess: function (result) {
      const idToken = result.getIdToken().getJwtToken();
      localStorage.setItem("idToken", idToken);

      const payload = JSON.parse(atob(idToken.split('.')[1]));
      const groups = payload["cognito:groups"] || [];

      if (groups.includes("owner")) {
        window.location.href = "owner.html";
      } else if (groups.includes("driver")) {
        window.location.href = "driver.html";
      } else {
        document.getElementById("message").innerText = "You are not assigned to any group.";
      }
    },
    onFailure: function (err) {
      document.getElementById("message").innerText = err.message || JSON.stringify(err);
    },
    newPasswordRequired: function (userAttributes) {
      cognitoUserGlobal = cognitoUser;
      document.getElementById("newPasswordForm").style.display = "block";
    }
  });
}

function submitNewPassword() {
  const newPassword = document.getElementById("newPassword").value;
  cognitoUserGlobal.completeNewPasswordChallenge(newPassword, {}, {
    onSuccess: function (result) {
      localStorage.setItem("idToken", result.getIdToken().getJwtToken());
      document.getElementById("message").innerText = "Password updated. Please log in again.";
      window.location.href = "login.html";
    },
    onFailure: function (err) {
      document.getElementById("message").innerText = err.message || JSON.stringify(err);
    }
  });
}
