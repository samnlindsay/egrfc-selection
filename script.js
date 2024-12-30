let players = [];
let playerAvailability = {};
let selectedPlayers = {}; // To track selected players for each position

const positionMapping = {
  "Prop": [1, 3], // Player numbers 1 and 3 are both Props
  "Hooker": [2], // Player number 2 is Hooker
  "Second Row": [4, 5], // Player numbers 4 and 5 are Second Rows
  "Flanker": [6, 7], // Player numbers 6 and 7 are Flankers
  "Number 8": [8], // Player number 8 is Number 8
  "Scrum Half": [9], // Player number 9 is Scrum Half
  "Fly Half": [10], // Player number 10 is Fly Half
  "Wing": [11, 14], // Player numbers 11 and 14 are Wings
  "Centre": [12, 13], // Player numbers 12 and 13 are Centres
  "Full Back": [15], // Player number 15 is Full Back
};


// Load players from the JSON file
document.addEventListener("DOMContentLoaded", () => {
  loadPlayers();
  document
    .getElementById("save-availability")
    .addEventListener("click", saveAvailabilityToFile);

  document
    .getElementById("mark-all-available")
    .addEventListener("click", markAllAvailable);

  document
    .getElementById("add-player-button")
    .addEventListener("click", () => {
      document.getElementById("add-player-modal").classList.remove("hidden");
    });

  document
    .getElementById("cancel-add-player")
    .addEventListener("click", () => {
      document.getElementById("add-player-modal").classList.add("hidden");
    });

  document
    .getElementById("save-player-button")
    .addEventListener("click", () => {
      const playerName = document.getElementById("player-name").value;
      
      // Extract player positions from checkbox values
      const playerPositions = Array.from(
        // Get all checkboxes that are checked with ids beginning with "position-"
        document.querySelectorAll('input[type="checkbox"]:checked[id^="position-"]')
      ).map((checkbox) => checkbox.value);

      const playerAvailability = document.getElementById(
        "player-availability"
      ).checked;

      if (!playerName || playerPositions.length === 0) {
        alert("Please provide valid inputs.");
        return;
      }

      // Add new player to the players array
      const newPlayer = {
        name: playerName,
        position: playerPositions,
        available: playerAvailability,
      };
      players.push(newPlayer);

      // Re-render the sidebar and dropdowns
      renderPlayerList(); // Assuming a function exists to render the player list
      renderPositionSelect(); // Assuming a function exists to render dropdowns

      // Clear inputs and hide modal
      document.getElementById("player-name").value = "";
      document.getElementById("player-availability").checked = false;
      // Uncheck all checkboxes
      document
        .querySelectorAll('input[type="checkbox"]:checked')
        .forEach((checkbox) => (checkbox.checked = false));

      document.getElementById("add-player-modal").classList.add("hidden");
    });

  document
    .getElementById("clear-selections")
    .addEventListener("click", clearSelections);

  document
    .getElementById("save-selection")
    .addEventListener("click", saveSelectionToFile);

  document
    .getElementById("copy-to-clipboard")
    .addEventListener("click", copyToClipboard);

  document
    .getElementById("player-container")
    .addEventListener("click", (event) => {
      const target = event.target;
      if (target.classList.contains("icon-edit")) {
        const playerId = target.closest(".player-info").dataset.id;
        editPlayer(playerId);
      } else if (target.classList.contains("icon-check")) {
        const playerId = target.closest(".player-info").dataset.id;
        toggleAvailability(playerId, true);
      } else if (target.classList.contains("icon-x")) {
        const playerId = target.closest(".player-info").dataset.id;
        toggleAvailability(playerId, false);
      }
    });

    document
      .getElementById("position-select")
      .addEventListener("change", (event) => {
        const target = event.target;
        if (target.tagName === "SELECT") {
          const position = target.id.replace("select-position-", ""); // Extract position name
          const playerIndex = target.value; // Get selected player index
          selectedPlayers[position] = playerIndex; // Update selectedPlayers
        }
      });

    document
      .querySelectorAll(".select-selected")
      .forEach((dropdown, index) => {
        dropdown.addEventListener("change", () =>
          handlePlayerSelection(index + 1)
        );
      });

});

const sidebar = document.getElementById("sidebar");
const toggleBtn = document.getElementById("toggle-btn");
const content = document.getElementById("content");

toggleBtn.addEventListener("click", () => {
  sidebar.classList.toggle("collapsed");
  content.classList.toggle("sidebar-collapsed");
  
  // Update the toggle button's arrow direction
  if (sidebar.classList.contains("collapsed")) {
    toggleBtn.innerHTML = "<i class='fa-solid fa-bars'></i>";
  } else {
    toggleBtn.innerHTML =
      '<span style="margin: 10px;">Show / Hide</span><i class="fa-solid fa-bars"></i>'; 
  }
});


// Edit player name and positions (display current name/positions as default)
function editPlayer(index) {
  const player = players[index];
  const updatedName = prompt("Enter player name:", player.name);
  const updatedPositions = prompt(
    "Enter player positions (comma-separated):",
    player.position.join(", ")
  );

  if (updatedName !== null && updatedPositions !== null) {
    players[index] = {
      ...player,
      name: updatedName,
      position: updatedPositions.split(",").map((pos) => pos.trim()),
    };

    renderPlayerList();
    renderPositionSelect();
  }
}

// Function to toggle the visibility of each section
function toggleSection(sectionId) {
  var section = document.getElementById(sectionId);
  var triangleIcon = section.previousElementSibling.querySelector('.triangle-icon');
  var sectionContainer = section.closest('.collapsible-section');

  // Toggle visibility of the section
  if (section.style.display === "none" || section.style.display === "") {
    section.style.display = "block";
    triangleIcon.classList.add('rotate');
    
    // If expanded, adjust the height of the sections
    sectionContainer.classList.add('expanded');
  } else {
    section.style.display = "none";
    triangleIcon.classList.remove('rotate');
    
    // Collapse the section
    sectionContainer.classList.remove('expanded');
  }
}

// Call the function initially to ensure sections are properly sized
adjustSidebarHeight();

// Function to adjust sidebar height when needed (e.g., after expanding)
function adjustSidebarHeight() {
  var sidebar = document.getElementById("sidebar");
  var sections = sidebar.querySelectorAll(".collapsible-section");

  // Reset all sections to default height
  sections.forEach(function(section) {
    section.style.flexGrow = '0';
  });

  // Calculate the total number of expanded sections
  var expandedSections = sidebar.querySelectorAll(".collapsible-section.expanded");

  // If no sections are expanded, make one grow to fill the sidebar
  if (expandedSections.length === 0) {
    sections[0].style.flexGrow = '1'; // Make the first section expand by default
  } else {
    // Distribute remaining space among expanded sections
    var spacePerSection = 100 / expandedSections.length;
    expandedSections.forEach(function(expandedSection) {
      expandedSection.style.flexGrow = spacePerSection;
    });
  }
}



// Load players from the JSON file
function loadPlayers() {
  fetch("players.json")
    .then((response) => response.json())
    .then((data) => {
      players = data;
      players.forEach((player) => {
        player.selected = null; // Initialize selected property
      });
      initializePlayerAvailability();
      renderPlayerList();
      renderPositionSelect(); // Call to render the dropdowns for positions
    })
    .catch((error) => {
      console.error("Error loading players:", error);
    });
}

function initializePlayerAvailability() {
  players.forEach((player, index) => {
    playerAvailability[index] = player.available || false; // Use actual availability
  });
}

function renderPositionSelect() {
  const positionSelectDiv = document.getElementById("position-select");
  positionSelectDiv.innerHTML = ""; // Clear existing content

  const positionNumbers = {
    Prop: [1, 3],
    Hooker: [2],
    Flanker: [6, 7],
    "Second Row": [4, 5],
    "Number 8": [8],
    "Scrum Half": [9],
    "Fly Half": [10],
    Centre: [12, 13],
    Wing: [11, 14],
    "Full Back": [15],
  };

  const usedNumbers = new Set();

  const rows = [
    ["Prop", "Hooker", "Prop"],
    ["Flanker", "Second Row", "Second Row", "Flanker"],
    ["Number 8"],
    [null, "Scrum Half"],
    [null, "Fly Half"],
    [null, "Centre", "Centre"],
    ["Wing", "Wing"],
    ["Full Back"],
  ];

  const getNextAvailableNumber = (position) => {
    const availableNumbers = positionNumbers[position].filter(
      (num) => !usedNumbers.has(num)
    );
    return availableNumbers.length > 0 ? availableNumbers[0] : null;
  };

  rows.forEach((rowPositions, rowIndex) => {
    const rowDiv = document.createElement("div");
    rowDiv.className = `position-row row-${rowIndex + 1}`;

    rowPositions.forEach((positionName) => {
      const positionDiv = document.createElement("div");
      positionDiv.className = "position-cell";

      if (positionName) {
        const assignedNumber = getNextAvailableNumber(positionName);

        if (assignedNumber !== null) {
          usedNumbers.add(assignedNumber); // Mark number as used

          const positionHeader = document.createElement("div");
          positionHeader.className = "position-header";

          const positionNumberLabel = document.createElement("span");
          positionNumberLabel.textContent = assignedNumber;
          positionNumberLabel.className = "position-number";

          const positionLabel = document.createElement("span");
          positionLabel.textContent = positionName;
          positionLabel.className = "position-label";

          positionHeader.appendChild(positionNumberLabel);
          positionHeader.appendChild(positionLabel);

          const positionSelect = document.createElement("select");
          positionSelect.id = `select-position-${assignedNumber}`;

          const placeholderOption = document.createElement("option");
          placeholderOption.value = "";
          placeholderOption.textContent = " - ";
          positionSelect.appendChild(placeholderOption);

          players.forEach((player, playerIndex) => {
            if (
              player.available &&
              player.position.includes(positionName) &&
              (player.selected === null || player.selected === assignedNumber)
            ) {
              const option = document.createElement("option");
              option.value = playerIndex;
              option.textContent = player.name;

              if (player.selected === assignedNumber) {
                option.selected = true;
                positionSelect.classList.add("select-selected");
              }

              positionSelect.appendChild(option);
            }
          });

          positionSelect.addEventListener("change", (event) => {
            const selectedPlayerIndex = event.target.value;

            players.forEach((player, index) => {
              if (index === parseInt(selectedPlayerIndex)) {
                player.selected = assignedNumber;
              } else if (player.selected === assignedNumber) {
                player.selected = null;
              }
            });

            // Re-render dropdowns to reflect updated selections
            renderPositionSelect();
          });

          positionDiv.appendChild(positionHeader);
          positionDiv.appendChild(positionSelect);
        } else {
          console.warn(
            `No available numbers left for position: ${positionName}`
          );
        }
      } else {
        positionDiv.classList.add("empty");
      }

      rowDiv.appendChild(positionDiv);
    });

    positionSelectDiv.appendChild(rowDiv);
  });

  const replacementsSelectDiv = document.getElementById("replacements-select");
  replacementsSelectDiv.innerHTML = ""; // Clear existing content

  const replacementsDiv = document.createElement("div");
  replacementsDiv.className = "replacements-row";

  [16, 17, 18].forEach((replacementNumber) => {
    const replacementDiv = document.createElement("div");
    replacementDiv.className = "replacement-cell";

    const positionNumberLabel = document.createElement("span");
    positionNumberLabel.textContent = replacementNumber;
    positionNumberLabel.className = "replacement-number";

    const positionSelect = document.createElement("select");
    positionSelect.id = `select-replacement-${replacementNumber}`;

    const placeholderOption = document.createElement("option");
    placeholderOption.value = "";
    placeholderOption.textContent = " - ";
    positionSelect.appendChild(placeholderOption);

    players.forEach((player, playerIndex) => {
      if (
        player.available &&
        (player.selected === null || player.selected === replacementNumber)
      ) {
        const option = document.createElement("option");
        option.value = playerIndex;
        option.textContent = player.name;

        if (player.selected === replacementNumber) {
          option.selected = true;
          positionSelect.classList.add("select-selected");
        }

        positionSelect.appendChild(option);
      }
    });

    positionSelect.addEventListener("change", (event) => {
      const selectedPlayerIndex = event.target.value;

      players.forEach((player, index) => {
        if (index === parseInt(selectedPlayerIndex)) {
          player.selected = replacementNumber;
        } else if (player.selected === replacementNumber) {
          player.selected = null;
        }
      });

      renderPositionSelect();
    });

    replacementDiv.appendChild(positionNumberLabel);
    replacementDiv.appendChild(positionSelect);
    replacementsDiv.appendChild(replacementDiv);
  });

  replacementsSelectDiv.appendChild(replacementsDiv);
}



function renderPlayerList() {
  // Sort players alphabetically by name
  players.sort((a, b) => a.name.localeCompare(b.name));

  const availablePlayersDiv = document.getElementById("available");
  const unavailablePlayersDiv = document.getElementById("unavailable");
  const notRespondedPlayersDiv = document.getElementById("not-responded-list");

  availablePlayersDiv.innerHTML = "";
  unavailablePlayersDiv.innerHTML = "";
  notRespondedPlayersDiv.innerHTML = "";

  let availablePlayers = 0;
  let unavailablePlayers = 0;
  let notRespondedPlayers = 0;

  availableCount = document.getElementById("available-count");
  unavailableCount = document.getElementById("unavailable-count");
  notRespondedCount = document.getElementById("not-responded-count");

  players.forEach((player, index) => {
    const playerDiv = document.createElement("div");
    playerDiv.className = `player-info ${
      player.available ? "available" : "unavailable"
    }`;

    const no = `<button class="icon icon-x" title="Mark unavailable" onclick="toggleAvailability(${index}, false)"><i class="fas fa-times"></i></button>`;
    const yes = `<button class="icon icon-check" title="Mark available" onclick="toggleAvailability(${index}, true)"><i class="fas fa-check"></i></button>`;
    const clear = `<button class="icon icon-trash" title="Clear availability" onclick="toggleAvailability(${index}, null)"><i class="fas fa-trash"></i></button>`;

    playerDiv.innerHTML = `
        <button class="icon icon-edit" title="Edit player info" onclick="editPlayer(${index})">
            <i class="fas fa-pencil-alt"></i>
        </button>
        <span class="player-name">${player.name}</span>
        ${player.available === null ? yes : player.available ? no : yes}
        ${player.available === null ? no : clear}
    `;

    if (player.available === null) {
      notRespondedPlayersDiv.appendChild(playerDiv);
      notRespondedPlayers++;
    } else if (player.available) {
      availablePlayersDiv.appendChild(playerDiv);
      availablePlayers++;
    } else {
      unavailablePlayersDiv.appendChild(playerDiv);
      unavailablePlayers++;
    }
  });
  availableCount.innerText = `${availablePlayers}`;
  unavailableCount.innerText = `${unavailablePlayers}`;
  notRespondedCount.innerText = `${notRespondedPlayers}`; 
}

function updateDropdownOptions(positionNumber) {
  const dropdown = document.getElementById(
    `select-position-${positionNumber}`
  );
  dropdown.innerHTML = ""; // Clear existing options

  players.forEach((player) => {
    if (player.selected === null || player.selected === positionNumber) {
      const option = document.createElement("option");
      option.value = player.name;
      option.textContent = player.name;
      dropdown.appendChild(option);
    }
  });
}

function handlePlayerSelection(positionNumber) {
  const dropdown = document.getElementById(`select-position-${positionNumber}`);
  const selectedPlayerName = dropdown.value;

  // If a player is selected, add the class
  if (selectedPlayerName) {
    dropdown.classList.add("select-selected");
  } else {
    dropdown.classList.remove("select-selected"); // Remove if no selection
  }

  // Update the `selected` property of players
  players.forEach((player) => {
    if (player.name === selectedPlayerName) {
      player.selected = positionNumber;
    } else if (player.selected === positionNumber) {
      player.selected = null;
    }
  });

  // Re-render dropdowns to reflect updated selections
  renderPositionSelect();
}


// Toggle player availability and persist dropdown selections
function toggleAvailability(index, available) {
  playerAvailability[index] = available; // Toggle to available
  players[index].available = playerAvailability[index]; // Keep in sync

  // Remove any invalid selections
  Object.keys(selectedPlayers).forEach((position) => {
    if (!playerAvailability[selectedPlayers[position]]) {
      delete selectedPlayers[position];
    }
  });

  renderPlayerList();
  renderPositionSelect();
}


function markAllAvailable() {
  console.log("Marking all players as available...");
  players.forEach((_, index) => {
    
    if (players[index].available === null) {
      toggleAvailability(index, true);
    }
  });
  renderPlayerList(); // Re-render the UI
  renderPositionSelect(); // Update dropdowns
}

// Function to clear all players' availability (set to null)
document.getElementById("clear-all").addEventListener("click", function() {
  // Loop through all players and set their availability to null (not responded)
  players.forEach((player, index) => {
    playerAvailability[index] = null;
    player.available = null;
  });
  renderPlayerList(); // Re-render the UI
  renderPositionSelect(); // Update dropdowns
});

// Update the player list to reflect the changes
function updatePlayerList() {
  const availableList = document.getElementById("available");
  const unavailableList = document.getElementById("unavailable");
  const notRespondedList = document.getElementById("not-responded");

  // Clear current lists
  availableList.innerHTML = '';
  unavailableList.innerHTML = '';
  notRespondedList.innerHTML = '';

  let availablePlayers = 0;
  let unavailablePlayers = 0;
  let notRespondedPlayers = 0;

  // Update lists and counts based on player availability
  for (let player of players) {
    if (player.availability === true) {
      availableList.innerHTML += `<div>${player.name}</div>`;
      availablePlayers++;
    } else if (player.availability === false) {
      unavailableList.innerHTML += `<div>${player.name}</div>`;
      unavailablePlayers++;
    } else {
      notRespondedList.innerHTML += `<div>${player.name}</div>`;
      notRespondedPlayers++;
    }
  }

  // Update the player count in the header
  availableCount.innerText = `(${availablePlayers})`;
  unavailableCount.innerText = `(${unavailablePlayers})`;
  notRespondedCount.innerText = `(${notRespondedPlayers})`;
}


function saveAvailabilityToFile() {
  const updatedPlayers = players.map((player, index) => ({
    ...player,
    available: playerAvailability[index] || false, // Add availability field
  }));

  const jsonData = JSON.stringify(updatedPlayers, null, 2);

  // Simulate file download
  const blob = new Blob([jsonData], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "players.json";
  a.click();
  URL.revokeObjectURL(url);

  alert("Availability saved to players.json!");
}



function saveSelectionToFile() {
  let teamSheet = generateTeamSheet();
  const blob = new Blob([teamSheet], { type: "text/plain" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = "team-sheet.txt";
  a.click();
  URL.revokeObjectURL(url);

  alert("Team sheet saved to team-sheet.txt!");
}

// Ensure clearSelections() only resets the UI, not the selected players
function clearSelections() {
  // You can reset the dropdowns and render the UI without resetting selectedPlayers
  selectedPlayers = {}; // Reset the selected players
  players.forEach((player) => (player.selected = null)); // Reset selected property
  renderPositionSelect();
}


function copyToClipboard() {
  let teamSheet = generateTeamSheet();
  navigator.clipboard.writeText(teamSheet).then(
    () => alert("Team sheet copied to clipboard!"),
    (err) => alert("Failed to copy to clipboard: " + err)
  );
}

function generateTeamSheet() {
  let teamSheet = "*1st XV Squad*\n";

  // Main squad positions (1–15)
  for (let number = 1; number <= 15; number++) {
    const playerIndex = selectedPlayers[number];
    if (playerIndex !== undefined && playerIndex !== "") {
      const playerName = players[playerIndex].name;
      teamSheet += `${number}. ${playerName}\n`;
    } else {
      teamSheet += `${number}. [Unselected]\n`;
    }
  }

  // Replacements (16–18)
  teamSheet += "\n*Replacements*\n";
  for (let number = 16; number <= 18; number++) {
    const playerIndex = selectedPlayers[number];
    if (playerIndex !== undefined && playerIndex !== "") {
      const playerName = players[playerIndex].name;
      teamSheet += `${number}. ${playerName}\n`;
    } else {
      teamSheet += `${number}. [Unselected]\n`;
    }
  }

  return teamSheet.trim(); // Ensure no trailing newline
}