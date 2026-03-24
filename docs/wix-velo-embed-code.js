/**
 * Wix Velo Code — Add to the PAGE that contains the quoting tool iframe
 *
 * SETUP INSTRUCTIONS:
 * 1. In Wix Studio Editor, select the page where the quoting tool iframe is embedded
 * 2. Click "Dev Mode" or the { } code icon to open Velo
 * 3. Paste this code into the page's code panel
 * 4. Replace 'quotingIframe' with the actual ID of your iframe/HTML element
 * 5. Replace the iframe URL with your deployed Vercel URL
 *
 * HOW IT WORKS:
 * - When the page loads, this code checks if the current Wix user is a
 *   site Collaborator (team member with backend access)
 * - If they are, it sends a postMessage to the quoting tool iframe
 * - The quoting tool listens for this message and shows the Admin button
 * - Regular site members (non-collaborators) won't see the Admin button
 */

import wixUsers from "wix-users";

$w.onReady(function () {
  // Wait a moment for the iframe to fully load
  setTimeout(() => {
    const iframeElement = $w("#quotingIframe"); // Change to your iframe element ID

    if (wixUsers.currentUser.loggedIn) {
      const user = wixUsers.currentUser;

      // Check the user's roles
      user.getRoles().then((roles) => {
        // Check if user has any admin-level role
        // Wix site collaborators have roles like "Admin", "Owner", etc.
        const adminRoles = roles.filter((role) => {
          const name = role.name.toLowerCase();
          return (
            name.includes("admin") ||
            name.includes("owner") ||
            name.includes("collaborator")
          );
        });

        if (adminRoles.length > 0) {
          // Send the role to the iframe
          iframeElement.postMessage({
            type: "wix-user-role",
            role: adminRoles[0].name, // e.g. "Collaborator", "Admin", "Owner"
          });
        }
      });
    }
  }, 1000); // 1 second delay for iframe to load

  // Also listen for messages FROM the iframe (future use)
  $w("#quotingIframe").onMessage((event) => {
    // Handle any messages from the quoting tool if needed
    console.log("Message from quoting tool:", event.data);
  });
});
