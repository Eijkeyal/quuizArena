import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Pencil,
  Trash2,
  Check,
  X,
  Send,
  MessageCircle,
  ArrowLeft,
} from "lucide-react";
import { io } from "socket.io-client";
import * as api from "../api";
import { useAuth } from "../context/AuthContext";

const SOCKET_URL =
  import.meta.env.VITE_API_URL || "http://localhost:3000";

function getId(value) {
  if (!value) return null;

  if (typeof value === "object") {
    return value._id || value.id || null;
  }

  return value;
}

function getMessageId(message) {
  return getId(message?._id || message?.id);
}

function getSenderId(message) {
  return getId(
    message?.senderId ??
      message?.sender ??
      message?.userId ??
      message?.author
  );
}

function decodeJwt(token) {
  if (!token) return null;

  try {
    const payload = token.split(".")[1];
    const base64 = payload
      .replace(/-/g, "+")
      .replace(/_/g, "/");
    const json = decodeURIComponent(
      atob(base64)
        .split("")
        .map(
          (c) =>
            "%" +
            c.charCodeAt(0).toString(16).padStart(2, "0")
        )
        .join("")
    );
    return JSON.parse(json);
  } catch {
    return null;
  }
}

function getMessageContent(message) {
  return message?.content || "";
}

function getSenderName(message) {
  if (message?.senderId?.name) {
    return message.senderId.name;
  }

  if (message?.sender?.name) {
    return message.sender.name;
  }

  return "User";
}

function formatTime(timestamp) {
  if (!timestamp) return "";

  return new Date(timestamp).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function extractConversation(data) {
  if (!data) {
    return null;
  }

  if (data._id || data.id) {
    return data;
  }

  if (data.conversation) {
    return data.conversation;
  }

  if (data.data) {
    if (data.data._id || data.data.id) {
      return data.data;
    }

    if (data.data.conversation) {
      return data.data.conversation;
    }
  }

  return null;
}

export default function UserDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [chatOpen, setChatOpen] = useState(false);

  const [users, setUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(false);

  const [selectedUser, setSelectedUser] = useState(null);

  const [conversation, setConversation] = useState(null);

  const [messages, setMessages] = useState([]);
  const [messagesLoading, setMessagesLoading] = useState(false);

  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);

  const [editingId, setEditingId] = useState(null);
  const [editDraft, setEditDraft] = useState("");

  const [pendingDeleteId, setPendingDeleteId] = useState(null);

  const [chatError, setChatError] = useState("");

  const [socketConnected, setSocketConnected] =
    useState(false);

  const listRef = useRef(null);
  const socketRef = useRef(null);

  const token =
    localStorage.getItem("accessToken") ||
    localStorage.getItem("token") ||
    sessionStorage.getItem("token");

  const currentUserId =
    user?._id ||
    user?.id ||
    user?.userId ||
    decodeJwt(token)?._id ||
    decodeJwt(token)?.id ||
    decodeJwt(token)?.userId ||
    decodeJwt(token)?.sub ||
    null;

  useEffect(() => {
    async function fetchQuizzes() {
      try {
        setLoading(true);
        setError("");

        const allQuizzes = await api.getQuizzes();

        const availableQuizzes = Array.isArray(allQuizzes)
          ? allQuizzes.filter(
              (quiz) =>
                quiz.status === "READY" ||
                quiz.status === "LIVE"
            )
          : [];

        setQuizzes(availableQuizzes);
      } catch (err) {
        console.error(
          "Failed to load quizzes:",
          err
        );

        setError(
          err?.response?.data?.message ||
            err?.message ||
            "Failed to load quizzes"
        );
      } finally {
        setLoading(false);
      }
    }

    fetchQuizzes();
  }, []);

  useEffect(() => {
    if (!token || !user) {
      return;
    }

    console.log(
      "Connecting to Socket.IO..."
    );

    const socket = io(SOCKET_URL, {
      auth: {
        token,
      },
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      console.log(
        "Socket connected:",
        socket.id
      );

      setSocketConnected(true);
    });

    socket.on("connect_error", (err) => {
      console.error(
        "Socket connection error:",
        err
      );

      setSocketConnected(false);

      setChatError(
        "Could not connect to chat server."
      );
    });

    socket.on("disconnect", () => {
      console.log(
        "Socket disconnected:",
        socket.id
      );

      setSocketConnected(false);
    });

    socket.on(
      "newMessage",
      (message) => {
        console.log(
          "New private message:",
          message
        );

        setMessages((prev) => {
          const newId =
            getMessageId(message);

          if (!newId) {
            return [...prev, message];
          }

          const exists = prev.some(
            (existingMessage) =>
              String(
                getMessageId(
                  existingMessage
                )
              ) === String(newId)
          );

          if (exists) {
            return prev;
          }

          return [...prev, message];
        });
      }
    );

    socket.on(
      "messageUpdated",
      (updatedMessage) => {
        const updatedId =
          getMessageId(
            updatedMessage
          );

        setMessages((prev) =>
          prev.map((message) =>
            String(
              getMessageId(message)
            ) === String(updatedId)
              ? updatedMessage
              : message
          )
        );
      }
    );

    socket.on(
      "messageDeleted",
      (deletedMessage) => {
        const deletedId =
          typeof deletedMessage ===
          "object"
            ? getMessageId(
                deletedMessage
              )
            : deletedMessage;

        setMessages((prev) =>
          prev.filter(
            (message) =>
              String(
                getMessageId(message)
              ) !== String(deletedId)
          )
        );
      }
    );

    return () => {
      socket.off("connect");
      socket.off("connect_error");
      socket.off("disconnect");
      socket.off("newMessage");
      socket.off("messageUpdated");
      socket.off("messageDeleted");

      socket.disconnect();

      socketRef.current = null;
    };
  }, [token, user]);

  useEffect(() => {
    const conversationId =
      getId(conversation);

    if (!socketConnected) {
      return;
    }

    if (!conversationId) {
      return;
    }

    console.log(
      "Joining conversation:",
      conversationId
    );

    socketRef.current?.emit(
      "joinConversation",
      conversationId
    );

    return () => {
      console.log(
        "Leaving conversation:",
        conversationId
      );

      socketRef.current?.emit(
        "leaveConversation",
        conversationId
      );
    };
  }, [
    conversation,
    socketConnected,
  ]);

  async function openChat() {
    setChatOpen(true);
    setChatError("");

    if (users.length > 0) {
      return;
    }

    try {
      setUsersLoading(true);

      const data =
        await api.getChatUsers();

      console.log(
        "Chat users:",
        data
      );

      setUsers(
        Array.isArray(data)
          ? data
          : []
      );
    } catch (err) {
      console.error(
        "Failed to load users:",
        err
      );

      setChatError(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to load users"
      );
    } finally {
      setUsersLoading(false);
    }
  }

  async function selectUser(otherUser) {
    const otherUserId =
      getId(otherUser);

    if (!otherUserId) {
      setChatError(
        "Invalid user selected."
      );
      return;
    }

    try {
      setSelectedUser(otherUser);

      setConversation(null);
      setMessages([]);

      setChatError("");
      setMessagesLoading(true);

      console.log(
        "Creating/getting conversation with:",
        otherUserId
      );

      const response =
        await api.createConversation(
          otherUserId
        );

      console.log(
        "Create conversation response:",
        response
      );

      const conversationData =
        extractConversation(
          response
        );

      console.log(
        "Extracted conversation:",
        conversationData
      );

      const conversationId =
        getId(
          conversationData
        );

      if (!conversationId) {
        console.error(
          "Backend returned invalid conversation:",
          response
        );

        setChatError(
          "Backend did not return a valid conversation."
        );

        setConversation(null);

        return;
      }

      console.log(
        "Valid conversation ID:",
        conversationId
      );

      setConversation(
        conversationData
      );

      const messageResponse =
        await api.getMessages(
          conversationId
        );

      console.log(
        "Messages response:",
        messageResponse
      );

      let loadedMessages = [];

      if (
        Array.isArray(
          messageResponse
        )
      ) {
        loadedMessages =
          messageResponse;
      } else if (
        Array.isArray(
          messageResponse?.messages
        )
      ) {
        loadedMessages =
          messageResponse.messages;
      } else if (
        Array.isArray(
          messageResponse?.data
        )
      ) {
        loadedMessages =
          messageResponse.data;
      }

      setMessages(
        loadedMessages
      );
    } catch (err) {
      console.error(
        "Failed to open conversation:",
        err
      );

      setConversation(null);
      setMessages([]);

      setChatError(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to open conversation"
      );
    } finally {
      setMessagesLoading(false);
    }
  }

  function backToUsers() {
    const conversationId =
      getId(conversation);

    if (conversationId) {
      socketRef.current?.emit(
        "leaveConversation",
        conversationId
      );
    }

    setSelectedUser(null);
    setConversation(null);
    setMessages([]);

    setDraft("");
    setEditingId(null);
    setEditDraft("");
    setPendingDeleteId(null);

    setChatError("");
  }

  async function sendMessage() {
    const content =
      draft.trim();

    if (!content) {
      return;
    }

    const conversationId =
      getId(conversation);

    console.log(
      "Sending message to conversation:",
      conversationId
    );

    if (!conversationId) {
      setChatError(
        "No valid conversation selected."
      );

      return;
    }

    if (sending) {
      return;
    }

    try {
      setSending(true);
      setChatError("");

      const response =
        await api.createMessage(
          conversationId,
          content
        );

      console.log(
        "Message sent:",
        response
      );

      setDraft("");

      const createdMessage =
        response?.message ||
        response?.data ||
        response;

      if (
        createdMessage &&
        getMessageId(
          createdMessage
        )
      ) {
        setMessages((prev) => {
          const newId =
            getMessageId(
              createdMessage
            );

          const exists =
            prev.some(
              (message) =>
                String(
                  getMessageId(
                    message
                  )
                ) === String(newId)
            );

          if (exists) {
            return prev;
          }

          return [
            ...prev,
            createdMessage,
          ];
        });
      }
    } catch (err) {
      console.error(
        "Failed to send message:",
        err
      );

      setChatError(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to send message"
      );
    } finally {
      setSending(false);
    }
  }

  function startEdit(message) {
    const messageId =
      getMessageId(message);

    if (!messageId) {
      return;
    }

    setEditingId(messageId);

    setEditDraft(
      getMessageContent(message)
    );

    setPendingDeleteId(null);
  }

  function cancelEdit() {
    setEditingId(null);
    setEditDraft("");
  }

  async function saveEdit(
    messageId
  ) {
    const content =
      editDraft.trim();

    if (!content) {
      return;
    }

    try {
      setChatError("");

      await api.updateMessage(
        messageId,
        content
      );

      cancelEdit();
    } catch (err) {
      console.error(
        "Failed to edit message:",
        err
      );

      setChatError(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to edit message"
      );
    }
  }

  async function confirmDelete(
    messageId
  ) {
    try {
      setChatError("");

      await api.deleteMessage(
        messageId
      );

      setMessages((prev) =>
        prev.filter(
          (message) =>
            String(
              getMessageId(message)
            ) !==
            String(messageId)
        )
      );

      setPendingDeleteId(null);
    } catch (err) {
      console.error(
        "Failed to delete message:",
        err
      );

      setChatError(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to delete message"
      );
    }
  }

  function isMyMessage(message) {
    if (!currentUserId) {
      return false;
    }

    return (
      String(
        getSenderId(message)
      ) ===
      String(currentUserId)
    );
  }

  useEffect(() => {
    if (!listRef.current) {
      return;
    }

    listRef.current.scrollTo({
      top: listRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages]);

  async function onJoin(quizId) {
    try {
      setError("");

      await api.joinQuiz(
        quizId
      );

      navigate(
        `/play/${quizId}`
      );
    } catch (err) {
      if (
        err?.response?.status ===
        409
      ) {
        navigate(
          `/play/${quizId}`
        );

        return;
      }

      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to join quiz"
      );
    }
  }

  if (loading) {
    return (
      <div className="page">
        <p className="dim">
          Loading...
        </p>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="eyebrow">
        Player Lobby
      </div>

      <h1>
        Available Quizzes
      </h1>

      {error && (
        <p className="error">
          {error}
        </p>
      )}

      {quizzes.length > 0 ? (
        <div className="card-grid">
          {quizzes.map(
            (quiz) => (
              <div
                className="quiz-card"
                key={quiz._id}
              >
                <div className="quiz-card-top">
                  <h3>
                    {quiz.title}
                  </h3>

                  <span
                    className={`badge badge-${quiz.status.toLowerCase()}`}
                  >
                    {quiz.status}
                  </span>
                </div>

                {quiz.description && (
                  <p className="dim">
                    {
                      quiz.description
                    }
                  </p>
                )}

                <button
                  className="btn btn-primary"
                  onClick={() =>
                    onJoin(
                      quiz._id
                    )
                  }
                >
                  {quiz.status ===
                  "LIVE"
                    ? "Join Quiz →"
                    : "Join and Wait →"}
                </button>
              </div>
            )
          )}
        </div>
      ) : (
        <p className="empty">
          No quizzes are available
          yet. Check back soon.
        </p>
      )}

      <div
        style={
          styles.chatWrapper
        }
      >
        <button
          style={
            styles.toggle
          }
          onClick={() => {
            if (chatOpen) {
              setChatOpen(false);
            } else {
              openChat();
            }
          }}
        >
          <MessageCircle
            size={22}
            color="#ffffff"
          />
        </button>

        {chatOpen && (
          <div
            style={
              styles.panel
            }
          >
            <div
              style={
                styles.header
              }
            >
              <div
                style={{
                  display:
                    "flex",
                  alignItems:
                    "center",
                  gap: 8,
                }}
              >
                {selectedUser && (
                  <button
                    style={
                      styles.closeBtn
                    }
                    onClick={
                      backToUsers
                    }
                  >
                    <ArrowLeft
                      size={18}
                      color="#374151"
                    />
                  </button>
                )}

                <div>
                  <div
                    style={
                      styles.headerTitle
                    }
                  >
                    {selectedUser
                      ? selectedUser.name
                      : "Private Chat"}
                  </div>

                  <div
                    style={
                      socketConnected
                        ? styles.online
                        : styles.offline
                    }
                  >
                    {socketConnected
                      ? "● Connected"
                      : "● Connecting..."}
                  </div>
                </div>
              </div>

              <button
                style={
                  styles.closeBtn
                }
                onClick={() =>
                  setChatOpen(false)
                }
              >
                <X
                  size={16}
                  color="#6b7280"
                />
              </button>
            </div>

            {chatError && (
              <div
                style={
                  styles.chatError
                }
              >
                {chatError}
              </div>
            )}

            {!selectedUser ? (
              <div
                style={
                  styles.userList
                }
              >
                <div
                  style={
                    styles.userListTitle
                  }
                >
                  Select someone to chat
                </div>

                {usersLoading ? (
                  <p
                    style={
                      styles.loadingText
                    }
                  >
                    Loading users...
                  </p>
                ) : users.length ===
                  0 ? (
                  <p
                    style={
                      styles.loadingText
                    }
                  >
                    No other users found.
                  </p>
                ) : (
                  users.map(
                    (chatUser) => (
                      <button
                        key={
                          getId(
                            chatUser
                          )
                        }
                        style={
                          styles.userItem
                        }
                        onClick={() =>
                          selectUser(
                            chatUser
                          )
                        }
                      >
                        <div
                          style={
                            styles.avatar
                          }
                        >
                          {chatUser.name
                            ?.charAt(
                              0
                            )
                            ?.toUpperCase()}
                        </div>

                        <div
                          style={
                            styles.userInfo
                          }
                        >
                          <div
                            style={
                              styles.userName
                            }
                          >
                            {
                              chatUser.name
                            }
                          </div>

                          <div
                            style={
                              styles.userEmail
                            }
                          >
                            {
                              chatUser.email
                            }
                          </div>
                        </div>
                      </button>
                    )
                  )
                )}
              </div>
            ) : (
              <>
                <div
                  style={
                    styles.list
                  }
                  ref={
                    listRef
                  }
                >
                  {messagesLoading ? (
                    <p
                      style={
                        styles.loadingText
                      }
                    >
                      Loading messages...
                    </p>
                  ) : messages.length ===
                    0 ? (
                    <div
                      style={
                        styles.emptyChat
                      }
                    >
                      <MessageCircle
                        size={28}
                        color="#9ca3af"
                      />

                      <p>
                        No messages yet.
                      </p>

                      <span>
                        Start the
                        conversation.
                      </span>
                    </div>
                  ) : (
                    messages.map(
                      (message) => {
                        const messageId =
                          getMessageId(
                            message
                          );

                        const mine =
                          isMyMessage(
                            message
                          );

                        const editing =
                          String(
                            editingId
                          ) ===
                          String(
                            messageId
                          );

                        const confirmingDelete =
                          String(
                            pendingDeleteId
                          ) ===
                          String(
                            messageId
                          );

                        return (
                          <div
                            key={
                              messageId
                            }
                            style={{
                              ...styles.row,
                              justifyContent:
                                mine
                                  ? "flex-end"
                                  : "flex-start",
                            }}
                          >
                            <div
                              style={{
                                maxWidth:
                                  "78%",
                              }}
                            >
                              {!mine && (
                                <div
                                  style={
                                    styles.senderName
                                  }
                                >
                                  {getSenderName(
                                    message
                                  )}
                                </div>
                              )}

                              <div
                                style={{
                                  ...styles.bubble,
                                  ...(mine
                                    ? styles.bubbleMine
                                    : styles.bubbleTheirs),
                                }}
                              >
                                {editing ? (
                                  <div
                                    style={
                                      styles.editRow
                                    }
                                  >
                                    <input
                                      autoFocus
                                      value={
                                        editDraft
                                      }
                                      onChange={(
                                        e
                                      ) =>
                                        setEditDraft(
                                          e
                                            .target
                                            .value
                                        )
                                      }
                                      onKeyDown={(
                                        e
                                      ) => {
                                        if (
                                          e.key ===
                                          "Enter"
                                        ) {
                                          saveEdit(
                                            messageId
                                          );
                                        }

                                        if (
                                          e.key ===
                                          "Escape"
                                        ) {
                                          cancelEdit();
                                        }
                                      }}
                                      style={
                                        styles.editInput
                                      }
                                    />

                                    <button
                                      style={
                                        styles.iconBtnGhost
                                      }
                                      onClick={() =>
                                        saveEdit(
                                          messageId
                                        )
                                      }
                                    >
                                      <Check
                                        size={
                                          14
                                        }
                                        color="#16a34a"
                                      />
                                    </button>

                                    <button
                                      style={
                                        styles.iconBtnGhost
                                      }
                                      onClick={
                                        cancelEdit
                                      }
                                    >
                                      <X
                                        size={
                                          14
                                        }
                                        color="#dc2626"
                                      />
                                    </button>
                                  </div>
                                ) : (
                                  <span>
                                    {getMessageContent(
                                      message
                                    )}
                                  </span>
                                )}
                              </div>

                              <div
                                style={{
                                  ...styles.metaRow,
                                  justifyContent:
                                    mine
                                      ? "flex-end"
                                      : "flex-start",
                                }}
                              >
                                <span
                                  style={
                                    styles.metaText
                                  }
                                >
                                  {formatTime(
                                    message.createdAt
                                  )}

                                  {message.updatedAt
                                    ? " · edited"
                                    : ""}
                                </span>

                                {mine &&
                                  !editing && (
                                    <span
                                      style={
                                        styles.actions
                                      }
                                    >
                                      {confirmingDelete ? (
                                        <>
                                          <button
                                            style={
                                              styles.actionTextBtn
                                            }
                                            onClick={() =>
                                              confirmDelete(
                                                messageId
                                              )
                                            }
                                          >
                                            Delete
                                          </button>

                                          <button
                                            style={
                                              styles.actionTextBtn
                                            }
                                            onClick={() =>
                                              setPendingDeleteId(
                                                null
                                              )
                                            }
                                          >
                                            Keep
                                          </button>
                                        </>
                                      ) : (
                                        <>
                                          <button
                                            style={
                                              styles.iconBtn
                                            }
                                            onClick={() =>
                                              startEdit(
                                                message
                                              )
                                            }
                                          >
                                            <Pencil
                                              size={
                                                12
                                              }
                                              color="#6b7280"
                                            />
                                          </button>

                                          <button
                                            style={
                                              styles.iconBtn
                                            }
                                            onClick={() =>
                                              setPendingDeleteId(
                                                messageId
                                              )
                                            }
                                          >
                                            <Trash2
                                              size={
                                                12
                                              }
                                              color="#6b7280"
                                            />
                                          </button>
                                        </>
                                      )}
                                    </span>
                                  )}
                              </div>
                            </div>
                          </div>
                        );
                      }
                    )
                  )}
                </div>

                <div
                  style={
                    styles.inputRow
                  }
                >
                  <input
                    value={draft}
                    onChange={(e) =>
                      setDraft(
                        e.target.value
                      )
                    }
                    onKeyDown={(e) => {
                      if (
                        e.key ===
                          "Enter" &&
                        !e.shiftKey
                      ) {
                        e.preventDefault();
                        sendMessage();
                      }
                    }}
                    placeholder={`Message ${selectedUser.name}...`}
                    style={
                      styles.input
                    }
                  />

                  <button
                    style={{
                      ...styles.sendBtn,
                      opacity:
                        sending
                          ? 0.6
                          : 1,
                    }}
                    onClick={
                      sendMessage
                    }
                    disabled={
                      sending
                    }
                  >
                    <Send
                      size={16}
                      color="#ffffff"
                    />
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  chatWrapper: {
    position: "fixed",
    bottom: 20,
    right: 20,
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-end",
    fontFamily:
      "'Inter', system-ui, sans-serif",
    zIndex: 50,
  },

  toggle: {
    width: 48,
    height: 48,
    borderRadius: "50%",
    border: "1px solid #e2e5ea",
    background: "#2563eb",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    boxShadow:
      "0 6px 20px rgba(15,23,42,0.18)",
  },

  panel: {
    marginTop: 12,
    width: 350,
    height: 500,
    background: "#ffffff",
    border: "1px solid #e2e5ea",
    borderRadius: 14,
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
    boxShadow:
      "0 16px 40px rgba(15,23,42,0.14)",
  },

  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "14px 16px",
    borderBottom:
      "1px solid #eef0f3",
    background: "#fafbfc",
  },

  headerTitle: {
    color: "#111827",
    fontWeight: 600,
    fontSize: 14,
  },

  online: {
    color: "#16a34a",
    fontSize: 12,
    marginTop: 2,
  },

  offline: {
    color: "#f59e0b",
    fontSize: 12,
    marginTop: 2,
  },

  closeBtn: {
    background: "transparent",
    border: "none",
    cursor: "pointer",
    padding: 4,
    display: "flex",
    alignItems: "center",
  },

  chatError: {
    padding: "8px 12px",
    background: "#fef2f2",
    color: "#dc2626",
    fontSize: 12,
    borderBottom:
      "1px solid #fee2e2",
  },

  userList: {
    flex: 1,
    overflowY: "auto",
    padding: 12,
  },

  userListTitle: {
    color: "#6b7280",
    fontSize: 12,
    fontWeight: 600,
    marginBottom: 8,
    padding: "4px",
  },

  userItem: {
    width: "100%",
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "10px 8px",
    border: "none",
    borderRadius: 10,
    background: "#ffffff",
    cursor: "pointer",
    textAlign: "left",
  },

  avatar: {
    width: 38,
    height: 38,
    borderRadius: "50%",
    background: "#dbeafe",
    color: "#2563eb",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: 600,
    fontSize: 14,
    flexShrink: 0,
  },

  userInfo: {
    minWidth: 0,
  },

  userName: {
    color: "#111827",
    fontSize: 13,
    fontWeight: 600,
  },

  userEmail: {
    color: "#9ca3af",
    fontSize: 11,
    marginTop: 2,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },

  list: {
    flex: 1,
    overflowY: "auto",
    padding: "14px 12px",
    display: "flex",
    flexDirection: "column",
    gap: 12,
    background: "#ffffff",
  },

  loadingText: {
    textAlign: "center",
    color: "#9ca3af",
    fontSize: 12,
    marginTop: 20,
  },

  emptyChat: {
    margin: "auto",
    textAlign: "center",
    color: "#9ca3af",
    fontSize: 12,
  },

  row: {
    display: "flex",
    width: "100%",
  },

  senderName: {
    color: "#6b7280",
    fontSize: 11,
    marginBottom: 3,
    marginLeft: 2,
  },

  bubble: {
    padding: "8px 12px",
    borderRadius: 14,
    fontSize: 13.5,
    lineHeight: 1.4,
    wordBreak: "break-word",
  },

  bubbleMine: {
    background: "#2563eb",
    color: "#ffffff",
    borderBottomRightRadius: 4,
  },

  bubbleTheirs: {
    background: "#f1f3f5",
    color: "#111827",
    border: "1px solid #e5e7eb",
    borderBottomLeftRadius: 4,
  },

  metaRow: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    marginTop: 3,
    paddingLeft: 2,
    paddingRight: 2,
  },

  metaText: {
    color: "#9ca3af",
    fontSize: 10.5,
  },

  actions: {
    display: "flex",
    gap: 6,
  },

  iconBtn: {
    background: "transparent",
    border: "none",
    cursor: "pointer",
    padding: 2,
    display: "flex",
    alignItems: "center",
  },

  iconBtnGhost: {
    background: "transparent",
    border: "none",
    cursor: "pointer",
    padding: 2,
    display: "flex",
    alignItems: "center",
  },

  actionTextBtn: {
    background: "transparent",
    border: "none",
    color: "#dc2626",
    fontSize: 10.5,
    cursor: "pointer",
    padding: 0,
    textDecoration: "underline",
  },

  editRow: {
    display: "flex",
    alignItems: "center",
    gap: 6,
  },

  editInput: {
    background: "#ffffff",
    border: "1px solid #d1d5db",
    borderRadius: 8,
    color: "#111827",
    fontSize: 13,
    padding: "4px 8px",
    outline: "none",
    minWidth: 120,
  },

  inputRow: {
    display: "flex",
    gap: 8,
    padding: 12,
    borderTop:
      "1px solid #eef0f3",
    background: "#fafbfc",
  },

  input: {
    flex: 1,
    background: "#ffffff",
    border: "1px solid #d1d5db",
    borderRadius: 20,
    padding: "9px 14px",
    color: "#111827",
    fontSize: 13,
    outline: "none",
  },

  sendBtn: {
    width: 36,
    height: 36,
    borderRadius: "50%",
    border: "none",
    background: "#2563eb",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
  },
};