window.ChatWidgetConfig = {
	webhook: {
	  url: "https://n8n.breadnbeyond.co/webhook/a9b855eb-1ebd-48bb-805a-59ae429ff400/chat",
	  route: "general",
	},
	style: {
	  primaryColor: "#2d2d2d",
	  secondaryColor: "#4a4a4a",
	  position: "right",
	  backgroundColor: "#ffffff",
	  fontColor: "#1a1a1a",
	},
};

// Helper function to detect device type
function detectDevice() {
	const userAgent = navigator.userAgent.toLowerCase();
	if (/iphone|ipad|ipod/.test(userAgent)) {
		return 'ios';
	} else if (/android/.test(userAgent)) {
		return 'android';
	} else {
		return 'other';
	}
}

// Function to generate or retrieve a unique chat ID
function getChatId() {
	let chatId = localStorage.getItem("chatId");
	if (!chatId) {
	  chatId = "chat_" + Math.random().toString(36).substr(2, 9);
	  localStorage.setItem("chatId", chatId);
	}
	return chatId;
}

// Function to get chat details (completely independent, no WordPress dependencies)
function getChatDeets() {
	let chatDeets = localStorage.getItem("chatDeets");
	if (!chatDeets) {
		chatDeets = {
			id: "chat_" + Math.random().toString(36).substr(2, 9),
			ua: window.navigator.userAgent,
			dv: detectDevice(),
			loc: 'Unknown' // Default location
		};
		
		// Try to get location using a free IP geolocation service
		return fetch('https://ipapi.co/json/')
			.then(response => response.json())
			.then(data => {
				if (data && data.city && data.country_name) {
					chatDeets.loc = data.city + ', ' + data.country_name;
				}
				localStorage.setItem("chatDeets", JSON.stringify(chatDeets));
				return chatDeets;
			})
			.catch(error => {
				// If geolocation fails, just use default
				console.log('Geolocation failed, using default location');
				localStorage.setItem("chatDeets", JSON.stringify(chatDeets));
				return chatDeets;
			});
	} else {
		return Promise.resolve(JSON.parse(chatDeets));
	}
}

// Function to format timestamp
function formatTimestamp() {
	const now = new Date();
	return now.toLocaleTimeString([], {
	  hour: "2-digit",
	  minute: "2-digit",
	});
}

// Function to auto-scroll to bottom
function scrollToBottom() {
	const chatBody = document.getElementById("chat-widget-body");
	if (chatBody) {
		chatBody.scrollTop = chatBody.scrollHeight;
	}
}

// Simple markdown parser
function parseMarkdown(text) {
	// Escape HTML first
	text = text
	  .replace(/&/g, "&amp;")
	  .replace(/</g, "&lt;")
	  .replace(/>/g, "&gt;");

	// Headers
	text = text.replace(/^### (.*$)/gim, "<h3>$1</h3>");
	text = text.replace(/^## (.*$)/gim, "<h2>$1</h2>");
	text = text.replace(/^# (.*$)/gim, "<h1>$1</h1>");

	// Bold
	text = text.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
	text = text.replace(/__(.*?)__/g, "<strong>$1</strong>");

	// Italic
	text = text.replace(/\*(.*?)\*/g, "<em>$1</em>");
	text = text.replace(/_(.*?)_/g, "<em>$1</em>");

	// Code blocks
	text = text.replace(/```([\s\S]*?)```/g, "<pre><code>$1</code></pre>");

	// Inline code
	text = text.replace(/`([^`]+)`/g, "<code>$1</code>");

	// Blockquotes
	text = text.replace(/^> (.*$)/gim, "<blockquote>$1</blockquote>");

	// Lists
	text = text.replace(/^\* (.*$)/gim, "<li>$1</li>");
	text = text.replace(/^- (.*$)/gim, "<li>$1</li>");
	text = text.replace(/^\d+\. (.*$)/gim, "<li>$1</li>");

	// Wrap consecutive <li> elements in <ul>
	text = text.replace(/(<li>.*<\/li>)/gs, function (match) {
	  return "<ul>" + match + "</ul>";
	});

	// Links
	text = text.replace(/\[([^\]]+)\]\(([^\)]+)\)/g, "<a href=\"$2\" target=\"_blank\" rel=\"noopener\">$1</a>");

	// Line breaks to paragraphs
	const paragraphs = text.split("\n\n").filter((p) => p.trim());
	text = paragraphs
	  .map((p) => {
		if (!p.match(/^<[huo]|^<blockquote|^<pre/)) {
		  return "<p>" + p.replace(/\n/g, "<br>") + "</p>";
		}
		return p;
	  })
	  .join("");

	return text;
}

// Function to auto-resize textarea
function autoResizeTextarea(textarea) {
	if (textarea) {
		textarea.style.height = "auto";
		textarea.style.height = Math.min(textarea.scrollHeight, 120) + "px";
	}
}

// Function to show loading indicator
function showLoading() {
	const chatBody = document.getElementById("chat-widget-body");
	if (!chatBody) return;
	
	const loadingMessage = document.createElement("div");
	loadingMessage.className = "message loading-message";
	loadingMessage.id = "loading-indicator";
	loadingMessage.innerHTML = `
	  <span>Responding </span>
	  <div class="loading-dots">
		<span></span>
		<span></span>
		<span></span>
	  </div>
	`;
	chatBody.appendChild(loadingMessage);
	scrollToBottom();
}

// Function to hide loading indicator
function hideLoading() {
	const loadingIndicator = document.getElementById("loading-indicator");
	if (loadingIndicator) {
	  loadingIndicator.remove();
	}
}

// Show chat widget and hide bubble
function openChatWidget() {
	const viewport = document.querySelector('meta[name="viewport"]');
	if (viewport) {
		viewport.setAttribute('content', 'width=device-width, initial-scale=1, interactive-widget=resizes-content');
	}
	
	const container = document.getElementById("chat-widget-container");
	const button = document.getElementById("chat-widget-button");
	const overlay = document.getElementById("chat-overlay");
	
	if (container) container.style.display = "flex";
	if (button) button.style.display = "none";
	if (overlay) overlay.style.display = "block";
	
	// Focus on input when chat opens
	setTimeout(() => {
	  const input = document.getElementById("chat-widget-input");
	  if (input) input.focus();
	}, 100);
}

// Close chat widget and show bubble
function closeChatWidget() {
	const viewport = document.querySelector('meta[name="viewport"]');
	if (viewport) {
		viewport.setAttribute('content', 'width=device-width, initial-scale=1');
	}
	
	const container = document.getElementById("chat-widget-container");
	const button = document.getElementById("chat-widget-button");
	const overlay = document.getElementById("chat-overlay");
	
	if (container) container.style.display = "none";
	if (button) button.style.display = "flex";
	if (overlay) overlay.style.display = "none";
}

// Toggle expand/collapse chat
function toggleExpandChat() {
	const container = document.getElementById("chat-widget-container");
	const button = document.getElementById("expand-button");
	
	if (!container || !button) return;

	if (container.classList.contains("expanded")) {
	  container.classList.remove("expanded");
	  button.textContent = "⛶";
	  button.title = "Expand chat";
	} else {
	  container.classList.add("expanded");
	  button.textContent = "⛶";
	  button.title = "Collapse chat";
	}
}

// Function to send message
function sendMessage() {
	const messageInput = document.getElementById("chat-widget-input");
	const chatBody = document.getElementById("chat-widget-body");
	
	if (!messageInput || !chatBody) return;
	
	let message = messageInput.value;
	if (message.trim() === "") return;

	// Create user message
	let userMessage = document.createElement("div");
	userMessage.className = "message user";
	userMessage.innerHTML = `
	  ${parseMarkdown(message)}
	  <div class="timestamp">${formatTimestamp()}</div>
	`;
	chatBody.appendChild(userMessage);
	scrollToBottom();

	// Show loading indicator
	showLoading();

	// Get chat details and send message
	getChatDeets()
		.then(chatDeets => {
			console.log('Chat details:', chatDeets);
			
			const payload = {
				chatId: chatDeets.id + '|' + chatDeets.ua + '|' + chatDeets.dv + '|' + chatDeets.loc,
				message: message,
				route: window.ChatWidgetConfig.webhook.route,
			};
			
			console.log('Sending payload:', payload);
			
			return fetch(window.ChatWidgetConfig.webhook.url, {
			  method: "POST",
			  headers: { 
				  "Content-Type": "application/json",
				  "Accept": "application/json"
			  },
			  body: JSON.stringify(payload),
			});
		})
		.then((response) => {
			console.log('Response status:', response.status);
			if (!response.ok) {
				throw new Error(`HTTP error! status: ${response.status}`);
			}
			return response.json();
		})
		.then((data) => {
			console.log('Response data:', data);
			// Hide loading indicator
			hideLoading();

			// Create bot message
			let botMessage = document.createElement("div");
			let parsedResponse = parseMarkdown(
				data.output || data.message || data.response || "Sorry, I couldn't understand that."
			);
			botMessage.className = "message bot";
			botMessage.innerHTML = `
			  ${parsedResponse}
			  <div class="timestamp">${formatTimestamp()}</div>
			`;
			chatBody.appendChild(botMessage);
			scrollToBottom();
		})
		.catch((error) => {
			console.error('Chat error:', error);
			hideLoading();

			// Show error message
			let errorMessage = document.createElement("div");
			errorMessage.className = "message bot";
			errorMessage.innerHTML = `
			  Sorry, there was an error processing your message. Please try again.<br>
			  <small>Error: ${error.message}</small>
			  <div class="timestamp">${formatTimestamp()}</div>
			`;
			chatBody.appendChild(errorMessage);
			scrollToBottom();
		});

	// Reset textarea
	messageInput.value = "";
	messageInput.style.height = "auto";
}

// Initialize everything when DOM is loaded
document.addEventListener("DOMContentLoaded", function () {
	// Set initial timestamp
	const initialTimestamp = document.getElementById("initial-timestamp");
	if (initialTimestamp) {
		initialTimestamp.textContent = formatTimestamp();
	}

	// Setup textarea auto-resize
	const textarea = document.getElementById("chat-widget-input");
	if (textarea) {
		textarea.addEventListener("input", function () {
		  autoResizeTextarea(this);
		});
	}

	// Chat button event listener
	const chatButton = document.getElementById("chat-widget-button");
	if (chatButton) {
		chatButton.addEventListener("click", openChatWidget);
	}

	// Expand button event listener
	const expandButton = document.getElementById("expand-button");
	if (expandButton) {
		expandButton.addEventListener("click", toggleExpandChat);
	}

	// Click outside to close
	const overlay = document.getElementById("chat-overlay");
	if (overlay) {
		overlay.addEventListener("click", closeChatWidget);
	}

	// Send button event listener
	const sendButton = document.getElementById("chat-widget-send");
	if (sendButton) {
		sendButton.addEventListener("click", sendMessage);
	}

	// Handle Enter key press (Enter to send, Shift+Enter for new line)
	if (textarea) {
		textarea.addEventListener("keydown", function (event) {
		  if (event.key === "Enter" && !event.shiftKey) {
			event.preventDefault();
			sendMessage();
		  }
		});
	}

	// Close chat widget on Escape key
	document.addEventListener("keydown", function (event) {
		if (event.key === "Escape") {
		  const chatContainer = document.getElementById("chat-widget-container");
		  if (chatContainer && chatContainer.style.display === "flex") {
			closeChatWidget();
		  }
		}
	});
});