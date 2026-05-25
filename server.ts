import "dotenv/config";
import express from "express";
import path from "path";
import { createServer } from "http";
import { Server } from "socket.io";
import { createServer as createViteServer } from "vite";
import { collection, doc, setDoc, getDoc, updateDoc, deleteDoc, arrayUnion, arrayRemove } from "firebase/firestore";
import { db, testConnection } from "./src/lib/firebase";

async function startServer() {
  // Try to test connection on server start
  testConnection().catch(console.error);

  const app = express();
  const httpServer = createServer(app);
  const io = new Server(httpServer, {
    cors: {
      origin: "*",
    },
  });

  const PORT = 3000;

  // Collection reference
  const ROOMS_COLLECTION = "rooms";

  // In-memory rooms are no longer used for persistence
  
  io.on("connection", (socket) => {
    console.log("A user connected:", socket.id);

    // Rock Paper Scissors Instant Start Handler
    socket.on("joinRPS", async ({ roomId, playerId, playerName }) => {
      const id = (roomId || "").trim().toUpperCase();
      if (!id) return;

      socket.join(id);
      
      try {
        const roomRef = doc(db, ROOMS_COLLECTION, id);
        const roomSnap = await getDoc(roomRef);
        
        let roomData: any;

        if (roomSnap.exists()) {
          roomData = roomSnap.data();
          // Normalize players to object if it's an array (from lobby)
          if (Array.isArray(roomData.players)) {
            const normalized: Record<string, any> = {};
            roomData.players.forEach((p: any) => {
              if (p.id) normalized[p.id] = p;
            });
            roomData.players = normalized;
          }
        } else {
          roomData = {
            id,
            players: {},
            status: "waiting",
            gameType: "rps"
          };
        }

        const pId = playerId || socket.id;
        roomData.players[pId] = {
          id: pId,
          socketId: socket.id,
          name: playerName || "Pilot",
          currentMove: null,
          score: roomData.players[pId]?.score || 0
        };

        await setDoc(roomRef, roomData);
        const playerCount = Object.keys(roomData.players).length;
        console.log(`[RPS] Player ${playerName} joined room ${id}. Total: ${playerCount}`);

        if (playerCount === 2 && roomData.status === "waiting") {
          roomData.status = "playing";
          await updateDoc(roomRef, { status: "playing" });
          io.to(id).emit("rpsGameStarted", roomData);
          console.log(`[RPS] Room ${id} has 2 players. Emitting rpsGameStarted.`);
        }
      } catch (err) {
        console.error("[RPS] Join error:", err);
      }
    });

    socket.on("rps-submit", async ({ roomId, choice }) => {
      const id = (roomId || "").trim().toUpperCase();
      try {
        const roomRef = doc(db, ROOMS_COLLECTION, id);
        const roomSnap = await getDoc(roomRef);
        if (!roomSnap.exists()) return;
        
        const room = roomSnap.data();
        const pId = Object.keys(room.players).find(pid => room.players[pid].socketId === socket.id);
        if (!pId) return;
        
        room.players[pId].currentMove = choice;
        
        const playersArr: any[] = Object.values(room.players);
        const movedCount = playersArr.filter(p => p.currentMove).length;
        
        if (movedCount === 2) {
          const results: Record<string, string> = {};
          playersArr.forEach(p => {
             results[p.id] = p.currentMove;
          });
          
          const p1 = playersArr[0];
          const p2 = playersArr[1];
          
          const beats: Record<string, string> = {
            rock: "scissors",
            paper: "rock",
            scissors: "paper"
          };

          let winnerId = null;
          if (p1.currentMove !== p2.currentMove) {
            winnerId = beats[p1.currentMove] === p2.currentMove ? p1.id : p2.id;
          }

          // Reset moves and potentially increment score
          playersArr.forEach(p => {
            if (winnerId && p.id === winnerId) p.score = (p.score || 0) + 1;
            p.currentMove = null;
          });
          
          await updateDoc(roomRef, { players: room.players });

          io.to(id).emit("rpsResult", {
            results,
            winnerId
          });
        } else {
          await updateDoc(roomRef, { players: room.players });
          socket.to(id).emit("rps-opponent-ready");
        }
      } catch (err) {
        console.error("[RPS] Submit error:", err);
      }
    });

    socket.on("create-room", async ({ gameId, userData }) => {
      try {
        // Robust 6-character alphanumeric ID avoiding ambiguous chars (0, O, I, 1)
        // We use a set that excludes 0 and 1 to prevent confusion with O and I
        const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
        const roomId = Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
        
        const newRoomData = {
          id: roomId,
          gameId,
          players: [{ ...userData, id: socket.id, isReady: false }],
          status: "waiting",
          gameState: {},
          hostId: socket.id,
          active: true,
          createdAt: new Date().toISOString()
        };

        const roomRef = doc(db, ROOMS_COLLECTION, roomId);
        console.log(`[CREATE] Creating room ${roomId} for [${userData?.displayName}]`);
        await setDoc(roomRef, newRoomData);

        socket.join(roomId);
        socket.emit("room-created", newRoomData);
        console.log(`[CREATE] Success: Room ${roomId} active.`);
      } catch (err: any) {
        console.error("[CREATE] ERROR:", err.message);
        socket.emit("error", "Failed to initialize arena.");
      }
    });

    socket.on("join-room", async ({ roomId, userData }) => {
      // Robust normalization: trim, uppercase, and fix common typos (0/O, 1/I)
      const normalizedCode = (roomId || "")
        .trim()
        .toUpperCase()
        .replace(/0/g, 'O')
        .replace(/1/g, 'I');
      
      console.log(`[JOIN] Request: [${normalizedCode}] User: [${userData?.displayName || 'Anonymous'}]`);

      try {
        // Detailed DB check for server environment
        const databaseId = (db as any)._databaseId?.database || "(default)";
        const projectId = (db as any)._databaseId?.projectId || "unknown";
        console.log(`[JOIN] Database context: project=[${projectId}] database=[${databaseId}]`);

        const roomRef = doc(db, ROOMS_COLLECTION, normalizedCode);
        let roomSnap = await getDoc(roomRef);

        // Retry logic for potential replication lag (up to 3 attempts, 1s apart)
        if (!roomSnap.exists()) {
          for (let i = 1; i <= 2; i++) {
            console.log(`[JOIN] Code [${normalizedCode}] not found, retry ${i}/2...`);
            await new Promise(resolve => setTimeout(resolve, 1000));
            roomSnap = await getDoc(roomRef);
            if (roomSnap.exists()) break;
          }
        }

        if (!roomSnap.exists()) {
          console.log(`[JOIN] FAIL: Room [${normalizedCode}] strictly does not exist in [${ROOMS_COLLECTION}]`);
          
          // Debug: Search by query to see if it exists under a different case or with spaces
          try {
            const { getDocs, query, where, collection, limit } = await import("firebase/firestore");
            const q = query(collection(db, ROOMS_COLLECTION), where("id", "==", normalizedCode));
            const querySnap = await getDocs(q);
            
            if (!querySnap.empty) {
              console.log(`[JOIN] Found via query but not via doc reference! ID: ${querySnap.docs[0].id}`);
              roomSnap = querySnap.docs[0];
            } else {
              // List a few rooms to see what's actually there
              const debugSnap = await getDocs(query(collection(db, ROOMS_COLLECTION), limit(10)));
              const existingIds = debugSnap.docs.map(d => d.id);
              console.log(`[JOIN] Visible rooms in current DB: [${existingIds.join(", ") || "NONE"}]`);
            }
          } catch (debugErr: any) {
            console.error("[JOIN] Debug query failed:", debugErr.message);
          }
        }

        if (!roomSnap || !roomSnap.exists()) {
          socket.emit("error", "Arena not found. Please verify the 6-character code.");
          return;
        }

        const room = roomSnap.data();
        if (room.players.length >= 4) {
          socket.emit("error", "Arena is already at maximum capacity (4 players).");
          return;
        }

        const newPlayer = { ...userData, id: socket.id, isReady: false };
        await updateDoc(roomRef, {
          players: arrayUnion(newPlayer)
        });

        // Get fresh data after update
        const updatedSnap = await getDoc(roomRef);
        const updatedRoom = updatedSnap.data();

        socket.join(normalizedCode);
        io.to(normalizedCode).emit("room-update", updatedRoom);
        console.log(`[JOIN] SUCCESS: Player [${userData?.displayName}] joined [${normalizedCode}]`);

      } catch (err: any) {
        console.error(`[JOIN] CRITICAL ERROR [${normalizedCode}]:`, err);
        socket.emit("error", "The arena link is unstable. Please try again.");
      }
    });

    socket.on("player-toggle-ready", async (roomId) => {
      try {
        const roomRef = doc(db, ROOMS_COLLECTION, roomId);
        const roomSnap = await getDoc(roomRef);
        
        if (roomSnap.exists()) {
          const room = roomSnap.data();
          const players = [...room.players];
          const playerIdx = players.findIndex(p => p.id === socket.id);
          
          if (playerIdx !== -1) {
            players[playerIdx].isReady = !players[playerIdx].isReady;
            await updateDoc(roomRef, { players });
            io.to(roomId).emit("room-update", { ...room, players });
          }
        }
      } catch (err) {
        console.error("Firestore Error in toggle-ready:", err);
      }
    });

    socket.on("start-game", async (roomId) => {
      try {
        const roomRef = doc(db, ROOMS_COLLECTION, roomId);
        const roomSnap = await getDoc(roomRef);
        
        if (roomSnap.exists()) {
          const room = roomSnap.data();
          if (room.hostId === socket.id) {
            const initialGameState = {
              activePlayerIdx: 0,
              consecutiveSixes: 0,
              lastUpdate: Date.now(),
              turnStartTime: Date.now()
            };
            await updateDoc(roomRef, { 
              status: "playing",
              gameState: initialGameState
            });
            io.to(roomId).emit("game-started", { ...room, status: "playing", gameState: initialGameState });
          }
        }
      } catch (err) {
        console.error("Firestore Error in start-game:", err);
      }
    });

    socket.on("game-action", async ({ roomId, action, data }) => {
      // Basic broadcast for backwards compatibility
      if (action && (action === "ludo-sync" || action.startsWith("ludo-"))) {
        io.to(roomId).emit("game-event", { sender: socket.id, action, data });
      } else {
        socket.to(roomId).emit("game-event", { sender: socket.id, action, data });
      }

      // authoritative turn management for specific actions
      if (action === "snakes-move" || action === "turn-finished" || action === "connect4-move") {
        try {
          const roomRef = doc(db, ROOMS_COLLECTION, roomId);
          const roomSnap = await getDoc(roomRef);
          
          if (roomSnap.exists()) {
            const room = roomSnap.data();
            const gameState = room.gameState || {};
            const playerIds = room.players.map((p: any) => p.id);
            const currentActiveIdx = gameState.activePlayerIdx || 0;

            // Only process if it was the active player sending the action
            if (socket.id === playerIds[currentActiveIdx]) {
              let nextIdx = (currentActiveIdx + 1) % playerIds.length;
              let consecutiveSixes = gameState.consecutiveSixes || 0;
              let updatedGameState = { ...gameState };

              if (action === "snakes-move") {
                const roll = data.roll;
                const isKnockout = data.isKnockout || false;
                nextIdx = currentActiveIdx; // Default to stay for bonus
                
                if (isKnockout || roll === 6) {
                  if (roll === 6) consecutiveSixes++;
                  if (consecutiveSixes >= 3) {
                    nextIdx = (currentActiveIdx + 1) % playerIds.length;
                    consecutiveSixes = 0;
                  }
                } else {
                  nextIdx = (currentActiveIdx + 1) % playerIds.length;
                  consecutiveSixes = 0;
                }
              } else if (action === "connect4-move") {
                nextIdx = (currentActiveIdx + 1) % playerIds.length;
              }

              const newGameState = {
                ...updatedGameState,
                activePlayerIdx: nextIdx,
                consecutiveSixes,
                lastUpdate: Date.now()
              };

              await updateDoc(roomRef, { gameState: newGameState });
              io.to(roomId).emit("game-state-update", newGameState);
            }
          }
        } catch (err) {
          console.error("Authoritative action error:", err);
        }
      }
    });

    socket.on("leave-room", (roomId) => {
      socket.leave(roomId);
      handleDisconnect(socket, roomId);
    });

    socket.on("disconnect", () => {
      handleDisconnect(socket);
    });

    async function handleDisconnect(socket: any, specificRoomId?: string) {
       // Memory cleanup is no longer needed for RPS/Chess as they use Firestore

       if (specificRoomId) {
         try {
           const roomRef = doc(db, ROOMS_COLLECTION, specificRoomId);
           const roomSnap = await getDoc(roomRef);
           if (roomSnap.exists()) {
             const room = roomSnap.data();
             let players = room.players;
             let isModified = false;

             if (Array.isArray(players)) {
               const originalCount = players.length;
               players = players.filter((p: any) => p.id !== socket.id);
               if (players.length !== originalCount) isModified = true;
             } else if (typeof players === 'object' && players !== null) {
               const pId = Object.keys(players).find(k => k === socket.id || players[k].socketId === socket.id);
               if (pId) {
                 delete players[pId];
                 isModified = true;
               }
             }
             
             if (!isModified) return;

             const playerCount = Array.isArray(players) ? players.length : Object.keys(players || {}).length;
             
             if (playerCount === 0) {
               await deleteDoc(roomRef);
             } else {
               let hostId = room.hostId;
               // If host left, assign new host if it's an array lobby room
               if (hostId === socket.id && Array.isArray(players)) {
                 hostId = players[0].id;
               }
               await updateDoc(roomRef, { players, hostId });
               io.to(specificRoomId).emit("room-update", { ...room, players, hostId });
             }
           }
         } catch (err) {
            console.error("Error handling disconnect:", err);
         }
       }
    }
  });

  // API routes
  app.get("/api/health", async (req, res) => {
    let dbStatus = "unknown";
    try {
      const { doc, getDocFromServer } = await import("firebase/firestore");
      const docRef = doc(db, '_connection_test_', 'check');
      await getDocFromServer(docRef);
      dbStatus = "connected";
    } catch (e: any) {
      dbStatus = `error: ${e.message}`;
    }
    
    res.json({ 
      status: "ok", 
      time: new Date().toISOString(),
      firestore: dbStatus,
      env: process.env.NODE_ENV,
      dbId: (db as any)._databaseId?.database || "(default)"
    });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
