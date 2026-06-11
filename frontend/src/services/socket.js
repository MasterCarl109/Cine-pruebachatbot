import { io } from 'socket.io-client'

export let socketToken = null

const socket = io('http://localhost:3000', {
  autoConnect: false,
  reconnection: true,
  reconnectionAttempts: Infinity,
  reconnectionDelay: 1000,
  auth: {}
})

export function setSocketToken(token) {
  socketToken = token
  if (!token) return
  socket.auth = { token }
  if (!socket.connected) {
    socket.connect()
  } else {
    socket.disconnect().connect()
  }
}

export default socket
