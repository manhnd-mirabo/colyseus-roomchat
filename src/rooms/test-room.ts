import { Schema, type, MapSchema, ArraySchema } from "@colyseus/schema";
import { Client, Room } from "colyseus";

import { removeItemOnce } from "../utils/helper";

// export class Client extends Schema {
//     @type("string") name : string;
// }

export class ChatRoom extends Schema {
    // @type({ map: Client })
    // clients = new MapSchema<Client>();
    // @type([ "string" ]) clients = new ArraySchema<string>();
    @type([ "string" ]) clients = new ArraySchema<string>();
    private onlineUsers: Map<string, Client >

    addClient(client) {
        this.clients.push(client)
    }

    removeClient(client) {
        this.clients = removeItemOnce(this.clients, client);
    }
}

export class State extends Schema {
    @type({ map: ChatRoom })
    chatRooms = new MapSchema<ChatRoom>();

    createRooms(roomName: string, client: string) {
        this.chatRooms.set(roomName, new ChatRoom());
        this.addClientToRoom(roomName, client) 
    }

    removeRooms(roomName: string) {
        this.chatRooms.delete(roomName);
    }

    addClientToRoom(roomName: string, client: string) {
        this.chatRooms.get(roomName).addClient(client);
    }

    removeClientToRoom(roomName: string, client: string) {
        this.chatRooms.get(roomName).removeClient(client);
    }
}

export class TestRoom extends Room<State> {
    // this room supports only 5 clients connected
    maxClients = 15;
    private onlineUsers: Map<string, Client >

    onCreate (options) {
        console.log("NOti:: created!", options);

        this.setState(new State());
        
        this.onMessage("get-rooms", (client, noti) => {
            this.broadcast("update-list-room", this.state);
        });

        this.onMessage("noti-create-room", (client, roomName) => {
            this.state.createRooms(roomName, client.sessionId);
            this.broadcast("update-list-room", this.state);
        });

        this.onMessage("message", (client, message) => {
            console.log("ChatRoom received message from", client.sessionId, ":", message);
            this.broadcast("messages", `(${client.sessionId}) ${message}`);
        });
    }

    onJoin (client) {
        this.broadcast("noti", `${ client.sessionId } joined.`);
    }

    onLeave (client) {
        this.broadcast("noti", `${ client.sessionId } left.`);
    }

    onDispose () {
        console.log("Dispose Noti::");
    }

    async getOnlineUsers(): Promise<Map<string, Client>> {
        return this.onlineUsers
    }
}
