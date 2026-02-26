package com.example.appdenetregasconexao2772.network

import io.socket.client.IO
import io.socket.client.Socket
import java.net.URISyntaxException

object SocketManager {
    private const val SOCKET_URL = "https://app-backend.zdc13k.easypanel.host"
    private var mSocket: Socket? = null

    init {
        try {
            mSocket = IO.socket(SOCKET_URL)
        } catch (e: URISyntaxException) {
            e.printStackTrace()
        }
    }

    fun connect() {
        mSocket?.connect()
    }

    fun disconnect() {
        mSocket?.disconnect()
    }

    fun getSocket(): Socket? {
        return mSocket
    }
}
