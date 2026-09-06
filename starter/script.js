const chatForm = document.getElementById('chat-form');
const userInput = document.getElementById('user-input');
const chatBox = document.getElementById('chat-box');
const sendButton = chatForm.querySelector('button[type="submit"]');

// Connect to backend (automatically handles both http://localhost:3000 and Live Server/file://)
const API_URL = (window.location.protocol === 'file:' || (window.location.port && window.location.port !== '3000'))
  ? 'http://localhost:3000/api/chat'
  : '/api/chat';

// Stores the multi-turn conversation history
// Format: [{ role: 'user' | 'model', text: string }]
const conversationHistory = [];

// Helper function to append a message element to the chat box
function appendMessage(sender, text) {
  const messageElement = document.createElement('div');
  messageElement.classList.add('message', sender);
  messageElement.textContent = text;
  chatBox.appendChild(messageElement);
  chatBox.scrollTop = chatBox.scrollHeight;
  return messageElement;
}

chatForm.addEventListener('submit', async function (e) {
  e.preventDefault();

  const userMessage = userInput.value.trim();
  if (!userMessage) return;

  // 1. Display user's message in the chat box
  appendMessage('user', userMessage);

  // 2. Add user message to conversation history
  conversationHistory.push({ role: 'user', text: userMessage });

  // 3. Clear input field and temporarily disable form controls
  userInput.value = '';
  userInput.disabled = true;
  if (sendButton) sendButton.disabled = true;

  // 4. Display temporary "Thinking..." bot message
  const botMessageElement = appendMessage('bot', 'Thinking...');

  try {
    // 5. Send POST request to backend with the conversation history
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        conversation: conversationHistory,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    // 6. Handle response: replace "Thinking..." with AI response or fallback
    if (data && data.result) {
      botMessageElement.textContent = data.result;
      conversationHistory.push({ role: 'model', text: data.result });
    } else {
      botMessageElement.textContent = 'Sorry, no response received.';
      // Revert the last user message from history if no response was received
      conversationHistory.pop();
    }
  } catch (error) {
    console.error('Error fetching chat response:', error);
    botMessageElement.textContent = 'Failed to get response from server.';
    // Revert the last user message from history on failure
    conversationHistory.pop();
  } finally {
    // 7. Re-enable form controls and scroll to latest message
    userInput.disabled = false;
    if (sendButton) sendButton.disabled = false;
    userInput.focus();
    chatBox.scrollTop = chatBox.scrollHeight;
  }
});
