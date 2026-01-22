import { redis } from '@/lib/redis'
import { Elysia } from 'elysia'
import { nanoid } from 'nanoid'
import { z } from "zod"
import { authMiddleware } from './auth'
import { Reddit_Mono } from 'next/font/google'
import { Message, realtime } from '@/lib/realtime'

const ROOM_TTL_SECONDS = 60 * 10    // 10 minutes

const rooms = new Elysia({ prefix: "/room" })
    .post("/create", async () => {
        const roomId = nanoid()

        await redis.hset(`meta:${roomId}`, {
            connected: [], //which users are currently connected to the chat room
            createdAt: Date.now(),
        })

        await redis.expire(`meta:${roomId}`, ROOM_TTL_SECONDS)

        return { roomId }
    })
    .use(authMiddleware)
    .get(
        "/ttl", 
        async ({ auth }) => {
            const ttl = await redis.ttl(`meta:${auth.roomId}`)
            return { ttl: ttl > 0 ? ttl : 0 }//pass the ttl to the frontend
        }, 
        { query: z.object({ roomId: z.string() }) }
    )
    .delete(
        "/", 
        async ({ auth }) => {
            await realtime.channel(auth.roomId).emit("chat.destroy", { isDestroyed: true})  //broadcasts a “room closed” event to all connected users instantly.
    
            await Promise.all([       //Deletes everything in parallel (faster)
                redis.del(auth.roomId),
                redis.del(`meta:${auth.roomId}`),
                redis.del(`messages:${auth.roomId}`),
            ]) 
        }, 
        {query: z.object({roomId: z.string() })} 
    ) 

//any API route we define on this endpoint will automatically use the authMiddleware before executing its logic
const messages = new Elysia({ prefix: "/messages" })
    .use(authMiddleware)
    .post(
        "/", 
        async ({ body, auth }) => {
            const { sender, text } = body
            const { roomId } = auth
            const roomExists = await redis.exists(`meta: ${roomId}`)

            if(!roomExists) {
                throw new Error("Room does not exist")
            }

            const message: Message = {
                id: nanoid(),
                sender,
                text,
                timestamp: Date.now(),
                roomId,
            }

            //messages history from the backend
            await redis.rpush(`messages:${roomId}`, {...message, token:auth.token})

            //so that every client in this room receives the message
            await realtime.channel(roomId).emit("chat.message", message)

            //housekeeping
            const remaining = await redis.ttl(`meta:${roomId}`)

            await Promise.all([
                redis.expire(`messages:${roomId}`, remaining),
                redis.expire(`history:${roomId}`, remaining),
                redis.expire(roomId, remaining)
            ])
        }, 
        {
        query: z.object({ roomId: z.string() }),
        body: z.object({
            sender: z.string().max(100),
            text: z.string().max(1000),
        }),
    }
)
.get("/", async ({ auth }) => {
    const messages = await redis.lrange<Message>(`messages:${auth.roomId}`, 0, -1) //i.e, no end, give us all messages

    return {
        messages: messages.map((m) => ({
            ...m,
            token: m.token === auth.token ? auth.token : undefined, // If message belongs to current user → keep token, Else → remove token (security)
            })),
        }
    }, {query: z.object({ roomId: z.string() }) }
)

const app = new Elysia({ prefix: '/api' }).use(rooms).use(messages) //Creates the main API app, All routes start with /api, Mounts rooms APIs and messages APIs 
     
export const GET = app.fetch             // Connects Elysia to Next.js App Router, One handler serves all HTTP methods
export const POST = app.fetch 
export const DELETE = app.fetch 

export type App = typeof app         //Exports the API type(shape) 