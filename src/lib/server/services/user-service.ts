import { Context, Effect } from 'effect';
import type { user } from '../db/auth-schema';

type User = typeof user.$inferSelect;

export class UserService extends Context.Tag('UserService')<
	UserService,
	{
		getUser: (userId: string) => Effect.Effect<User, Error>;
		createUser: (userData: User) => Effect.Effect<User>;
		deleteUser: (userId: string) => Effect.Effect<void, Error>;
	}
>() {}
