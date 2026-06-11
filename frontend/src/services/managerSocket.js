import { io } from 'socket.io-client'

export let socketToken = null

const managerSocket = io('http://localhost:3000', {
  autoConnect: false,
  reconnection: true,
  reconnectionAttempts: Infinity,
  reconnectionDelay: 1000,
  auth: {}
})

export function setManagerSocketToken(token) {
  socketToken = token
  if (!token) return
  managerSocket.auth = { token }
  if (!managerSocket.connected) {
    managerSocket.connect()
  } else {
    managerSocket.disconnect().connect()
  }
}

export default managerSocket
