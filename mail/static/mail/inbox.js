document.addEventListener('DOMContentLoaded', function(result) {

  // Use buttons to toggle between views
  document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
  document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
  document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
  document.querySelector('#compose').addEventListener('click', compose_email);
  document.querySelector('#compose-form').addEventListener('submit', (event) => submit_email(event));

  // By default, load the inbox
  load_mailbox('inbox');
});

function compose_email() {

  // Show compose view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';

  // Clear out composition fields
  document.querySelector('#compose-recipients').value = '';
  document.querySelector('#compose-subject').value = '';
  document.querySelector('#compose-body').value = '';
}

function submit_email(event) {
  event.preventDefault();

  fetch("/emails", {
    method: "POST",
    body: JSON.stringify({
      recipients: document.querySelector("#compose-recipients").value,
      subject: document.querySelector("#compose-subject").value,
      body: document.querySelector("#compose-body").value,
    }),
  })
    .then((response) => response.json())
    .then((result) => {
      if (result["message"]) {
        alert(result["message"]);
        load_mailbox("sent");
      } else if (result["error"]) {
        alert(result["error"])
      }
      console.log(result);
    });
}

function load_mailbox(mailbox, message) {
  // Show the mailbox and hide other views
  document.querySelector("#emails-view").style.display = "block";
  document.querySelector("#compose-view").style.display = "none";

  // Show the mailbox name
  document.querySelector("#emails-view").innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;

  //GET request to appropriate mailbox (inbox,sent,archive)
  fetch(`/emails/${mailbox}`)
    .then((response) => response.json())
    .then((emails) => {
      // Print emails
      console.log(emails);
      // ... do something else with emails ...

      // loop over each emails 
      emails.forEach((email) => {
        // create div for each email
        const emailDiv = document.createElement("div");
        emailDiv.style.padding = "5px";
        emailDiv.style.border = "1px solid black";
        emailDiv.style.display = "flex";
        emailDiv.style.justifyContent = "space-between";

        // If the email has been read, it appears with a gray background, else white
        if (mailbox === "inbox" && email["read"] === true) {
          emailDiv.style.backgroundColor = "lightgrey";
        } else {
          emailDiv.style.backgroundColor = "white";
        }

        // create an HTML element
        emailDiv.innerHTML = `
            <div>
            <span class="sender"> <b>${email["sender"]}</b> </span>
            <span class="subject" style="padding-left:10px"> ${email["subject"]} </span>
            </div>
            <span class="timestamp" style="color:grey"> ${email["timestamp"]} </span>`;

        // adds an event handler to run a view_email function when that div is clicked on
        emailDiv.addEventListener("click", () => view_email(email["id"], mailbox));

        // adds new email to an HTML element whose id is emails-view
        document.querySelector("#emails-view").append(emailDiv);
      });
    });
}

function view_email(id, mailbox){
  // document.querySelector("#emails-view").style.display = "none";
  document.querySelector("#emails-view").innerHTML = "";

  // sending a GET request to /emails/email_id where email_id is an integer id for an email
  fetch(`/emails/${id}`)
    .then((response) => response.json())
    .then((email) => {
      // Print email

      console.log(email);
      // ... do something else with email ...

      // when email had been read the read argument become true
      if (email["read"] == false) {
        fetch(`/emails/${id}`, {
          method: "PUT",
          body: JSON.stringify({
            read: true,
          }),
        });
      }

      // create an HTML element
      const content = document.createElement("div");
      content.innerHTML = `
        <strong>From:</strong> ${email["sender"]}<br>
        <strong>To:</strong> ${email["recipients"]}<br>
        <strong>Subject:</strong> ${email["subject"]}<br>
        <p><strong>Timestamp:</strong> ${email["timestamp"]}<br></p>`;

      const line = document.createElement("hr");

      const body = document.createElement("div");
      body.innerText = `${email["body"]}`;

      // create reply button
      const replyButton = document.createElement("button");
      replyButton.className = "btn btn-sm btn-outline-primary";
      replyButton.style.marginRight = "5px";
      replyButton.innerText = `Reply`;

      // create archive button
      const archiveButton = document.createElement("button");
      archiveButton.className = "btn btn-sm btn-outline-primary";
      if (email["archived"]) {
        archiveButton.innerText = "Unarchive";
      } else {
        archiveButton.innerText = "Archive";
      }

      // adds an event handler to change emails archive status when archive button is clicked on
      archiveButton.addEventListener("click", () => {
        if (archiveButton.innerText === "Archive")
          archiveButton.innerText = "UnArchive";
        else archiveButton.innerText = "Archive";

        fetch(`/emails/${id}`, {
          method: "PUT",
          body: JSON.stringify({
            archived: !email["archived"],
          }),
        });
        location.reload();
        load_mailbox("inbox");
      });

      // adds an event handler to reply button
      replyButton.addEventListener("click", () => {
        compose_email();

        document.querySelector("#compose-recipients").value = email["sender"];

        // if the subject line already begins with Re: , it will not add it again
        if (/RE/.test(email["subject"])) {
          document.querySelector("#compose-subject").value = email["subject"];
        } else {
          document.querySelector("#compose-subject").value = `RE: ${email["subject"]}`;
        }

        document.querySelector("#compose-body").value = `\n\n >> On ${email["timestamp"]} ${email["sender"]} wrote: \n${email["body"]}\n`;
      });

      // add every email to HTML
      document.querySelector("#emails-view").append(content);

      // archive button will not be added to emails which are in the Sent mailbox
      if (mailbox !== "sent") {
        document.querySelector("#emails-view").appendChild(replyButton);
        document.querySelector("#emails-view").appendChild(archiveButton);
      } else {
        document.querySelector("#emails-view").appendChild(replyButton);
      }

      console.log(body);
      document.querySelector("#emails-view").append(line);
      document.querySelector("#emails-view").append(body);
    });
}
