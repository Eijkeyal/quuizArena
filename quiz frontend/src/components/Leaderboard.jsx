// components/Leaderboard.jsx

export default function Leaderboard({
  leaderboard = [],
  final = false,
  currentUserId,
}) {
  const winner = leaderboard[0];

  return (
    <div className="card leaderboard-card">
      {/* Header */}
      <div className="leaderboard-header">
        <div>
          <div className="eyebrow">
            {final ? "Final Results" : "Live Results"}
          </div>

          <h2 className="leaderboard-title">
            {final
              ? "🏆 Final Leaderboard"
              : "📊 Live Leaderboard"}
          </h2>
        </div>

        <span className="participant-count">
          {leaderboard.length}{" "}
          {leaderboard.length === 1
            ? "Player"
            : "Players"}
        </span>
      </div>

      {/* Winner */}
      {final && winner && (
        <div className="winner-banner">
          <div className="winner-icon">🏆</div>

          <div>
            <div className="winner-label">
              QUIZ WINNER
            </div>

            <div className="winner-name">
              {winner.name}
            </div>

            <div className="winner-points">
              {winner.score ?? winner.points ?? 0} points
            </div>
          </div>
        </div>
      )}

      {/* Leaderboard */}
      {leaderboard.length > 0 ? (
        <div className="leaderboard-table-wrapper">
          <table className="score-table">
            <thead>
              <tr>
                <th>Rank</th>
                <th>Player</th>
                <th>Correct</th>
                <th>Points</th>
              </tr>
            </thead>

            <tbody>
              {leaderboard.map((player, index) => {
                const playerId = player.userId?.toString();
                const myId = currentUserId?.toString();

                const isMe =
                  playerId &&
                  myId &&
                  playerId === myId;

                const rank =
                  player.rank ?? index + 1;

                const points =
                  player.score ?? player.points ?? 0;

                const correctAnswers =
                  player.correctAnswers ?? 0;

                return (
                  <tr
                    key={playerId || index}
                    className={
                      isMe
                        ? "me-row"
                        : ""
                    }
                  >
                    {/* Rank */}
                    <td className="rank">
                      <span
                        className={`rank-badge rank-${rank}`}
                      >
                        {rank === 1
                          ? "🥇"
                          : rank === 2
                            ? "🥈"
                            : rank === 3
                              ? "🥉"
                              : `#${rank}`}
                      </span>
                    </td>

                    {/* Player */}
                    <td className="name">
                      <div className="player-info">
                        <div className="player-avatar">
                          {player.name
                            ?.charAt(0)
                            .toUpperCase() || "?"}
                        </div>

                        <div>
                          <div className="player-name">
                            {player.name ||
                              "Unknown Player"}

                            {isMe && (
                              <span className="you-badge">
                                YOU
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Correct answers */}
                    <td className="correct-cell">
                      <span className="correct-value">
                        ✓ {correctAnswers}
                      </span>
                    </td>

                    {/* Points */}
                    <td className="score">
                      <strong>
                        {points}
                      </strong>
                      <span className="points-label">
                        pts
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="empty-leaderboard">
          <p>📭 No scores yet.</p>
        </div>
      )}
    </div>
  );
}