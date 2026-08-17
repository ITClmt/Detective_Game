import { db } from "../../db/client"
import { usersTable } from "../../db/schema/index"

interface CreateUserParams {
    username: string;
    email: string;
    password: string;
}

const authRepository = {

    createUser: async (payload: CreateUserParams) => {
        const [user] = await db.insert(usersTable).values({
            username: payload.username,
            email: payload.email,
            password: payload.password
        }).returning()

        return user
    }
    
}

export default authRepository