// controls room access: lets returning users in, blocks full rooms, and generates new tokens for first-time users.
// sets a secure authentication cookie for the user, updates the room’s metadata in Redis to include the new user, and returns the response.
import { NextRequest, NextResponse } from "next/server"
import { redis } from "./lib/redis"
import { nanoid } from "nanoid"

export const proxy = async (req: NextRequest ) => {   //Takes a Next.js request object
    const pathname = req.nextUrl.pathname

    const roomMatch = pathname.match(/^\/room\/([^/]+)$/)
    if(!roomMatch) return NextResponse.redirect(new URL("/", req.url))

    const roomId = roomMatch[1]

    const meta = await redis.hgetall<{connected: string[],createdAt: number}>(`meta:${roomId}`)   // Uses Redis to fetch metadata for the room: connected → array of connected user IDs, createdAt → timestamp of room creation

    if(!meta) {
        return NextResponse.redirect(new URL("/?error=room-not-found", req.url))
    }

    const existingToken = req.cookies.get("x-auth-token")?.value //if a token already exists

    //User allowed to join the room, might have refreshed browser
    if(existingToken && meta.connected.includes(existingToken)) {
        return NextResponse.next()
    }

    //User is not allowed to join
    if(meta.connected.length >= 2) {       //Checks if the room already has 2 users connected (max capacity).
        return NextResponse.redirect(new URL("/?error=room-full", req.url))
    }

    const response = NextResponse.next()   

    const token = nanoid()   //Generates a new unique token for the user joining the room.

    response.cookies.set("x-auth-token", token, 
    {
        path: "/", 
        httpOnly: true, 
        secure:process.env.NODE_ENV === "production",
        sameSite: "strict",
    })

    await redis.hset(`meta:${roomId}`, { //update the metadata for the newly joined user
        connected: [...meta.connected, token],
    })

    return response
}


//decides when proxy method should run
export const config = {
    matcher : "/room/:path*",
}