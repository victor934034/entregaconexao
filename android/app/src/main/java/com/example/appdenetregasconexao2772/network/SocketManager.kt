package com.example.appdenetregasconexao2772.network

import io.socket.client.IO
import io.socket.client.Socket
import java.net.URISyntaxException

object SocketManager {
    private const val SOCKET_URL = "http://10.0.2.2:3000"
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
