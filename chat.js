document.addEventListener("DOMContentLoaded", function () {
    initializeChat();
});

function initializeChat() {
    const messagesContainer = document.querySelector(".messages-container");
    
    window.chatHistory = window.chatHistory || [];
    window.currentChatIndex = window.currentChatIndex || -1;
    window.isProcessing = false;
    window.firstMessage = null;
    window.isChatSaved = false;

    // Get the input elements
    const inputField = document.querySelector(".v0-input-field");
    const sendButton = document.querySelector(".v0-send-btn");
    const actionButtons = document.querySelectorAll(".v0-action-btn");

    function adjustTextareaHeight(reset = false) {
        if (reset) {
            inputField.style.height = '36px';
            return;
        }
        
        inputField.style.height = '36px';
        const newHeight = Math.min(Math.max(inputField.scrollHeight, 36), 200);
        inputField.style.height = newHeight + 'px';
    }
    
    // Handle textarea input
    inputField.addEventListener('input', () => {
        adjustTextareaHeight();
        // Toggle send button active state
        sendButton.classList.toggle('active', inputField.value.trim().length > 0);
    });
    
    // Handle Enter key
    inputField.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            if (inputField.value.trim()) {
                window.sendMessage();
            }
        }
    });
    
    // Handle send button click
    sendButton.addEventListener('click', () => {
        if (inputField.value.trim()) {
            window.sendMessage();
        }
    });
    
    // Handle action buttons
    actionButtons.forEach(button => {
        button.addEventListener('click', () => {
            const action = button.textContent.trim();
            inputField.value = `Help me ${action.toLowerCase()}`;
            inputField.focus();
            adjustTextareaHeight();
            sendButton.classList.add('active');
        });
    });
    
    // Handle window resize
    window.addEventListener('resize', () => {
        adjustTextareaHeight();
    });
    
    // Initial height adjustment
    adjustTextareaHeight();

    // Save existing chat before refresh
    window.addEventListener('beforeunload', function() {
        if (messagesContainer && messagesContainer.children.length > 1 && !window.isChatSaved) {
            const chatContent = Array.from(messagesContainer.children)
                .map(msg => {
                    const isUser = msg.classList.contains('user-message');
                    return `${isUser ? 'User' : 'AI'}: ${msg.textContent}`;
                })
                .join('\n');
            
            // Get first user message as title
            const firstUserMessage = Array.from(messagesContainer.children)
                .find(msg => msg.classList.contains('user-message'))?.textContent || 'Untitled Chat';
            
            if (typeof window.saveChat === 'function') {
                window.saveChat(chatContent, firstUserMessage);
            }
        }
    });

    // Handle keyboard shortcuts
    document.addEventListener("keydown", function(e) {
        // Command/Ctrl + K for new thread
        if ((e.metaKey || e.ctrlKey) && e.key === "k") {
            e.preventDefault();
            window.startNewThread();
        }
    });

    // Add showThinkingMessage as a global function
    window.showThinkingMessage = function() {
        const messagesContainer = document.querySelector(".messages-container");
        if (!messagesContainer) return null;

        const thinkingMessage = document.createElement("div");
        thinkingMessage.classList.add("thinking-message");
        thinkingMessage.innerText = "DysonASI is thinking...";
        messagesContainer.appendChild(thinkingMessage);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
        return thinkingMessage;
    };

    // Expose functions globally
    window.sendMessage = async function() {
        const inputField = document.querySelector(".v0-input-field");
        if (!inputField || !messagesContainer) return;

        const message = inputField.value.trim();
        if (!message || window.isProcessing) return;

        window.isProcessing = true;
        
        if (!window.firstMessage) {
            window.firstMessage = message;
        }
        
        if (window.currentChatIndex === -1) {
            window.startNewThread();
        }

        // Reset textarea height
        inputField.style.height = "auto";

        // Add user message
        const userMessageDiv = document.createElement("div");
        userMessageDiv.classList.add("message", "user-message");
        userMessageDiv.textContent = message;
        messagesContainer.appendChild(userMessageDiv);
        
        window.chatHistory[window.currentChatIndex].push({ text: message, isUser: true });
        inputField.value = "";
        
        // Show thinking message
        const thinkingMessage = window.showThinkingMessage();
        if (!thinkingMessage) {
            window.isProcessing = false;
            return;
        }
        
        try {
            const response = await fetch("http://localhost:5001/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ message }),
            });

            const data = await response.json();
            const formattedResponse = formatResponse(data.response || "Sorry, I couldn't understand that.");

            if (thinkingMessage && thinkingMessage.parentNode) {
                thinkingMessage.remove();
            }
            
            const aiMessageDiv = document.createElement("div");
            aiMessageDiv.classList.add("message", "ai-message");
            aiMessageDiv.innerHTML = formattedResponse;
            messagesContainer.appendChild(aiMessageDiv);
            
            messagesContainer.scrollTop = messagesContainer.scrollHeight;

            if (!window.isChatSaved && window.firstMessage) {
                const chatContent = Array.from(messagesContainer.children)
                    .map(msg => {
                        const isUser = msg.classList.contains('user-message');
                        return `${isUser ? 'User' : 'AI'}: ${msg.textContent}`;
                    })
                    .join('\n');
                
                if (typeof window.saveChat === 'function') {
                    window.saveChat(chatContent, window.firstMessage);
                    window.isChatSaved = true;
                }
            }

        } catch (error) {
            console.error("Error:", error);
            if (thinkingMessage && thinkingMessage.parentNode) {
                thinkingMessage.textContent = "Error connecting to DysonASI server.";
            }
        }
        window.isProcessing = false;
    };

    window.startNewThread = function() {
        // Save existing chat before starting new one
        if (messagesContainer && messagesContainer.children.length > 1 && !window.isChatSaved) {
            const chatContent = Array.from(messagesContainer.children)
                .map(msg => {
                    const isUser = msg.classList.contains('user-message');
                    return `${isUser ? 'User' : 'AI'}: ${msg.textContent}`;
                })
                .join('\n');
            
            // Get first user message as title
            const firstUserMessage = Array.from(messagesContainer.children)
                .find(msg => msg.classList.contains('user-message'))?.textContent || 'Untitled Chat';
            
            if (typeof window.saveChat === 'function') {
                window.saveChat(chatContent, firstUserMessage);
            }
        }

        window.chatHistory.push([]);
        window.currentChatIndex = window.chatHistory.length - 1;
        window.firstMessage = null;
        window.isChatSaved = false;
        
        if (messagesContainer && inputField) {
            messagesContainer.innerHTML = "";
            inputField.value = "";
            inputField.style.height = "auto";
            
            const welcomeMessage = document.createElement("div");
            welcomeMessage.classList.add("message", "ai-message");
            welcomeMessage.innerHTML = "<p>Hi, I'm DysonASI! How can I assist you today?</p>";
            messagesContainer.appendChild(welcomeMessage);
        }
    };

    function formatResponse(responseText) {
        let formattedLines = [];
        let inCodeBlock = false;
        let codeLanguage = '';
        let codeContent = [];
        let inList = false;
        let listType = 'ul';

        responseText.split('\n').forEach(line => {
            line = line.trim();
            if (!line) return;

            // Handle code blocks
            if (line.startsWith('```')) {
                if (!inCodeBlock) {
                    // Start of code block
                    inCodeBlock = true;
                    codeLanguage = line.slice(3).trim() || 'plaintext';
                    codeContent = [];
                } else {
                    // End of code block
                    inCodeBlock = false;
                    const codeBlockId = 'code-' + Math.random().toString(36).substr(2, 9);
                    formattedLines.push(`
                        <div class="code-block-container">
                            <div class="code-block-header">
                                <span class="code-language">${codeLanguage}</span>
                                <div class="code-actions">
                                    <button class="code-action-button" onclick="copyCode('${codeBlockId}')">
                                        <i class="fas fa-copy"></i> Copy
                                    </button>
                                    <button class="code-action-button" onclick="editCode('${codeBlockId}')">
                                        <i class="fas fa-edit"></i> Edit
                                    </button>
                                </div>
                            </div>
                            <div class="code-block-content" id="${codeBlockId}">
                                <pre><code class="language-${codeLanguage}">${escapeHtml(codeContent.join('\n'))}</code></pre>
                            </div>
                        </div>
                    `);
                }
                return;
            }

            if (inCodeBlock) {
                codeContent.push(line);
                return;
            }

            // Convert bold text (**text**) to <strong> tags
            line = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

            // Handle lists
            if (line.startsWith('- ') || line.startsWith('*')) {
                if (!inList) {
                    formattedLines.push('<ul>');
                    inList = true;
                    listType = 'ul';
                }
                formattedLines.push(`<li>${line.slice(2)}</li>`);
            } else if (line.match(/^\d+\. /)) {
                if (!inList) {
                    formattedLines.push('<ol>');
                    inList = true;
                    listType = 'ol';
                }
                formattedLines.push(`<li>${line.slice(line.indexOf('.') + 2)}</li>`);
            } else {
                if (inList) {
                    formattedLines.push(listType === 'ul' ? '</ul>' : '</ol>');
                    inList = false;
                }
                formattedLines.push(`<p>${line}</p>`);
            }
        });

        if (inList) {
            formattedLines.push(listType === 'ul' ? '</ul>' : '</ol>');
        }

        return formattedLines.join('\n');
    }

    // Helper function to escape HTML
    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // Copy code function
    window.copyCode = function(codeBlockId) {
        const codeBlock = document.getElementById(codeBlockId);
        const code = codeBlock.querySelector('code').textContent;
        navigator.clipboard.writeText(code).then(() => {
            const button = codeBlock.parentElement.querySelector('.code-action-button');
            const originalText = button.innerHTML;
            button.innerHTML = '<i class="fas fa-check"></i> Copied!';
            setTimeout(() => {
                button.innerHTML = originalText;
            }, 2000);
        });
    };

    // Edit code function
    window.editCode = function(codeBlockId) {
        const codeBlock = document.getElementById(codeBlockId);
        const code = codeBlock.querySelector('code').textContent;
        const textarea = document.createElement('textarea');
        textarea.className = 'code-editor-textarea';
        textarea.value = code;
        
        // Replace code block with textarea
        const originalContent = codeBlock.innerHTML;
        codeBlock.innerHTML = '';
        codeBlock.appendChild(textarea);
        
        // Add save button
        const saveButton = document.createElement('button');
        saveButton.className = 'code-action-button';
        saveButton.innerHTML = '<i class="fas fa-save"></i> Save';
        saveButton.onclick = () => {
            const newCode = textarea.value;
            codeBlock.innerHTML = originalContent;
            codeBlock.querySelector('code').textContent = newCode;
            // Re-apply syntax highlighting
            if (window.Prism) {
                Prism.highlightElement(codeBlock.querySelector('code'));
            }
        };
        
        const header = codeBlock.parentElement.querySelector('.code-block-header .code-actions');
        header.appendChild(saveButton);
    };

    // Start new thread if no chat exists
    if (window.currentChatIndex === -1) {
        window.startNewThread();
    }

    // Simple scroll to latest message
    function scrollToLatestMessage() {
        const messagesContainer = document.querySelector('.messages-container');
        if (messagesContainer) {
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
        }
    }

    // Basic observer for new messages
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.addedNodes.length) {
                scrollToLatestMessage();
            }
        });
    });

    // Start observing the messages container
    observer.observe(messagesContainer, { childList: true, subtree: true });

    // Also scroll when the page loads
    document.addEventListener('DOMContentLoaded', scrollToLatestMessage);
}


