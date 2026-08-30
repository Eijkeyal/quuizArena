import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Pencil,
  Trash2,
  Check,
  X,
  Send,
  MessageCircle,
} from "lucide-react";
import { io } from "socket.io-client";
import * as api from "../api";
import { useAuth } from "../context/AuthContext";

// ============================================================
// CONFIG
// ============================================================

const SOCKET_URL = "http://localhost:3000";

// Use the conversation that should be used for the lobby chat.
// Change this to your real conversation ID.
const CONVERSATION_ID = "6a834a191a6282676e99c9c5";

// ============================================================
// HELPERS
// ============================================================

function getMessageId(message) {
  return message?._id || message?.id;
}

function getSenderId(message) {
  if (!message) return null;

  if (typeof message.senderId === "object") {
    return (
      message.senderId?._id ||
      message.senderId?.id ||
      null
    );
  }

  return message.senderId || null;
}

function getSenderName(message) {
  if (!message) return "User";

  if (message.senderId?.name) {
    return message.senderId.name;
  }

  if (message.sender?.name) {
    return message.sender.name;
  }

  if (message.user?.name) {
    return message.user.name;
  }

  if (message.userName) {
    return message.userName;
  }

  return "User";
}

function getMessageContent(message) {
  return (
    message?.content ||
    message?.text ||
    ""
  );
}

function getMessageCreatedAt(message) {
  return (
    message?.createdAt ||
    message?.created_at ||
    Date.now()
  );
}

function getMessageEditedAt(message) {
  return (
    message?.editedAt ||
    message?.updatedAt ||
    null
  );
}

function formatTime(timestamp) {
  return new Date(timestamp).toLocaleTimeString(
    [],
    {
      hour: "2-digit",
      minute: "2-digit",
    },
  );
}

// ============================================================
// COMPONENT
// ============================================================

export default function UserDashboard() {
  const navigate = useNavigate();

  const { user } = useAuth();

  // ==========================================================
  // QUIZ STATE
  // ==========================================================

  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // ==========================================================
  // CHAT STATE
  // ==========================================================

  const [chatOpen, setChatOpen] = useState(false);

  const [messages, setMessages] = useState([]);

  const [draft, setDraft] = useState("");

  const [editingId, setEditingId] =
    useState(null);

  const [editDraft, setEditDraft] =
    useState("");

  const [pendingDeleteId, setPendingDeleteId] =
    useState(null);

  const [chatLoading, setChatLoading] =
    useState(false);

  const [sending, setSending] =
    useState(false);

  const [chatError, setChatError] =
    useState("");

  const [socketConnected, setSocketConnected] =
    useState(false);

  const listRef = useRef(null);

  const socketRef = useRef(null);

  // ==========================================================
  // TOKEN
  // ==========================================================

  const token =
    localStorage.getItem("accessToken") ||
    localStorage.getItem("token");

  // ==========================================================
  // CURRENT USER ID
  // ==========================================================

  const currentUserId =
    user?._id || user?.id || null;

  // ==========================================================
  // LOAD QUIZZES
  // ==========================================================

  useEffect(() => {
    async function fetchQuizzes() {
      try {
        setLoading(true);
        setError("");

        const allQuizzes =
          await api.getQuizzes();

        const availableQuizzes =
          Array.isArray(allQuizzes)
            ? allQuizzes.filter(
                (quiz) =>
                  quiz.status === "READY" ||
                  quiz.status === "LIVE",
              )
            : [];

        setQuizzes(availableQuizzes);
      } catch (err) {
        console.error(
          "Failed to load quizzes:",
          err,
        );

        setError(
          err?.response?.data?.message ||
            err?.message ||
            "Failed to load quizzes",
        );
      } finally {
        setLoading(false);
      }
    }

    fetchQuizzes();
  }, []);

  // ==========================================================
  // CONNECT SOCKET.IO
  // ==========================================================

  useEffect(() => {
    if (!token || !user) {
      return;
    }

    console.log(
      "Connecting to Socket.IO...",
    );

    const socket = io(SOCKET_URL, {
      auth: {
        token,
      },
    });

    socketRef.current = socket;

    // --------------------------------------------------------
    // CONNECT
    // --------------------------------------------------------

    socket.on("connect", () => {
      console.log(
        "Socket connected:",
        socket.id,
      );

      setSocketConnected(true);

      // Join the conversation room
      socket.emit(
        "joinConversation",
        CONVERSATION_ID,
      );
    });

    // --------------------------------------------------------
    // CONNECTION ERROR
    // --------------------------------------------------------

    socket.on(
      "connect_error",
      (err) => {
        console.error(
          "Socket connection error:",
          err,
        );

        setSocketConnected(false);

        setChatError(
          "Could not connect to chat server.",
        );
      },
    );

    // --------------------------------------------------------
    // DISCONNECT
    // --------------------------------------------------------

    socket.on("disconnect", () => {
      console.log(
        "Socket disconnected",
      );

      setSocketConnected(false);
    });

    // --------------------------------------------------------
    // NEW MESSAGE
    // --------------------------------------------------------

    socket.on(
      "newMessage",
      (message) => {
        console.log(
          "New message:",
          message,
        );

        setMessages((prev) => {
          const newId =
            getMessageId(message);

          // Prevent duplicates
          const exists = prev.some(
            (existingMessage) =>
              String(
                getMessageId(
                  existingMessage,
                ),
              ) === String(newId),
          );

          if (exists) {
            return prev;
          }

          return [
            ...prev,
            message,
          ];
        });
      },
    );

    // --------------------------------------------------------
    // MESSAGE UPDATED
    // --------------------------------------------------------

    socket.on(
      "messageUpdated",
      (updatedMessage) => {
        console.log(
          "Message updated:",
          updatedMessage,
        );

        const updatedId =
          getMessageId(
            updatedMessage,
          );

        setMessages((prev) =>
          prev.map((message) =>
            String(
              getMessageId(message),
            ) === String(updatedId)
              ? updatedMessage
              : message,
          ),
        );
      },
    );

    // --------------------------------------------------------
    // MESSAGE DELETED
    // --------------------------------------------------------

    socket.on(
      "messageDeleted",
      (deletedMessage) => {
        console.log(
          "Message deleted:",
          deletedMessage,
        );

        const deletedId =
          typeof deletedMessage ===
          "object"
            ? getMessageId(
                deletedMessage,
              )
            : deletedMessage;

        setMessages((prev) =>
          prev.filter(
            (message) =>
              String(
                getMessageId(message),
              ) !== String(
                deletedId,
              ),
          ),
        );
      },
    );

    // --------------------------------------------------------
    // CLEANUP
    // --------------------------------------------------------

    return () => {
      console.log(
        "Cleaning Socket.IO connection",
      );

      socket.off("connect");
      socket.off(
        "connect_error",
      );
      socket.off("disconnect");
      socket.off("newMessage");
      socket.off(
        "messageUpdated",
      );
      socket.off(
        "messageDeleted",
      );

      socket.disconnect();

      socketRef.current = null;
    };
  }, [token, user]);

  // ==========================================================
  // LOAD MESSAGE HISTORY
  // ==========================================================

  useEffect(() => {
    if (!chatOpen) {
      return;
    }

    if (!token) {
      setChatError(
        "You are not logged in.",
      );

      return;
    }

    async function loadMessages() {
      try {
        setChatLoading(true);
        setChatError("");

        const response =
          await fetch(
            `${SOCKET_URL}/conversations/${CONVERSATION_ID}/messages`,
            {
              method: "GET",

              headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type":
                  "application/json",
              },
            },
          );

        const data =
          await response.json();

        if (!response.ok) {
          throw new Error(
            data?.message ||
              "Failed to load messages",
          );
        }

        const loadedMessages =
          Array.isArray(data)
            ? data
            : data.messages || [];

        setMessages(
          loadedMessages,
        );
      } catch (err) {
        console.error(
          "Failed to load messages:",
          err,
        );

        setChatError(
          err?.message ||
            "Failed to load messages",
        );
      } finally {
        setChatLoading(false);
      }
    }

    loadMessages();
  }, [chatOpen, token]);

  // ==========================================================
  // AUTO SCROLL
  // ==========================================================

  useEffect(() => {
    if (!listRef.current) {
      return;
    }

    listRef.current.scrollTo({
      top: listRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages]);

  // ==========================================================
  // JOIN QUIZ
  // ==========================================================

  async function onJoin(quizId) {
    try {
      setError("");

      await api.joinQuiz(
        quizId,
      );

      navigate(
        `/play/${quizId}`,
      );
    } catch (err) {
      // Already joined
      if (
        err?.response?.status ===
        409
      ) {
        navigate(
          `/play/${quizId}`,
        );

        return;
      }

      setError(
        err?.response?.data
          ?.message ||
          err?.message ||
          "Failed to join quiz",
      );
    }
  }

  // ==========================================================
  // SEND MESSAGE
  // ==========================================================

  async function sendMessage() {
    const content =
      draft.trim();

    if (!content) {
      return;
    }

    if (!token) {
      setChatError(
        "You are not authenticated.",
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
        await fetch(
          `${SOCKET_URL}/conversations/${CONVERSATION_ID}/messages`,
          {
            method: "POST",

            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify({
              content,
            }),
          },
        );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data?.message ||
            "Failed to send message",
        );
      }

      console.log(
        "Message sent:",
        data,
      );

      /*
       * Do NOT add the message
       * manually here.
       *
       * Socket.IO should send
       * "newMessage" back to
       * the connected clients.
       */

      setDraft("");
    } catch (err) {
      console.error(
        "Failed to send message:",
        err,
      );

      setChatError(
        err?.message ||
          "Failed to send message",
      );
    } finally {
      setSending(false);
    }
  }

  // ==========================================================
  // START EDIT
  // ==========================================================

  function startEdit(message) {
    const messageId =
      getMessageId(message);

    setEditingId(
      messageId,
    );

    setEditDraft(
      getMessageContent(
        message,
      ),
    );

    setPendingDeleteId(
      null,
    );
  }

  // ==========================================================
  // CANCEL EDIT
  // ==========================================================

  function cancelEdit() {
    setEditingId(null);
    setEditDraft("");
  }

  // ==========================================================
  // SAVE EDIT
  // ==========================================================

  async function saveEdit(
    messageId,
  ) {
    const content =
      editDraft.trim();

    if (!content) {
      return;
    }

    try {
      setChatError("");

      const response =
        await fetch(
          `${SOCKET_URL}/messages/${messageId}`,
          {
            method: "PUT",

            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify({
              content,
            }),
          },
        );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data?.message ||
            "Failed to update message",
        );
      }

      const updatedMessage =
        data.message ||
        data;

      setMessages((prev) =>
        prev.map(
          (message) =>
            String(
              getMessageId(
                message,
              ),
            ) ===
            String(messageId)
              ? updatedMessage
              : message,
        ),
      );

      cancelEdit();
    } catch (err) {
      console.error(
        "Failed to edit message:",
        err,
      );

      setChatError(
        err?.message ||
          "Failed to edit message",
      );
    }
  }

  // ==========================================================
  // DELETE MESSAGE
  // ==========================================================

  async function confirmDelete(
    messageId,
  ) {
    try {
      setChatError("");

      const response =
        await fetch(
          `${SOCKET_URL}/messages/${messageId}`,
          {
            method: "DELETE",

            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type":
                "application/json",
            },
          },
        );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data?.message ||
            "Failed to delete message",
        );
      }

      /*
       * Remove immediately from UI.
       *
       * If your backend also emits
       * messageDeleted, the socket
       * handler prevents problems.
       */

      setMessages((prev) =>
        prev.filter(
          (message) =>
            String(
              getMessageId(
                message,
              ),
            ) !==
            String(messageId),
        ),
      );

      setPendingDeleteId(
        null,
      );
    } catch (err) {
      console.error(
        "Failed to delete message:",
        err,
      );

      setChatError(
        err?.message ||
          "Failed to delete message",
      );
    }
  }

  // ==========================================================
  // CHECK MESSAGE OWNER
  // ==========================================================

  function isMyMessage(
    message,
  ) {
    if (!currentUserId) {
      return false;
    }

    const senderId =
      getSenderId(message);

    return (
      String(senderId) ===
      String(currentUserId)
    );
  }

  // ==========================================================
  // LOADING
  // ==========================================================

  if (loading) {
    return (
      <div className="page">
        <p className="dim">
          Loading...
        </p>
      </div>
    );
  }

  // ==========================================================
  // UI
  // ==========================================================

  return (
    <div className="page">
      {/* ====================================================
          QUIZ SECTION
      ==================================================== */}

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
                      quiz._id,
                    )
                  }
                >
                  {quiz.status ===
                  "LIVE"
                    ? "Join Quiz →"
                    : "Join and Wait →"}
                </button>
              </div>
            ),
          )}
        </div>
      ) : (
        <p className="empty">
          No quizzes are available
          yet. Check back soon.
        </p>
      )}

      {/* ====================================================
          CHAT BUTTON
      ==================================================== */}

      <div
        style={
          styles.chatWrapper
        }
      >
        <button
          style={
            styles.toggle
          }
          onClick={() =>
            setChatOpen(
              (open) =>
                !open,
            )
          }
          aria-label={
            chatOpen
              ? "Close chat"
              : "Open chat"
          }
        >
          <MessageCircle
            size={22}
            color="#ffffff"
          />
        </button>

        {/* ==================================================
            CHAT PANEL
        ================================================== */}

        {chatOpen && (
          <div
            style={
              styles.panel
            }
          >
            {/* HEADER */}

            <div
              style={
                styles.header
              }
            >
              <div>
                <div
                  style={
                    styles.headerTitle
                  }
                >
                  Lobby chat
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

              <button
                style={
                  styles.closeBtn
                }
                onClick={() =>
                  setChatOpen(
                    false,
                  )
                }
                aria-label="Close"
              >
                <X
                  size={16}
                  color="#6b7280"
                />
              </button>
            </div>

            {/* ERROR */}

            {chatError && (
              <div
                style={
                  styles.chatError
                }
              >
                {chatError}
              </div>
            )}

            {/* MESSAGE LIST */}

            <div
              style={
                styles.list
              }
              ref={listRef}
            >
              {chatLoading ? (
                <p
                  style={
                    styles.loadingText
                  }
                >
                  Loading messages...
                </p>
              ) : messages.length ===
                0 ? (
                <p
                  style={
                    styles.loadingText
                  }
                >
                  No messages yet.
                </p>
              ) : (
                messages.map(
                  (message) => {
                    const messageId =
                      getMessageId(
                        message,
                      );

                    const mine =
                      isMyMessage(
                        message,
                      );

                    const editing =
                      String(
                        editingId,
                      ) ===
                      String(
                        messageId,
                      );

                    const confirmingDelete =
                      String(
                        pendingDeleteId,
                      ) ===
                      String(
                        messageId,
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
                          {/* SENDER */}

                          {!mine && (
                            <div
                              style={
                                styles.senderName
                              }
                            >
                              {getSenderName(
                                message,
                              )}
                            </div>
                          )}

                          {/* MESSAGE */}

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
                                    e,
                                  ) =>
                                    setEditDraft(
                                      e.target
                                        .value,
                                    )
                                  }
                                  onKeyDown={(
                                    e,
                                  ) => {
                                    if (
                                      e.key ===
                                      "Enter"
                                    ) {
                                      saveEdit(
                                        messageId,
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
                                      messageId,
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
                                  message,
                                )}
                              </span>
                            )}
                          </div>

                          {/* MESSAGE META */}

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
                                getMessageCreatedAt(
                                  message,
                                ),
                              )}

                              {getMessageEditedAt(
                                message,
                              )
                                ? " · edited"
                                : ""}
                            </span>

                            {/* EDIT / DELETE */}

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
                                            messageId,
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
                                            null,
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
                                            message,
                                          )
                                        }
                                        aria-label="Edit"
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
                                            messageId,
                                          )
                                        }
                                        aria-label="Delete"
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
                  },
                )
              )}
            </div>

            {/* INPUT */}

            <div
              style={
                styles.inputRow
              }
            >
              <input
                value={draft}
                onChange={(e) =>
                  setDraft(
                    e.target.value,
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
                placeholder="Message the lobby..."
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
                aria-label="Send"
              >
                <Send
                  size={16}
                  color="#ffffff"
                />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================
// STYLES
// ============================================================

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
    border:
      "1px solid #e2e5ea",
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
    width: 340,
    height: 460,
    background: "#ffffff",
    border:
      "1px solid #e2e5ea",
    borderRadius: 14,
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
    boxShadow:
      "0 16px 40px rgba(15,23,42,0.14)",
  },

  header: {
    display: "flex",
    justifyContent:
      "space-between",
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
    background:
      "transparent",
    border: "none",
    cursor: "pointer",
    padding: 4,
  },

  chatError: {
    padding:
      "8px 12px",
    background:
      "#fef2f2",
    color: "#dc2626",
    fontSize: 12,
    borderBottom:
      "1px solid #fee2e2",
  },

  list: {
    flex: 1,
    overflowY: "auto",
    padding:
      "14px 12px",
    display: "flex",
    flexDirection:
      "column",
    gap: 12,
    background:
      "#ffffff",
  },

  loadingText: {
    textAlign: "center",
    color: "#9ca3af",
    fontSize: 12,
    marginTop: 20,
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
    padding:
      "8px 12px",
    borderRadius: 14,
    fontSize: 13.5,
    lineHeight: 1.4,
    wordBreak:
      "break-word",
  },

  bubbleMine: {
    background:
      "#2563eb",
    color: "#ffffff",
    borderBottomRightRadius: 4,
  },

  bubbleTheirs: {
    background:
      "#f1f3f5",
    color: "#111827",
    border:
      "1px solid #e5e7eb",
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
    background:
      "transparent",
    border: "none",
    cursor: "pointer",
    padding: 2,
    display: "flex",
    alignItems: "center",
  },

  iconBtnGhost: {
    background:
      "transparent",
    border: "none",
    cursor: "pointer",
    padding: 2,
    display: "flex",
    alignItems: "center",
  },

  actionTextBtn: {
    background:
      "transparent",
    border: "none",
    color: "#dc2626",
    fontSize: 10.5,
    cursor: "pointer",
    padding: 0,
    textDecoration:
      "underline",
  },

  editRow: {
    display: "flex",
    alignItems: "center",
    gap: 6,
  },

  editInput: {
    background:
      "#ffffff",
    border:
      "1px solid #d1d5db",
    borderRadius: 8,
    color: "#111827",
    fontSize: 13,
    padding:
      "4px 8px",
    outline: "none",
    minWidth: 120,
  },

  inputRow: {
    display: "flex",
    gap: 8,
    padding: 12,
    borderTop:
      "1px solid #eef0f3",
    background:
      "#fafbfc",
  },

  input: {
    flex: 1,
    background:
      "#ffffff",
    border:
      "1px solid #d1d5db",
    borderRadius: 20,
    padding:
      "9px 14px",
    color: "#111827",
    fontSize: 13,
    outline: "none",
  },

  sendBtn: {
    width: 36,
    height: 36,
    borderRadius: "50%",
    border: "none",
    background:
      "#2563eb",
    display: "flex",
    alignItems: "center",
    justifyContent:
      "center",
    cursor: "pointer",
  },
};
