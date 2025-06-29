// client/src/components/ChatBox.jsx

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext'; // To get current user details

function ChatBox({ projectId, projectName }) {
    const { user, isAuthenticated } = useAuth(); // Get logged-in user
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const messagesEndRef = useRef(null); // Ref for auto-scrolling
    const messageListRef = useRef(null); // Ref for the message list container

    // Function to scroll to the bottom of the messages
    const scrollToBottom = useCallback(() => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, []);

    // Function to fetch messages for the given project
    const fetchMessages = useCallback(async () => {
        if (!isAuthenticated || !projectId || !user) {
            setLoading(false);
            return;
        }

        // Store current scroll position to decide if we should auto-scroll later
        const isScrolledToBottom = messageListRef.current 
            ? messageListRef.current.scrollHeight - messageListRef.current.clientHeight <= messageListRef.current.scrollTop + 1 // +1 for tolerance
            : true; // Assume at bottom if element not yet rendered

        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`http://localhost:5000/api/messages/project/${projectId}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to fetch messages.');
            }

            const data = await response.json();
            // Only update messages if there's a change to prevent unnecessary re-renders
            // This also prevents scrolling when no new messages
            setMessages(prevMessages => {
                if (prevMessages.length !== data.length || JSON.stringify(prevMessages) !== JSON.stringify(data)) {
                    // Decide whether to scroll: if new message from other user, or if already at bottom
                    const hasNewMessageFromOthers = data.length > prevMessages.length && data[data.length - 1].sender._id !== user.id;

                    if (isScrolledToBottom || hasNewMessageFromOthers) {
                        // Delay scroll slightly to allow rendering
                        setTimeout(scrollToBottom, 100); 
                    }
                    return data;
                }
                return prevMessages; // No change, return previous state
            });

        } catch (err) {
            console.error('ChatBox Error fetching messages:', err);
            setError(err.message || 'Could not load messages.');
            toast.error(`Error loading chat: ${err.message}`);
        } finally {
            setLoading(false);
        }
    }, [isAuthenticated, projectId, user, scrollToBottom]);

    // Effect to fetch messages on component mount or projectId change
    useEffect(() => {
        // Initial fetch
        fetchMessages();
        // Set up an interval for polling (simple real-time substitute for WebSockets)
        const intervalId = setInterval(fetchMessages, 3000); // Poll every 3 seconds

        return () => clearInterval(intervalId); // Clear interval on component unmount
    }, [fetchMessages]);


    // Function to handle sending a new message
    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!newMessage.trim() || !isAuthenticated || !projectId || !user) {
            toast.warn('Message cannot be empty or you are not logged in.');
            return;
        }

        try {
            const token = localStorage.getItem('token');
            const response = await fetch('http://localhost:5000/api/messages', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ projectId, content: newMessage })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to send message.');
            }

            const sentMessage = await response.json();
            // Optimistically update the UI (add message immediately)
            // Ensure sender is populated on optimistic update for consistency
            const populatedMessage = { 
                ...sentMessage.message, 
                sender: { _id: user.id, username: user.username } // Add minimal sender info
            };
            setMessages(prevMessages => [...prevMessages, populatedMessage]); 
            setNewMessage(''); // Clear input field
            setTimeout(scrollToBottom, 100); // Scroll to new message after rendering
            toast.success('Message sent!');

        } catch (err) {
            console.error('ChatBox Error sending message:', err);
            toast.error(`Error sending message: ${err.message}`);
        }
    };

    if (loading) {
        return <div style={styles.loading}>Loading chat...</div>;
    }

    if (error) {
        return <div style={styles.error}>Error: {error}</div>;
    }

    // Determine current user's role and display name for chat bubbles
    const currentUserId = user?.id;

    return (
        <div style={styles.chatContainer}>
            <div style={styles.chatHeader}>
                Chat for: {projectName || 'Loading Project...'}
            </div>
            <div ref={messageListRef} style={styles.messageList}> {/* Attach ref here */}
                {messages.length === 0 ? (
                    <div style={styles.noMessages}>No messages yet. Start the conversation!</div>
                ) : (
                    messages.map((msg) => (
                        <div 
                            key={msg._id} 
                            style={{
                                ...styles.messageBubble,
                                ...(msg.sender._id === currentUserId ? styles.myMessage : styles.otherMessage)
                            }}
                        >
                            <span style={styles.senderName}>{msg.sender.username} ({msg.sender.role})</span> {/* Display role too */}
                            <p style={styles.messageContent}>{msg.content}</p>
                            <span style={styles.timestamp}>
                                {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                        </div>
                    ))
                )}
                <div ref={messagesEndRef} /> {/* For auto-scrolling */}
            </div>
            <form onSubmit={handleSendMessage} style={styles.messageForm}>
                <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type your message..."
                    style={styles.messageInput}
                />
                <button type="submit" style={styles.sendButton}>Send</button>
            </form>
        </div>
    );
}

// Basic inline styles for ChatBox
const styles = {
    chatContainer: {
        display: 'flex',
        flexDirection: 'column',
        height: '500px', // Fixed height for chat area
        border: '1px solid #e0e0e0',
        borderRadius: '8px',
        overflow: 'hidden',
        backgroundColor: '#f9f9f9',
        fontFamily: 'Inter, sans-serif',
        boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
        margin: '20px 0',
    },
    chatHeader: {
        padding: '15px',
        backgroundColor: '#007bff', // Blue header
        color: 'white',
        fontSize: '1.2em',
        fontWeight: 'bold',
        textAlign: 'center',
    },
    messageList: {
        flexGrow: 1,
        padding: '15px',
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        backgroundColor: '#e6ebf0', // Light grey background for messages
    },
    messageBubble: {
        maxWidth: '70%',
        padding: '10px 15px',
        borderRadius: '18px', // More rounded bubbles
        wordWrap: 'break-word',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        position: 'relative',
    },
    myMessage: {
        alignSelf: 'flex-end',
        backgroundColor: '#dcf8c6', // Light green for my messages
        color: '#333',
        borderBottomRightRadius: '2px', // Tapered corner
    },
    otherMessage: {
        alignSelf: 'flex-start',
        backgroundColor: '#ffffff', // White for other user's messages
        color: '#333',
        borderBottomLeftRadius: '2px', // Tapered corner
    },
    senderName: {
        fontSize: '0.75em',
        fontWeight: 'bold',
        color: '#555',
        marginBottom: '4px',
        display: 'block',
    },
    messageContent: {
        margin: '0',
        fontSize: '0.95em',
        lineHeight: '1.4',
    },
    timestamp: {
        fontSize: '0.7em',
        color: '#777',
        textAlign: 'right',
        marginTop: '5px',
        display: 'block',
    },
    noMessages: {
        textAlign: 'center',
        color: '#777',
        padding: '20px',
        fontSize: '1.1em',
    },
    messageForm: {
        display: 'flex',
        padding: '15px',
        borderTop: '1px solid #e0e0e0',
        backgroundColor: '#ffffff',
    },
    messageInput: {
        flexGrow: 1,
        padding: '12px 15px',
        border: '1px solid #ccc',
        borderRadius: '25px', // Pill-shaped input
        outline: 'none',
        fontSize: '1em',
        marginRight: '10px',
        transition: 'border-color 0.3s ease',
        '&:focus': {
            borderColor: '#007bff',
        }
    },
    sendButton: {
        padding: '12px 20px',
        backgroundColor: '#28a745', // Green send button
        color: 'white',
        border: 'none',
        borderRadius: '25px', // Pill-shaped button
        cursor: 'pointer',
        fontSize: '1em',
        fontWeight: 'bold',
        transition: 'background-color 0.3s ease',
        '&:hover': {
            backgroundColor: '#218838',
        }
    },
    loading: {
        textAlign: 'center',
        padding: '20px',
        color: '#555',
    },
    error: {
        textAlign: 'center',
        padding: '20px',
        color: 'red',
    }
};
export default ChatBox;
