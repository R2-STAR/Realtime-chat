import { redis } from "@/lib/redis"
import Elysia from "elysia"

class AuthError extends Error {
    constructor(message: string) {
        super(message)
        this.name = "AuthError"
    }
}

export const authMiddleware = new Elysia({ name: "auth" }).error({ AuthError }).onError(({ code, set }) => { //whenever an AuthError is thrown anywhere in this app, this middleware will catch it.
    if(code === "AuthError") {
        set.status = 401
        return { error: "Unauthorised" }
    }
}).derive({ as: "scoped" }, async ({ query, cookie }) => {
    const roomId = query.roomId //which room is user trying to connect to 
    const token = cookie["x-auth-token"].value as string | undefined //is the token allowing them or not


    if(!roomId || !token) {
        throw new AuthError("Missing roomId or token.")
    }

    const connected = await redis.hget<string[]>(`meta:${roomId}`, "connected") //metadate of the room user is trynna connect to

    if(!connected?.includes(token)) {
        throw new AuthError("Invalid token")
    }

    return { auth: { roomId, token, connected }}
})