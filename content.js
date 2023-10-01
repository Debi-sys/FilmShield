// content.js

// Function to block the movie from showing
function blockMovie() {
  const overlay = document.createElement("div");
  overlay.className = "movie-overlay";
  overlay.innerHTML = `
    <p>Trigger warnings: [List of trigger warnings]</p>
    <button id="acknowledge-button">I Acknowledge</button>
  `;
  document.body.appendChild(overlay);

  // Add event listener for the "acknowledge" button
  document.getElementById("acknowledge-button").addEventListener("click", () => {
    // Remove the overlay and show the movie
    overlay.remove();
  });
}

// Call the blockMovie function to block the movie on page load
blockMovie();
